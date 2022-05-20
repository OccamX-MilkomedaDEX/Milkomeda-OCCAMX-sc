const hre = require("hardhat");
const {utils} = require("ethers");
const { sleep, getInputData } = require("./helpers");
const { ethers } = require("hardhat");

/**
 * Deployment script for the zap contract
 * It creates the contract on-chain with the given parameters
 * and then runs a simple test to verify that it works.
 */
async function main() {
    
    // PARAMS Start
    let routerAddress, wAdaAddress, testPairAddress, testAdaAmount;
    if (hre.network.name == "milkomedaMainnet") {
        routerAddress = "0x9CdcE24c0e67611B698E6C228BF7791D4ECc553A";
        wAdaAddress = "0xAE83571000aF4499798d1e3b0fA0070EB3A3E3F9";
        testPairAddress = "0x354EB6D82f8fb60b12839A5C693d82BDCcb917bF"; // madUSDC-mADA
        testAdaAmount = utils.parseEther("0.001");
    } else if (hre.network.name == "milkomedaTestnet") {
        routerAddress = "0x472F4fEb99AC98098657f7341F4e04F28DCAD367";
        wAdaAddress = "0x01BbBB9C97FC43e3393E860fc8BbeaD47B6960dB";
        testPairAddress = "";
        testAdaAmount = utils.parseEther("0.001");
    } else {
        console.log("No parameters set for network", hre.network.name);
        return;
    }
    // PARAMS End

    console.log(`Operating in network ${hre.network.name}`)
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    let pair = await ethers.getContractAt("Pair", testPairAddress);

    const zapFactory = await hre.ethers.getContractFactory('ZapOccamX', deployer);
    let zap = await zapFactory.deploy(routerAddress, wAdaAddress);
    console.log("Zap address:", zap.address);
        
    console.log("Testing zap on pair ", testPairAddress);
    console.log(`Holding ${await pair.balanceOf(deployer.address)} liquidity tokens before zap`);

    let tx = await zap.zapInADA(testPairAddress, 0, {value: testAdaAmount});

    console.log("waiting for 5 confirmations");
    await tx.wait(5);
    console.log(`Holding ${await pair.balanceOf(deployer.address)} liquidity tokens after zap`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
    console.error(error);
    process.exit(1);
    });