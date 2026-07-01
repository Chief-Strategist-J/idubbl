import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Master list of all games on the platform
export const ALL_GAMES = [
  { id: 'word_duel',     name: 'Word Duel',         icon: '🔤', category: 'Skill Duels',  freePlay: false },
  { id: 'math_duel',     name: 'Math Duel',          icon: '🔢', category: 'Skill Duels',  freePlay: false },
  { id: 'reaction_race', name: 'Reaction Race',      icon: '⚡', category: 'Skill Duels',  freePlay: false },
  { id: 'lucky_wheel',   name: 'Lucky Wheel',        icon: '🎡', category: 'Chance',        freePlay: false },
  { id: 'lucky_balls',   name: 'Lucky Balls',        icon: '🎱', category: 'Chance',        freePlay: false },
  { id: 'blackjack',     name: 'Blackjack',          icon: '🃏', category: 'Card Games',    freePlay: false },
  { id: 'holdem_poker',  name: 'Heads-Up Poker',     icon: '💵', category: 'Card Games',    freePlay: false },
  { id: 'baccarat',      name: 'Baccarat',           icon: '💎', category: 'Card Games',    freePlay: false },
  { id: 'casino_war',    name: 'Casino War',         icon: '⚔️', category: 'Card Games',    freePlay: false },
  { id: 'red_dog',       name: 'Red Dog',            icon: '🐕', category: 'Card Games',    freePlay: false },
  { id: 'pai_gow',       name: 'Pai Gow Poker',      icon: '🧧', category: 'Card Games',    freePlay: false },
  { id: 'three_card',    name: 'Three Card Poker',   icon: '🔺', category: 'Card Games',    freePlay: false },
  { id: 'video_poker',   name: 'Video Poker',        icon: '📺', category: 'Card Games',    freePlay: false },
  { id: 'ludo',          name: 'Ludo Classic',       icon: '🎲', category: 'Board Games',   freePlay: true  },
];

const defaultVisibility = Object.fromEntries(ALL_GAMES.map(g => [g.id, true]));

const usePlatformStore = create(
  persist(
    (set, get) => ({
      // Per-game visibility: { [gameId]: boolean }
      gameVisibility: defaultVisibility,

      // Chat feature toggle
      chatEnabled: true,

      // --- Actions ---
      setGameVisible: (gameId, visible) =>
        set(state => ({
          gameVisibility: { ...state.gameVisibility, [gameId]: visible }
        })),

      toggleGame: (gameId) =>
        set(state => ({
          gameVisibility: {
            ...state.gameVisibility,
            [gameId]: !state.gameVisibility[gameId]
          }
        })),

      setChatEnabled: (enabled) => set({ chatEnabled: enabled }),
      toggleChat: () => set(state => ({ chatEnabled: !state.chatEnabled })),

      // Reset all to defaults
      resetToDefaults: () => set({
        gameVisibility: defaultVisibility,
        chatEnabled: true,
      }),

      // Helpers
      getVisibleGames: () =>
        ALL_GAMES.filter(g => get().gameVisibility[g.id] !== false),

      isGameVisible: (gameId) =>
        get().gameVisibility[gameId] !== false,
    }),
    {
      name: 'idubbl-platform-settings',
      // Always merge so new games added to ALL_GAMES default to visible
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        gameVisibility: {
          ...current.gameVisibility,            // all new games default true
          ...(persisted?.gameVisibility || {}), // override with saved settings
        },
      }),
    }
  )
);

export default usePlatformStore;
