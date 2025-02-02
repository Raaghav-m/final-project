const { ethers, network } = require("hardhat");

async function main() {
  try {
    // Get network configuration
    const networkName = network.name;
    const chainId = network.config.chainId;
    const isSepolia = chainId === 11155111;
    const confirmations = isSepolia ? 2 : 1;

    console.log(
      `Testing quadratic voting on ${networkName} (Chain ID: ${chainId})`
    );

    // Get signers
    const [admin, user1, user2] = await ethers.getSigners();
    console.log("\nTest accounts:");
    console.log("Admin:", admin.address);
    console.log("User 1:", user1.address);
    // Contract addresses
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

    // Verify contracts
    const userSideCode = await ethers.provider.getCode(userSideAddress);
    const governanceTokenCode = await ethers.provider.getCode(
      governanceTokenAddress
    );

    if (userSideCode === "0x" || governanceTokenCode === "0x") {
      throw new Error(
        "One or more contracts are not deployed at the specified addresses"
      );
    }

    // Get the latest DAO
    const totalDaos = await userSide.totalDaos();
    if (totalDaos === 0n) {
      throw new Error("No DAOs found. Please create a DAO first.");
    }
    const daoId = totalDaos;
    console.log("\nUsing DAO ID:", daoId.toString());

    // Check user's voting power first
    const userId = 3; // Assuming user1's ID is 1
    const votingPower = await userSide.getVotingPower(daoId, userId);
    console.log("\nUser's voting power:", votingPower.toString());

    // Create a new quadratic voting proposal
    console.log("\nCreating new quadratic voting proposal...");
    const currentTime = Math.floor(Date.now() / 1000);
    const beginTime = BigInt(currentTime + 30);
    const endTime = BigInt(currentTime + 120);

    const proposalTx = await userSide.connect(user1).createProposal(
      2, // Quadratic voting type
      "Test Quadratic Voting Proposal",
      ethers.parseEther("1"), // Reduced threshold to 1 token
      daoId,
      governanceTokenAddress,
      user1.address,
      beginTime,
      endTime,
      51,
      false
    );

    console.log("Creating proposal, transaction hash:", proposalTx.hash);
    await proposalTx.wait(confirmations);
    console.log("Proposal created successfully!");

    const proposalId = await userSide.totalProposals();
    console.log("New Proposal ID:", proposalId.toString());

    // Wait for voting to begin
    console.log("\nWaiting for voting period to begin...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Get proposal details to verify voting period
    const proposal = await userSide.proposalIdtoProposal(proposalId);
    console.log("\nProposal Details:");
    console.log(
      "Begin Time:",
      new Date(Number(proposal.beginningTime) * 1000).toLocaleString()
    );
    console.log(
      "End Time:",
      new Date(Number(proposal.endingTime) * 1000).toLocaleString()
    );
    console.log(
      "Voting Threshold:",
      ethers.formatEther(proposal.votingThreshold)
    );

    // Verify user can vote
    const isMember = await userSide.checkMembership(daoId, user1.address);
    console.log("\nUser Status:");
    console.log("Is member:", isMember);

    const balance = await governanceToken.balanceOf(user1.address);
    console.log("Token balance:", ethers.formatEther(balance));

    // Calculate optimal voting tokens (25 tokens = 5 voting power)
    const votingTokens = ethers.parseEther("0.009");

    console.log("\nVoting Power Calculation:");
    console.log("Tokens being used:", ethers.formatEther(votingTokens));
    console.log("Raw token amount in wei:", votingTokens.toString());
    console.log(
      "Expected voting power (√25):",
      Math.sqrt(25),
      "(5 voting power)"
    );
    console.log("Maximum allowed voting power: 10");

    // Verify calculations
    console.log("\nVerifying calculations:");
    console.log("- 25 tokens = √25 = 5 voting power (good value)");
    console.log("- 100 tokens = √100 = 10 voting power (maximum)");
    console.log("- 1 token = √1 = 1 voting power (minimum)");
    console.log("- Current attempt: 25 tokens = 5 voting power");

    // Approve tokens
    console.log("\nApproving tokens...");
    const approveTx = await governanceToken
      .connect(user1)
      .approve(userSideAddress, votingTokens);
    console.log("Approval transaction hash:", approveTx.hash);
    await approveTx.wait(confirmations);

    // Cast vote with try-catch
    console.log("\nCasting quadratic vote...");
    try {
      const voteTx = await userSide.connect(user1).qvVoting(
        proposalId,
        votingTokens,
        user1.address,
        1 // YES vote
      );
      console.log("Vote transaction hash:", voteTx.hash);
      const receipt = await voteTx.wait(confirmations);
      console.log("Vote confirmed in block:", receipt.blockNumber);

      // Get the actual voting weight recorded
      const yesWeight = await userSide.quadraticYesMappings(proposalId, userId);
      console.log("\nActual voting weight recorded:", yesWeight.toString());
    } catch (error) {
      console.error("\nVoting failed:");
      console.error("Error message:", error.message);
      if (error.data) {
        try {
          const decodedError = userSide.interface.parseError(error.data);
          console.error("Decoded error:", decodedError);
        } catch (e) {
          console.error("Raw error data:", error.data);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("\nScript failed:");
    console.error("Error message:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
