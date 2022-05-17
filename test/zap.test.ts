import { ethers } from 'hardhat';
import chai, { use } from 'chai';
import { solidity } from 'ethereum-waffle';

chai.config.includeStack = true;

import { ZapOccamX } from '../typechain/ZapOccamX';
import { WETH9 } from '../typechain/WETH9';
import { Factory } from '../typechain/Factory';
import { Pair } from '../typechain/Pair';
import { Router02 } from '../typechain/Router02';
import { MockCoin } from '../typechain/MockCoin';

import { deployMockContract } from '@ethereum-waffle/mock-contract';
import { BigNumber, ContractTransaction, providers, utils } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { isBytes } from '@ethersproject/bytes';
import { ZlibParams } from 'zlib';

const fs = require('fs');
const hre = require('hardhat');

chai.use(solidity);
const { expect } = chai;



describe('Zap', () => {
	let zap: ZapOccamX;
	let coin1, coin2, coin3: MockCoin;
	let liquidity1, liquidity2, liquidity3, liquidityWAda: BigNumber;
	let factory: Factory;
	let pair12, pair3Ada: Pair;
	let router: Router02;
	let wADA: WETH9;

	let deployer, user1, user2: SignerWithAddress;

	beforeEach(async () => {
		[ deployer, user1, user2 ] = await ethers.getSigners();

		// DEPLOY & SETUP all the stuff we need for testing (tokens, weth, factory, pairs, router)
		const coinFactory = await ethers.getContractFactory('MockCoin', deployer);
		coin1 = (await coinFactory.deploy('One', '1ONE')) as MockCoin;
		liquidity1 = utils.parseEther("1");
		coin2 = (await coinFactory.deploy('Two', '2TWO')) as MockCoin;
		liquidity2 = utils.parseEther("2");
		coin3 = (await coinFactory.deploy('Three', '2THREE')) as MockCoin;
		liquidity3 = utils.parseEther("3");


		// wADA is for wrapped ADA on Milkomeda, so it is the WETH equivalent
		const wAdaFactory = await hre.ethers.getContractFactory("WETH9", deployer);
        wADA = await wAdaFactory.deploy() as WETH9;
		liquidityWAda = utils.parseEther("0.5");

		const factoryFactory = await hre.ethers.getContractFactory("Factory", deployer);
        factory = await factoryFactory.deploy(deployer.address);
		await factory.deployed();

        const routerFactory = await hre.ethers.getContractFactory("Router02");
        router = await routerFactory.deploy(factory.address, wADA.address);

		// we want to test with one token-token pool and one token-wADA pool
		let pairInterface = JSON.parse(fs.readFileSync('./artifacts/contracts/Pair.sol/Pair.json'))['abi'];
		const addressPair12 = await factory.getPair(coin1.address, coin2.address);
		pair12 = (new hre.ethers.Contract(addressPair12, pairInterface, deployer)) as Pair;
		await coin1.mint(deployer.address, liquidity1);
		await coin2.mint(deployer.address, liquidity2);
		await coin1.connect(deployer).approve(router.address, liquidity1);
        await coin2.connect(deployer).approve(router.address, liquidity2);
		await router.connect(deployer).addLiquidity(coin1.address, coin2.address, liquidity1, liquidity2, 0, 0, deployer.address, 1000000000000000);

		const addressPair3Ada = await factory.getPair(wADA.address, coin3.address);
		pair3Ada = (new hre.ethers.Contract(addressPair3Ada, pairInterface, deployer)) as Pair;
		await coin3.mint(deployer.address, liquidity3);
		await coin3.connect(deployer).approve(router.address, liquidity3);
		await router.connect(deployer).addLiquidityADA(coin3.address, liquidity3, 0, 0, deployer.address, 1000000000000000, {value: liquidityWAda});

		// SETUP the zap contract we want to test
		const zapFactory = await hre.ethers.getContractFactory('ZapOccamX', deployer);
		zap = (await zapFactory.deploy(router.address, wADA.address)) as ZapOccamX;
	});

	it('should construct the zap contract', async () => {
		expect(zap.address).to.properAddress;
	});
});