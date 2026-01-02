import { useState } from 'react';
import { useSignTypedData, useReadContract, useChainId } from 'wagmi';
import { MNEE_CONTRACT, VAULT_ADDRESS, ERC20_ABI, PERMIT_TYPES } from '../lib/wagmi';
import { processGaslessDeposit } from '../lib/supabase';
import { parseUnits } from 'viem';

interface TopUpModalProps {
  address: `0x${string}`;
  onClose: () => void;
  onSuccess: () => void;
}


export function TopUpModal({ address, onClose, onSuccess }: TopUpModalProps) {
  const [amount, setAmount] = useState('1.0');
  const [step, setStep] = useState<'input' | 'signing' | 'processing' | 'success' | 'error'>('input');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();

  // Get nonce for permit
  const { data: nonce } = useReadContract({
    address: MNEE_CONTRACT,
    abi: ERC20_ABI,
    functionName: 'nonces',
    args: [address],
  });

  async function handleDeposit() {
    try {
      setStep('signing');
      setError('');

      const value = parseUnits(amount, 18);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
      const currentNonce = nonce ?? 0n;

      // Create EIP-712 domain
      const domain = {
        name: 'MNEE',
        version: '1',
        chainId: chainId,
        verifyingContract: MNEE_CONTRACT,
      };

      // Sign the permit
      const signature = await signTypedDataAsync({
        account: address,
        domain,
        types: PERMIT_TYPES,
        primaryType: 'Permit',
        message: {
          owner: address,
          spender: VAULT_ADDRESS,
          value: value,
          nonce: currentNonce,
          deadline: deadline,
        },
      });

      // Parse signature components
      const r = signature.slice(0, 66);
      const s = '0x' + signature.slice(66, 130);
      const v = parseInt(signature.slice(130, 132), 16);

      setStep('processing');

      // Send to gasless relay
      const result = await processGaslessDeposit(
        address,
        value.toString(),
        deadline.toString(),
        v,
        r,
        s
      );

      if (!result?.success) {
        throw new Error(result?.error || 'Deposit failed');
      }

      setTxHash(result.txHash);
      setStep('success');
      onSuccess();
    } catch (err) {
      console.error('Deposit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process deposit');
      setStep('error');
    }
  }

  const presetAmounts = ['0.50', '1.00', '5.00', '10.00'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Top Up Credits</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 'input' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Amount (MNEE)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${amount === preset
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-700/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Deposit Amount</span>
                  <span className="text-white font-medium">{amount} MNEE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Gas Fee</span>
                  <span className="text-emerald-400 font-medium">FREE (Gasless)</span>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign & Deposit
              </button>

              <p className="text-xs text-slate-400 text-center">
                You will be asked to sign an EIP-2612 permit. No gas fees required.
              </p>
            </div>
          )}

          {step === 'signing' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Sign Permit</h3>
              <p className="text-sm text-slate-400">Please sign the permit in your wallet...</p>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Processing Deposit</h3>
              <p className="text-sm text-slate-400">Relaying your transaction...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Deposit Successful</h3>
              <p className="text-sm text-slate-400 mb-4">{amount} MNEE added to your credits</p>
              {txHash && (
                <p className="text-xs text-slate-500 font-mono break-all mb-6">
                  TX: {txHash.slice(0, 20)}...{txHash.slice(-8)}
                </p>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Deposit Failed</h3>
              <p className="text-sm text-red-400 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setStep('input')}
                  className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
