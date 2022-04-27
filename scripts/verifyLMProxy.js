const axios = require("axios");
const fs = require("fs");

async function main() {

    let address = "0xD858B37Bc72A999D761d7F02C455Af33889527e3";
    let contractName = "UpgradeabilityProxy";
    let compilerVersion = "v0.7.6+commit.7338295f";
    let sourceCodeFile = "./flattened/UpgradeabilityProxyFlat.sol";
    let sourceCode = fs.readFileSync(sourceCodeFile).toString('utf-8');


    let url = "https://blockscout.com/poa/sokol/api?module=contract&action=verify";
    let params = {
        addressHash: address,
        name: contractName,
        compilerVersion: compilerVersion,
        optimization: false,
        contractSourceCode: sourceCode
    }

    response = await axios({
        method: "post",
        url: url,
        data: params
    })

    console.log(axios.defaults.timeout);

    console.log(response);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
    console.error(error);
    process.exit(1);
    });