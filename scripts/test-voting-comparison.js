const { ethers, network } = require("hardhat");

async function main() {
  try {
    // Get network configuration
    const networkName = network.name;
    const chainId = network.config.chainId;
    const isSepolia = chainId === 11155111;
    const confirmations = isSepolia ? 2 : 1;

    console.log(
      `Testing voting mechanisms on ${networkName} (Chain ID: ${chainId})`
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

    // Get the latest DAO
    const totalDaos = await userSide.totalDaos();
    if (totalDaos === 0n) {
      throw new Error("No DAOs found. Please create a DAO first.");
    }
    const daoId = totalDaos;

    // Get the latest proposals
    const totalProposals = await userSide.totalProposals();
    if (totalProposals === 0n) {
      throw new Error("No proposals found. Please create proposals first.");
    }
    const proposal1Id = totalProposals - 1n; // Regular voting
    const proposal2Id = totalProposals; // Quadratic voting

    console.log("\nTesting with:");
    console.log("DAO ID:", daoId.toString());
    console.log("Regular Voting Proposal ID:", proposal1Id.toString());
    console.log("Quadratic Voting Proposal ID:", proposal2Id.toString());

    // Verify DAO membership
    for (const user of [user1, user2]) {
      const isMember = await userSide.checkMembership(daoId, user.address);
      if (!isMember) {
        throw new Error(
          `${user.address} is not a member of the DAO. Please join the DAO first.`
        );
      }
    }

    // Test Regular Voting
    console.log("\n=== Testing Regular Voting ===");

    // User 1 votes YES with 100 tokens
    console.log("\nUser 1 voting YES with 100 tokens...");
    const approve1Tx = await governanceToken
      .connect(user1)
      .approve(userSideAddress, ethers.parseEther("100"), { gasLimit: 100000 });
    console.log("Approval transaction hash:", approve1Tx.hash);
    await approve1Tx.wait(confirmations);

    const vote1Tx = await userSide.connect(user1).voteForProposal(
      proposal1Id,
      1, // YES
      user1.address,
      { gasLimit: 200000 }
    );
    console.log("Vote transaction hash:", vote1Tx.hash);
    await vote1Tx.wait(confirmations);

    // User 2 votes NO with 100 tokens
    console.log("\nUser 2 voting NO with 100 tokens...");
    const approve2Tx = await governanceToken
      .connect(user2)
      .approve(userSideAddress, ethers.parseEther("100"), { gasLimit: 100000 });
    console.log("Approval transaction hash:", approve2Tx.hash);
    await approve2Tx.wait(confirmations);

    const vote2Tx = await userSide.connect(user2).voteForProposal(
      proposal1Id,
      2, // NO
      user2.address,
      { gasLimit: 200000 }
    );
    console.log("Vote transaction hash:", vote2Tx.hash);
    await vote2Tx.wait(confirmations);

    // Get voting results
    const yesVotes = await userSide.getAllYesVotes(proposal1Id);
    const noVotes = await userSide.getAllNoVotes(proposal1Id);

    console.log("\nCurrent Voting Results:");
    console.log("Yes Votes:", yesVotes.length);
    console.log("No Votes:", noVotes.length);
  } catch (error) {
    console.error("\nDetailed error:");
    console.error("Message:", error.message);
    if (error.transaction) {
      console.error("Transaction:", error.transaction);
    }
    if (error.receipt) {
      console.error("Receipt:", error.receipt);
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
