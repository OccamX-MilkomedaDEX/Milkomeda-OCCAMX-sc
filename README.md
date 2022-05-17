# Milkomeda-OCCAMX-sc

![HackMD Image](https://hackmd.io/_uploads/SJc3QSC_K.png)

## Installation
```
npm install
```

## Running tests
```
npm run test
```

## Deployment
### Zap contract
First adjust the parameters in `scripts/deployZap.js` as needed.
It takes address of the router, WADA and a pool for testing the ADA zap in.

Make sure you have the environment variables setup as required by the `hardhat.config.ts`. This includes the netwrok RPC to connect to and the private key for the deployer to send transactions from.

```
npx hardhat run scripts/deployZap.js --network milkomeda<Main|Test>net
```
