const hre = require("hardhat");
const {utils} = require("ethers");
const {sleep} = require("./helpers");

async function main() {


    console.log(`Operating in network ${hre.network.name}`)

    const [deployer] = await hre.ethers.getSigners();

    console.log(
    "Deploying contracts with the account:",
    deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const WADAFactory = await ethers.getContractFactory("WADA10");
    const WADAInstance = await WADAFactory.deploy();

    console.log("WADA address:", WADAInstance.address);
    
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