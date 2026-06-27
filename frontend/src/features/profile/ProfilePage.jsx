import { useState, useEffect } from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Button, Input, Card, Modal } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';

import PersonalWalletsWidget from '../deposit/components/PersonalWalletsWidget.jsx';

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

  /* — Account Info — */
  const [account, setAccount] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [accountSuccess, setAccountSuccess] = useState('');

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

        <PersonalWalletsWidget />

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
    </AppLayout>
  );
}
