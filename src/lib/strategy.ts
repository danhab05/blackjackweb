import type { Card } from './blackjack';
import { calculateHandValue, getCardValue } from './blackjack';

type StrategyMove = 'T' | 'R' | 'D' | 'S' | 'A';

// T = Tirer, R = Rester, D = Doubler, S = Split, A = Abandonner

const hardTotals: Record<number, Record<number, StrategyMove>> = {
  // Player Total: { Dealer Card: Move }
  8:  { 2: 'T', 3: 'T', 4: 'T', 5: 'T', 6: 'T', 7: 'T', 8: 'T', 9: 'T', 10: 'T', 1: 'T' },
  9:  { 2: 'T', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'T', 8: 'T', 9: 'T', 10: 'T', 1: 'T' },
  10: { 2: 'D', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'D', 8: 'D', 9: 'D', 10: 'T', 1: 'T' },
  11: { 2: 'D', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'D', 8: 'D', 9: 'D', 10: 'D', 1: 'T' },
  12: { 2: 'T', 3: 'T', 4: 'R', 5: 'R', 6: 'R', 7: 'T', 8: 'T', 9: 'T', 10: 'T', 1: 'T' },
  13: { 2: 'R', 3: 'R', 4: 'R', 5: 'R', 6: 'R', 7: 'T', 8: 'T', 9: 'T', 10: 'T', 1: 'T' },
  14: { 2: 'R', 3: 'R', 4: 'R', 5: 'R', 6: 'R', 7: 'T', 8: 'T', 9: 'T', 10: 'T', 1: 'T' },
  15: { 2: 'R', 3: 'R', 4: 'R', 5: 'R', 6: 'R', 7: 'T', 8: 'T', 9: 'T', 10: 'A', 1: 'T' },
  16: { 2: 'R', 3: 'R', 4: 'R', 5: 'R', 6: 'R', 7: 'T', 8: 'T', 9: 'A', 10: 'A', 1: 'A' },
  17: { 2: 'R', 3: 'R', 4: 'R', 5: 'R', 6: 'R', 7: 'R', 8: 'R', 9: 'R', 10: 'R', 1: 'R' },
};

const softTotals: Record<number, Record<number, StrategyMove>> = {
  // Player Ace + Other Card: { Dealer Card: Move }
  2: { 2: 'T', 3: 'T', 4: 'T', 5: 'D', 6: 'D', 7: 'T', 8: 'T', 9: 'T', 10: 'T', 1: 'T' }, // A,2
  3: { 2: 'T', 3: 'T', 4: 'T', 5: 'D', 6: 'D', 7: 'T', 8: 'T', 9: 'T', 10: 'T', 1: 'T' }, // A,3
  4: { 2: 'T', 3: 'T', 4: 'D', 5: 'D', 6: 'D', 7: 'T', 8: 'T', 9: 'T', 10: 'T', 1: 'T' }, // A,4
  5: { 2: 'T', 3: 'T', 4: 'D', 5: 'D', 6: 'D', 7: 'T', 8: 'T', 9: 'T', 10: 'T', 1: 'T' }, // A,5
  6: { 2: 'T', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'T', 8: 'T', 9: 'T', 10: 'T', 1: 'T' }, // A,6
  7: { 2: 'R', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'R', 8: 'R', 9: 'T', 10: 'T', 1: 'T' }, // A,7
  8: { 2: 'R', 3: 'R', 4: 'R', 5: 'R', 6: 'R', 7: 'R', 8: 'R', 9: 'R', 10: 'R', 1: 'R' }, // A,8
  9: { 2: 'R', 3: 'R', 4: 'R', 5: 'R', 6: 'R', 7: 'R', 8: 'R', 9: 'R', 10: 'R', 1: 'R' }, // A,9
  10:{ 2: 'R', 3: 'R', 4: 'R', 5: 'R', 6: 'R', 7: 'R', 8: 'R', 9: 'R', 10: 'R', 1: 'R' }, // A,10
};

const pairs: Record<number, Record<number, StrategyMove>> = {
  // Player Pair: { Dealer Card: Move }
  1:  { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 1: 'S' }, // A,A
  2:  { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'T', 9: 'T', 10: 'T', 1: 'T' }, // 2,2 & 3,3 (approx)
  3:  { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'T', 9: 'T', 10: 'T', 1: 'T' }, // 2,2 & 3,3 (approx)
  4:  { 2: 'T', 3: 'T', 4: 'T', 5: 'T', 6: 'T', 7: 'T', 8: 'T', 9: 'T', 10: 'T', 1: 'T' }, // 4,4
  5:  { 2: 'D', 3: 'D', 4: 'D', 5: 'D', 6: 'D', 7: 'D', 8: 'D', 9: 'D', 10: 'T', 1: 'T' }, // 5,5
  6:  { 2: 'T', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'T', 8: 'T', 9: 'T', 10: 'T', 1: 'T' }, // 6,6
  7:  { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'T', 9: 'T', 10: 'T', 1: 'T' }, // 7,7
  8:  { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 1: 'S' }, // 8,8
  9:  { 2: 'S', 3: 'S', 4: 'S', 5: 'S', 6: 'S', 7: 'R', 8: 'S', 9: 'S', 10: 'R', 1: 'R' }, // 9,9
  10: { 2: 'R', 3: 'R', 4: 'R', 5: 'R', 6: 'R', 7: 'R', 8: 'R', 9: 'R', 10: 'R', 1: 'R' }, // 10,10
};

function getDealerValue(dealerCard: Card): number {
    if (dealerCard.rank === 'A') return 1;
    return getCardValue(dealerCard);
}


export function getStrategy(playerHand: Card[], dealerCard: Card): StrategyMove {
  const handValue = calculateHandValue(playerHand);
  const dealerValue = getDealerValue(dealerCard);

  // Check for pairs first
  if (playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank) {
    const cardValue = getCardValue(playerHand[0]);
    return pairs[cardValue === 11 ? 1 : cardValue]?.[dealerValue] ?? 'R';
  }

  // Check for soft totals
  if (handValue.soft && handValue.soft <= 21) {
    const nonAceValue = handValue.hard - 1;
    if(nonAceValue >= 2 && nonAceValue <= 10) {
        return softTotals[nonAceValue]?.[dealerValue] ?? 'R';
    }
  }

  // Check for hard totals
  const playerScore = handValue.hard;
  if (playerScore <= 8) return hardTotals[8]?.[dealerValue] ?? 'T';
  if (playerScore >= 17) return hardTotals[17]?.[dealerValue] ?? 'R';
  return hardTotals[playerScore]?.[dealerValue] ?? 'R';
}
