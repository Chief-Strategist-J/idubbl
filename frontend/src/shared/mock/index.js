export const MOCK_USERS = [
  { id: 'u1', firstName: 'Alex', lastName: 'Storm', email: 'alex@demo.com', phone: '+1 555-0101', status: 'active', role: 'player', createdAt: '2026-05-01' },
  { id: 'u2', firstName: 'Maya', lastName: 'Chen', email: 'maya@demo.com', phone: '+1 555-0102', status: 'active', role: 'player', createdAt: '2026-05-03' },
  { id: 'u3', firstName: 'Jordan', lastName: 'Wick', email: 'jordan@demo.com', phone: '+1 555-0103', status: 'suspended', role: 'player', createdAt: '2026-05-07' },
  { id: 'admin1', firstName: 'Sam', lastName: 'Admin', email: 'admin@idubbl.com', phone: '+1 555-0001', status: 'active', role: 'admin', createdAt: '2026-04-01' },
];

export const MOCK_TIERS = [
  { id: 't1', name: 'Bronze', entryFee: 5, rakePercent: 10, prize: 9, minWaitSeconds: 30, active: true, waitingCount: 3, color: 'bronze' },
  { id: 't2', name: 'Silver', entryFee: 10, rakePercent: 10, prize: 18, minWaitSeconds: 45, active: true, waitingCount: 1, color: 'silver' },
  { id: 't3', name: 'Gold', entryFee: 25, rakePercent: 8, prize: 46, minWaitSeconds: 60, active: true, waitingCount: 0, color: 'gold' },
];

export const MOCK_MATCHES = [
  { id: 'm1', tier: 'Bronze', player1: 'Alex Storm', player2: 'Maya Chen', status: 'completed', winner: 'Alex Storm', winnerId: 'u1', rounds: [{ roundNo: 1, winner: 'Alex Storm', score: '120-80' }, { roundNo: 2, winner: 'Maya Chen', score: '95-110' }, { roundNo: 3, winner: 'Alex Storm', score: '130-100' }], prize: 9, rake: 1, startedAt: '2026-06-16T10:00:00Z', endedAt: '2026-06-16T10:07:00Z', refId: 'M-001' },
  { id: 'm2', tier: 'Silver', player1: 'Alex Storm', player2: 'Jordan Wick', status: 'completed', winner: 'Jordan Wick', winnerId: 'u3', rounds: [{ roundNo: 1, winner: 'Alex Storm', score: '110-90' }, { roundNo: 2, winner: 'Jordan Wick', score: '80-120' }, { roundNo: 3, winner: 'Jordan Wick', score: '95-130' }], prize: 18, rake: 2, startedAt: '2026-06-16T09:00:00Z', endedAt: '2026-06-16T09:09:00Z', refId: 'M-002' },
  { id: 'm3', tier: 'Bronze', player1: 'Maya Chen', player2: 'Jordan Wick', status: 'active', winner: null, winnerId: null, rounds: [], prize: 9, rake: 1, startedAt: '2026-06-16T11:00:00Z', endedAt: null, refId: 'M-003' },
];

export const MOCK_DEPOSITS = [
  { id: 'd1', userId: 'u1', user: 'Alex Storm', amount: 50, network: 'TRC20', txHash: '0xabc123def456', status: 'approved', reviewedBy: 'admin1', createdAt: '2026-06-15T08:00:00Z', note: '' },
  { id: 'd2', userId: 'u2', user: 'Maya Chen', amount: 100, network: 'TRC20', txHash: '0xdef789ghi012', status: 'pending', reviewedBy: null, createdAt: '2026-06-16T09:30:00Z', note: 'First deposit' },
  { id: 'd3', userId: 'u3', user: 'Jordan Wick', amount: 25, network: 'ERC20', txHash: '0xjkl345mno678', status: 'rejected', reviewedBy: 'admin1', createdAt: '2026-06-14T14:00:00Z', note: 'Unverified hash' },
  { id: 'd4', userId: 'u1', user: 'Alex Storm', amount: 200, network: 'TRC20', txHash: '0xpqr901stu234', status: 'pending', reviewedBy: null, createdAt: '2026-06-16T11:15:00Z', note: '' },
];

