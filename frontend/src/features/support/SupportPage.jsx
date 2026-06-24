import { useState } from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Button, Input, Card } from '../../shared/components/ui/index.js';

/* ── FAQ Data ──────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    id: 1,
    q: 'What is iDubbl?',
    a: 'iDubbl is a 1v1 skill game platform. Two players put up the same entry fee, play a short match, and the winner takes the pool minus a small platform fee.',
  },
  {
    id: 2,
    q: 'Is this gambling?',
    a: 'No. Outcomes are decided by player skill in a timed word game, not by chance or odds.',
  },
  {
    id: 3,
    q: "My deposit hasn't been credited yet",
    a: "Deposits are reviewed manually. Please allow up to 30 minutes during active hours. If it's been longer, contact support below.",
  },
  {
    id: 4,
    q: 'How do I cancel a withdrawal?',
    a: 'Withdrawal requests that are still Pending can be cancelled from your wallet page. Approved requests cannot be reversed.',
  },
  {
    id: 5,
    q: 'What happens if I disconnect mid-match?',
    a: "You'll have a short window to reconnect. If you don't reconnect in time, the round may be scored as a loss.",
  },
  {
    id: 6,
    q: 'How fast are withdrawals?',
    a: 'Approved withdrawal requests are typically paid out the same day.',
  },
];

/* ── Accordion item ─────────────────────────────────────────────────────── */
function AccordionItem({ item, open, onToggle }) {
  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '1rem 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: 'var(--text-primary)',
            fontSize: '0.925rem',
            flex: 1,
          }}
        >
          {item.q}
        </span>
        <span
          style={{
            color: 'var(--primary)',
            fontSize: '1.25rem',
            lineHeight: 1,
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.22s ease',
            flexShrink: 0,
          }}
        >
          ＋
        </span>
      </button>

      <div
        style={{
          maxHeight: open ? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.28s ease',
        }}
      >
        <p
          style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            fontSize: '0.9rem',
            paddingBottom: '1rem',
            margin: 0,
          }}
        >
          {item.a}
        </p>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function SupportPage() {
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ subject: '', description: '', refId: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const filtered = FAQ_ITEMS.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject || !form.description) return;
    setSubmitLoading(true);
    setTimeout(() => {
      setSubmitLoading(false);
      setSubmitted(true);
      setForm({ subject: '', description: '', refId: '' });
    }, 800);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Need help?"
        subtitle="Search common questions or message support."
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
        {/* ── Search bar ──────────────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              fontSize: '1rem',
            }}
          >
            🔍
          </span>
          <input
            type="search"
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search help articles…"
            style={{ paddingLeft: 42 }}
          />
        </div>

        {/* ── FAQ Accordion ────────────────────────────────────────────── */}
        <Card>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.25rem',
            }}
          >
            Frequently asked questions
          </h3>

          {filtered.length === 0 ? (
            <p
              style={{
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '2rem 0',
                fontSize: '0.9rem',
              }}
            >
              No results for "{search}".
            </p>
          ) : (
            filtered.map((item) => (
              <AccordionItem
                key={item.id}
                item={item}
                open={openId === item.id}
                onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              />
            ))
          )}
        </Card>

        {/* ── Contact Support ──────────────────────────────────────────── */}
        <Card>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.375rem',
            }}
          >
            Still need help?{' '}
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
              Message our team.
            </span>
          </h3>

          {submitted ? (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                borderRadius: 10,
                background: 'rgba(0,210,140,0.1)',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.95rem',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>✓</span>
              Message sent. We'll get back to you soon.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                marginTop: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <Input
                label="Subject"
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="e.g. Deposit not credited"
                required
              />

              {/* Textarea (not in shared Input, handled inline) */}
              <div className="form-group">
                <label className="form-label">
                  Description <span style={{ color: 'var(--secondary)', marginLeft: 4 }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your issue in detail…"
                  style={{ resize: 'vertical', minHeight: 100 }}
                  required
                />
              </div>

              <Input
                label="Reference ID (optional)"
                value={form.refId}
                onChange={(e) => setForm((p) => ({ ...p, refId: e.target.value }))}
                placeholder="Match ID or transaction ID"
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={submitLoading}
              >
                Send message
              </Button>
            </form>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
