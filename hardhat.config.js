require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

const SEPOLIA_URL = process.env.SEPOLIA_URL;

// Get all private keys from .env
const getPrivateKeys = () => {
  const keys = [];
  const numKeys = parseInt(process.env.NUM_PRIVATE_KEYS || "0");

  for (let i = 1; i <= numKeys; i++) {
    const key = process.env[`PRIVATE_KEY_${i}`];
    if (key) {
      keys.push(key);
    }
  }
  return keys;
};

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1,
      accounts: getPrivateKeys().map((key) => ({
        privateKey: key,
        balance: "10000000000000000000000", // 10000 ETH
      })),
    },
    sepolia: {
      chainId: 11155111,
      url: SEPOLIA_URL,
      saveDeployments: true,
      accounts: getPrivateKeys(),
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.7",
      },
      {
        version: "0.8.17",
      },
      {
        version: "0.8.20",
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0, // First private key is deployer
    },
    user1: {
      default: 1, // Second private key
    },
    user2: {
      default: 2, // Third private key
    },
  },
};
