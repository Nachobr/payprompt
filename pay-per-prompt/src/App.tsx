import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, ConnectButton, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider, useSignMessage, useAccount, useDisconnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './lib/wagmi';
import { Dashboard } from './components/Dashboard';
import { createSiweMessage, generateNonce, verifySiwe, getSession, setSession, type Session } from './lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import './App.css';

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [session, setLocalSession] = useState<Session | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const existing = getSession();
    if (existing && address && existing.address.toLowerCase() === address.toLowerCase()) {
      setLocalSession(existing);
    } else if (existing) {
      setSession(null);
      setLocalSession(null);
    }
  }, [address]);

  const handleSignIn = useCallback(async () => {
    if (!address) return;

    setIsAuthenticating(true);
    setAuthError('');

    try {
      const nonce = generateNonce();
      const domain = window.location.host;
      const message = createSiweMessage(address, nonce, domain);

      const signature = await signMessageAsync({ message, account: address });

      const newSession = await verifySiwe(message, signature, address);

      if (newSession) {
        setLocalSession(newSession);
      } else {
        setAuthError('Failed to verify signature');
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      setAuthError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, signMessageAsync]);

  const handleSignOut = useCallback(() => {
    setSession(null);
    setLocalSession(null);
    disconnect();
  }, [disconnect]);

  if (!isConnected || !address) {
    return (
      <div className="text-center py-24">
        <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center">
          <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Access AI prompts with micropayments. Pay $0.05-$0.25 per prompt using MNEE stablecoin - no gas fees required.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <FeatureCard
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
            title="Micropayments"
            description="Pay as little as $0.05 per prompt with MNEE stablecoin"
            color="emerald"
          />
          <FeatureCard
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
            title="Gasless"
            description="No ETH gas fees - we relay your transactions for free"
            color="teal"
          />
          <FeatureCard
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
            title="Secure"
            description="Sign-In with Ethereum for decentralized authentication"
            color="cyan"
          />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-24">
        <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center">
          <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Sign-In with Ethereum</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Sign a message to verify wallet ownership and create your session.
        </p>

        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 max-w-md mx-auto">
            <p className="text-sm text-red-400">{authError}</p>
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={isAuthenticating}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
        >
          {isAuthenticating ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Signing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Sign Message
            </>
          )}
        </button>

        <p className="mt-6 text-sm text-slate-500">
          Connected as {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      </div>
    );
  }

  return <Dashboard address={address} session={session} onSignOut={handleSignOut} />;
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    teal: 'bg-teal-500/10 text-teal-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
  };

  return (
    <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Pay-Per-Prompt</h1>
              <p className="text-xs text-slate-400">MNEE Micropayments for AI</p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <AuthenticatedApp />
      </main>
    </div>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#10b981',
          accentColorForeground: 'white',
          borderRadius: 'medium',
        })}>
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
