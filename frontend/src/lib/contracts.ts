export const RENTAL_ADDRESS = (process.env.NEXT_PUBLIC_RENTAL_ADDRESS || '0x896277Ca55946c3602Bb6f5668d2eDdAb645A76c') as `0x${string}`;
export const STAKING_ADDRESS = (process.env.NEXT_PUBLIC_STAKING_ADDRESS || '0x2E3f82aE26a0EfE83B63bdabC905fFa3321223d0') as `0x${string}`;

// Backward compat
export const MARKETPLACE_ADDRESS = RENTAL_ADDRESS;

export const RENTAL_ABI = [
  // Events
  {
    type: 'event',
    name: 'AgentListed',
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: true, name: 'owner', type: 'address' },
      { name: 'name', type: 'string' },
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
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'pricePerHour', type: 'uint256' },
      { name: 'totalEarnings', type: 'uint256' },
      { name: 'totalRentals', type: 'uint256' },
      { name: 'rating', type: 'uint256' },
      { name: 'ratingCount', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
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
      { name: '_name', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_capabilities', type: 'string[]' },
      { name: '_pricePerHour', type: 'uint256' },
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
    name: 'updatePrice',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_agentId', type: 'uint256' },
      { name: '_newPrice', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'deactivateAgent',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_agentId', type: 'uint256' }],
    outputs: [],
  },
] as const;

export const STAKING_ABI = [
  { type: 'function', name: 'stake', stateMutability: 'payable', inputs: [{ name: '_agentId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'unstake', stateMutability: 'nonpayable', inputs: [{ name: '_agentId', type: 'uint256' }, { name: '_amount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'claimReward', stateMutability: 'nonpayable', inputs: [{ name: '_agentId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'pendingReward', stateMutability: 'view', inputs: [{ name: '_agentId', type: 'uint256' }, { name: '_staker', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'getPoolInfo', stateMutability: 'view', inputs: [{ name: '_agentId', type: 'uint256' }], outputs: [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }] },
  { type: 'function', name: 'stakers', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }, { name: '', type: 'address' }], outputs: [{ name: 'staked', type: 'uint256' }, { name: 'rewardPerTokenPaid', type: 'uint256' }, { name: 'rewards', type: 'uint256' }] },
  { type: 'function', name: 'getAllPools', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256[]' }] },
  { type: 'function', name: 'createPool', stateMutability: 'nonpayable', inputs: [{ name: '_agentId', type: 'uint256' }], outputs: [] },
] as const;

// Backward compat
export const MARKETPLACE_ABI = RENTAL_ABI;
