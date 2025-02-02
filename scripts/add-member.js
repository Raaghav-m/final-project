const { ethers, network } = require("hardhat");
const { getNetworkConfig } = require("../helper-hardhat-config");

async function addMember() {
  try {
    // Get network configuration
    const networkName = network.name;
    const chainId = network.config.chainId;
    console.log(`Adding member on ${networkName} (Chain ID: ${chainId})`);

    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log("Admin address:", deployer.address);

    // Member address to add
    const memberAddress = "0xcBE66646C0450d75957F726cF99dAD471916933B";
    console.log("Adding member:", memberAddress);

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
    console.log("Using DAO ID:", daoId.toString());

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

    // Check if member is already in the DAO
    const isMember = await userSide.checkMembership(daoId, memberAddress);
    if (isMember) {
      console.log("\nAddress is already a member of this DAO!");
      return;
    }

    // Add member to DAO using addMembertoDao function
    console.log("\nAdding member to DAO...");
    const addMemberTx = await userSide.addMembertoDao(
      daoId, // DAO ID
      memberAddress, // New member's address
      deployer.address // Admin's address
    );

    console.log("Transaction hash:", addMemberTx.hash);
    console.log("Waiting for transaction to be mined...");
    await addMemberTx.wait(chainId === 11155111 ? 2 : 1);
    console.log("Member added successfully!");

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
    await addMember();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
