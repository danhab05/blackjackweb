'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, Bot } from 'lucide-react';

export function AdviceDialog({
  isOpen,
  onClose,
  advice,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  advice: string | null;
  isLoading: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-accent/30 text-foreground font-headline">
        <DialogHeader>
          <DialogTitle className="text-accent flex items-center space-x-2">
            <Bot />
            <span>Blackjack AI Advisor</span>
          </DialogTitle>
          <DialogDescription className="text-foreground/60">
            AI-powered advice for your current hand.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 min-h-[8rem] flex items-center justify-center bg-background/50 rounded-lg">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-2 text-accent">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="font-semibold tracking-wider">THINKING...</p>
            </div>
          ) : (
            <p className="text-2xl sm:text-3xl font-bold tracking-widest text-center text-accent">{advice}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
