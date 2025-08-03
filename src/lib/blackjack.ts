export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type HandValue = {
  hard: number;
  soft?: number;
};

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

export const calculateHandValue = (hand: Card[]): HandValue => {
  let hard = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.rank === 'A') {
      aces += 1;
      hard += 1;
    } else if (['J', 'Q', 'K'].includes(card.rank)) {
      hard += 10;
    } else {
      hard += parseInt(card.rank, 10);
    }
  }
  
  let soft;
  if (aces > 0) {
      soft = hard + 10;
  }

  return { hard, soft };
};

export const getBestScore = (handValue: HandValue): number => {
    if (handValue.soft && handValue.soft <= 21) {
        return handValue.soft;
    }
    return handValue.hard;
}


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
