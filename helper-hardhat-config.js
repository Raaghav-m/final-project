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
    governanceTokenAddress: "0x65BbC2437b955393eB21610a72C18b724D3cC63e",
    createGovernanceAddress: "0x97C51f70a44c0837E02a180e5D116EC2B57c2581",
    userSideAddress: "0x7661c9F567c41101bf2Af2b7592Aeb840A867AEF",
  },
  1: {
    name: "mainnet",
    governanceTokenAddress: "your_governance_token_address",
    createGovernanceAddress: "your_create_governance_address",
    userSideAddress: "your_user_side_address",
    blockConfirmations: 6,
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
