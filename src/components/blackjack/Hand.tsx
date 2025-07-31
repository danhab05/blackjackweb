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
    <div className="flex flex-col items-center space-y-4 w-full">
      <h2 className="text-2xl font-semibold text-primary-foreground/80 tracking-wider uppercase">
        {title} <span className="text-accent font-bold">{score > 0 ? score : ''}</span>
      </h2>
      <div className="flex justify-center items-end space-x-[-4rem] min-h-[10rem] w-full px-4">
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
      </div>
    </div>
  );
}
