import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying RittyRental with:", deployer.address);

  // Staking pool address (already deployed)
  const STAKING_POOL = "0x93A5445D1f514b00a4012b2cceA4c669cDcc43D5";

  const Rental = await ethers.getContractFactory("RittyRental");
  const rental = await Rental.deploy(STAKING_POOL);
  await rental.waitForDeployment();

  const address = await rental.getAddress();
  console.log("RittyRental deployed to:", address);

  // Verify on explorer
  console.log("Verify with:");
  console.log(`npx hardhat verify --network ritual ${address} ${STAKING_POOL}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
