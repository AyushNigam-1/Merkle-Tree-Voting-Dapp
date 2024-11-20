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
    hardhat: {
      chainId: 1337,
    },
  },
};
