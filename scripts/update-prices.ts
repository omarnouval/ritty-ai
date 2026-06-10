import { ethers } from "hardhat";

async function main() {
  const MARKETPLACE_ADDRESS = "0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE";
  
  // Agent IDs from listing (1-5)
  const agentIds = [1, 2, 3, 4, 5];
  
  // New prices (very cheap for testnet)
  const newPrices = {
    1: ethers.parseEther("0.0001"), // Content Pro
    2: ethers.parseEther("0.0001"), // Research Alpha
    3: ethers.parseEther("0.0001"), // Trading Signal
    4: ethers.parseEther("0.0001"), // Marketing Guru
    5: ethers.parseEther("0.0001"), // Code Assistant
  };

  console.log("Updating agent prices to 0.0001 RITUAL/hr...");
  const marketplace = await ethers.getContractAt("AgentMarketplace", MARKETPLACE_ADDRESS);

  for (const id of agentIds) {
    try {
      console.log(`Updating agent ${id}...`);
      const tx = await marketplace.updatePrice(id, newPrices[id]);
      await tx.wait();
      console.log(`✅ Agent ${id} updated! TX: ${tx.hash}`);
    } catch (error: any) {
      console.log(`❌ Agent ${id} failed: ${error.message?.slice(0, 80)}`);
    }
  }

  console.log("\n🎉 Prices updated!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
