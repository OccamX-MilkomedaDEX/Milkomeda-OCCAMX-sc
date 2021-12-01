const { utils, BigNumber } = require("ethers");

function sleep(s) {
    if (s > 0) {
        console.log(`Waiting for ${s} seconds`);
        return new Promise(resolve => setTimeout(resolve, s*1000));
    }
}

function getInputData (functionSig, functionName, args) {
    let ABI = [functionSig];
    let iface = new utils.Interface(ABI);
    return iface.encodeFunctionData(functionName, args);
}

function secondsSinceEpoch() {
    return Math.round(Date.now() / 1000);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getRandomBigNumber(max) {
    return BigNumber.from(utils.randomBytes(32)).mod(max);
}

async function getCurrentBlock(provider) {
    let currentBlockNumber = await provider.getBlockNumber();
    let currentBlock = await provider.getBlock(currentBlockNumber);

    // loop to avoid provider.getBlockNumber caching bug
    while (currentBlock === null && currentBlockNumber >= 0) {
        currentBlockNumber--;
        currentBlock = await provider.getBlock(currentBlockNumber);
    }

    return currentBlock;
}

async function fastForwardTo(provider, timestamp) {
    let currentBlock = await getCurrentBlock(provider);
    let currentTime = currentBlock.timestamp;
    provider.send("evm_increaseTime", [timestamp - currentTime]);
    provider.send("evm_mine", []);
}

async function sendTxAndWait(contractInstance, sender, functionName, functionArgs) {
    const tx = await contractInstance.connect(sender)[functionName](...functionArgs);

    const txHash = tx.hash;

    while ((await hre.ethers.provider.getTransactionReceipt(txHash)) == null) {
        console.log(`waiting for transaction ${functionName} to be finished.`);
        await sleep(10);
    }

    const txReceipt = await hre.ethers.provider.getTransactionReceipt(txHash);

    console.log(`receipt for transaction ${functionName}`);
    console.log(txReceipt);
    console.log(`---------------------------------------`);
}

module.exports = { secondsSinceEpoch, getRandomInt, getRandomBigNumber, getInputData, sleep, getCurrentBlock, fastForwardTo, sendTxAndWait };
