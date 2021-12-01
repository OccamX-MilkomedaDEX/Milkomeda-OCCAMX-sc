const hre = require("hardhat");
const {utils} = require("ethers");
const {sleep} = require("./helpers");

async function main() {

    let factoryAddress, WADAAddress, PTAddress;

    if (hre.network.name == "milkomedaTestnet") {
        factoryAddress = "0x8265B1f98c86130cc2436247bf5152A0Eb03E970";
        WADAAddress = "0x34CB666e61c379ECD20690ea7A3Fe4E271668ef0";
        PTAddress = "0x8d27b9827817D2C92FCF55390c22C2E2bD476f05";
    } 


    console.log(`Operating in network ${hre.network.name}`)

    const [deployer] = await hre.ethers.getSigners();

    console.log(
    "Deploying contracts with the account:",
    deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const CollectorFactory = await ethers.getContractFactory("Collector");
    const CollectorInstance = await CollectorFactory.deploy(factoryAddress, PTAddress, WADAAddress);

    console.log("Collector address:", CollectorInstance.address);
    
    /* await sleep(120);
    await hre.run("verify:verify", {
        address: TokenInstance.address,
        constructorArguments: [],
    }); */
    

}

main()
    .then(() => process.exit(0))
    .catch(error => {
    console.error(error);
    process.exit(1);
    });