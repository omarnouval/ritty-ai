import hre from "hardhat";
import { parseEther } from "viem";

const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS || "";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Creating agent with:", deployer.address);

  const marketplace = await hre.ethers.getContractAt("AgentMarketplace", MARKETPLACE_ADDRESS);

  // Create a sample sovereign agent (use a dummy address for test)
  const agentContract = deployer.address; // In production, this would be the actual agent contract

  console.log("Listing agent...");
  const tx = await marketplace.listAgent(
    agentContract,
    "Alpha Hunter Bot",
    "Monitors Twitter/Telegram for alpha signals. Analyzes sentiment and provides real-time alerts.",
    ["research", "monitoring", "trading"],
    parseEther("0.01"), // 0.01 ETH per hour
    1, // PERSISTENT
  );

  const receipt = await tx.wait();
  console.log("Agent listed! TX:", receipt.hash);

  // Create a sovereign agent
  const tx2 = await marketplace.listAgent(
    agentContract,
    "Code Reviewer",
    "One-shot code review agent. Submit a PR link and get detailed feedback.",
    ["code-review", "analysis"],
    parseEther("0.005"), // 0.005 ETH per hour
    0, // SOVEREIGN
  );

  const receipt2 = await tx2.wait();
  console.log("Agent 2 listed! TX:", receipt2.hash);

  const count = await marketplace.agentCount();
  console.log("\nTotal agents:", count.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
