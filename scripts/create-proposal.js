const { ethers, network } = require("hardhat");

async function main() {
  try {
    // Get network configuration
    const networkName = network.name;
    const chainId = network.config.chainId;
    const isSepolia = chainId === 11155111;
    const confirmations = isSepolia ? 2 : 1;

    console.log(
      `\nCreating a sample proposal on ${networkName} (Chain ID: ${chainId})`
    );

    // Get signers
    const [admin, user1, user2] = await ethers.getSigners();
    console.log("\nTest Accounts:");
    console.log("Admin:", admin.address);
    console.log("User 1:", user1.address);
    console.log("User 2:", user2.address);

    // Contract addresses (replace with your deployed contract addresses)
    const userSideAddress = "0x7661c9F567c41101bf2Af2b7592Aeb840A867AEF";
    const governanceTokenAddress = "0x65BbC2437b955393eB21610a72C18b724D3cC63e";

    console.log("\nContract Addresses:");
    console.log("UserSide:", userSideAddress);
    console.log("GovernanceToken:", governanceTokenAddress);

    // Get contract instances
    const userSide = await ethers.getContractAt("UserSide", userSideAddress);
    const governanceToken = await ethers.getContractAt(
      "GovernanceToken",
      governanceTokenAddress
    );

    // Verify contracts are deployed
    const userSideCode = await ethers.provider.getCode(userSideAddress);
    const governanceTokenCode = await ethers.provider.getCode(
      governanceTokenAddress
    );

    if (userSideCode === "0x" || governanceTokenCode === "0x") {
      throw new Error(
        "One or more contracts are not deployed at the specified addresses"
      );
    }

    // Retrieve DAO ID (assuming the latest DAO is the one to use)
    const totalDaos = await userSide.totalDaos();
    if (totalDaos === 0n) {
      throw new Error("No DAOs found. Please create a DAO first.");
    }
    const daoId = totalDaos;
    console.log("\nUsing DAO ID:", daoId.toString());

    // Retrieve User ID for user1
    const userId = await userSide.userWallettoUserId(user1.address);
    if (userId === 0n) {
      throw new Error("User1 is not registered. Please create the user first.");
    }
    console.log("User 1 ID:", userId.toString());

    // Define proposal parameters
    const proposalType = 2; // For example, 2 could represent Quadratic Voting
    const proposalTitleAndDesc =
      "Increase DAO treasury funds for community projects.";
    const votingThreshold = ethers.parseEther("25"); // 25 tokens for quadratic voting (√25 = 5 voting power)
    const daoIdParam = daoId;
    const governanceTokenAddr = governanceTokenAddress;
    const userWalletAddr = user1.address;

    // Define voting window (e.g., starts now + 1 minute, ends now + 10 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const beginningTime = BigInt(currentTime + 60); // Starts in 1 minute
    const endingTime = BigInt(currentTime + 600); // Ends in 10 minutes

    const passingThreshold = 50; // Example: 50 votes needed to pass
    const voteOnce = true; // Users can vote only once

    console.log("\nProposal Parameters:");
    console.log("Proposal Type:", proposalType);
    console.log("Title and Description:", proposalTitleAndDesc);
    console.log(
      "Voting Threshold (Tokens):",
      ethers.formatEther(votingThreshold)
    );
    console.log("DAO ID:", daoIdParam.toString());
    console.log("Governance Token Address:", governanceTokenAddr);
    console.log("Proposer Wallet Address:", userWalletAddr);
    console.log(
      "Voting Starts At:",
      new Date(Number(beginningTime) * 1000).toLocaleString()
    );
    console.log(
      "Voting Ends At:",
      new Date(Number(endingTime) * 1000).toLocaleString()
    );
    console.log("Passing Threshold:", passingThreshold);
    console.log("Vote Once Enabled:", voteOnce);

    // Create the proposal
    console.log("\nCreating Proposal...");
    const createProposalTx = await userSide
      .connect(user1)
      .createProposal(
        proposalType,
        proposalTitleAndDesc,
        votingThreshold,
        daoIdParam,
        governanceTokenAddr,
        userWalletAddr,
        beginningTime,
        endingTime,
        passingThreshold,
        voteOnce,
        { gasLimit: 500000 }
      );

    console.log("Transaction Hash:", createProposalTx.hash);
    const receipt = await createProposalTx.wait(confirmations);

    if (receipt.status === 0) {
      throw new Error("Proposal creation transaction failed");
    }

    console.log("Proposal created successfully in block:", receipt.blockNumber);

    // Retrieve the new proposal ID
    const totalProposals = await userSide.totalProposals();
    const newProposalId = totalProposals;
    console.log("New Proposal ID:", newProposalId.toString());

    // Fetch and display proposal details
    const proposalDetails = await userSide.proposalIdtoProposal(newProposalId);
    console.log("\nNew Proposal Details:");
    console.log("- Proposal ID:", proposalDetails.proposalId.toString());
    console.log("- Proposal Type:", proposalDetails.proposalType.toString());
    console.log(
      "- Title and Description:",
      proposalDetails.proposalTitleAndDesc
    );
    console.log("- Proposer ID:", proposalDetails.proposerId.toString());
    console.log(
      "- Voting Threshold:",
      ethers.formatEther(proposalDetails.votingThreshold)
    );
    console.log("- DAO ID:", proposalDetails.daoId.toString());
    console.log("- Voting Token Address:", proposalDetails.votingTokenAddress);
    console.log(
      "- Beginning Time:",
      new Date(Number(proposalDetails.beginningTime) * 1000).toLocaleString()
    );
    console.log(
      "- Ending Time:",
      new Date(Number(proposalDetails.endingTime) * 1000).toLocaleString()
    );
    console.log(
      "- Passing Threshold:",
      proposalDetails.passingThreshold.toString()
    );
    console.log("- Vote Once Enabled:", proposalDetails.voteOnce);
  } catch (error) {
    console.error("\nScript failed:");
    console.error("Error message:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nUnexpected error:");
    console.error(error);
    process.exit(1);
  });
