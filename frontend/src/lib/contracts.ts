export const MARKETPLACE_ADDRESS = (process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE') as `0x${string}`;

export const MARKETPLACE_ABI = [
  // Events
  {
    type: 'event',
    name: 'AgentListed',
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: true, name: 'owner', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'agentType', type: 'uint8' },
    ],
  },
  {
    type: 'event',
    name: 'AgentRented',
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: true, name: 'renter', type: 'address' },
      { name: 'duration', type: 'uint256' },
      { name: 'totalPaid', type: 'uint256' },
    ],
  },
  // Read functions
  {
    type: 'function',
    name: 'agents',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'agentContract', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'pricePerHour', type: 'uint256' },
      { name: 'totalEarnings', type: 'uint256' },
      { name: 'totalRentals', type: 'uint256' },
      { name: 'rating', type: 'uint256' },
      { name: 'ratingCount', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'agentType', type: 'uint8' },
    ],
  },
  {
    type: 'function',
    name: 'agentCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getActiveAgents',
    stateMutability: 'view',
    inputs: [
      { name: '_offset', type: 'uint256' },
      { name: '_limit', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getUserAgents',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'calculateRentalCost',
    stateMutability: 'view',
    inputs: [
      { name: '_agentId', type: 'uint256' },
      { name: '_hours', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Write functions
  {
    type: 'function',
    name: 'listAgent',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_agentContract', type: 'address' },
      { name: '_name', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_capabilities', type: 'string[]' },
      { name: '_pricePerHour', type: 'uint256' },
      { name: '_agentType', type: 'uint8' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'rentAgent',
    stateMutability: 'payable',
    inputs: [
      { name: '_agentId', type: 'uint256' },
      { name: '_hours', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'rateAgent',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_agentId', type: 'uint256' },
      { name: '_rating', type: 'uint8' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdrawEarnings',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'deactivateAgent',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_agentId', type: 'uint256' }],
    outputs: [],
  },
  // Precompile integration
  {
    type: 'function',
    name: 'executeTask',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_agentId', type: 'uint256' },
      { name: '_task', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes' }],
  },
  {
    type: 'function',
    name: 'createSovereignTask',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_agentId', type: 'uint256' },
      { name: '_input', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'isPrecompileAgent',
    stateMutability: 'view',
    inputs: [{ name: '_agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
