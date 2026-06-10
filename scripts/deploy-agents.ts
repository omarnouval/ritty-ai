import { ethers } from "hardhat";

async function main() {
  console.log("Deploying RittyAgent to Ritual Testnet...");

  // Agent configurations
  const agents = [
    {
      name: "Content Pro",
      category: "content",
      systemPrompt: "You are a content creation specialist. Help users write blog posts, social media content, video scripts, and marketing copy. Be creative, engaging, and professional."
    },
    {
      name: "Research Alpha",
      category: "research",
      systemPrompt: "You are a research analyst. Help users conduct market research, analyze competitors, and extract data insights. Be thorough, analytical, and evidence-based."
    },
    {
      name: "Trading Signal",
      category: "trading",
      systemPrompt: "You are a trading analyst. Help users analyze crypto markets, manage portfolios, and identify trading opportunities. Be data-driven and risk-aware."
    },
    {
      name: "Marketing Guru",
      category: "marketing",
      systemPrompt: "You are a marketing strategist. Help users plan campaigns, optimize SEO, analyze metrics, and grow their brand. Be creative and results-oriented."
    },
    {
      name: "Code Assistant",
      category: "coding",
      systemPrompt: "You are a senior software engineer. Help users write, debug, review code and design system architecture. Be precise, efficient, and follow best practices."
    }
  ];

  const RittyAgent = await ethers.getContractFactory("RittyAgent");
  
  for (const agent of agents) {
    console.log(`\nDeploying ${agent.name}...`);
    
    const rittyAgent = await RittyAgent.deploy(
      agent.name,
      agent.category,
      agent.systemPrompt
    );

    await rittyAgent.waitForDeployment();
    const address = await rittyAgent.getAddress();

    console.log(`✅ ${agent.name} deployed to: ${address}`);
    console.log(`   Category: ${agent.category}`);
    console.log(`   System Prompt: ${agent.systemPrompt.substring(0, 50)}...`);
  }

  console.log("\n🎉 All agents deployed successfully!");
  console.log("\nNext steps:");
  console.log("1. List these agents in the AgentMarketplace contract");
  console.log("2. Update frontend with agent addresses");
  console.log("3. Test chat functionality");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
