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

    const TokenFactory = await ethers.getContractFactory("ERC20Permit");
    const Token1Instance = await TokenFactory.attach("0x4AD6B6B9a9C817C544D398d297dffbC77d64683B");
    const Token2Instance = await TokenFactory.attach("0xB5a2fDA777EAeED6A665742aCAefD7417140618e");
    const Token3Instance = await TokenFactory.attach("0xd8717258bC00Ba82041394981B0290D7281122de");

    console.log(`Token 1 balance ${await Token1Instance.balanceOf(deployer.address)}`);
    console.log(`Token 2 balance ${await Token2Instance.balanceOf(deployer.address)}`);
    console.log(`Token 3 balance ${await Token3Instance.balanceOf(deployer.address)}`);
    
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