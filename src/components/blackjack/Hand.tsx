'use client';

import { CardComponent } from './Card';
import type { Card } from '@/lib/blackjack';

export function Hand({
  cards,
  title,
  score,
  isDealer,
  isPlayerTurn,
}: {
  cards: Card[];
  title: string;
  score: number;
  isDealer?: boolean;
  isPlayerTurn: boolean;
}) {
  return (
    <div className="flex flex-col items-center space-y-3 sm:space-y-4 w-full">
      <h2 className="text-xl sm:text-2xl font-semibold text-foreground/70 tracking-wider uppercase font-headline">
        {title} <span className="text-accent font-bold text-2xl sm:text-3xl">{score > 0 ? score : ''}</span>
      </h2>
      <div className="flex justify-center items-end space-x-[-5rem] sm:space-x-[-6rem] min-h-[9rem] sm:min-h-[10rem] w-full px-4">
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
