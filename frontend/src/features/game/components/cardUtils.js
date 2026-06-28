export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createShuffledDeck() {
  const deck = SUITS.flatMap(suit => RANKS.map(rank => ({ rank, suit })));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function rankOrder(rank) {
  if (rank == null) return 0;
  const o = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
  return o[rank] ?? 0;
}

export function isRed(suit) {
  return suit === '♥' || suit === '♦';
}

// Blackjack card value (aces handled externally)
export function bjValue(rank) {
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank);
}

export function handTotal(cards) {
  if (!cards?.length) return 0;
  let total = cards.reduce((s, c) => s + bjValue(c.rank), 0);
  let aces = cards.filter(c => c.rank === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

// Baccarat: card value (10/J/Q/K = 0, A = 1)
export function bacValue(rank) {
  if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
  if (rank === 'A') return 1;
  return parseInt(rank);
}

export function bacTotal(cards) {
  if (!cards?.length) return 0;
  return cards.reduce((s, c) => s + bacValue(c.rank), 0) % 10;
}

// Five-card hand evaluator
export function evaluateHand(cards) {
  if (!cards?.length) return { rank: -1, name: 'High Card' };
  const ranks = cards.map(c => rankOrder(c.rank)).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const counts = {};
  cards.forEach(c => { counts[c.rank] = (counts[c.rank] || 0) + 1; });
  const cv = Object.values(counts).sort((a, b) => b - a);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = ranks.every((r, i) => i === 0 || r === ranks[i - 1] - 1) ||
    (JSON.stringify(ranks) === JSON.stringify([14, 5, 4, 3, 2]));

  if (isFlush && isStraight && ranks[0] === 14 && ranks[4] === 10) return { rank: 8, name: 'Royal Flush' };
  if (isFlush && isStraight) return { rank: 7, name: 'Straight Flush' };
  if (cv[0] === 4) return { rank: 6, name: 'Four of a Kind' };
  if (cv[0] === 3 && cv[1] === 2) return { rank: 5, name: 'Full House' };
  if (isFlush) return { rank: 4, name: 'Flush' };
  if (isStraight) return { rank: 3, name: 'Straight' };
  if (cv[0] === 3) return { rank: 2, name: 'Three of a Kind' };
  if (cv[0] === 2 && cv[1] === 2) return { rank: 1, name: 'Two Pair' };
  if (cv[0] === 2) return { rank: 0.5, name: 'One Pair' };
  return { rank: 0, name: 'High Card' };
}

// Three-card hand evaluator
export function evaluateThreeCard(cards) {
  if (!cards?.length) return { rank: -1, name: 'High Card' };
  const ranks = cards.map(c => rankOrder(c.rank)).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = (ranks[0] - ranks[1] === 1 && ranks[1] - ranks[2] === 1) ||
    (ranks[0] === 14 && ranks[1] === 3 && ranks[2] === 2);
  const isThree = ranks[0] === ranks[1] && ranks[1] === ranks[2];
  const isPair = ranks[0] === ranks[1] || ranks[1] === ranks[2];

  if (isFlush && isStraight) return { rank: 5, name: 'Straight Flush' };
  if (isThree) return { rank: 4, name: 'Three of a Kind' };
  if (isStraight) return { rank: 3, name: 'Straight' };
  if (isFlush) return { rank: 2, name: 'Flush' };
  if (isPair) return { rank: 1, name: 'Pair' };
  return { rank: 0, name: 'High Card' };
}

// Video poker hand evaluator (Jacks or Better)
export function videoPokerRank(cards) {
  const h = evaluateHand(cards);
  if (h.rank >= 0.5) {
    if (h.name === 'One Pair') {
      const pairRank = Object.entries(
        cards.reduce((acc, c) => { acc[c.rank] = (acc[c.rank] || 0) + 1; return acc; }, {})
      ).find(([, v]) => v === 2)?.[0];
      if (pairRank && rankOrder(pairRank) < 11) return { ...h, rank: 0, name: 'Low Pair (no win)' };
    }
    return h;
  }
  return { rank: 0, name: 'High Card (no win)' };
}
