const hre = require("hardhat");
const {utils} = require("ethers");


async function main() {


    console.log(`Operating in network ${hre.network.name}`)

    const [deployer] = await hre.ethers.getSigners();

    let factoryAddress, collectorAddress, zeroAddress;

    if (hre.network.name == "milkomedaTestnet") {
        factoryAddress = "0x428779a1A596c9cFdB68f5DaEf78b14901B95566";
        collectorAddress = "0xEBe25C7BFd25e32e4c4a1B4046B52CF7DF5008E7";
        zeroAddress = "0x0000000000000000000000000000000000000000";
    } 

    console.log(
    "Deploying contracts with the account:",
    deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const DEXFactoryFactory = await ethers.getContractFactory("Factory");
    const DEXFactoryInstance = await DEXFactoryFactory.attach(factoryAddress);

    await DEXFactoryInstance.connect(deployer).setFeeTo(zeroAddress);
    await sleep(20);

    console.log(`fee to address is ${await DEXFactoryInstance.feeTo()}`);
    
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