export const MOCK_WITHDRAWALS = [
  { id: 'w1', userId: 'u1', user: 'Alex Storm', amount: 18, address: 'TXxyz...abc', network: 'TRC20', status: 'pending', reviewedBy: null, createdAt: '2026-06-16T10:30:00Z' },
  { id: 'w2', userId: 'u2', user: 'Maya Chen', amount: 9, address: 'TXdef...456', network: 'TRC20', status: 'approved', reviewedBy: 'admin1', paidAt: '2026-06-15T15:00:00Z', createdAt: '2026-06-15T13:00:00Z' },
  { id: 'w3', userId: 'u3', user: 'Jordan Wick', amount: 46, address: '0xabc...789', network: 'ERC20', status: 'pending', reviewedBy: null, createdAt: '2026-06-16T11:00:00Z' },
];

export const MOCK_TRANSACTIONS = [
  { id: 'tx1', type: 'deposit', amount: 50, status: 'approved', date: '2026-06-15T08:00:00Z', refId: 'D-001', description: 'USDT Deposit' },
  { id: 'tx2', type: 'match_reserve', amount: -5, status: 'completed', date: '2026-06-16T09:55:00Z', refId: 'M-001', description: 'Bronze tier entry reserve' },
  { id: 'tx3', type: 'winnings', amount: 9, status: 'completed', date: '2026-06-16T10:07:00Z', refId: 'M-001', description: 'Match winnings' },
  { id: 'tx4', type: 'match_reserve', amount: -10, status: 'completed', date: '2026-06-16T08:55:00Z', refId: 'M-002', description: 'Silver tier entry reserve' },
  { id: 'tx5', type: 'match_loss', amount: -10, status: 'completed', date: '2026-06-16T09:09:00Z', refId: 'M-002', description: 'Match loss - pool deducted' },
  { id: 'tx6', type: 'withdrawal', amount: -18, status: 'pending', date: '2026-06-16T10:30:00Z', refId: 'W-001', description: 'USDT Withdrawal request' },
  { id: 'tx7', type: 'deposit', amount: 200, status: 'pending', date: '2026-06-16T11:15:00Z', refId: 'D-004', description: 'USDT Deposit (pending review)' },
];

export const WORD_DUEL_QUESTIONS = [
  { word: 'EPHEMERAL', options: ['Lasting forever', 'Lasting for a very short time', 'Related to water', 'A type of plant'], correct: 1 },
  { word: 'RESILIENT', options: ['Easily broken', 'Able to recover quickly from difficulties', 'Very slow', 'A musical term'], correct: 1 },
  { word: 'TENACIOUS', options: ['Holding firmly to a purpose', 'Moving slowly', 'Very quiet', 'Relating to time'], correct: 0 },
  { word: 'LUCID', options: ['Dark and unclear', 'Very bright', 'Expressed clearly and easy to understand', 'A type of dream'], correct: 2 },
  { word: 'VERBOSE', options: ['Speaking briefly', 'Using more words than needed', 'Silent', 'Very fast'], correct: 1 },
  { word: 'AUSTERE', options: ['Very luxurious', 'Severe and unadorned', 'Warm and friendly', 'Related to music'], correct: 1 },
  { word: 'PROLIFIC', options: ['Rare and uncommon', 'Producing much work', 'Very slow', 'A type of plant'], correct: 1 },
  { word: 'CANDID', options: ['Secretive', 'Truthful and straightforward', 'Very sweet', 'A camera type'], correct: 1 },
  { word: 'DILIGENT', options: ['Lazy and careless', 'Having or showing care in work', 'Very loud', 'A musical note'], correct: 1 },
  { word: 'ELOQUENT', options: ['Unable to speak', 'Fluent and persuasive in speaking', 'Very quiet', 'A type of poem'], correct: 1 },
];

export const PLATFORM_WALLET = 'TDsqW9XXXXXXXXXXXXXXXXXXXXXXX';
export const SUPPORTED_NETWORKS = ['TRC20 (TRON)', 'ERC20 (Ethereum)'];
export const MIN_DEPOSIT = 10;
export const MIN_WITHDRAWAL = 5;
