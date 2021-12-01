const hre = require("hardhat");
const {utils} = require("ethers");

async function main() {

    let tokenName = "Test2";
    let ticker = "TEST2";
    let supply = utils.parseEther("100000000");
    /* let supply = utils.parseUnits("100000000", "gwei"); */

    console.log(`Operating in network ${hre.network.name}`)

    const [deployer] = await hre.ethers.getSigners();

    let holder = deployer.address;

    console.log(
    "Deploying contracts with the account:",
    deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const TokenFactory = await ethers.getContractFactory("ProtocolToken");
    const TokenInstance = await TokenFactory.deploy(supply, holder, tokenName, ticker);

    console.log("Token address:", TokenInstance.address);
    
    /* await sleep(120);
    await hre.run("verify:verify", {
        address: TokenInstance.address,
        constructorArguments: [supply, holder, tokenName, ticker],
    }) */
    

}

main()
    .then(() => process.exit(0))
    .catch(error => {
    console.error(error);
    process.exit(1);
    });