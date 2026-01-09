import { useState, useEffect } from 'react';
import { getOrCreateProfile, getTransactions, type Profile, type Transaction } from '../lib/supabase';
import { PromptWall } from './PromptWall';
import { TopUpModal } from './TopUpModal';

interface DashboardProps {
    address: `0x${string}`;
    session: any;
    onSignOut: () => void;
}

export function Dashboard({ address, session, onSignOut }: DashboardProps) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchUserData = async () => {
        const [p, t] = await Promise.all([
            getOrCreateProfile(address),
            getTransactions(address)
        ]);
        setProfile(p);
        setTransactions(t);
    };

    useEffect(() => {
        fetchUserData().finally(() => setLoading(false));
    }, [address]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                    <p className="text-slate-400">Manage your credits and prompts</p>
                </div>
                <button onClick={onSignOut} className="text-sm text-slate-400 hover:text-white transition-colors">
                    Sign Out
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-sm text-slate-400 mb-1">Available Balance</p>
                    <p className="text-3xl font-bold text-emerald-400">
                        {profile?.total_credits_mnee.toFixed(2) || '0.00'} MNEE
                    </p>
                    <button
                        onClick={() => setIsTopUpOpen(true)}
                        className="mt-4 w-full py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                        Top Up
                    </button>
                </div>

                <div className="md:col-span-2 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex flex-col h-[400px]">
                    <h3 className="text-sm font-medium text-slate-400 mb-4 shrink-0">Recent Transactions</h3>
                    <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {transactions.length === 0 ? (
                            <p className="text-sm text-slate-500">No recent transactions</p>
                        ) : (
                            transactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
                                    <span className={tx.type === 'deposit' ? 'text-emerald-400 font-medium' : 'text-slate-300'}>
                                        {tx.type === 'deposit' ? '+' : '-'}{Number(tx.amount).toFixed(6)} MNEE
                                    </span>
                                    <span className="text-slate-500 text-xs">{new Date(tx.created_at).toLocaleString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <PromptWall
                address={address}
                creditBalance={profile?.total_credits_mnee || 0}
                onTopUp={() => setIsTopUpOpen(true)}
                onBalanceChange={fetchUserData}
            />

            {isTopUpOpen && (
                <TopUpModal
                    address={address}
                    onClose={() => setIsTopUpOpen(false)}
                    onSuccess={fetchUserData}
                />
            )}
        </div>
    );
}
