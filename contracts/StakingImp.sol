pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Ownable.sol";
import "./interfaces/IERC20Burnable.sol";
import "./interfaces/IStaking.sol";

contract StakingImp is IStaking, ReentrancyGuard, Ownable() {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeERC20 for IERC20Burnable;

    /* ========== STATE VARIABLES ========== */

    IERC20 public override rewardsToken; 
    IERC20Burnable public override stakingToken;
    uint256[] public override checkPoints; 
    uint256[] public override rewardPerSecond; 
    uint256 public override lastUpdateTime;
    uint256 public override rewardPerTokenStored;
    uint public override startingCheckPoint; 

    uint public override unstakingFeeRatio = 400;
    uint public override newUnstakingFeeRatio;
    uint public override unstakingFeeRatioTimelock;
    uint public override constant unstakingFeeRatioTimelockPeriod = 600;
    uint public override constant unstakingFeeDenominator = 10000;

    mapping(address => uint256) public override userRewardPerTokenPaid;
    mapping(address => uint256) public override rewards;

    uint256 public override totalStake;
    mapping(address => uint256) public override stakes;

    bool public override feeBurn = false;
    bool public override initialized = false;

    /* ========== CONSTRUCTOR ========== */

    function initialize(
        address _rewardsToken,
        address _stakingToken,
        uint emissionStart,
        uint firstCheckPoint,
        uint _rewardPerSecond,
        address admin,
        bool _feeBurn,
        uint _unstakingFeeRatio
    ) public override {
        require(initialized == false, "StakingImp: contract has already been initialized.");
        rewardsToken = IERC20(_rewardsToken);
        stakingToken = IERC20Burnable(_stakingToken);
        if (checkPoints.length == 0) {
            checkPoints.push(emissionStart);
            checkPoints.push(firstCheckPoint);
            rewardPerSecond.push(_rewardPerSecond);
        }
        owner = admin;
        feeBurn = _feeBurn;
        unstakingFeeRatio = _unstakingFeeRatio;
        initialized = true;
    }

    function updateSchedule(uint checkPoint, uint _rewardPerSecond) public override onlyOwner {
        require(checkPoint > Math.max(checkPoints[checkPoints.length.sub(1)], block.timestamp), "LM: new checkpoint has to be in the future");
        if (block.timestamp > checkPoints[checkPoints.length.sub(1)]) {
            checkPoints.push(block.timestamp);
            rewardPerSecond.push(0);
        }
        checkPoints.push(checkPoint);
        rewardPerSecond.push(_rewardPerSecond);
    }

    function getCheckPoints() public override view returns (uint256[] memory) {
        return checkPoints;
    }

    function getRewardPerSecond() public override view returns (uint256[] memory) {
        return rewardPerSecond;
    }

    function lastTimeRewardApplicable() public override view returns (uint256) {
        return Math.min(block.timestamp, checkPoints[checkPoints.length.sub(1)]);
    }

    function getTotalEmittedTokens(uint256 _from, uint256 _to, uint256 _startingCheckPoint) public override view returns (uint256, uint256) {
        require(_to >= _from, "StakingImp: _to has to be greater than _from.");
        uint256 totalEmittedTokens = 0;
        uint256 workingTime = Math.max(_from, checkPoints[0]);
        if (_to <= workingTime) {
            return (0, _startingCheckPoint);
        }
        uint checkPointsLength = checkPoints.length;
        for (uint256 i = _startingCheckPoint + 1; i < checkPointsLength; ++i) {
            uint256 emissionTime = checkPoints[i];
            uint256 emissionRate = rewardPerSecond[i-1];
            if (_to < emissionTime) {
                totalEmittedTokens = totalEmittedTokens.add(_to.sub(workingTime).mul(emissionRate));
                return (totalEmittedTokens, i - 1);
            } else if (workingTime < emissionTime) {
                totalEmittedTokens = totalEmittedTokens.add(emissionTime.sub(workingTime).mul(emissionRate));
                workingTime = emissionTime;
            }
        }
        return (totalEmittedTokens, checkPointsLength.sub(1));
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function setFeeBurn(bool _feeBurn) public override onlyOwner {
        feeBurn = _feeBurn;
    }

    function stake(uint256 amount) external override nonReentrant updateReward(msg.sender) {
        require(amount > 0, "StakingImp: Cannot stake 0");
        totalStake = totalStake.add(amount);
        stakes[msg.sender] = stakes[msg.sender].add(amount);
        stakingToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount, uint maximumFee) public override nonReentrant updateReward(msg.sender) {
        uint unstakingFee = amount.mul(unstakingFeeRatio).div(unstakingFeeDenominator);
        require(unstakingFee <= maximumFee, "StakingImp: fee too high.");
        uint amountWithoutFee = amount.sub(unstakingFee);
        require(stakes[msg.sender] >= amount, "StakingImp: INSUFFICIENT_STAKE");
        stakes[msg.sender] = stakes[msg.sender].sub(amount);
        totalStake = totalStake.sub(amount);
        stakingToken.transfer(msg.sender, amountWithoutFee);
        if (feeBurn) {
            stakingToken.burn(unstakingFee);
            emit FeeBurned(unstakingFee);
        }
        emit Unstaked(msg.sender, amount);
    }

    function transferStake(address _recipient, uint _amount) public override {
        require(_amount <= stakes[msg.sender], "StakingImp: not enough stake to transfer");
        _updateReward(msg.sender);
        _updateReward(_recipient);
        stakes[msg.sender] = stakes[msg.sender].sub(_amount);
        stakes[_recipient] = stakes[_recipient].add(_amount);
        emit Unstaked(msg.sender, _amount);
        emit Staked(_recipient, _amount);
    }

    function getRewardThenStake() public override nonReentrant updateReward(msg.sender) {
        require(address(stakingToken) == address(rewardsToken), "StakingImp:only when staking and rewards tokens are the same");
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            require(reward < stakingToken.balanceOf(address(this)).sub(totalStake), "StakingImp: not enough tokens to pay out reward.");
            rewards[msg.sender] = 0;
            stakes[msg.sender] = stakes[msg.sender].add(reward);
            totalStake = totalStake.add(reward);
            emit Staked(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function withdrawFee(uint256 amount) public override nonReentrant onlyOwner {
        uint totalFee = stakingToken.balanceOf(address(this)).sub(totalStake);
        require(amount <= totalFee, "StakingImp: not enough fee.");
        stakingToken.transfer(owner, amount);
        emit FeeCollected(amount);

    } 

    function getReward() public override nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardsToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function exit() external override {
        unstake(stakes[msg.sender], uint(-1));
        getReward();
    }

    function setNewUnstakingFeeRatio(uint _newUnstakingFeeRatio) public override onlyOwner {
        require(_newUnstakingFeeRatio <= unstakingFeeDenominator, "StakingImp: invalid unstaking fee.");
        newUnstakingFeeRatio = _newUnstakingFeeRatio;
        unstakingFeeRatioTimelock = block.timestamp.add(unstakingFeeRatioTimelockPeriod);
    }

    function changeUnstakingFeeRatio() public override onlyOwner {
        require(block.timestamp >= unstakingFeeRatioTimelock, "StakingImp: too early to change unstaking fee.");
        unstakingFeeRatio = newUnstakingFeeRatio;
    }

    function showPendingReward(address account) public override view returns (uint256) {
        uint rewardPerTokenStoredActual;
        if (totalStake != 0) {
            (uint256 totalEmittedTokensSinceLastUpdate, ) = getTotalEmittedTokens(lastUpdateTime, block.timestamp, startingCheckPoint);
            rewardPerTokenStoredActual = rewardPerTokenStored.add(totalEmittedTokensSinceLastUpdate.mul(1e18).div(totalStake));
        } else {
            rewardPerTokenStoredActual = rewardPerTokenStored;
        }
        return rewards[account].add((rewardPerTokenStoredActual.sub(userRewardPerTokenPaid[account])).mul(stakes[account]).div(1e18));
    }

    function _updateReward(address account) internal {
        if (totalStake != 0) {
            (uint256 totalEmittedTokensSinceLastUpdate, uint256 newStartingCheckPoint) = getTotalEmittedTokens(lastUpdateTime, block.timestamp, startingCheckPoint);
            startingCheckPoint = newStartingCheckPoint;
            rewardPerTokenStored = rewardPerTokenStored.add(totalEmittedTokensSinceLastUpdate.mul(1e18).div(totalStake));
        }
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            uint256 _rewardPerTokenStored = rewardPerTokenStored;
            rewards[account] = rewards[account].add((_rewardPerTokenStored.sub(userRewardPerTokenPaid[account])).mul(stakes[account]).div(1e18));
            userRewardPerTokenPaid[account] = _rewardPerTokenStored;
        }
    }
    modifier updateReward(address account) {
        _updateReward(account);
        _;
    }

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event FeeBurned(uint256 amount);
    event FeeCollected(uint256 amount);
}
