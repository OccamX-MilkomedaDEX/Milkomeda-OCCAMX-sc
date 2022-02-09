const hre = require("hardhat");
const {utils} = require("ethers");


async function main() {

    let factoryAddress, WADAAddress;

    if (hre.network.name == "milkomedaTestnet") {
        factoryAddress = "0x428779a1A596c9cFdB68f5DaEf78b14901B95566";
        WADAAddress = "0x01BbBB9C97FC43e3393E860fc8BbeaD47B6960dB";
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