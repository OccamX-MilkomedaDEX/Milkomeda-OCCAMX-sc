const hre = require("hardhat");
const {utils} = require("ethers");


async function main() {


    console.log(`Operating in network ${hre.network.name}`)

    const [deployer] = await hre.ethers.getSigners();

    let factoryAddress, collectorAddress;

    if (hre.network.name == "milkomedaTestnet") {
        factoryAddress = "0x8265B1f98c86130cc2436247bf5152A0Eb03E970";
        collectorAddress = "0xB14B152014Ee8B8b17b70b91AB207aa638b00C47";
    } 

    console.log(
    "Deploying contracts with the account:",
    deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const DEXFactoryFactory = await ethers.getContractFactory("Factory");
    const DEXFactoryInstance = await DEXFactoryFactory.attach(factoryAddress);

    await DEXFactoryInstance.connect(deployer).setFeeTo(collectorAddress);
    
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