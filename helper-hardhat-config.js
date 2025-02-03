const networkConfig = {
  31337: {
    name: "localhost",
    governanceTokenAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    createGovernanceAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    userSideAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    blockConfirmations: 1,
  },
  11155111: {
    name: "sepolia",
    governanceTokenAddress: "", //paste the address of the governance token
    createGovernanceAddress: "", //paste the address of the create governance address
    userSideAddress: "", //paste the address of the userside contract
    blockConfirmations: 2,
  },
};

const developmentChains = ["hardhat", "localhost"];

function getNetworkConfig(chainId) {
  if (!chainId) chainId = 31337; // default to localhost
  const config = networkConfig[chainId];
  if (!config) {
    throw new Error(`No configuration found for chain ID ${chainId}`);
  }
  return config;
}

module.exports = {
  networkConfig,
  developmentChains,
  getNetworkConfig,
};
