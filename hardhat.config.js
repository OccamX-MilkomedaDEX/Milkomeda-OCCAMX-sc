// loading variables from .env
require('dotenv').config();
const process = require('process');

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan"); 
require("@nomiclabs/hardhat-ethers");
require("hardhat-contract-sizer");


const { utils } = require("ethers");
/* const { sleep } = require("./scripts/helpers"); */

module.exports = {
  solidity: {
    compilers: [
        {
            version: "0.7.6",
        },
        {
            version: "0.5.16",
        },
        {
            version: "0.6.6",
        },
        {
            version: "0.6.12",
        },
        ],   
    },
  networks: {
    rinkeby: {
        url: process.env.RinkebyInfuraAPI,
        accounts: [ process.env.RinkebyWhiteLabelDeployerPrivateKey ],
        },
    milkomedaTestnet: {
        url: process.env.MilkomedaTestnetAPI,
        accounts: [ process.env.MilkomedaTestnetDeployerPrivateKey,
                    process.env.MilkomedaTestnetUser1PrivateKey,
                    process.env.MilkomedaTestnetUser2PrivateKey ],
        },
    milkomedaMainnet: {
    url: process.env.MilkomedaMainnetAPI,
    accounts: [ process.env.MilkomedaMainnetDeployerPrivateKey ],
        },
    mainnet: {
        url: process.env.MainnetAlchemyAPI,
        accounts: [ process.env.RazerPersonalPrivateKey ],
        },
    BSC: {
            url: process.env.BSCRPCURL,
            accounts: [ process.env.StarlyDeployerPrivateKey]
        }
    },
    etherscan: {
        apiKey: process.env.EtherscanApiKey,
    }
};


