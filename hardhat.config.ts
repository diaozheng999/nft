import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

if (process.env.PRIVATE_KEY) {
  config.networks = {
    polygon_mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
  };
}

if (process.env.POLYGONSCAN_API_KEY) {
  config.etherscan = {
    apiKey: `${process.env.POLYGONSCAN_API_KEY}`,
  };
}

export default config;
