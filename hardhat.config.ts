import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0".repeat(64);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    ritual: {
      url: process.env.RITUAL_RPC_URL || "https://rpc.ritualfoundation.org",
      chainId: 1979,
      accounts: [PRIVATE_KEY],
    },
    ritualTestnet: {
      url: process.env.RITUAL_TESTNET_RPC_URL || "https://rpc.ritualfoundation.org",
      chainId: 1979,
      accounts: [PRIVATE_KEY],
    },
    hardhat: {
      chainId: 1979,
    },
  },
  etherscan: {
    apiKey: {
      ritual: process.env.RITUALSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "ritual",
        chainId: 1979,
        urls: {
          apiURL: "https://scan.ritual.net/api",
          browserURL: "https://scan.ritual.net",
        },
      },
    ],
  },
};

export default config;
