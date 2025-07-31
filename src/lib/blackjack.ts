export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const createDeck = (): Card[] => {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({ suit, rank }))
  );
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getCardValue = (card: Card): number => {
  if (['J', 'Q', 'K'].includes(card.rank)) {
    return 10;
  }
  if (card.rank === 'A') {
    return 11;
  }
  return parseInt(card.rank, 10);
};

export const calculateHandValue = (hand: Card[]): number => {
  let value = hand.reduce((sum, card) => sum + getCardValue(card), 0);
  let aces = hand.filter((card) => card.rank === 'A').length;

  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }
  return value;
};

export const cardToString = (card: Card): string => {
    const suitNames: Record<Suit, string> = {
        '♠': 'Spades',
        '♥': 'Hearts',
        '♦': 'Diamonds',
        '♣': 'Clubs'
    };
    const rankNames: Record<string, string> = {
        'J': 'Jack',
        'Q': 'Queen',
        'K': 'King',
        'A': 'Ace'
    }
    const rank = rankNames[card.rank] || card.rank;
    return `${rank} of ${suitNames[card.suit]}`;
}
