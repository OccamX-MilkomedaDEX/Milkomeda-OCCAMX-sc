const hre = require("hardhat");
const {utils} = require("ethers");


async function main() {


    console.log(`Operating in network ${hre.network.name}`)

    const [deployer] = await hre.ethers.getSigners();

    console.log(
    "Deploying contracts with the account:",
    deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const DEXFactoryFactory = await ethers.getContractFactory("Factory");
    const DEXFactoryInstance = await DEXFactoryFactory.deploy(deployer.address);

    console.log("DEX Factory address:", DEXFactoryInstance.address);
    
    /* await sleep(150);
    await hre.run("verify:verify", {
        address: TokenInstance.address,
        constructorArguments: [supply, holder, tokenName, ticker],
    })
     */

}

main()
    .then(() => process.exit(0))
    .catch(error => {
    console.error(error);
    process.exit(1);
    });