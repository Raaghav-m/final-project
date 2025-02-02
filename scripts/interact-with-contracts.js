const { ethers, network } = require("hardhat");
const { getNetworkConfig } = require("../helper-hardhat-config");

async function interactWithContracts() {
  try {
    // Get network configuration
    const networkName = network.name;
    const chainId = network.config.chainId;
    console.log(
      `Interacting with contracts on ${networkName} (Chain ID: ${chainId})`
    );

    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log("Using address:", deployer.address);

    // Get network config
    const config = getNetworkConfig(chainId);
    console.log("Using contracts:");
    console.log("- UserSide:", config.userSideAddress);
    console.log("- CreateGovernance:", config.createGovernanceAddress);
    console.log("- GovernanceToken:", config.governanceTokenAddress);

    // Get contract instances
    const userSide = await ethers.getContractAt(
      "UserSide",
      config.userSideAddress
    );
    const createGovernance = await ethers.getContractAt(
      "CreateGovernanceToken",
      config.createGovernanceAddress
    );

    // Verify contracts are deployed
    const userSideCode = await ethers.provider.getCode(config.userSideAddress);
    if (userSideCode === "0x") {
      throw new Error("UserSide contract not deployed at specified address");
    }

    const createGovernanceCode = await ethers.provider.getCode(
      config.createGovernanceAddress
    );
    if (createGovernanceCode === "0x") {
      throw new Error(
        "CreateGovernanceToken contract not deployed at specified address"
      );
    }

    // Get total users before
    const totalUsersBefore = await userSide.totalUsers();
    console.log("\nTotal users before:", totalUsersBefore.toString());

    // Create a new user
    console.log("\nCreating new user...");
    const createUserTx = await userSide.createUser(
      "Test User",
      "test@example.com",
      "Test Description",
      "ipfs://profile-image-hash",
      deployer.address
    );

    console.log("Transaction hash:", createUserTx.hash);
    console.log("Waiting for transaction to be mined...");

    // Wait for more confirmations on Sepolia
    const confirmations = chainId === 11155111 ? 2 : 1;
    await createUserTx.wait(confirmations);
    console.log("Transaction mined!");

    // Get total users after
    const totalUsersAfter = await userSide.totalUsers();
    console.log("Total users after:", totalUsersAfter.toString());

    // Get user ID
    const userId = await userSide.userWallettoUserId(deployer.address);
    console.log("User ID:", userId.toString());

    // Deploy a governance token
    console.log("\nDeploying governance token...");
    const TOKEN_NAME = "Test DAO Token";
    const TOKEN_SYMBOL = "TDT";
    const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens

    const deployTokenTx = await createGovernance.deployToken(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      INITIAL_SUPPLY,
      userId
    );
    console.log("Transaction hash:", deployTokenTx.hash);
    console.log("Waiting for transaction to be mined...");
    await deployTokenTx.wait(confirmations);
    console.log("Governance token deployed!");

    // Get total tokens deployed
    const totalTokens = await createGovernance.getTotalTokesnDeployed(userId);
    console.log("Total tokens deployed for user:", totalTokens.toString());

    // Get user details
    const userDetails = await userSide.userIdtoUser(userId);
    console.log("\nUser Details:");
    console.log("- Name:", userDetails.userName);
    console.log("- Email:", userDetails.userEmail);
    console.log("- Description:", userDetails.description);
    console.log("- Profile Image:", userDetails.profileImage);
    console.log("- Wallet:", userDetails.userWallet);
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
    await interactWithContracts();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
