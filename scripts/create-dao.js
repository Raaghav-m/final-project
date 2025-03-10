const { ethers, network } = require("hardhat");
const { getNetworkConfig } = require("../helper-hardhat-config");

async function createDao() {
  try {
    // Get network configuration
    const networkName = network.name;
    const chainId = network.config.chainId;
    console.log(`Creating DAO on ${networkName} (Chain ID: ${chainId})`);

    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log("Using address:", deployer.address);

    // Get network config
    const config = getNetworkConfig(chainId);

    // Get contract instances
    const userSide = await ethers.getContractAt(
      "UserSide",
      config.userSideAddress
    );
    const createGovernance = await ethers.getContractAt(
      "CreateGovernanceToken",
      config.createGovernanceAddress
    );

    // First, check if user exists
    const userId = await userSide.userWallettoUserId(deployer.address);
    if (userId.toString() === "0") {
      console.log("Creating new user first...");
      const createUserTx = await userSide.createUser(
        "Test User",
        "test@example.com",
        "Test Description",
        "ipfs://profile-image-hash",
        deployer.address
      );
      await createUserTx.wait(chainId === 11155111 ? 2 : 1);
      console.log("User created!");
    }
    console.log("User ID:", userId.toString());

    // Deploy governance token for the DAO
    console.log("\nDeploying governance token for DAO...");
    const TOKEN_NAME = "Test DAO Token";
    const TOKEN_SYMBOL = "TDT";
    const INITIAL_SUPPLY = ethers.parseEther("500"); // 1 million tokens

    const deployTokenTx = await createGovernance.deployToken(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      INITIAL_SUPPLY,
      userId
    );
    console.log("Waiting for token deployment...");
    await deployTokenTx.wait(chainId === 11155111 ? 2 : 1);

    // Get the deployed token address
    const totalTokens = await createGovernance.getTotalTokesnDeployed(userId);
    const deployedTokens = [];
    for (let i = 0; i < totalTokens; i++) {
      const tokenAddress = await createGovernance.userIdtoDeployedTokens(
        userId,
        i
      );
      deployedTokens.push(tokenAddress);
    }
    const governanceTokenAddress = deployedTokens[deployedTokens.length - 1];
    console.log("Governance token deployed at:", governanceTokenAddress);

    // Create DAO
    console.log("\nCreating DAO...");
    const createDaoTx = await userSide.createDao(
      "Test DAO", // DAO name
      "A test DAO for demonstration", // Description
      10, // Joining threshold (100 tokens)
      100, // Proposing threshold (1000 tokens)
      governanceTokenAddress, // Governance token address
      false, // Is private
      deployer.address // Creator wallet
    );

    console.log("Transaction hash:", createDaoTx.hash);
    console.log("Waiting for transaction to be mined...");
    await createDaoTx.wait(chainId === 11155111 ? 2 : 1);

    // Get DAO details
    const totalDaos = await userSide.totalDaos();
    const daoId = totalDaos;
    const daoDetails = await userSide.daoIdtoDao(daoId);

    console.log("\nDAO Created Successfully!");
    console.log("DAO Details:");
    console.log("- ID:", daoId.toString());
    console.log("- Name:", daoDetails.daoName);
    console.log("- Description:", daoDetails.daoDescription);
    console.log("- Creator ID:", daoDetails.creator.toString());
    console.log(
      "- Joining Threshold:",
      ethers.formatEther(daoDetails.joiningThreshold),
      "tokens"
    );
    console.log(
      "- Proposing Threshold:",
      ethers.formatEther(daoDetails.proposingThreshold),
      "tokens"
    );
    console.log("- Governance Token:", daoDetails.governanceTokenAddress);
    console.log("- Is Private:", daoDetails.isPrivate);

    // Get DAO members
    const members = await userSide.getAllDaoMembers(daoId);
    console.log(
      "\nInitial DAO Members:",
      members.map((m) => m.toString())
    );
  } catch (error) {
    console.error("\nDetailed error:");
    console.error("Message:", error.message);
    if (error.transaction) {
      console.error("Transaction:", error.transaction);
    }
    if (error.receipt) {
      console.error("Receipt:", error.receipt);
    }
    throw error;
  }
}

async function main() {
  try {
    await createDao();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
