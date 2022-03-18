const hre = require("hardhat");
const {utils} = require("ethers");


async function main() {

    let factoryAddress, WADAAddress;

    if (hre.network.name == "milkomedaTestnet") {
        factoryAddress = "0x428779a1A596c9cFdB68f5DaEf78b14901B95566";
        WADAAddress = "0x01BbBB9C97FC43e3393E860fc8BbeaD47B6960dB";
    } else if (hre.network.name == "milkomedaMainnet") {
        factoryAddress = "0x2ef06A90b0E7Ae3ae508e83Ea6628a3987945460";
        WADAAddress = "0xAE83571000aF4499798d1e3b0fA0070EB3A3E3F9";
    } 


    console.log(`Operating in network ${hre.network.name}`)

    const [deployer] = await hre.ethers.getSigners();

    console.log(
    "Deploying contracts with the account:",
    deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const FactoryInstance = await ethers.getContractAt("Factory", factoryAddress);
    
    const allPairsLength = await FactoryInstance.allPairsLength();
    const lastPairAddress = await FactoryInstance.allPairs(allPairsLength - 1);

    console.log(lastPairAddress);

    const lastPair = await ethers.getContractAt("Pair", lastPairAddress);
    
    /* await sleep(150);
    await hre.run("verify:verify", {
        address: RouterInstance.address,
        constructorArguments: [factoryAddress, WADAAddress],
    }) */
    
    const lastPairToken0 = await lastPair.token0();
    const lastPairToken1 = await lastPair.token1();

    console.log(`token 0 ${lastPairToken0}`);
    console.log(`token 1 ${lastPairToken1}`);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
    console.error(error);
    process.exit(1);
    });