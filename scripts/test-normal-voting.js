const { ethers, network } = require("hardhat");

async function main() {
  try {
    // Get network configuration
    const networkName = network.name;
    const chainId = network.config.chainId;
    const isSepolia = chainId === 11155111;
    const confirmations = isSepolia ? 2 : 1;

    console.log(
      `Testing normal voting on ${networkName} (Chain ID: ${chainId})`
    );

    // Get signers for all accounts
    const [admin, user1, user2] = await ethers.getSigners();
    console.log("\nTest accounts:");
    console.log("Admin:", admin.address);
    console.log("User 1:", user1.address);
    console.log("User 2:", user2.address);

    // Hardcoded contract addresses for Sepolia
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

    // Get the latest proposal
    const totalProposals = await userSide.totalProposals();
    console.log("\nTotal Proposals:", totalProposals.toString());

    if (totalProposals === 0n) {
      throw new Error("No proposals found. Please create a proposal first.");
    }
    const proposalId = totalProposals;

    // Check if proposal exists and is active
    const proposal = await userSide.proposalIdtoProposal(proposalId);
    const currentTime = Math.floor(Date.now() / 1000);

    console.log("\nProposal Details:");
    console.log(
      "Start Time:",
      new Date(Number(proposal.startingTime) * 1000).toLocaleString()
    );
    console.log(
      "End Time:",
      new Date(Number(proposal.endingTime) * 1000).toLocaleString()
    );
    console.log("Current Time:", new Date(currentTime * 1000).toLocaleString());

    if (currentTime < Number(proposal.startingTime)) {
      throw new Error("Voting has not started yet");
    }
    if (currentTime > Number(proposal.endingTime)) {
      throw new Error("Voting has already ended");
    }

    console.log("\nTesting with:");
    console.log("DAO ID:", daoId.toString());
    console.log("Proposal ID:", proposalId.toString());

    // Test Normal Voting
    console.log("\n=== Testing Normal Voting ===");

    // User 1 votes YES with 100 tokens
    console.log("\nUser 1 voting YES with 100 tokens...");
    const approve1Tx = await governanceToken
      .connect(user1)
      .approve(userSideAddress, ethers.parseEther("100"), { gasLimit: 100000 });
    console.log("Approval transaction hash:", approve1Tx.hash);
    await approve1Tx.wait(confirmations);

    try {
      const vote1Tx = await userSide.connect(user1).voteForProposal(
        proposalId,
        1, // YES
        user1.address,
        { gasLimit: 200000 }
      );
      console.log("Vote transaction hash:", vote1Tx.hash);
      await vote1Tx.wait(confirmations);
    } catch (error) {
      console.error("\nVoting Error Details:");
      console.error("Error Message:", error.message);
      if (error.error) {
        console.error("Error Reason:", error.error.reason);
      }
      throw error;
    }

    // User 2 votes NO with 100 tokens
    console.log("\nUser 2 voting NO with 100 tokens...");
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
    console.log("Vote transaction hash:", vote2Tx.hash);
    await vote2Tx.wait(confirmations);

    // Get voting results
    const yesVoters = await userSide.getAllYesVotes(proposalId);
    const noVoters = await userSide.getAllNoVotes(proposalId);

    console.log("\nVoting Results:");
    console.log("Yes Votes:", yesVoters.length);
    console.log("No Votes:", noVoters.length);

    if (!isSepolia) {
      await network.provider.send("evm_increaseTime", [3600]);
      await network.provider.send("evm_mine");
    } else {
      console.log("\nWaiting for voting period to end on Sepolia...");
    }

    await new Promise((resolve) => setTimeout(resolve, 600000));

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
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
