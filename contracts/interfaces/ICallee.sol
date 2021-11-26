pragma solidity >=0.6.0;

interface ICallee {
    function Call(address sender, uint amount0, uint amount1, bytes calldata data) external;
}
