const { ethers, network } = require("hardhat");
const { getNetworkConfig } = require("../helper-hardhat-config");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForVotingEnd(userSide, proposalId) {
  while (true) {
    try {
      const proposal = await userSide.proposalIdtoProposal(proposalId);
      const currentTime = Math.floor(Date.now() / 1000);
      const endTime = Number(proposal.endingTime);

      if (currentTime >= endTime) {
        console.log("\nVoting period has ended!");
        break;
      }

      const timeLeft = endTime - currentTime;
      console.log(
        `\nWaiting for voting to end... ${timeLeft} seconds remaining`
      );

      // Wait for 30 seconds before checking again
      await sleep(30000);
    } catch (error) {
      console.error("Error checking voting status:", error);
      throw error;
    }
  }
}

async function main() {
  try {
    // Get network configuration
    const networkName = network.name;
    const chainId = network.config.chainId;
    const isSepolia = chainId === 11155111;
    const confirmations = isSepolia ? 2 : 1;

    console.log(
      `Testing vote-once proposal on ${networkName} (Chain ID: ${chainId})`
    );

    // Get signers for all accounts
    const [admin, user1, user2] = await ethers.getSigners();
    console.log("\nTest accounts:");
    console.log("Admin:", admin.address);
    console.log("User 1:", user1.address);
    console.log("User 2:", user2.address);

    // Hardcoded contract addresses for Sepolia
    const userSideAddress = getNetworkConfig(chainId).userSideAddress;
    const governanceTokenAddress =
      getNetworkConfig(chainId).governanceTokenAddress;

    console.log("\nContract Addresses:");
    console.log("UserSide:", userSideAddress);
    console.log("GovernanceToken:", governanceTokenAddress);

    // Get contract instances
    const userSide = await ethers.getContractAt("UserSide", userSideAddress);
    const governanceToken = await ethers.getContractAt(
      "GovernanceToken",
      governanceTokenAddress
    );

    // Get the latest DAO
    const totalDaos = await userSide.totalDaos();
    console.log("\nTotal DAOs:", totalDaos.toString());

    if (totalDaos === 0n) {
      throw new Error("No DAOs found. Please create a DAO first.");
    }
    const daoId = totalDaos;

    // Check DAO membership
    const user1IsMember = await userSide.checkMembership(daoId, user1.address);
    const user2IsMember = await userSide.checkMembership(daoId, user2.address);

    console.log("\nDAO Membership Status:");
    console.log("User 1 is member:", user1IsMember);
    console.log("User 2 is member:", user2IsMember);

    if (!user1IsMember || !user2IsMember) {
      throw new Error("Users must be DAO members first");
    }

    // Check token balances
    const user1Balance = await governanceToken.balanceOf(user1.address);
    const user2Balance = await governanceToken.balanceOf(user2.address);

    console.log("\nToken Balances:");
    console.log("User 1:", ethers.formatEther(user1Balance), "tokens");
    console.log("User 2:", ethers.formatEther(user2Balance), "tokens");

    if (
      user1Balance < ethers.parseEther("100") ||
      user2Balance < ethers.parseEther("100")
    ) {
      throw new Error("Users need at least 100 tokens each");
    }

    // Create a vote-once proposal
    console.log("\nCreating vote-once proposal...");
    const currentTime = Math.floor(Date.now() / 1000);
    const oneHour = 360;

    const createProposalTx = await userSide.connect(user1).createProposal(
      1, // Normal voting
      "Test Vote-Once Proposal",
      ethers.parseEther("100"), // 100 tokens to vote
      daoId,
      governanceTokenAddress,
      user1.address,
      currentTime,
      currentTime + oneHour,
      51, // 51% to pass
      true, // vote once enabled
      { gasLimit: 300000 }
    );
    console.log("Create proposal transaction hash:", createProposalTx.hash);
    await createProposalTx.wait(confirmations);

    const proposalId = await userSide.totalProposals();
    console.log("New Proposal ID:", proposalId.toString());

    // First vote from user1
    console.log("\nUser 1 voting YES...");
    const approve1Tx = await governanceToken
      .connect(user1)
      .approve(userSideAddress, ethers.parseEther("100"), { gasLimit: 100000 });
    console.log("Approval transaction hash:", approve1Tx.hash);
    await approve1Tx.wait(confirmations);

    const vote1Tx = await userSide.connect(user1).voteForProposal(
      proposalId,
      1, // YES
      user1.address,
      { gasLimit: 200000 }
    );
    console.log("First vote transaction hash:", vote1Tx.hash);
    await vote1Tx.wait(confirmations);

    // Try to vote again with user1 (should fail)
    console.log("\nTrying to vote again with User 1 (should fail)...");
    try {
      await governanceToken
        .connect(user1)
        .approve(userSideAddress, ethers.parseEther("100"), {
          gasLimit: 100000,
        });

      await userSide.connect(user1).voteForProposal(
        proposalId,
        1, // YES
        user1.address,
        { gasLimit: 200000 }
      );
      console.log("ERROR: Second vote should have failed!");
    } catch (error) {
      console.log("Second vote failed as expected:", error.message);
    }

    // User2 votes
    console.log("\nUser 2 voting NO...");
    const approve2Tx = await governanceToken
      .connect(user2)
      .approve(userSideAddress, ethers.parseEther("100"), { gasLimit: 100000 });
    console.log("Approval transaction hash:", approve2Tx.hash);
    await approve2Tx.wait(confirmations);

    const vote2Tx = await userSide.connect(user2).voteForProposal(
      proposalId,
      2, // NO
      user2.address,
      { gasLimit: 200000 }
    );
    console.log("User 2 vote transaction hash:", vote2Tx.hash);
    await vote2Tx.wait(confirmations);

    // Get voting results
    const yesVoters = await userSide.getAllYesVotes(proposalId);
    const noVoters = await userSide.getAllNoVotes(proposalId);

    console.log("\nCurrent Voting Results:");
    console.log("Yes Votes:", yesVoters.length);
    console.log("No Votes:", noVoters.length);

    if (!isSepolia) {
      await network.provider.send("evm_increaseTime", [3600]);
      await network.provider.send("evm_mine");
    } else {
      console.log("\nWaiting for voting period to end on Sepolia...");
      await waitForVotingEnd(userSide, proposalId);
    }

    // Try to finalize the proposal
    console.log("\nAttempting to finalize proposal...");
    const finalizeTx = await userSide.finalizeProposal(proposalId, {
      gasLimit: 200000,
    });
    console.log("Finalize transaction hash:", finalizeTx.hash);
    await finalizeTx.wait(confirmations);

    // Get final result
    const proposalResult = await userSide.getProposalResult(proposalId);
    console.log("\nFinal Result:", proposalResult ? "Passed" : "Failed");
  } catch (error) {
    console.error("\nScript Failed:");
    console.error("Error Message:", error.message);
    if (error.transaction) {
      console.error("Transaction Hash:", error.transaction.hash);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
