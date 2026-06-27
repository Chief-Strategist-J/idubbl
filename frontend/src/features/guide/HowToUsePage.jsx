import React from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { Card, PageHeader } from '../../shared/components/ui/index.js';

export default function HowToUsePage() {
  return (
    <AppLayout>
      <PageHeader
        title="User Guide & FAQs"
        subtitle="Learn how to deposit, play matches, and withdraw your winnings."
      />

      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
        
        {/* Step 1: Create Account */}
        <Card style={{ background: 'linear-gradient(135deg, rgba(0, 195, 255, 0.05) 0%, rgba(20, 24, 33, 0.95) 100%)', border: '1px solid rgba(0, 195, 255, 0.15)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--accent-cyan)', color: 'var(--bg-darker)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
              1
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                Create Your Account
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6', margin: 0 }}>
                Sign up by going to the <a href="/signup" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>Registration Page</a>. Provide your name, email address, and select a secure password. You'll instantly gain access to your player dashboard.
              </p>
            </div>
          </div>
        </Card>

        {/* Step 2: Deposit Funds */}
        <Card style={{ background: 'linear-gradient(135deg, rgba(0, 210, 140, 0.05) 0%, rgba(20, 24, 33, 0.95) 100%)', border: '1px solid rgba(0, 210, 140, 0.15)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--accent-green)', color: 'var(--bg-darker)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
              2
            </div>
            <div style={{ width: '100%' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                Deposit USDT & Get Testnet Funds
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6', margin: '0 0 1rem 0' }}>
                To play matches, you need to deposit USDT stablecoins into your account.
              </p>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>How to Deposit:</span>
                <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>Go to the <a href="/deposit" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>Deposit Page</a> and click <strong>Generate My Deposit Wallets</strong>.</li>
                  <li>Copy your unique TRON address and transfer your TRC-20 USDT tokens to it.</li>
                  <li>After sending, copy the transaction hash, paste it into the deposit form, and submit.</li>
                </ol>
              </div>

              <div style={{ background: 'rgba(255, 171, 0, 0.05)', border: '1px solid rgba(255, 171, 0, 0.15)', padding: '1rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ⚠️ Shasta Testnet Sandbox Mode:
                </span>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Need free test tokens? Claim free Shasta Testnet TRX/USDT from the <a href="https://shasta.tronex.io/join/getJoinPage" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', fontWeight: 600 }}>Shasta Faucet</a> or <a href="https://faucet.triangleplatform.com/tron/shasta" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', fontWeight: 600 }}>Triangle Faucet</a>. Once received on-chain, click <strong>Refresh Balances</strong> to sync them automatically!
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Step 3: Play and Win */}
        <Card style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(20, 24, 33, 0.95) 100%)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--accent-purple)', color: 'var(--bg-darker)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
              3
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                Play Matches & Accumulate Winnings
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6', margin: 0 }}>
                Navigate to the Matchmaking Arena. Join any active matchmaking queue (Rookie, Pro, or Legend tiers) using your deposited USDT. Win matches to secure reward payouts, which are credited directly to your withdrawable **Winnings Wallet**.
              </p>
            </div>
          </div>
        </Card>

        {/* Step 4: Withdraw Winnings */}
        <Card style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(20, 24, 33, 0.95) 100%)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--accent-red)', color: 'var(--bg-darker)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
              4
            </div>
            <div style={{ width: '100%' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                Withdraw Your Winnings
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6', margin: '0 0 1rem 0' }}>
                You can withdraw only the money that you have won in matches. Your deposit wallet funds are reserved for playing queues.
              </p>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>Withdrawal Steps:</span>
                <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>Go to the <a href="/withdraw" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>Withdraw Page</a>.</li>
                  <li>Enter your personal receiving TRON (TRC-20) or Ethereum address.</li>
                  <li>Input the amount you wish to withdraw and submit.</li>
                  <li>The request will be set to <strong>In Review</strong>. Once approved by the administrator, the funds will be paid out directly on-chain to your destination wallet address.</li>
                </ol>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </AppLayout>
  );
}
