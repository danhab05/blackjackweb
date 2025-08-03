import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Card, Suit } from '@/lib/blackjack';
import { Spade, Heart, Club, Diamond } from 'lucide-react';

const suitIcons: Record<Suit, ReactNode> = {
  '♠': <Spade className="h-full w-full" />,
  '♥': <Heart className="h-full w-full fill-current" />,
  '♦': <Diamond className="h-full w-full fill-current" />,
  '♣': <Club className="h-full w-full fill-current" />,
};

export function CardComponent({ card, hidden, className }: { card?: Card; hidden?: boolean; className?: string }) {
  if (hidden) {
    return (
      <div className={cn("relative h-28 w-20 sm:h-36 sm:w-28 rounded-lg bg-secondary/50 border-2 border-dashed border-primary/30 shadow-lg backdrop-blur-sm", className)}>
        <div className="flex h-full w-full items-center justify-center">
            <div className="h-14 w-10 sm:h-16 sm:w-12 rounded-md bg-primary/20 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const isRed = card.suit === '♥' || card.suit === '♦';

  return (
    <div className={cn("relative h-28 w-20 sm:h-36 sm:w-28 rounded-lg bg-zinc-900 dark:bg-zinc-900 shadow-xl border border-white/10", "bg-zinc-100", className)}>
      <div className={cn(
        "flex h-full w-full flex-col justify-between p-1 sm:p-2 font-bold font-headline",
        isRed ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-50'
      )}>
        <div className="flex flex-col items-start">
          <span className="text-lg sm:text-2xl leading-none">{card.rank}</span>
          <span className="h-3 w-3 sm:h-4 sm:w-4">{suitIcons[card.suit]}</span>
        </div>
        <div className="flex justify-center items-center">
             <span className="h-5 w-5 sm:h-8 sm:w-8 opacity-50">{suitIcons[card.suit]}</span>
        </div>
        <div className="flex flex-col items-end rotate-180">
          <span className="text-lg sm:text-2xl leading-none">{card.rank}</span>
          <span className="h-3 w-3 sm:h-4 sm:w-4">{suitIcons[card.suit]}</span>
        </div>
      </div>
    </div>
  );
}
