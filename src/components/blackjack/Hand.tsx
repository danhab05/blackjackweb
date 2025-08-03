'use client';

import { CardComponent } from './Card';
import type { Card, HandValue } from '@/lib/blackjack';

function formatScore(score: HandValue): string {
    if (score.hard === 0) return '';
    if (score.soft && score.soft <= 21 && score.soft !== score.hard) {
        return `${score.hard} / ${score.soft}`;
    }
    
    let aces = 0;
    let value = score.hard;

    if (score.soft) {
        const potentialAces = Math.floor((score.soft - score.hard) / 10);
        value = score.soft;
        aces = potentialAces;
    }
    
    while(value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
    }

    return value.toString();
}

export function Hand({
  cards,
  title,
  score,
  isDealer,
  isPlayerTurn,
}: {
  cards: Card[];
  title: string;
  score: HandValue;
  isDealer?: boolean;
  isPlayerTurn: boolean;
}) {

  const displayScore = formatScore(score);

  return (
    <div className="flex flex-col items-center space-y-2 sm:space-y-4 w-full">
      <h2 className="text-lg sm:text-2xl font-semibold text-foreground/70 tracking-wider uppercase font-headline">
        {title} <span className="text-accent font-bold text-xl sm:text-3xl">{displayScore}</span>
      </h2>
      <div className="flex justify-center items-end space-x-[-4.5rem] sm:space-x-[-6rem] min-h-[8rem] sm:min-h-[10rem] w-full px-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="animate-slide-in opacity-0"
            style={{ animationDelay: `${i * 150}ms`, zIndex: i }}
          >
            <CardComponent
              card={card}
              hidden={isDealer && i === 0 && isPlayerTurn}
            />
          </div>
        ))}
        {cards.length === 0 && (
          <div className="animate-slide-in opacity-0">
             <CardComponent hidden />
          </div>
        )}
      </div>
    </div>
  );
}
