const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy UserSide contract
  console.log("Deploying UserSide...");
  const UserSide = await ethers.getContractFactory("UserSide");
  const userSide = await UserSide.deploy();
  await userSide.waitForDeployment();
  const userSideAddress = await userSide.getAddress();
  console.log("UserSide deployed to:", userSideAddress);

  // Verify the deployment
  const code = await ethers.provider.getCode(userSideAddress);
  console.log("Contract deployed successfully:", code !== "0x");

  // Save this address to use in your interaction script
  console.log(
    "\nUpdate your interaction script with this address:",
    userSideAddress
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
