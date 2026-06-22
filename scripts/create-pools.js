const { ethers } = require("hardhat");

async function main() {
  const STAKING = "0x2E3f82aE26a0EfE83B63bdabC905fFa3321223d0";
  const abi = ["function createPool(uint256 _agentId) external"];
  
  const [signer] = await ethers.getSigners();
  const staking = new ethers.Contract(STAKING, abi, signer);
  
  for (let i = 1; i <= 6; i++) {
    try {
      const tx = await staking.createPool(i);
      await tx.wait();
      console.log(`Pool ${i} created: ${tx.hash}`);
    } catch (e) {
      console.log(`Pool ${i} failed: ${e.message.slice(0, 80)}`);
    }
  }
}

main().catch(console.error);
