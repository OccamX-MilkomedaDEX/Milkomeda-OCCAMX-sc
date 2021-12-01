pragma solidity ^0.6.0;
import './Pair.sol';

contract CalHash {
    function getInitHash() public pure returns(bytes32){
        bytes memory bytecode = type(Pair).creationCode;
        return keccak256(abi.encodePacked(bytecode));
    }
}