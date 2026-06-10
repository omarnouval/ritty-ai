import { ethers } from "hardhat";

async function main() {
  const MARKETPLACE_ADDRESS = "0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE";
  
  // Agent details from deployment
  const agents = [
    {
      contract: "0x2C08D301Bf4Dc353c1B90FFBcF20e2F1b997698f",
      name: "Content Pro",
      description: "AI agent specialized in content creation — blog posts, social media, scripts, copywriting",
      capabilities: ["content", "copywriting", "social-media"],
      pricePerHour: ethers.parseEther("0.01"),
      agentType: 0 // SOVEREIGN (no validation)
    },
    {
      contract: "0x3d5b379De4820AF12ff2Ab797b0d3b552A91BA3e",
      name: "Research Alpha",
      description: "AI agent for market research, competitor analysis, and data insights",
      capabilities: ["research", "analysis", "data"],
      pricePerHour: ethers.parseEther("0.015"),
      agentType: 0 // SOVEREIGN
    },
    {
      contract: "0xe7df613e37232667B3196F1DfD94A5De4306307c",
      name: "Trading Signal",
      description: "Crypto trading analyst — market analysis, portfolio management, signals",
      capabilities: ["trading", "crypto", "signals"],
      pricePerHour: ethers.parseEther("0.02"),
      agentType: 0 // SOVEREIGN
    },
    {
      contract: "0x3919071913123D25bA04f6Aa56A5f6bD36530915",
      name: "Marketing Guru",
      description: "Marketing strategist — campaigns, SEO, growth hacking, analytics",
      capabilities: ["marketing", "seo", "growth"],
      pricePerHour: ethers.parseEther("0.012"),
      agentType: 0 // SOVEREIGN
    },
    {
      contract: "0x4C735C3706006C3e2Bccf0328c417ff264a3130E",
      name: "Code Assistant",
      description: "Senior software engineer — code generation, debugging, review, architecture",
      capabilities: ["coding", "debugging", "review"],
      pricePerHour: ethers.parseEther("0.018"),
      agentType: 0 // SOVEREIGN
    }
  ];

  console.log("Listing agents in AgentMarketplace...");
  console.log(`Marketplace: ${MARKETPLACE_ADDRESS}\n`);

  const marketplace = await ethers.getContractAt("AgentMarketplace", MARKETPLACE_ADDRESS);

  for (const agent of agents) {
    console.log(`Listing ${agent.name}...`);
    
    try {
      const tx = await marketplace.listAgent(
        agent.contract,
        agent.name,
        agent.description,
        agent.capabilities,
        agent.pricePerHour,
        agent.agentType
      );
      
      await tx.wait();
      console.log(`✅ ${agent.name} listed! TX: ${tx.hash}`);
    } catch (error: any) {
      console.log(`❌ Failed to list ${agent.name}: ${error.message}`);
    }
  }

  console.log("\n🎉 Listing complete!");
  console.log("Check marketplace at: https://ritty-ai.vercel.app/marketplace");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
