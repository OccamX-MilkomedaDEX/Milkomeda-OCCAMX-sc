const { expect } = require("chai");
const hre = require("hardhat");
const { utils } = require("ethers");




describe("feeBurn", () => {
    let deployer;
    let token1Instance, token2Instance, WETHInstance;
    let routerInstance;

    beforeEach(async () => {
        [ deployer ] = await hre.ethers.getSigners();

        const tokenSupply = utils.parseEther("100000000");
        const tokenFactory = await hre.ethers.getContractFactory("ProtocolToken", deployer);
        token1Instance = await tokenFactory.deploy(tokenSupply, deployer.address, "token1", "TK1");
        token2Instance = await tokenFactory.deploy(tokenSupply, deployer.address, "token2", "TK2");
        
        const WETHFactory = await hre.ethers.getContractFactory("WETH", deployer);
        WETHInstance = await WETHFactory.deploy();

        const FactoryFactory = await hre.ethers.getContractFactory("Factory", deployer);
        const FactoryInstance = await hre.ethers.deploy(deployer.address);
    });
});