const { ethers } = require("hardhat");
const { getNetworkConfig } = require("../helper-hardhat-config");
async function main() {
  try {
    // Get network configuration
    const networkName = network.name;
    const chainId = network.config.chainId;
    console.log(`Getting user ID on ${networkName} (Chain ID: ${chainId})`);

    // Contract address
    const userSideAddress = getNetworkConfig(chainId).userSideAddress;
    console.log("\nUserSide Contract Address:", userSideAddress);

    // Get contract instance
    const userSide = await ethers.getContractAt("UserSide", userSideAddress);

    // Get signers
    const [admin, user1] = await ethers.getSigners();

    // Array of addresses to check
    const addressesToCheck = [user1.address];

    console.log("\nLooking up User IDs...");

    for (const address of addressesToCheck) {
      try {
        const userId = await userSide.userWallettoUserId(address);
        console.log(`\nAddress: ${address}`);
        console.log(`User ID: ${userId.toString()}`);

        // If userId exists, get user details
        if (userId > 0) {
          const userDetails = await userSide.userIdtoUser(userId);
          console.log("User Details:");
          console.log("- Name:", userDetails.userName);
          console.log("- Email:", userDetails.userEmail);
          console.log("- Description:", userDetails.description);
        }
      } catch (error) {
        console.error(`Error getting user ID for ${address}:`, error.message);
      }
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
