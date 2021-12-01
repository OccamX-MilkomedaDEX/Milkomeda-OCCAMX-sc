const { expect } = require("chai");
const hre = require("hardhat");
const { utils } = require("ethers");
const { constants } = require("ethers");




describe("feeBurn", () => {
    let deployer;
    let token1Instance, token2Instance, WADAInstance, PTInstance;
    let factoryInstance, routerInstance, collectorInstance;

    beforeEach(async () => {
        [ deployer ] = await hre.ethers.getSigners();
        let provider = hre.ethers.provider;

        /* const tokenSupply = utils.parseEther("100000000");
        const poolLiquidity = utils.parseEther("10000")
        const tokenFactory = await hre.ethers.getContractFactory("ProtocolToken", deployer);
        token1Instance = await tokenFactory.deploy(tokenSupply, deployer.address, "token1", "TK1");
        token2Instance = await tokenFactory.deploy(tokenSupply, deployer.address, "token2", "TK2");
        PTInstance = await tokenFactory.deploy(tokenSupply, deployer.address, "ProtocolToken", "PT");

        const WADAFactory = await hre.ethers.getContractFactory("WADA10", deployer);
        WADAInstance = await WADAFactory.deploy();

        const factoryFactory = await hre.ethers.getContractFactory("Factory", deployer);
        factoryInstance = await factoryFactory.deploy(deployer.address);
 */

        const routerFactory = await hre.ethers.getContractFactory("Router02", deployer);
        routerInstance = await routerFactory.deploy(deployer.address, deployer.address);

        /* routerInstance = await routerFactory.deploy(factoryInstance.address, WADAInstance.address);

        const collectorFactory = await hre.ethers.getContractFactory("Collector", deployer);
        collectorInstance = await collectorFactory.deploy(factoryInstance.address, PTInstance.address, WADAInstance.address);

        await token1Instance.connect(deployer).approve(routerInstance.address, tokenSupply);
        await token2Instance.connect(deployer).approve(routerInstance.address, tokenSupply);
        await PTInstance.connect(deployer).approve(routerInstance.address, tokenSupply);

        await routerInstance.connect(deployer).addLiquidity(token1Instance.address, token2Instance.address, poolLiquidity, poolLiquidity, 0, 0, deployer.address, 1000000000000000);
        await routerInstance.connect(deployer).addLiquidity(token1Instance.address, PTInstance.address, poolLiquidity, poolLiquidity, 0, 0, deployer.address, 1000000000000000);
        await routerInstance.connect(deployer).addLiquidity(PTInstance.address, token2Instance.address, poolLiquidity, poolLiquidity, 0, 0, deployer.address, 1000000000000000);
        await routerInstance.connect(deployer).addLiquidityADA(PTInstance.address, poolLiquidity, 0, 0, deployer.address, 1000000000000000, {value: poolLiquidity});
        await routerInstance.connect(deployer).addLiquidityADA(token1Instance.address, poolLiquidity, 0, 0, deployer.address, 1000000000000000, {value: poolLiquidity});
        await routerInstance.connect(deployer).addLiquidityADA(token2Instance.address, poolLiquidity, 0, 0, deployer.address, 1000000000000000, {value: poolLiquidity}); */

    });

    it('pools are correctly initialized', async () => {
        /* expect(await factoryInstance.getPair(token1Instance.address, token2Instance)).to.be.not.equal(constants.AddressZero); */
    });
});