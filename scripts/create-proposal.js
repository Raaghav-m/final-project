const { ethers, network } = require("hardhat");
const { getNetworkConfig } = require("../helper-hardhat-config");

async function createAndVoteProposal() {
  try {
    // Get network configuration
    const networkName = network.name;
    const chainId = network.config.chainId;
    console.log(`Testing vote on ${networkName} (Chain ID: ${chainId})`);

    // Get signer
    const [user1] = await ethers.getSigners();
    console.log("\nUser address:", user1.address);

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

    // Get governance token instance
    const governanceToken = await ethers.getContractAt(
      "GovernanceToken",
      daoDetails.governanceTokenAddress
    );

    // Check if user is member
    const isUserMember = await userSide.checkMembership(daoId, user1.address);
    console.log("\nMembership Status:");
    console.log("User is member:", isUserMember);

    if (!isUserMember) {
      console.log("\nError: User must be a member of this DAO!");
      return;
    }

    // Check token balance
    const userBalance = await governanceToken.balanceOf(user1.address);
    console.log("\nToken Balance:");
    console.log("User:", ethers.formatEther(userBalance), "tokens");

    // Get the latest proposal
    const totalProposals = await userSide.totalProposals();
    const proposalId = totalProposals;
    const proposalDetails = await userSide.proposalIdtoProposal(proposalId);

    console.log("\nProposal Details:");
    console.log("- ID:", proposalId.toString());
    console.log("- Title:", proposalDetails.proposalTitleAndDesc);
    console.log("- Vote Once:", proposalDetails.voteOnce);
    console.log(
      "- Beginning Time:",
      new Date(Number(proposalDetails.beginningTime) * 1000).toLocaleString()
    );
    console.log(
      "- Ending Time:",
      new Date(Number(proposalDetails.endingTime) * 1000).toLocaleString()
    );

    // Check if voting is active
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime < Number(proposalDetails.beginningTime)) {
      console.log("\nError: Voting has not started yet!");
      return;
    }
    if (currentTime > Number(proposalDetails.endingTime)) {
      console.log("\nError: Voting has ended!");
      return;
    }

    // Approve and vote
    console.log("\nVoting process:");
    const votingThreshold = proposalDetails.votingThreshold;

    const approveTx = await governanceToken.approve(
      config.userSideAddress,
      votingThreshold,
      { gasLimit: 100000 }
    );
    console.log("Token approval hash:", approveTx.hash);
    await approveTx.wait(chainId === 11155111 ? 2 : 1);

    const voteTx = await userSide.voteForProposal(
      proposalId,
      1, // YES
      user1.address,
      { gasLimit: 200000 }
    );
    console.log("Vote transaction hash:", voteTx.hash);
    await voteTx.wait(chainId === 11155111 ? 2 : 1);
    console.log("Vote recorded successfully!");

    // Get voting results
    const yesVotes = await userSide.getAllYesVotes(proposalId);
    const noVotes = await userSide.getAllNoVotes(proposalId);

    console.log("\nCurrent Voting Results:");
    console.log("- Yes Votes:", yesVotes.length);
    console.log("- No Votes:", noVotes.length);
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
    await createAndVoteProposal();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
