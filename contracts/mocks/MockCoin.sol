pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCoin is ERC20 {
    constructor(string memory __name, string memory __symbol) ERC20(__name, __symbol) public {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}