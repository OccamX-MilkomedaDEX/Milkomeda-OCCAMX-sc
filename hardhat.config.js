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
    milkomedaTestnet: {
        url: process.env.MilkomedaTestnetAPI,
        accounts: [ process.env.MilkomedaTestnetDeployerPrivateKey,
                    process.env.MilkomedaTestnetUser1PrivateKey,
                    process.env.MilkomedaTestnetUser2PrivateKey ],
        },
    milkomedaMainnet: {
    url: process.env.MilkomedaMainnetAPI,
    accounts: [ process.env.MilkomedaMainnetDeployerPrivateKey ],
        }
    }
};


