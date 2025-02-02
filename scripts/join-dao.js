const { ethers, network } = require("hardhat");
const { getNetworkConfig } = require("../helper-hardhat-config");

async function joinDao() {
  try {
    // Get network configuration
    const networkName = network.name;
    const chainId = network.config.chainId;
    console.log(`Joining DAO on ${networkName} (Chain ID: ${chainId})`);

    // Member address that wants to join
    const memberAddress = "0x07b1DAf7b72dd9E0F6D57e4B9C8cFC00719096f9";
    console.log("Member trying to join:", memberAddress);

    // Get network config
    const config = getNetworkConfig(chainId);

    // Get contract instances
    const userSide = await ethers.getContractAt(
      "UserSide",
      config.userSideAddress
    );

    // Get the DAO ID (assuming the last created DAO)
    const totalDaos = await userSide.totalDaos();
    const daoId = totalDaos;
    console.log("Attempting to join DAO ID:", daoId.toString());

    // Get DAO details
    const daoDetails = await userSide.daoIdtoDao(daoId);
    console.log("\nDAO Details:");
    console.log("- Name:", daoDetails.daoName);
    console.log("- Governance Token:", daoDetails.governanceTokenAddress);
    console.log(
      "- Joining Threshold:",
      ethers.formatEther(daoDetails.joiningThreshold),
      "tokens"
    );
    console.log("- Is Private:", daoDetails.isPrivate);

    // Check if DAO is private
    if (daoDetails.isPrivate) {
      console.log(
        "\nError: Cannot join private DAO directly. Need admin invitation."
      );
      return;
    }

    // First, check if the member exists as a user
    let memberId = await userSide.userWallettoUserId(memberAddress);
    if (memberId.toString() === "0") {
      console.log("\nCreating new user for member...");
      const createUserTx = await userSide.createUser(
        "New Member",
        "member@example.com",
        "New DAO Member",
        "ipfs://member-profile-image",
        memberAddress
      );
      await createUserTx.wait(chainId === 11155111 ? 2 : 1);
      console.log("User created for member!");
      memberId = await userSide.userWallettoUserId(memberAddress);
    }
    console.log("Member User ID:", memberId.toString());

    // Check if already a member
    const isMember = await userSide.checkMembership(daoId, memberAddress);
    if (isMember) {
      console.log("\nAddress is already a member of this DAO!");
      return;
    }

    // Get governance token instance to check balance
    const governanceToken = await ethers.getContractAt(
      "GovernanceToken",
      daoDetails.governanceTokenAddress
    );

    const tokenBalance = await governanceToken.balanceOf(memberAddress);
    console.log("\nToken Balance:", ethers.formatEther(tokenBalance), "tokens");

    if (tokenBalance < daoDetails.joiningThreshold) {
      console.log("\nError: Insufficient token balance to join DAO");
      console.log(
        "Required:",
        ethers.formatEther(daoDetails.joiningThreshold),
        "tokens"
      );
      console.log(
        "Current balance:",
        ethers.formatEther(tokenBalance),
        "tokens"
      );
      return;
    }

    // Join DAO
    console.log("\nJoining DAO...");
    const joinDaoTx = await userSide.joinDao(
      daoId, // DAO ID
      memberAddress // Member's address
    );

    console.log("Transaction hash:", joinDaoTx.hash);
    console.log("Waiting for transaction to be mined...");
    await joinDaoTx.wait(chainId === 11155111 ? 2 : 1);
    console.log("Successfully joined DAO!");

    // Get updated DAO members
    const members = await userSide.getAllDaoMembers(daoId);
    console.log(
      "\nUpdated DAO Members:",
      members.map((m) => m.toString())
    );

    // Verify membership
    const membershipVerified = await userSide.checkMembership(
      daoId,
      memberAddress
    );
    console.log("\nMembership verified:", membershipVerified);
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
    await joinDao();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
