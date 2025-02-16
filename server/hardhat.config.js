require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
const fs = require("fs");
const path = require("path");

task("clean", "Clean the artifacts, cache, and ignition deployment directories", async () => {
  const dirs = ["artifacts", "cache", "ignition/deployments"]; // Add ignition/deployment
  dirs.forEach((dir) => {
    const dirPath = path.resolve(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`${dir} folder deleted`);
    }
  });
});

module.exports = {
  solidity: "0.8.27",
  networks: {
    zkTest: {
      url: "https://rpc.testnet.immutable.com",
      chainId: 13473,
      accounts: ["0x3af0860959ac77e78ef9814f1b19962585fae66b5979ca1cb0edfeb3a423b6ca"]
    },
    ethTest: {
      url: "https://1rpc.io/holesky",
      chainId: 17000,
      accounts: ["0x3af0860959ac77e78ef9814f1b19962585fae66b5979ca1cb0edfeb3a423b6ca"]
    },
    hardhat: {
      chainId: 1337,
    },
  },
};