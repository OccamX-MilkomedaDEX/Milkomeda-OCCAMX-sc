const hre = require("hardhat");
const {utils} = require("ethers");
const { sleep, getInputData } = require("./helpers");

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

    const zapFactory = await hre.ethers.getContractFactory('ZapOccamX', deployer);
    let zap = await zapFactory.deploy(routerAddress, wAdaAddress);
    console.log("Zap address:", zap.address);
    
    console.log("Waiting 30s before verifying constructor parameters");
    await sleep(30);
    // console.log("Verifying constructor parameters");
    // let verification = await hre.run("verify:verify", {
    //     address: zap.address,
    //     constructorArguments: [routerAddress, wAdaAddress],
    // })
    // console.log("Verification result:", verification);
    
    console.log("Testing zap on pair ", testPairAddress);
    let tx = await zap.zapInADA(testPairAddress, 0, {value: testAdaAmount});
    // TODO: check result

}

main()
    .then(() => process.exit(0))
    .catch(error => {
    console.error(error);
    process.exit(1);
    });