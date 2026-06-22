const { ethers } = require("hardhat");

async function main() {
  const RENTAL = "0x896277Ca55946c3602Bb6f5668d2eDdAb645A76c";
  const abi = [
    "function listAgent(string _name, string _description, string[] _capabilities, uint256 _pricePerHour) external returns (uint256)"
  ];
  
  const [signer] = await ethers.getSigners();
  const rental = new ethers.Contract(RENTAL, abi, signer);
  
  const agents = [
    { name: "Content Pro", desc: "AI content creation agent", caps: ["writing", "seo", "social"], price: "5000000000000000" },
    { name: "Research Alpha", desc: "Deep research agent", caps: ["research", "analysis", "summarization"], price: "5000000000000000" },
    { name: "Code Assistant", desc: "AI coding agent", caps: ["coding", "debugging", "review"], price: "5000000000000000" },
    { name: "Marketing Guru", desc: "Marketing strategy agent", caps: ["marketing", "branding", "growth"], price: "5000000000000000" },
    { name: "Trading Signal", desc: "Crypto trading signals", caps: ["trading", "analysis", "signals"], price: "5000000000000000" },
    { name: "HealthGuide", desc: "Health and wellness agent", caps: ["health", "wellness", "fitness"], price: "5000000000000000" },
  ];
  
  for (const a of agents) {
    try {
      const tx = await rental.listAgent(a.name, a.desc, a.caps, ethers.parseEther("0.005"));
      await tx.wait();
      console.log(`Listed: ${a.name} - ${tx.hash}`);
    } catch (e) {
      console.log(`Failed: ${a.name} - ${e.message.slice(0, 80)}`);
    }
  }
}

main().catch(console.error);
