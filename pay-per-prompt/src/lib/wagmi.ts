import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, mainnet, sepolia } from 'viem/chains';

export const config = getDefaultConfig({
  appName: 'MNEE',
  projectId: '95103afe61b99f673d28f4ba71966f84',
  chains: [base, mainnet, sepolia],
  ssr: false,
});

// MNEE Token Contract (Using Sepolia Mock: 0xf125d08c35635e2c4ee0d968667e44a29048138b)
export const MNEE_CONTRACT = '0xf125d08c35635e2c4ee0d968667e44a29048138b' as const;

// MNEE Vault Contract (Update this after Step 2 of DEPLOYMENT.md)
export const VAULT_ADDRESS = '0x768ed3886138269220356238F66cD701dE981B3d' as const;

// ERC20 ABI for balanceOf and permit
export const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// EIP-2612 Permit types for signing
export const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;
