const hre = require("hardhat");
const {utils} = require("ethers");


async function main() {

    let factoryAddress, WADAAddress;

    if (hre.network.name == "milkomedaTestnet") {
        factoryAddress = "0x8265B1f98c86130cc2436247bf5152A0Eb03E970";
        WADAAddress = "0x34CB666e61c379ECD20690ea7A3Fe4E271668ef0";
    } 


    console.log(`Operating in network ${hre.network.name}`)

    const [deployer] = await hre.ethers.getSigners();

    console.log(
    "Deploying contracts with the account:",
    deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const RouterFactory = await ethers.getContractFactory("Router02");
    const RouterInstance = await RouterFactory.deploy(factoryAddress, WADAAddress);

    console.log("Router address:", RouterInstance.address);
    
    /* await sleep(150);
    await hre.run("verify:verify", {
        address: RouterInstance.address,
        constructorArguments: [factoryAddress, WADAAddress],
    }) */
    

}

main()
    .then(() => process.exit(0))
    .catch(error => {
    console.error(error);
    process.exit(1);
    });