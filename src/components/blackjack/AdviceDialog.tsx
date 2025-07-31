'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-accent">Blackjack AI Advisor</DialogTitle>
          <DialogDescription>
            Here's some AI-powered advice for your current hand.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 min-h-[8rem] flex items-center justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
              <p>Thinking...</p>
            </div>
          ) : (
            <p className="text-lg leading-relaxed text-left">{advice}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
