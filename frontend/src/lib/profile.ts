// Profile contract on Ritual Chain
export const PROFILE_ADDRESS = '0xA487bd6BEE21AaE0E1705FE5DDB256Ae6B384c03' as const;

export const PROFILE_ABI = [
  {
    name: 'createProfile',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_username', type: 'string' },
      { name: '_bio', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'hasProfile',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'isUsernameAvailable',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_username', type: 'string' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getUsername',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;
