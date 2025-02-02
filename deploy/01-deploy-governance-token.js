const { network, ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("----------------------------------------------------");
  const args = ["Sample Token", "SMPL", ethers.parseEther("1000000")]; // Example args

  await deploy("GovernanceToken", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  log("----------------------------------------------------");
};

module.exports.tags = ["all", "governancetoken"];
