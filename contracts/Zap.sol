// SPDX-License-Identifier: GPLv2

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// @author Zwilling for OccamX, forked from Wivern for Beefy.Finance (https://github.com/beefyfinance/beefy-contracts/blob/b4f0ab0394b9316e40596b2d8066ee94398449dd/contracts/BIFI/zaps/BeefyZapUniswapV2.txt)
// @notice This contract adds liquidity to Uniswap V2 compatible liquidity pair pools and stake.

pragma solidity 0.6.12;

import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@uniswap/lib/contracts/libraries/Babylonian.sol';
import './interfaces/IPair.sol';
import './interfaces/IRouter02.sol';
import './libraries/Math.sol';

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 wad) external;
}

contract ZapOccamX {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IRouter02 public immutable router;
    address public immutable WETH;
    uint256 public constant minimumAmount = 1000;

    constructor(address _router, address _WETH) public {
        // Safety checks to ensure WETH token address
        IWETH(_WETH).deposit{value: 0}();
        IWETH(_WETH).withdraw(0);

        router = IRouter02(_router);
        WETH = _WETH;
    }

    receive() external payable {
        assert(msg.sender == WETH);
    }

    /** TODO
     */
    function zapInETH (address pairAddr, uint256 tokenAmountOutMin) external payable {
        require(msg.value >= minimumAmount, 'Zap: Insignificant input amount');

        IWETH(WETH).deposit{value: msg.value}();

        _swapAndAddLiquidity(pairAddr, tokenAmountOutMin, WETH);
    }

    /** TODO
     */
    function zapIn (address pairAddr, uint256 tokenAmountOutMin, address tokenIn, uint256 tokenInAmount) external {
        require(tokenInAmount >= minimumAmount, 'Zap: Insignificant input amount');
        require(IERC20(tokenIn).allowance(msg.sender, address(this)) >= tokenInAmount, 'Zap: Input token is not approved');

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), tokenInAmount);

        _swapAndAddLiquidity(pairAddr, tokenAmountOutMin, tokenIn);
    }

    /** TODO
     */
    function zapOut (address pairAddr, uint256 withdrawAmount) external {
        IPair pair = IPair(pairAddr);

        if (pair.token0() != WETH && pair.token1() != WETH) {
            return _removeLiquidity(pairAddr, msg.sender);
        }

        _removeLiquidity(pairAddr, address(this));

        address[] memory tokens = new address[](2);
        tokens[0] = pair.token0();
        tokens[1] = pair.token1();

        _returnAssets(tokens);
    }

    /** TODO
     */
    function zapOutAndSwap(address pairAddr, uint256 withdrawAmount, address desiredToken, uint256 desiredTokenOutMin) external {
        IPair pair = IPair(pairAddr);
        address token0 = pair.token0();
        address token1 = pair.token1();
        require(token0 == desiredToken || token1 == desiredToken, 'Zap: desired token not present in liquidity pair');

        _removeLiquidity(pairAddr, address(this));

        address swapToken = token1 == desiredToken ? token0 : token1;
        address[] memory path = new address[](2);
        path[0] = swapToken;
        path[1] = desiredToken;

        _approveTokenIfNeeded(path[0], address(router));
        router.swapExactTokensForTokens(IERC20(swapToken).balanceOf(address(this)), desiredTokenOutMin, path, address(this), block.timestamp);

        _returnAssets(path);
    }

    function _removeLiquidity(address pair, address to) private {
        IERC20(pair).safeTransfer(pair, IERC20(pair).balanceOf(address(this)));
        (uint256 amount0, uint256 amount1) = IPair(pair).burn(to);

        require(amount0 >= minimumAmount, 'Router: INSUFFICIENT_A_AMOUNT');
        require(amount1 >= minimumAmount, 'Router: INSUFFICIENT_B_AMOUNT');
    }

    function _swapAndAddLiquidity(address pairAddr, uint256 tokenAmountOutMin, address tokenIn) private {
        IPair pair = IPair(pairAddr);

        (uint256 reserveA, uint256 reserveB,) = pair.getReserves();
        require(reserveA > minimumAmount && reserveB > minimumAmount, 'Zap: Liquidity pair reserves too low');

        bool isInputA = pair.token0() == tokenIn;
        require(isInputA || pair.token1() == tokenIn, 'Zap: Input token not present in liquidity pair');

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = isInputA ? pair.token1() : pair.token0();

        uint256 fullInvestment = IERC20(tokenIn).balanceOf(address(this));
        uint256 swapAmountIn;
        if (isInputA) {
            swapAmountIn = _getSwapAmount(fullInvestment, reserveA, reserveB);
        } else {
            swapAmountIn = _getSwapAmount(fullInvestment, reserveB, reserveA);
        }

        _approveTokenIfNeeded(path[0], address(router));
        uint256[] memory swapedAmounts = router
            .swapExactTokensForTokens(swapAmountIn, tokenAmountOutMin, path, address(this), block.timestamp);

        _approveTokenIfNeeded(path[1], address(router));
        (,, uint256 amountLiquidity) = router
            .addLiquidity(path[0], path[1], fullInvestment.sub(swapedAmounts[0]), swapedAmounts[1], 1, 1, address(this), block.timestamp);

        // TODO: add possibility to stake for liquidity mining
    }

    function _returnAssets(address[] memory tokens) private {
        uint256 balance;
        for (uint256 i; i < tokens.length; i++) {
            balance = IERC20(tokens[i]).balanceOf(address(this));
            if (balance > 0) {
                if (tokens[i] == WETH) {
                    IWETH(WETH).withdraw(balance);
                    (bool success,) = msg.sender.call{value: balance}(new bytes(0));
                    require(success, 'Zap: ETH transfer failed');
                } else {
                    IERC20(tokens[i]).safeTransfer(msg.sender, balance);
                }
            }
        }
    }

    function _getSwapAmount(uint256 investmentA, uint256 reserveA, uint256 reserveB) private view returns (uint256 swapAmount) {
        uint256 halfInvestment = investmentA / 2;
        uint256 nominator = router.getAmountOut(halfInvestment, reserveA, reserveB);
        uint256 denominator = router.quote(halfInvestment, reserveA.add(halfInvestment), reserveB.sub(nominator));
        swapAmount = investmentA.sub(Babylonian.sqrt(halfInvestment * halfInvestment * nominator / denominator));
    }

    function estimateSwap(address pairAddr, address tokenIn, uint256 fullInvestmentIn) public view returns(uint256 swapAmountIn, uint256 swapAmountOut, address swapTokenOut) {
        IPair pair = IPair(pairAddr);

        bool isInputA = pair.token0() == tokenIn;
        require(isInputA || pair.token1() == tokenIn, 'Zap: Input token not present in liquidity pair');

        (uint256 reserveA, uint256 reserveB,) = pair.getReserves();
        (reserveA, reserveB) = isInputA ? (reserveA, reserveB) : (reserveB, reserveA);

        swapAmountIn = _getSwapAmount(fullInvestmentIn, reserveA, reserveB);
        swapAmountOut = router.getAmountOut(swapAmountIn, reserveA, reserveB);
        swapTokenOut = isInputA ? pair.token1() : pair.token0();
    }

    function _approveTokenIfNeeded(address token, address spender) private {
        if (IERC20(token).allowance(address(this), spender) == 0) {
            IERC20(token).safeApprove(spender, type(uint256).max);
        }
    }
}
