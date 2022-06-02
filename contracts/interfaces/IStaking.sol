pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IERC20Burnable.sol";

interface IStaking {
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event FeeBurned(uint256 amount);
    event FeeCollected(uint256 amount);

    // from Ownable
    function owner() external view returns (address);
    function pendingOwner() external view returns (address);
    function transferOwnership(address newOwner, bool direct, bool renounce) external;
    function claimOwnership() external;

    // public variables and mappings
    function rewardsToken() external view returns(IERC20); 
    function stakingToken() external view returns(IERC20Burnable);
    function checkPoints() external view returns(uint256[] memory); 
    function rewardPerSecond() external view returns(uint256[] memory); 
    function lastUpdateTime() external view returns(uint256);
    function rewardPerTokenStored() external view returns(uint256);
    function startingCheckPoint() external view returns(uint); 
    function unstakingFeeRatio() external pure returns(uint);
    function newUnstakingFeeRatio() external view returns(uint);
    function unstakingFeeRatioTimelock() external view returns(uint);
    function unstakingFeeRatioTimelockPeriod() external pure returns(uint);
    function unstakingFeeDenominator() external pure returns(uint);
    function totalStake() external view returns(uint256);
    function feeBurn() external view returns(bool);
    function initialized() external view returns(bool);
    function userRewardPerTokenPaid(address) external view returns(uint256);
    function rewards(address) external view returns(uint256);
    function stakes(address) external view returns(uint256);

    // public functions
    function initialize(address _rewardsToken, address _stakingToken, uint emissionStart, uint firstCheckPoint, uint _rewardPerSecond, address admin, bool _feeBurn,uint _unstakingFeeRatio) external;
    function updateSchedule(uint checkPoint, uint _rewardPerSecond) external;
    function getCheckPoints() external view returns (uint256[] memory);
    function getRewardPerSecond() external view returns (uint256[] memory);
    function lastTimeRewardApplicable() external view returns (uint256);
    function getTotalEmittedTokens(uint256 _from, uint256 _to, uint256 _startingCheckPoint) external view returns (uint256, uint256);
    function setFeeBurn(bool _feeBurn) external;
    function stake(uint256 amount) external;
    function unstake(uint256 amount, uint maximumFee) external;
    function transferStake(address _recipient, uint _amount) external;
    function getRewardThenStake() external;
    function withdrawFee(uint256 amount) external;
    function getReward() external;
    function exit() external;
    function setNewUnstakingFeeRatio(uint _newUnstakingFeeRatio) external;
    function changeUnstakingFeeRatio() external;
    function showPendingReward(address account) external view returns (uint256);
}
