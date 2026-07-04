import { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, Button, Modal, Input } from '../../../../shared/components/ui/index.js';
import useMatchStore from '../../../../shared/store/matchStore.js';

const COLUMNS = [
  { key: 'name', label: 'Tier' },
  { key: 'entryFee', label: 'Entry Fee', render: (v) => `${v} USDT` },
  { key: 'prize', label: 'Prize', render: (v) => `${v} USDT` },
  { key: 'rakePercent', label: 'Rake', render: (v) => `${v}%` },
  { key: 'waitingCount', label: 'In Queue' },
  { key: 'active', label: 'Status', render: (v) => <Badge status={v ? 'active' : 'rejected'} label={v ? 'Active' : 'Inactive'} /> },
];

export default function AdminTiersPage() {
  const { tiers } = useMatchStore();
  const [editModal, setEditModal] = useState(false);

  return (
    <AdminLayout>
      <PageHeader
        title="Tier Configuration"
        subtitle="Manage entry fees, rake, and tier availability. Super admin only."
        action={<Button variant="primary" onClick={() => setEditModal(true)}>+ New Tier</Button>}
      />

      <Card>
        <Table columns={COLUMNS} rows={tiers} emptyMessage="No tiers configured." />
      </Card>

      <Modal open={editModal} title="Create New Tier" onClose={() => setEditModal(false)}>
        <Input label="Tier Name" placeholder="e.g. Platinum" />
        <Input label="Entry Fee (USDT)" type="number" placeholder="50" />
        <Input label="Rake %" type="number" placeholder="10" />
        <Input label="Min Wait (seconds)" type="number" placeholder="60" />
        <Button variant="primary" fullWidth onClick={() => setEditModal(false)}>Save Tier</Button>
      </Modal>
    </AdminLayout>
  );
}
