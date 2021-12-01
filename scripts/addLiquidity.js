const hre = require("hardhat");
const {utils, constants} = require("ethers");
const {sleep, sendTxAndWait} = require("./helpers");

async function main() {

    let routerAddress, token1Address, token2Address;

    if (hre.network.name == "milkomedaTestnet") {
        routerAddress = "0x472F4fEb99AC98098657f7341F4e04F28DCAD367";
        token1Address = "0x4541D7aB99D5b3441db0E4e01f467026DB4aa961";
        token2Address = "0x8d27b9827817D2C92FCF55390c22C2E2bD476f05";
    }

    const token1Amount = utils.parseEther("30000");
    const token2Amount = utils.parseEther("30000");
    const slippage = 5; 

    const now = parseInt((new Date()).getTime()/1000);
    const deadline = now + 3600;

    console.log(`Operating in network ${hre.network.name}`)

    const [deployer] = await hre.ethers.getSigners();

    console.log(
    "Deploying contracts with the account:",
    deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const routerFactory = await ethers.getContractFactory("Router02");
    const routerInstance = await routerFactory.attach(routerAddress);
    const token1Instance = await ethers.getContractAt("contracts/interfaces/IERC20.sol:IERC20", token1Address);
    const token2Instance = await ethers.getContractAt("contracts/interfaces/IERC20.sol:IERC20", token2Address);

    const routerAllowance1 = await token1Instance.allowance(deployer.address, routerAddress);
    const routerAllowance2 = await token2Instance.allowance(deployer.address, routerAddress);

    if (routerAllowance1 < token1Amount) {
        await sendTxAndWait(token1Instance, deployer, "approve", [routerAddress, constants.MaxUint256]);
    }

    if (routerAllowance2 < token2Amount) {
        await sendTxAndWait(token2Instance, deployer, "approve", [routerAddress, constants.MaxUint256]);
    }


    console.log(`token 1 allowance of router from deployer is ${await token1Instance.allowance(deployer.address, routerInstance.address)}`);
    console.log(`token 2 allowance of router from deployer is ${await token2Instance.allowance(deployer.address, routerInstance.address)}`);

    const deployPairTx = await routerInstance.connect(deployer).addLiquidity(token1Address, 
                                                                             token2Address, 
                                                                             token1Amount, 
                                                                             token2Amount, 
                                                                             token1Amount.mul(slippage).div(100), 
                                                                             token2Amount.mul(slippage).div(100), deployer.address, 
                                                                             deadline);

    const deployPairTxHash = deployPairTx.hash;

    while ((await hre.ethers.provider.getTransactionReceipt(deployPairTxHash)) == null) {
        console.log(`waiting for deploy pair transaction to be finished.`);
        await sleep(10);
    };

    console.log(await hre.ethers.provider.getTransactionReceipt(deployPairTxHash));

    const factoryAddress = await routerInstance.factory();
    const factoryFactory = await ethers.getContractFactory("Factory");
    const factoryInstance = await factoryFactory.attach(factoryAddress);

    const pairAddress = await factoryInstance.getPair(token1Address, token2Address);
    console.log(`pair address is ${pairAddress}`);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
    console.error(error);
    process.exit(1);
    });