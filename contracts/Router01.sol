pragma solidity ^0.6.0;

import './interfaces/IFactory.sol';
import './libraries/TransferHelper.sol';

import './libraries/Library.sol';
import './interfaces/IRouter01.sol';
import './interfaces/IERC20.sol';
import './interfaces/IWADA.sol';

contract Router01 is IRouter01 {
    address public immutable override factory;
    address public immutable override WADA;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'DEXRouter: EXPIRED');
        _;
    }

    constructor(address _factory, address _WADA) public {
        factory = _factory;
        WADA = _WADA;
    }

    receive() external payable {
        assert(msg.sender == WADA); // only accept ADA via fallback from the WADA contract
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) private returns (uint amountA, uint amountB) {
        // create the pair if it doesn't exist yet
        if (IFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            IFactory(factory).createPair(tokenA, tokenB);
        }
        (uint reserveA, uint reserveB) = Library.getReserves(factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = Library.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'Router: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = Library.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'Router: INSUFFICIENT_A_AMOUNT');
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external override ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = Library.pairFor(factory, tokenA, tokenB);
        TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = IPair(pair).mint(to);
    }
    function addLiquidityADA(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountADAMin,
        address to,
        uint deadline
    ) external override payable ensure(deadline) returns (uint amountToken, uint amountADA, uint liquidity) {
        (amountToken, amountADA) = _addLiquidity(
            token,
            WADA,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountADAMin
        );
        address pair = Library.pairFor(factory, token, WADA);
        TransferHelper.safeTransferFrom(token, msg.sender, pair, amountToken);
        IWADA(WADA).deposit{value: amountADA}();
        assert(IWADA(WADA).transfer(pair, amountADA));
        liquidity = IPair(pair).mint(to);
        if (msg.value > amountADA) TransferHelper.safeTransferADA(msg.sender, msg.value - amountADA); // refund dust ADA, if any
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) public override ensure(deadline) returns (uint amountA, uint amountB) {
        address pair = Library.pairFor(factory, tokenA, tokenB);
        IPair(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (uint amount0, uint amount1) = IPair(pair).burn(to);
        (address token0,) = Library.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'DEXRouter: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'DEXRouter: INSUFFICIENT_B_AMOUNT');
    }
    function removeLiquidityADA(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountADAMin,
        address to,
        uint deadline
    ) public override ensure(deadline) returns (uint amountToken, uint amountADA) {
        (amountToken, amountADA) = removeLiquidity(
            token,
            WADA,
            liquidity,
            amountTokenMin,
            amountADAMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, amountToken);
        IWADA(WADA).withdraw(amountADA);
        TransferHelper.safeTransferADA(to, amountADA);
    }
    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external override returns (uint amountA, uint amountB) {
        address pair = Library.pairFor(factory, tokenA, tokenB);
        uint value = approveMax ? uint(-1) : liquidity;
        IPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountA, amountB) = removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline);
    }
    function removeLiquidityADAWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountADAMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external override returns (uint amountToken, uint amountADA) {
        address pair = Library.pairFor(factory, token, WADA);
        uint value = approveMax ? uint(-1) : liquidity;
        IPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountToken, amountADA) = removeLiquidityADA(token, liquidity, amountTokenMin, amountADAMin, to, deadline);
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swap(uint[] memory amounts, address[] memory path, address _to) private {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = Library.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
            address to = i < path.length - 2 ? Library.pairFor(factory, output, path[i + 2]) : _to;
            IPair(Library.pairFor(factory, input, output)).swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override ensure(deadline) returns (uint[] memory amounts) {
        amounts = Library.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'DEXRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        TransferHelper.safeTransferFrom(path[0], msg.sender, Library.pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external override ensure(deadline) returns (uint[] memory amounts) {
        amounts = Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, 'DEXRouter: EXCESSIVE_INPUT_AMOUNT');
        TransferHelper.safeTransferFrom(path[0], msg.sender, Library.pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }
    function swapExactADAForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        override
        payable
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[0] == WADA, 'DEXRouter: INVALID_PATH');
        amounts = Library.getAmountsOut(factory, msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'DEXRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        IWADA(WADA).deposit{value: amounts[0]}();
        assert(IWADA(WADA).transfer(Library.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
    }
    function swapTokensForExactADA(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        override
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[path.length - 1] == WADA, 'DEXRouter: INVALID_PATH');
        amounts = Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, 'DEXRouter: EXCESSIVE_INPUT_AMOUNT');
        TransferHelper.safeTransferFrom(path[0], msg.sender, Library.pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, address(this));
        IWADA(WADA).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferADA(to, amounts[amounts.length - 1]);
    }
    function swapExactTokensForADA(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        override
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[path.length - 1] == WADA, 'DEXRouter: INVALID_PATH');
        amounts = Library.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'DEXRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        TransferHelper.safeTransferFrom(path[0], msg.sender, Library.pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, address(this));
        IWADA(WADA).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferADA(to, amounts[amounts.length - 1]);
    }
    function swapADAForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        override
        payable
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[0] == WADA, 'DEXRouter: INVALID_PATH');
        amounts = Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= msg.value, 'DEXRouter: EXCESSIVE_INPUT_AMOUNT');
        IWADA(WADA).deposit{value: amounts[0]}();
        assert(IWADA(WADA).transfer(Library.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        if (msg.value > amounts[0]) TransferHelper.safeTransferADA(msg.sender, msg.value - amounts[0]); // refund dust ADA, if any
    }

    function quote(uint amountA, uint reserveA, uint reserveB) public pure override returns (uint amountB) {
        return Library.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) public pure override returns (uint amountOut) {
        return Library.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) public pure override returns (uint amountIn) {
        return Library.getAmountOut(amountOut, reserveIn, reserveOut);
    }

    function getAmountsOut(uint amountIn, address[] memory path) public view override returns (uint[] memory amounts) {
        return Library.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint amountOut, address[] memory path) public view override returns (uint[] memory amounts) {
        return Library.getAmountsIn(factory, amountOut, path);
    }
}
