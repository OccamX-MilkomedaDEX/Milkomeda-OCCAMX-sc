const hre = require("hardhat");
const { utils } = require("ethers");
const { sleep } = require("./helpers");

async function main() {
    let proxyOwner, admin, stakingTokenAddress, unstakingFeeRatio, emissionStart, firstCheckPoint, rewardPerSecond, feeBurn, rewardsTokenAddress;
    const [ deployer ] = await hre.ethers.getSigners();

    console.log(`operating on network ${hre.network.name}`)
    if (hre.network.name == "milkomedaTestnet") {
        admin = deployer.address;
        rewardsTokenAddress = "0xcE5eC4569b0ec9E9dE311dB566473234c337c443"; //OCX
        stakingTokenAddress = "0x30aa7F615E8540f05a9707dE00E95469D77be613"; //OCX
        unstakingFeeRatio = 0;
        emissionStart = 0;
        firstCheckPoint = 1620133780;
        rewardPerSecond = 0;
        feeBurn = false;
    } else if (hre.network.name == "mainnet") {
        proxyOwner = "0x865d9eb17D84167745A4931F9b254B0764fDd0f6";
        logicsOwner = "0x865d9eb17D84167745A4931F9b254B0764fDd0f6";
        stakingTokenAddress = "0x2f109021afe75b949429fe30523ee7c0d5b27207";
        unstakingFeeRatio = 400;
        // !!! Check timelock for both unstaking fee and implemetation change
        emissionStart = 0;
        firstCheckPoint = 1622541600;
        rewardPerSecond = 0;
    }
        

    console.log(`Deploying contracts with account: ${ deployer.address }`);

    console.log(`Account balance: ${ (await deployer.getBalance()).toString()}`);

    const StakingFactory = await hre.ethers.getContractFactory("Staking", deployer);

    const CONTRACT_ARGS = [rewardsTokenAddress, stakingTokenAddress, emissionStart, firstCheckPoint, rewardPerSecond, admin, feeBurn, unstakingFeeRatio];

    const StakingInstance = await StakingFactory.deploy(...CONTRACT_ARGS);

    const StakingAddress = StakingInstance.address;
    console.log(`StakingImp address: ${StakingAddress}`);
    console.log(`deployed from address ${StakingInstance.deployTransaction.from}`);

    const stakingDeployTxHash = StakingInstance.deployTransaction.hash;

    while ((await hre.ethers.provider.getTransactionReceipt(stakingDeployTxHash)) == null) {
        console.log(`waiting for staking implementation deployment to be finished.`);
        await sleep(10);
    }
    const stakingDeployReceipt = await hre.ethers.provider.getTransactionReceipt(stakingDeployTxHash);

    console.log(`staking deployment is finished`);
    console.log(`gas used ${stakingDeployReceipt.gasUsed}`);

    console.log(`----------`);
    console.log(`Input parameters`);
    console.log(`staking token address ${stakingTokenAddress}`);
    console.log(`unstaking fee ratio ${unstakingFeeRatio/10000}`);
    console.log(`logics owner ${admin}`);
    console.log(`emission start ${emissionStart}`);
    console.log(`first checkpoint ${firstCheckPoint}`);
    console.log(`reward per second ${rewardPerSecond}`);
    console.log(`-----------`);
    console.log(`Onchain parameters`);
    console.log(`check staking token address ${await StakingInstance.stakingToken()}`);
    console.log(`check unstaking fee ratio ${(await StakingInstance.unstakingFeeRatio())/10000}`);
    console.log(`check admin ${await StakingInstance.owner()}`);
    console.log(`check emission schedule ${await StakingInstance.getCheckPoints()}`);
    console.log(`check reward per second ${await StakingInstance.getRewardPerSecond()}`);
    console.log(`-----------`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
    console.error(error);
    process.exit(1);
    });
