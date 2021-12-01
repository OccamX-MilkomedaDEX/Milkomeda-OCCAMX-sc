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

    const CalHashFactory = await ethers.getContractFactory("CalHash");
    const CalHashInstance = await CalHashFactory.deploy();

    console.log("CalHash address:", CalHashInstance.address);

    console.log(`initcode hash is ${await CalHashInstance.getInitHash()}`);
    
    /* await sleep(150);
    await hre.run("verify:verify", {
        address: CalHashInstance.address,
        constructorArguments: [],
    }) */
    

}

main()
    .then(() => process.exit(0))
    .catch(error => {
    console.error(error);
    process.exit(1);
    });