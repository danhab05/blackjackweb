
'use client';

import { CardComponent } from './Card';
import type { Card, HandValue } from '@/lib/blackjack';
import { cn } from '@/lib/utils';

function formatScore(score: HandValue): string {
    if (score.hard === 0) return '';
    if (score.soft && score.soft <= 21 && score.soft !== score.hard) {
        return `${score.hard} / ${score.soft}`;
    }
    
    let aces = 0;
    let value = score.hard;

    if (score.soft) {
        const hasAce = score.hard !== score.soft;
        if (hasAce) {
            const tempSoft = score.hard + 10;
            if (tempSoft <= 21) {
                return `${score.hard} / ${tempSoft}`;
            }
        }
    }

    return score.hard.toString();
}

export function Hand({
  cards,
  title,
  score,
  isDealer,
  isPlayerTurn,
  isActive,
}: {
  cards: Card[];
  title: string;
  score: HandValue;
  isDealer?: boolean;
  isPlayerTurn: boolean;
  isActive?: boolean;
}) {

  const displayScore = formatScore(score);

  return (
    <div className={cn(
        "flex flex-col items-center space-y-2 sm:space-y-4 w-full bg-secondary/50 p-4 rounded-lg border border-border transition-all duration-300",
        isActive && "shadow-lg shadow-primary/30 border-primary/50 scale-105"
        )}>
      <h2 className="text-lg sm:text-xl font-semibold text-muted-foreground tracking-wider uppercase font-headline">
        {title} <span className="text-primary font-bold text-xl sm:text-2xl">{displayScore}</span>
      </h2>
      <div className="relative flex justify-center items-center min-h-[8rem] sm:min-h-[10rem] w-full px-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="animate-deal-card opacity-0 absolute transition-all duration-300 ease-out"
            style={{ 
              animationDelay: `${i * 150}ms`, 
              zIndex: i,
              // We calculate the offset to spread the cards.
              // The more cards, the closer they are.
              left: `calc(50% + ${(i - (cards.length - 1) / 2) * (cards.length > 5 ? 2.5 : 3.5)}rem - 2.5rem)`
             }}
          >
            <CardComponent
              card={card}
              hidden={isDealer && i === 0 && isPlayerTurn}
            />
          </div>
        ))}
        {(cards.length === 0 || (isDealer && isPlayerTurn && cards.length === 1)) && (
          <div className="animate-deal-card opacity-0">
             <CardComponent hidden />
          </div>
        )}
      </div>
    </div>
  );
}
