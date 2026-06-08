import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy marketplace with deployer as treasury
  const Marketplace = await hre.ethers.getContractFactory("AgentMarketplace");
  const marketplace = await Marketplace.deploy(deployer.address);
  await marketplace.waitForDeployment();

  const address = await marketplace.getAddress();
  console.log("AgentMarketplace deployed to:", address);

  // Verify on RitualScan
  if (hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await marketplace.deploymentTransaction()?.wait(5);

    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments: [deployer.address],
      });
      console.log("Verified on RitualScan");
    } catch (e: any) {
      console.log("Verification failed:", e.message);
    }
  }

  console.log("\n=== Deployment Complete ===");
  console.log("Marketplace:", address);
  console.log("Treasury:", deployer.address);
  console.log("Network:", hre.network.name);
  console.log("Add to .env:");
  console.log(`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
