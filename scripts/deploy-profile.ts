import { ethers } from "hardhat";

async function main() {
  console.log("Deploying RittyProfile to Ritual Testnet...");

  const RittyProfile = await ethers.getContractFactory("RittyProfile");
  const profile = await RittyProfile.deploy();

  await profile.waitForDeployment();
  const address = await profile.getAddress();

  console.log(`✅ RittyProfile deployed to: ${address}`);
  console.log("\nUpdate frontend with this address:");
  console.log(`NEXT_PUBLIC_PROFILE_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
