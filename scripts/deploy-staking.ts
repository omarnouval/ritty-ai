import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying new RittyStakingPool with:", deployer.address);

  // New rental contract
  const RENTAL_ADDRESS = "0x896277Ca55946c3602Bb6f5668d2eDdAb645A76c";

  const Staking = await ethers.getContractFactory("RittyStakingPool");
  const staking = await Staking.deploy(RENTAL_ADDRESS);
  await staking.waitForDeployment();

  const address = await staking.getAddress();
  console.log("New RittyStakingPool deployed to:", address);
  console.log("Verify with:");
  console.log(`npx hardhat verify --network ritual ${address} ${RENTAL_ADDRESS}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
