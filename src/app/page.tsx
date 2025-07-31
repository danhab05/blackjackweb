"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Hand } from "@/components/blackjack/Hand";
import { AdviceDialog } from "@/components/blackjack/AdviceDialog";
import {
  createDeck,
  shuffleDeck,
  calculateHandValue,
  cardToString,
  type Card,
} from "@/lib/blackjack";
import { getBlackjackAdvice } from "@/ai/flows/blackjack-advice";
import { RefreshCw, Dices, Shield, Bot } from 'lucide-react';

type GameState = "player-turn" | "dealer-turn" | "game-over";

export default function BlackjackPage() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>("player-turn");
  const [result, setResult] = useState<string | null>(null);

  const [advice, setAdvice] = useState<string | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [isAdviceOpen, setIsAdviceOpen] = useState(false);

  const playerHandValue = useMemo(() => calculateHandValue(playerHand), [playerHand]);
  const dealerHandValue = useMemo(() => calculateHandValue(dealerHand), [dealerHand]);
  
  const dealerVisibleScore = useMemo(() => {
    if (gameState === 'player-turn' && dealerHand.length > 1) {
      return calculateHandValue([dealerHand[1]]);
    }
    return dealerHandValue;
  }, [gameState, dealerHand, dealerHandValue]);

  const dealCard = useCallback((currentDeck: Card[]): { card: Card; newDeck: Card[] } => {
    const card = currentDeck[0];
    const newDeck = currentDeck.slice(1);
    return { card, newDeck };
  }, []);

  const startGame = useCallback(() => {
    let newDeck = shuffleDeck(createDeck());
    
    // Deal cards ensuring player and dealer get cards alternately
    const { card: pCard1, newDeck: d1 } = dealCard(newDeck);
    const { card: dCard1, newDeck: d2 } = dealCard(d1);
    const { card: pCard2, newDeck: d3 } = dealCard(d2);
    const { card: dCard2, newDeck: d4 } = dealCard(d3);

    const initialPlayerHand = [pCard1, pCard2];
    const initialDealerHand = [dCard1, dCard2];

    setPlayerHand(initialPlayerHand);
    setDealerHand(initialDealerHand);
    setDeck(d4);
    setGameState("player-turn");
    setResult(null);

    const playerValue = calculateHandValue(initialPlayerHand);
    const dealerValue = calculateHandValue(initialDealerHand);

    if (playerValue === 21) {
      setGameState("game-over");
      setResult(dealerValue === 21 ? "Push! You both have Blackjack." : "Blackjack! You win!");
    }
  }, [dealCard]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleHit = () => {
    if (gameState !== "player-turn") return;

    const { card, newDeck } = dealCard(deck);
    const newPlayerHand = [...playerHand, card];
    setPlayerHand(newPlayerHand);
    setDeck(newDeck);

    if (calculateHandValue(newPlayerHand) > 21) {
      setGameState("game-over");
      setResult("Bust! You lose.");
    }
  };

  const handleStand = () => {
    if (gameState !== "player-turn") return;
    setGameState("dealer-turn");
  };

  useEffect(() => {
    if (gameState === "dealer-turn") {
      let currentDealerHand = [...dealerHand];
      let currentDeck = [...deck];
      let handValue = calculateHandValue(currentDealerHand);

      const dealerPlay = () => {
        if (handValue < 17) {
          const { card, newDeck } = dealCard(currentDeck);
          currentDealerHand = [...currentDealerHand, card];
          currentDeck = newDeck;
          handValue = calculateHandValue(currentDealerHand);
          setDealerHand(currentDealerHand);
          setDeck(currentDeck);
          setTimeout(dealerPlay, 800);
        } else {
          setGameState("game-over");
          const playerValue = calculateHandValue(playerHand);
          if (handValue > 21 || playerValue > handValue) {
            setResult("You win!");
          } else if (playerValue < handValue) {
            setResult("You lose.");
          } else {
            setResult("Push.");
          }
        }
      };
      
      setTimeout(dealerPlay, 500);
    }
  }, [gameState, dealerHand, deck, playerHand, dealCard]);

  const handleGetAdvice = async () => {
    if (playerHand.length === 0 || dealerHand.length < 2) return;
    setIsAdviceLoading(true);
    setIsAdviceOpen(true);
    setAdvice(null);
    try {
      const response = await getBlackjackAdvice({
        playerHand: playerHand.map(cardToString).join(", "),
        dealerUpCard: cardToString(dealerHand[1]),
      });
      setAdvice(response.advice);
    } catch (error) {
      console.error("Error getting advice:", error);
      setAdvice("Sorry, I couldn't get any advice right now.");
    } finally {
      setIsAdviceLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-between p-4 sm:p-8 md:p-12 font-body bg-background text-foreground">
      <header className="w-full max-w-5xl text-center mb-8">
        <h1 className="text-5xl font-bold text-accent font-headline tracking-tighter">
          Quick Blackjack
        </h1>
        <p className="text-primary-foreground/70 mt-2">The fastest way to play a hand. Good luck!</p>
      </header>
      
      <main className="flex flex-col items-center justify-center w-full max-w-5xl space-y-8 flex-grow">
        <Hand
          title="Bank's Hand"
          cards={dealerHand}
          score={dealerVisibleScore}
          isDealer
          isPlayerTurn={gameState === 'player-turn'}
        />

        <div className="relative h-24 w-full flex items-center justify-center">
            {gameState === 'game-over' && result && (
                <div className="animate-slide-in opacity-0 text-center p-4 rounded-lg bg-card/80 backdrop-blur-sm shadow-xl">
                    <h3 className="text-4xl font-bold text-accent">{result}</h3>
                </div>
            )}
        </div>

        <Hand
          title="Your Hand"
          cards={playerHand}
          score={playerHandValue}
          isPlayerTurn={gameState === 'player-turn'}
        />
      </main>

      <footer className="w-full max-w-5xl mt-8">
        <div className="flex justify-center items-center space-x-4 p-4 bg-card/50 rounded-lg shadow-inner">
          {gameState === 'player-turn' ? (
            <>
              <Button onClick={handleHit} size="lg" className="w-32 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Dices className="mr-2" /> Hit
              </Button>
              <Button onClick={handleStand} variant="secondary" size="lg" className="w-32">
                <Shield className="mr-2" /> Stand
              </Button>
              <Button onClick={handleGetAdvice} variant="outline" size="lg" className="w-32 border-accent text-accent hover:bg-accent/10 hover:text-accent">
                <Bot className="mr-2" /> Advice
              </Button>
            </>
          ) : (
            <Button onClick={startGame} size="lg" className="w-48 bg-accent text-accent-foreground hover:bg-accent/90">
                <RefreshCw className="mr-2" /> Play Again
            </Button>
          )}
        </div>
      </footer>
      
      <AdviceDialog 
        isOpen={isAdviceOpen}
        onClose={() => setIsAdviceOpen(false)}
        advice={advice}
        isLoading={isAdviceLoading}
      />
    </div>
  );
}
