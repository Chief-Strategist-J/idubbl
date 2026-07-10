/**
 * Comprehensive game metadata: rules, how-to-play, and descriptions
 * for every game on the iDubbl platform.
 * Shared between GamesPage and LobbyPage.
 */
export const GAME_META = {

  // ─── SKILL DUELS ──────────────────────────────────────────────────────────

  word_duel: {
    subtitle: 'Anagram Sprint',
    description: 'Two players, same 7 scrambled letters, 20 seconds per round. Form the highest-scoring word to win each round. First to win 2 of 3 rounds claims the prize pool.',
    difficulty: 'Medium',
    color: '#00E37A',
    emoji: '📝',
    imageUrl: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'Both players receive the same 7 scrambled letters at the same time — no advantage to either.',
      'Rearrange any subset of those letters to form the highest-scoring valid English word within 20 seconds.',
      'Word scores are based on letter values (similar to Scrabble): Q, Z = 10 pts; J, X = 8 pts; common letters score less.',
      'The player whose word scores the most points wins that round.',
      'First to win 2 out of 3 rounds wins the entire match and takes the prize pool.',
    ],
    rules: [
      'Only standard dictionary English words are accepted — no proper nouns, abbreviations, or hyphenated words.',
      'You must use only the 7 provided letters; you cannot add extra letters not in the set.',
      'Duplicate letters in the set can be reused only as many times as they appear.',
      'Using all 7 letters ("bingo") earns a +50 bonus on top of the word\'s letter score.',
      'If both players submit the same word score, the round is a tie — neither player wins that round.',
      'If you fail to submit before the 20-second timer expires, your score for that round is 0.',
      'Disconnecting during an active round forfeits that round for you (score = 0).',
      'If a player disconnects for more than 30 seconds, the match is awarded to their opponent.',
    ],
  },

  math_duel: {
    subtitle: 'Arithmetic Blitz',
    description: 'Rapid-fire mental math battle. Both players see the same arithmetic question and race to select the correct answer. Speed and accuracy both matter — faster correct answers score higher.',
    difficulty: 'Hard',
    color: '#5B8DEF',
    emoji: '🔢',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'Both players see the same arithmetic question appear on screen simultaneously.',
      'Select the correct answer from 4 multiple-choice options as fast as possible.',
      'Your score = 100 base points + (time remaining in seconds × 2 bonus points).',
      'Example: if correct with 8 seconds left → 100 + 16 = 116 points.',
      'The player with the higher score wins that round. First to 2 rounds wins the match.',
    ],
    rules: [
      'Questions cover addition, subtraction, multiplication, and division with integer results.',
      'Difficulty scales across rounds — Round 3 always has harder numbers than Round 1.',
      'Each player gets exactly one attempt per question — selecting an answer is final, no changing it.',
      'A wrong answer scores 0 for that round, regardless of how fast you answered.',
      'If the 15-second timer runs out without a selection, it counts as 0 (same as wrong).',
      'Questions are randomly drawn from a server-side pool; both players get identical questions.',
      'The correct answer and all options are determined server-side — the client only displays them.',
    ],
  },

  reaction_race: {
    subtitle: 'Speed Reflex',
    description: 'A pure reaction-time test. Wait for the green GO! signal — then tap the button as fast as humanly possible. Milliseconds decide the winner.',
    difficulty: 'Easy',
    color: '#fbbf24',
    emoji: '⚡',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'Both players see a screen displaying a red "WAIT" state.',
      'After a random delay of 1–4 seconds (unknown to both players), the screen flashes green "GO!".',
      'Tap the large button the instant you see GO! Your reaction time in milliseconds is recorded.',
      'The player with the faster valid reaction wins that round.',
      'Best of 3 rounds wins the match.',
    ],
    rules: [
      'Tapping before the GO! signal (false start) adds a 500ms penalty to your recorded reaction time for that round.',
      'Three consecutive false starts in a single match result in automatic forfeit.',
      'The delay before GO! is server-generated and unpredictable — both players experience the exact same timer.',
      'Reaction times are measured server-side from when the GO signal is sent; network latency is equalized.',
      'Maximum allowed reaction time is 2 seconds after GO! — anything slower scores as a miss.',
      'A miss counts as infinity (loser of that round).',
    ],
  },

  // ─── CHANCE GAMES ─────────────────────────────────────────────────────────

  lucky_wheel: {
    subtitle: 'Spin vs. the House',
    description: 'A pure Chance Game: spin the fortune wheel against the house across a best-of-3 match. These games are difficult by design — winning is not guaranteed. Your entry fee is grown 100x into a fixed jackpot for your tier, and there is no platform rake.',
    difficulty: 'Very Hard',
    color: '#8b5cf6',
    emoji: '🎡',
    imageUrl: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'Choose a tier (Micro, Rookie, Pro, or Elite) and pay the fixed entry fee to start a match against the house.',
      'Each round, spin the wheel. The outcome is decided server-side before the animation begins — the spin itself is purely cosmetic.',
      'Landing on the marked target segment wins you the round; any other segment loses it.',
      'Best of 3 rounds decides the match. Win the match to receive your tier\'s fixed jackpot prize.',
      'Losing the match forfeits your entry fee — there is no refund on a loss.',
    ],
    rules: [
      'This is a Chance Game: outcomes are difficult to predict and winning the match is NOT guaranteed, regardless of skill.',
      'The house wins the large majority of matches by design — treat this as a long-shot, high-reward game, not a reliable income source.',
      'Your entry fee is multiplied 100x to form the fixed jackpot for your tier (e.g. a $2 Micro entry can pay a $200 prize) — no platform rake is taken from this payout.',
      'Match outcomes are determined entirely server-side; the spin animation only visualizes a result already decided.',
      'Every match is played against the house/machine only — you are never matched with another real player in this game.',
    ],
  },

  lucky_balls: {
    subtitle: 'Pick vs. the House',
    description: 'A pure Chance Game: pick a ball against the house across a best-of-3 match. These games are difficult by design — winning is not guaranteed. Your entry fee is grown 100x into a fixed jackpot for your tier, and there is no platform rake.',
    difficulty: 'Very Hard',
    color: '#f97316',
    emoji: '🔮',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'Choose a tier (Micro, Rookie, Pro, or Elite) and pay the fixed entry fee to start a match against the house.',
      'Each round, pick one of 9 balls. The house then reveals its draw — decided server-side beforehand, so the reveal is purely cosmetic.',
      'If your pick matches the house\'s draw, you win the round; otherwise you lose it.',
      'Best of 3 rounds decides the match. Win the match to receive your tier\'s fixed jackpot prize.',
      'Losing the match forfeits your entry fee — there is no refund on a loss.',
    ],
    rules: [
      'This is a Chance Game: outcomes are difficult to predict and winning the match is NOT guaranteed, regardless of skill.',
      'The house wins the large majority of matches by design — treat this as a long-shot, high-reward game, not a reliable income source.',
      'Your entry fee is multiplied 100x to form the fixed jackpot for your tier (e.g. a $2 Micro entry can pay a $200 prize) — no platform rake is taken from this payout.',
      'Match outcomes are determined entirely server-side; the reveal only visualizes a result already decided.',
      'Every match is played against the house/machine only — you are never matched with another real player in this game.',
    ],
  },

  // ─── CARD GAMES ───────────────────────────────────────────────────────────

  blackjack: {
    subtitle: '21 Battle',
    description: 'Classic heads-up Blackjack — the most iconic card game. Get your hand as close to 21 as possible without going over. Beat your opponent\'s hand to win the round.',
    difficulty: 'Medium',
    color: '#ef4444',
    emoji: '🃏',
    imageUrl: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'Each player and the dealer position is dealt 2 cards face-up at the start of each round.',
      'On your turn: choose HIT (take another card) or STAND (keep your current hand).',
      'You can hit as many times as you like — but going over 21 is a BUST (automatic loss for that round).',
      'Once both players stand (or one busts), hands are compared. The hand closest to 21 without busting wins.',
      'Best of 3 rounds wins the match.',
    ],
    rules: [
      'Card values: numbered cards (2–10) = face value; Jack, Queen, King = 10; Ace = 1 or 11 (whichever benefits the hand more).',
      'BUST: If your hand total exceeds 21, you automatically lose that round regardless of opponent\'s hand.',
      'BLACKJACK: An Ace + any 10-value card dealt in the initial 2 cards = Blackjack. Blackjack beats any other hand that totals 21.',
      'If both players have the same hand value, it is a push (tie) for that round — no winner.',
      'If both players Bust in the same round, the round is also a tie.',
      'Each round uses a freshly shuffled deck — no card counting advantage exists.',
      'You have 20 seconds to make your Hit/Stand decision, or an automatic STAND is applied.',
    ],
  },

  holdem_poker: {
    subtitle: "Texas Hold'em",
    description: "Speed Texas Hold'em — the world's most popular poker variant. Each player gets 2 private hole cards. Combined with 5 shared community cards, make the best 5-card hand to win.",
    difficulty: 'Hard',
    color: '#10b981',
    emoji: '♠️',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'Each player receives 2 private "hole cards" dealt face-down (only you see yours).',
      'A betting round occurs. You can Check, Bet, Call, Raise, or Fold.',
      'FLOP: 3 community cards dealt face-up. Second betting round.',
      'TURN: 1 more community card. Third betting round.',
      'RIVER: Final community card. Last betting round.',
      'Showdown: Both players reveal hole cards. Best 5-card hand (using any combo of 2 hole + 5 community) wins.',
    ],
    rules: [
      'Standard poker hand rankings apply (best → worst): Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, Pair, High Card.',
      'Betting is capped at the match entry stake per hand — no unlimited raises.',
      'Folding forfeits the round — your opponent wins without showdown.',
      'If both players have identical best hands, the round is a tie.',
      'A fresh, shuffled deck is used for each round.',
      'Each betting decision has a 15-second timer — inaction defaults to Check (if available) or Fold.',
      'Best of 3 rounds wins the match.',
    ],
  },

  baccarat: {
    subtitle: 'Player vs Banker',
    description: 'One of the simplest yet most elegant casino card games. Predict which hand — Player or Banker — will come closer to 9, then watch the cards be revealed.',
    difficulty: 'Medium',
    color: '#a855f7',
    emoji: '👑',
    imageUrl: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'Before the deal, each player places a prediction: PLAYER wins, BANKER wins, or TIE.',
      'The server deals 2 cards each to the "Player" position and the "Banker" position.',
      'The hand value closest to 9 wins (no busting in baccarat).',
      'A third card may be automatically drawn according to fixed baccarat drawing rules.',
      'The player who correctly predicted the winning side wins the round. Best of 3 wins the match.',
    ],
    rules: [
      'Card values: 2–9 = face value; 10, Jack, Queen, King = 0; Ace = 1.',
      'If a hand\'s total exceeds 9, only the rightmost digit counts (e.g., 15 = 5; 18 = 8).',
      'Third-card drawing rules are AUTOMATIC and fixed by casino rules — players have no control over this.',
      'PLAYER third card rule: if Player total is 0–5, draw; if 6–7, stand.',
      'BANKER third card rule: complex conditional based on both hands — fully server-enforced.',
      'A TIE prediction is correct if both hands are exactly equal. Ties pay a higher implied multiplier but are the rarest outcome.',
      'If both players predict the same outcome and it wins, a server tiebreak determines the round winner.',
    ],
  },

  casino_war: {
    subtitle: 'High Card Duel',
    description: 'The simplest card game in existence. One card each. Highest card wins. If they tie, choose to Go to War or surrender. Pure, instant, decisive.',
    difficulty: 'Easy',
    color: '#ec4899',
    emoji: '⚔️',
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'Both players (and the dealer) are dealt one card face-up.',
      'The higher card wins the round.',
      'On a TIE (both players have the same rank), you choose: GO TO WAR or SURRENDER.',
      'Going to War: an additional wager equal to the original stake is placed. One more card is dealt — higher card wins the war.',
      'Surrendering: forfeit half your stake for that round — no card is dealt.',
      'Best of 3 rounds wins the match.',
    ],
    rules: [
      'Card ranking (highest to lowest): A, K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2.',
      'Suits are completely irrelevant — only rank matters.',
      'When Going to War on a tie, both players put in an equal extra stake; the next card drawn determines the winner.',
      'If the War card also ties, you win the war (this favors the player in traditional casino war — same rule applies here).',
      'If the timer expires before you choose War/Surrender, Surrender is applied automatically.',
      'A fresh deck is used for each round.',
    ],
  },

  red_dog: {
    subtitle: 'In-Between Bet',
    description: 'Two cards define the range. Will the third card fall strictly between them? The wider the gap between the two cards, the easier the bet — but the lower the multiplier.',
    difficulty: 'Medium',
    color: '#f43f5e',
    emoji: '🐕',
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'Two cards are dealt face-up, creating a range (e.g., a 4 and a Jack).',
      'Both players place their bet: will the third card be strictly between those two values?',
      'The "spread" = number of card ranks between the two cards (e.g., 4 and J = spread of 6: 5,6,7,8,9,10).',
      'The third card is drawn. If it falls between the first two ranks (strictly, not equal), you win.',
      'The player who predicted correctly (or predicted higher multiplier bet) wins the round. Best of 3.',
    ],
    rules: [
      'Card ranking: A (high or low), K, Q, J, 10 ... 2.',
      'PUSH: If the first two cards are consecutive (spread = 0, e.g., 7 & 8), the round is a push — no winner.',
      'PAIR: If the first two cards are identical rank, a third card is drawn. If that third card matches = instant win. Otherwise = push.',
      'The WIDER the spread, the lower the payout multiplier (easier to win); the NARROWER the spread, the higher the multiplier.',
      'You must commit your bet before the third card is drawn.',
      'A fresh deck is used for each round.',
    ],
  },

  pai_gow: {
    subtitle: 'Two-Hand Strategy',
    description: 'You receive 7 cards and must split them into a 5-card "high" hand and a 2-card "low" hand. Both of your hands must beat the dealer\'s corresponding hands to win — the hardest strategic card game on iDubbl.',
    difficulty: 'Hard',
    color: '#e11d48',
    emoji: '🀄',
    imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'You receive 7 cards. The dealer (server) also receives 7 cards.',
      'Split your 7 cards into a 5-card "High" hand and a 2-card "Low" hand.',
      'Your 5-card High hand MUST rank higher than your 2-card Low hand.',
      'Both of your hands are compared to the dealer\'s corresponding hands.',
      'WIN: both your High and Low beat the dealer\'s → you win the round.',
      'PUSH: one hand wins, one loses → no winner for that round.',
      'LOSE: both your hands lose to the dealer\'s → you lose the round.',
    ],
    rules: [
      'Standard poker hand rankings apply to the 5-card High hand.',
      'The 2-card Low hand can only be a Pair or a High Card (no straights/flushes on 2 cards).',
      'Your 5-card hand MUST outrank your 2-card hand — if not, it\'s a Foul and you lose the round automatically.',
      'The dealer\'s hand is set following a fixed "house way" algorithm with no discretion or randomness in splitting.',
      'Aces can be used as high or low cards in the 5-card hand.',
      'You have 30 seconds to set your hand. If time expires, the house-way algorithm sets it automatically for you.',
      'Best of 3 rounds wins the match.',
    ],
  },

  three_card: {
    subtitle: 'Fast Tri-Card',
    description: 'A lightning-fast poker variant using only 3 cards. Decide to Play or Fold instantly — best 3-card poker hand at showdown wins.',
    difficulty: 'Medium',
    color: '#d97706',
    emoji: '🎴',
    imageUrl: 'https://images.unsplash.com/photo-1533078420084-28ab16c873df?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'Each player (and the dealer) receives 3 cards face-down.',
      'You look at your cards and decide: PLAY (continue) or FOLD (forfeit the round).',
      'If you Play, your 3 cards are revealed and compared to the dealer\'s 3 cards.',
      'The better 3-card poker hand wins the round. Best of 3 rounds wins the match.',
    ],
    rules: [
      '3-Card Poker Hand Rankings (best → worst): Straight Flush, Three of a Kind, Straight, Flush, Pair, High Card.',
      'IMPORTANT DIFFERENCE: In 3-card poker, a Straight OUTRANKS a Flush (straights are harder with 3 cards).',
      'Folding immediately forfeits that round — no cards are revealed.',
      'If you fold and the dealer had a weaker hand, you still lose (no regret showing).',
      'Pair Plus side rule: if your hand is a Pair or better, you earn a bonus multiplier regardless of the dealer\'s hand.',
      'Each round uses a freshly shuffled deck.',
      'You have 15 seconds to decide Play or Fold before auto-Fold is applied.',
    ],
  },

  video_poker: {
    subtitle: 'Draw Poker',
    description: 'The classic video poker machine adapted for 1v1 duels. Receive 5 cards, choose which to keep, draw replacements, and make the best 5-card hand. Higher final hand wins.',
    difficulty: 'Medium',
    color: '#2563eb',
    emoji: '🎰',
    imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'You receive 5 cards from a freshly shuffled deck.',
      'Select which cards to HOLD (keep). All unselected cards are discarded.',
      'Replacement cards are drawn for each discarded card from the same deck.',
      'Your final 5-card hand determines your hand rank.',
      'The player with the higher-ranked final hand wins the round. Best of 3 wins the match.',
    ],
    rules: [
      'Standard poker hand rankings: Royal Flush > Straight Flush > Four of a Kind > Full House > Flush > Straight > Three of a Kind > Two Pair > Pair > High Card.',
      'Minimum qualifying hand: a Pair of Jacks or better. Lower pairs do not count as a win.',
      'If neither player has at least Jacks or Better, the round is considered a push (no winner).',
      'Each round uses a completely fresh, independently shuffled deck for each player.',
      'You have 20 seconds to select which cards to hold before the draw is made automatically (holding nothing).',
      'You can hold all 5 cards if you\'re satisfied with your starting hand.',
    ],
  },

  // ─── BOARD GAMES ──────────────────────────────────────────────────────────

  ludo: {
    subtitle: 'Board Game',
    description: 'The classic Ludo board game for 2 players. Race all 4 of your tokens from the starting base to the home column — capturing opponents, avoiding captures, and riding safe squares. Free to play with no entry fee.',
    difficulty: 'Easy',
    color: '#f97316',
    emoji: '🎲',
    imageUrl: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=300&q=80',
    howToPlay: [
      'Each player controls 4 tokens, all starting inside their colored base area.',
      'On your turn, roll the dice. The number rolled determines how many squares to move.',
      'You MUST roll a 6 to move a token out of your base and onto the board.',
      'Rolling a 6 also gives you a bonus extra roll — use it to move any token.',
      'Move your tokens clockwise around the shared board, then up your home column toward the Home square.',
      'The first player to get all 4 tokens into the Home square wins the match.',
    ],
    rules: [
      'You must roll a 6 to enter a token from your base onto the start square.',
      'Each 6 rolled earns one bonus roll. Rolling a 6 on a bonus roll gives another bonus roll (up to 3 consecutive sixes → no move, turn ends — optional rule, confirm in-game).',
      'If you land on a square occupied by an opponent\'s token, that token is CAPTURED — sent back to its base.',
      'SAFE SQUARES (marked with a star or special color): tokens on safe squares cannot be captured.',
      'Your own tokens can share the same square (no self-capture).',
      'To enter the Home column, you must land on the entry square with an exact roll from the shared outer track.',
      'To reach the Home square, you must land on it exactly — overshooting means you bounce back.',
      'This is a FREE-PLAY game. No USDT entry fee is required. Open to all users including guests.',
    ],
  },

};
