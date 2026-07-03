import { useState, useEffect } from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Button, Input, Card, Modal } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';
import QoreID from '@qore-id/web-sdk';
import { ShieldCheck, ShieldAlert, Shield, XCircle, RefreshCw } from 'lucide-react';


/* ── Toggle row ─────────────────────────────────────────────────────────── */
function ToggleRow({ label, checked, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        style={{
          position: 'relative',
          width: 44,
          height: 24,
          borderRadius: 12,
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          background: checked ? 'var(--primary)' : 'var(--surface-2)',
          transition: 'background 0.25s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            transition: 'left 0.25s',
          }}
        />
      </button>
    </div>
  );
}

/* ── Section heading ─────────────────────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <h3
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '1.25rem',
        paddingBottom: '0.625rem',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {children}
    </h3>
  );
}

/* ── Success banner ──────────────────────────────────────────────────────── */
function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.75rem 1rem',
        borderRadius: 8,
        background: 'rgba(0,210,140,0.12)',
        border: '1px solid var(--primary)',
        color: 'var(--primary)',
        fontSize: '0.875rem',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span>✓</span>
      {message}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user } = useAuthStore();

  // KYC States
  const [kycStatus, setKycStatus] = useState('loading'); // 'loading' | 'unverified' | 'pending' | 'verified' | 'failed'
  const [kycDetails, setKycDetails] = useState(null);
  const [kycActionLoading, setKycActionLoading] = useState(false);
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [kycRequired, setKycRequired] = useState(true);

  /* — Account Info — */
  const [account, setAccount] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [accountSuccess, setAccountSuccess] = useState('');

  let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
  if (!apiBase.startsWith('http')) apiBase = `https://${apiBase}`;

  // Fetch KYC status on mount
  const fetchKycStatus = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiBase}/api/kyc/status`, {
        headers: { 'x-user-id': user.id },
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setKycStatus(json.kycStatus || 'unverified');
          setKycDetails(json.kycDetails);
        }
      } else {
        setKycStatus('unverified');
      }
    } catch (err) {
      console.error('Error fetching KYC status in Profile:', err);
      setKycStatus('unverified');
    }
  };

  useEffect(() => {
    fetchKycStatus();

    // Fetch public KYC requirement config
    fetch(`${apiBase}/api/kyc/config`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setKycRequired(json.kycRequired !== false);
        }
      })
      .catch(err => console.error('Error fetching KYC config in Profile:', err));
  }, [user?.id]);

  // Set up QoreID Web SDK event listeners
  useEffect(() => {
    try {
      QoreID.on('success', async (data) => {
        console.log('QoreID SDK success (Profile):', data);
        await fetch(`${apiBase}/api/kyc/simulate`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.id
          },
          body: JSON.stringify({ status: 'verified' })
        });
        fetchKycStatus();
      });

      QoreID.on('error', async (err) => {
        console.error('QoreID SDK error (Profile):', err);
        await fetch(`${apiBase}/api/kyc/simulate`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.id
          },
          body: JSON.stringify({ status: 'failed' })
        });
        fetchKycStatus();
      });

      QoreID.on('close', () => {
        console.log('QoreID SDK closed (Profile)');
      });
    } catch (e) {
      console.warn('QoreID event subscription failed in Profile:', e);
    }
  }, [user?.id]);

  const handleStartKyc = async () => {
    setKycActionLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/kyc/session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id
        },
        credentials: 'include'
      });
      const data = await res.json();
      setKycActionLoading(false);

      if (data.success) {
        if (data.simulation) {
          setSimulationModalOpen(true);
        } else {
          await QoreID.start({
            token: data.sdkSessionToken,
            customerReference: `idubbl-${user?.id}`,
            applicantData: {
              firstname: user?.name?.split(' ')[0] || 'User',
              lastname: user?.name?.split(' ')?.slice(1)?.join(' ') || 'Player',
              email: user?.email
            }
          });
        }
      } else {
        alert(data.error || 'Failed to initialize KYC. Falling back to simulation...');
        setSimulationModalOpen(true);
      }
    } catch (err) {
      console.error('Error starting QoreID flow in Profile:', err);
      setKycActionLoading(false);
      setSimulationModalOpen(true);
    }
  };

  const handleSimulateStatus = async (status) => {
    setKycActionLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/kyc/simulate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setKycStatus(data.kycStatus);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setKycActionLoading(false);
      setSimulationModalOpen(false);
    }
  };

  useEffect(() => {
    if (user) {
      setAccount({
        firstName: user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleAccountSave = () => {
    setAccountSuccess('Profile updated.');
    setTimeout(() => setAccountSuccess(''), 3500);
  };

  /* — Security — */
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handlePasswordUpdate = () => {
    if (!passwords.current || !passwords.newPw || !passwords.confirm) {
      setPwError('All fields are required.');
      return;
    }
    if (passwords.newPw !== passwords.confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwError('');
    setPwSuccess('Password updated successfully.');
    setPasswords({ current: '', newPw: '', confirm: '' });
    setShowPasswordFields(false);
    setTimeout(() => setPwSuccess(''), 3500);
  };

  /* — Notifications — */
  const [notifPrefs, setNotifPrefs] = useState({
    depositConfirmed: true,
    withdrawalPaid: true,
    matchResult: true,
  });
  const [notifSuccess, setNotifSuccess] = useState('');

  const handleNotifSave = () => {
    setNotifSuccess('Preferences saved.');
    setTimeout(() => setNotifSuccess(''), 3500);
  };

  /* — Danger Zone — */
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  return (
    <AppLayout>
      <PageHeader
        title="Profile"
        subtitle="Manage your account and preferences."
      />

      <div
        style={{
          maxWidth: 700,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* ── Account Info ─────────────────────────────────────────────── */}
        <Card>
          <SectionTitle>Account Information</SectionTitle>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            <Input
              label="First name"
              value={account.firstName}
              onChange={(e) => setAccount((p) => ({ ...p, firstName: e.target.value }))}
              placeholder="First name"
            />
            <Input
              label="Last name"
              value={account.lastName}
              onChange={(e) => setAccount((p) => ({ ...p, lastName: e.target.value }))}
              placeholder="Last name"
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={account.email}
            disabled
            icon={<span style={{ fontSize: '0.85rem' }}>🔒</span>}
            hint="Email cannot be changed directly. Contact support."
          />

          <Input
            label="Phone"
            type="tel"
            value={account.phone}
            onChange={(e) => setAccount((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+1 555 000 0000"
          />

          <div style={{ marginTop: '1.25rem' }}>
            <Button variant="primary" onClick={handleAccountSave}>
              Save changes
            </Button>
          </div>

          <SuccessBanner message={accountSuccess} />
        </Card>

        {/* ── KYC Identity Verification ─────────────────────────────────── */}
        {kycRequired && (
          <Card style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <SectionTitle>Identity Verification (KYC)</SectionTitle>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '50%', background: kycStatus === 'verified' ? 'var(--accent-green-glow)' : kycStatus === 'pending' ? 'rgba(245,158,11,0.1)' : kycStatus === 'failed' ? 'var(--accent-red-glow)' : 'rgba(255,255,255,0.03)', color: kycStatus === 'verified' ? 'var(--accent-green)' : kycStatus === 'pending' ? 'var(--accent-warning)' : kycStatus === 'failed' ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                  {kycStatus === 'verified' ? <ShieldCheck style={{ width: '28px', height: '28px' }} /> : kycStatus === 'failed' ? <XCircle style={{ width: '28px', height: '28px' }} /> : kycStatus === 'pending' ? <RefreshCw style={{ width: '28px', height: '28px', animation: 'spin 3s linear infinite' }} /> : <Shield style={{ width: '28px', height: '28px' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Identity Verification Status</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.15rem 0.45rem', borderRadius: '6px', background: kycStatus === 'verified' ? 'var(--accent-green-glow)' : kycStatus === 'pending' ? 'rgba(245,158,11,0.15)' : kycStatus === 'failed' ? 'var(--accent-red-glow)' : 'var(--bg-darker)', color: kycStatus === 'verified' ? 'var(--accent-green)' : kycStatus === 'pending' ? 'var(--accent-warning)' : kycStatus === 'failed' ? 'var(--accent-red)' : 'var(--text-muted)', border: `1px solid ${kycStatus === 'verified' ? 'rgba(20,241,149,0.2)' : kycStatus === 'pending' ? 'rgba(245,158,11,0.2)' : kycStatus === 'failed' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}` }}>
                      {kycStatus}
                    </span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {kycStatus === 'verified' ? 'Your identity is fully verified. You can withdraw your winnings at any time.' : kycStatus === 'pending' ? 'Your documents are being reviewed. Verification typically takes a few minutes.' : kycStatus === 'failed' ? 'Your verification was rejected. Please check your credentials and try again.' : 'Verification is required before you can request any fund withdrawals.'}
                  </p>
                </div>
              </div>

              {kycStatus !== 'verified' && (
                <Button onClick={handleStartKyc} loading={kycActionLoading} variant="primary">
                  {kycStatus === 'failed' ? 'Retry Identity Verification' : kycStatus === 'pending' ? 'Verify Again' : 'Start Identity Verification'}
                </Button>
              )}

              {/* Simulation controls */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  🛠️ Simulator Options
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleSimulateStatus('verified')} style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', background: 'var(--accent-green-glow)', border: '1px solid rgba(20,241,149,0.3)', color: 'var(--accent-green)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Verify Profile</button>
                  <button onClick={() => handleSimulateStatus('failed')} style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', background: 'var(--accent-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Fail Profile</button>
                  <button onClick={() => handleSimulateStatus('unverified')} style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Reset Status</button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ── Security ─────────────────────────────────────────────────── */}
        <Card>
          <SectionTitle>Security</SectionTitle>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                Password
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Update your login password.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setShowPasswordFields((v) => !v);
                setPwError('');
              }}
            >
              {showPasswordFields ? 'Cancel' : 'Change password'}
            </Button>
          </div>

          {showPasswordFields && (
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Input
                label="Current password"
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                placeholder="••••••••"
              />
              <Input
                label="New password"
                type="password"
                value={passwords.newPw}
                onChange={(e) => setPasswords((p) => ({ ...p, newPw: e.target.value }))}
                placeholder="••••••••"
              />
              <Input
                label="Confirm new password"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="••••••••"
                error={pwError}
              />
              <Button variant="primary" onClick={handlePasswordUpdate}>
                Update password
              </Button>
            </div>
          )}

          <SuccessBanner message={pwSuccess} />
        </Card>

        {/* ── Notification Preferences ──────────────────────────────────── */}
        <Card>
          <SectionTitle>Notifications</SectionTitle>

          <ToggleRow
            label="Deposit confirmed"
            checked={notifPrefs.depositConfirmed}
            onChange={(v) => setNotifPrefs((p) => ({ ...p, depositConfirmed: v }))}
          />
          <ToggleRow
            label="Withdrawal paid"
            checked={notifPrefs.withdrawalPaid}
            onChange={(v) => setNotifPrefs((p) => ({ ...p, withdrawalPaid: v }))}
          />
          <ToggleRow
            label="Match result"
            checked={notifPrefs.matchResult}
            onChange={(v) => setNotifPrefs((p) => ({ ...p, matchResult: v }))}
          />

          <div style={{ marginTop: '1.25rem' }}>
            <Button variant="primary" onClick={handleNotifSave}>
              Save preferences
            </Button>
          </div>

          <SuccessBanner message={notifSuccess} />
        </Card>


        <Card
          style={{
            border: '1.5px solid rgba(239,68,68,0.45)',
            borderRadius: 'var(--radius)',
          }}
        >
          <SectionTitle>Danger Zone</SectionTitle>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                Deactivate Account
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                This will suspend your access until you contact support.
              </p>
            </div>
            <Button variant="danger" onClick={() => setDeactivateOpen(true)}>
              Deactivate Account
            </Button>
          </div>
        </Card>
      </div>

      {/* ── Deactivate Confirm Modal ──────────────────────────────────────── */}
      <Modal
        open={deactivateOpen}
        title="Deactivate your account?"
        onClose={() => setDeactivateOpen(false)}
      >
        <p
          style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: '1.75rem',
            fontSize: '0.925rem',
          }}
        >
          You won't be able to log in, deposit, or play until you contact support to
          reactivate. Are you sure?
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDeactivateOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setDeactivateOpen(false);
              /* TODO: call deactivate API */
            }}
          >
            Deactivate
          </Button>
        </div>
      </Modal>

      {/* QoreID Mock UI Modal */}
      {simulationModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '90%', maxWidth: '440px', background: '#111827', border: '1.5px solid #374151', borderRadius: '16px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSimulationModalOpen(false)}>✕</div>
            
            {/* QoreID Mock Branding */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '28px', height: '28px', background: '#3b82f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.85rem' }}>Q</div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f3f4f6', letterSpacing: '0.5px' }}>qore<span style={{ color: '#3b82f6' }}>ID</span></span>
              <span style={{ fontSize: '0.65rem', background: '#1e3a8a', color: '#60a5fa', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>SANDBOX SIMULATOR</span>
            </div>

            <h4 style={{ color: '#f9fafb', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Verify Your Identity</h4>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              You are about to test the QoreID identity verification SDK integration. Please choose a simulated result below.
            </p>

            {/* Mock Applicant Data Preview */}
            <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '10px', textAlign: 'left', marginBottom: '1.5rem', border: '1px solid #374151' }}>
              <span style={{ display: 'block', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Applicant Details</span>
              <div style={{ fontSize: '0.8rem', color: '#e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div><strong>Name:</strong> {user?.name || 'User Player'}</div>
                <div><strong>Email:</strong> {user?.email || 'user@example.com'}</div>
                <div><strong>Ref:</strong> idubbl-{user?.id}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={() => handleSimulateStatus('verified')}
                style={{ width: '100%', padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s' }}
              >
                ✓ Pass Verification (Simulate Success)
              </button>
              <button 
                onClick={() => handleSimulateStatus('failed')}
                style={{ width: '100%', padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s' }}
              >
                ✕ Reject Verification (Simulate Failure)
              </button>
            </div>

            <p style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '1.25rem' }}>
              Real production integrations will prompt users for document upload (NIN, Drivers License, BVN, Voter Card) or liveness detection.
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
