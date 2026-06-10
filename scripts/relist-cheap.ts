import { ethers } from "hardhat";

async function main() {
  const MARKETPLACE_ADDRESS = "0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE";
  
  // Agent contracts
  const agents = [
    { contract: "0x2C08D301Bf4Dc353c1B90FFBcF20e2F1b997698f", name: "Content Pro", category: "content" },
    { contract: "0x3d5b379De4820AF12ff2Ab797b0d3b552A91BA3e", name: "Research Alpha", category: "research" },
    { contract: "0xe7df613e37232667B3196F1DfD94A5De4306307c", name: "Trading Signal", category: "trading" },
    { contract: "0x3919071913123D25bA04f6Aa56A5f6bD36530915", name: "Marketing Guru", category: "marketing" },
    { contract: "0x4C735C3706006C3e2Bccf0328c417ff264a3130E", name: "Code Assistant", category: "coding" },
  ];

  const marketplace = await ethers.getContractAt("AgentMarketplace", MARKETPLACE_ADDRESS);

  // Deactivate old listings (IDs 1-6)
  console.log("Deactivating old listings...");
  for (let i = 1; i <= 6; i++) {
    try {
      const tx = await marketplace.deactivateAgent(i);
      await tx.wait();
      console.log(`✅ Deactivated agent ${i}`);
    } catch (e: any) {
      console.log(`⚠️ Agent ${i}: ${e.message?.slice(0, 50)}`);
    }
  }

  // Relist with cheap prices
  console.log("\nRelisting with 0.0001 RITUAL/hr...");
  const cheapPrice = ethers.parseEther("0.0001");

  for (const agent of agents) {
    try {
      const tx = await marketplace.listAgent(
        agent.contract,
        agent.name,
        `${agent.name} — AI agent for ${agent.category}`,
        [agent.category],
        cheapPrice,
        0 // SOVEREIGN
      );
      await tx.wait();
      console.log(`✅ ${agent.name} listed at 0.0001 RITUAL/hr`);
    } catch (e: any) {
      console.log(`❌ ${agent.name}: ${e.message?.slice(0, 80)}`);
    }
  }

  console.log("\n🎉 Done! All agents now cost 0.0001 RITUAL/hr");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
