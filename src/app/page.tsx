"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Hand } from "@/components/blackjack/Hand";
import {
  createDeck,
  shuffleDeck,
  calculateHandValue,
  getBestScore,
  type Card,
  type HandValue,
} from "@/lib/blackjack";
import { getStrategy } from "@/lib/strategy";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { RefreshCw, Dices, Shield, LucideGitCompare, LucideCopy, BarChart } from 'lucide-react';

type GameState = "player-turn" | "dealer-turn" | "game-over";
type StrategyMove = 'T' | 'R' | 'D' | 'S' | 'A';

const strategyText: Record<StrategyMove, string> = {
    'T': "Tirer une carte.",
    'R': "Rester.",
    'D': "Doubler votre mise.",
    'S': "Séparer votre main (Split).",
    'A': "Abandonner (si possible)."
};

export default function BlackjackPage() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>("player-turn");
  const [result, setResult] = useState<string | null>(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  const playerHandValue = useMemo(() => calculateHandValue(playerHand), [playerHand]);
  const dealerHandValue = useMemo(() => calculateHandValue(dealerHand), [dealerHand]);
  
  const dealerVisibleScore = useMemo(() => {
    if (gameState === 'player-turn' && dealerHand.length > 1) {
      return calculateHandValue([dealerHand[1]]);
    }
    return dealerHandValue;
  }, [gameState, dealerHand, dealerHandValue]);

  const canDoubleDown = useMemo(() => playerHand.length === 2 && gameState === "player-turn", [playerHand, gameState]);
  const canSplit = useMemo(() => {
      return playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank && gameState === "player-turn";
  }, [playerHand, gameState]);
  
  const recommendedStrategy = useMemo(() => {
    if (gameState === 'player-turn' && playerHand.length > 0 && dealerHand.length > 1) {
        return getStrategy(playerHand, dealerHand[1]);
    }
    return null;
  }, [gameState, playerHand, dealerHand]);


  const dealCard = useCallback((currentDeck: Card[]): { card: Card; newDeck: Card[] } => {
    if (currentDeck.length === 0) {
        currentDeck = shuffleDeck(createDeck());
    }
    const card = currentDeck[0];
    const newDeck = currentDeck.slice(1);
    return { card, newDeck };
  }, []);

  const startGame = useCallback(() => {
    let newDeck = shuffleDeck(createDeck());
    
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

    const playerValue = getBestScore(calculateHandValue(initialPlayerHand));
    const dealerValue = getBestScore(calculateHandValue(initialDealerHand));

    if (playerValue === 21) {
      setGameState("game-over");
      setResult(dealerValue === 21 ? "Égalité ! Vous avez tous les deux Blackjack." : "Blackjack ! Vous gagnez !");
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

    if (getBestScore(calculateHandValue(newPlayerHand)) > 21) {
      setGameState("game-over");
      setResult("Bust ! Vous perdez.");
    }
  };

  const handleStand = () => {
    if (gameState !== "player-turn") return;
    setGameState("dealer-turn");
  };

  const handleDoubleDown = () => {
    if (!canDoubleDown) return;

    const { card, newDeck } = dealCard(deck);
    const newPlayerHand = [...playerHand, card];
    setPlayerHand(newPlayerHand);
    setDeck(newDeck);
    
    if (getBestScore(calculateHandValue(newPlayerHand)) > 21) {
        setGameState("game-over");
        setResult("Bust ! Vous perdez.");
    } else {
        setGameState("dealer-turn");
    }
  }

  const handleSplit = () => {
    if (!canSplit) return;
    alert("La fonctionnalité de Split n'est pas encore complètement implémentée, une nouvelle main sera distribuée.");
    startGame();
  }
  
  const handleStrategy = () => {
    setShowStrategyModal(true);
  }


  useEffect(() => {
    if (gameState === "dealer-turn") {
      let currentDealerHand = [...dealerHand];
      let currentDeck = [...deck];
      let handValue = getBestScore(calculateHandValue(currentDealerHand));

      const dealerPlay = () => {
        if (handValue < 17) {
          const { card, newDeck } = dealCard(currentDeck);
          currentDealerHand = [...currentDealerHand, card];
          currentDeck = newDeck;
          handValue = getBestScore(calculateHandValue(currentDealerHand));
          setDealerHand(currentDealerHand);
          setDeck(currentDeck);
          setTimeout(dealerPlay, 800);
        } else {
          setGameState("game-over");
          const playerValue = getBestScore(playerHandValue);
          if (handValue > 21 || playerValue > handValue) {
            setResult("Vous gagnez !");
          } else if (playerValue < handValue) {
            setResult("Vous perdez.");
          } else {
            setResult("Égalité.");
          }
        }
      };
      
      setTimeout(dealerPlay, 500);
    }
  }, [gameState, dealerHand, deck, playerHand, playerHandValue, dealCard]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-between p-4 sm:p-6 md:p-8 font-body bg-background text-foreground">
      <header className="w-full max-w-5xl text-center mb-4 sm:mb-8">
        <h1 className="text-4xl sm:text-6xl font-bold text-accent font-headline tracking-tighter uppercase">
          Blackjack Rapide
        </h1>
        <p className="text-foreground/60 mt-2 text-sm sm:text-base">Le moyen le plus rapide de jouer une main. Bonne chance !</p>
      </header>
      
      <main className="flex flex-col items-center justify-center w-full max-w-5xl space-y-6 sm:space-y-8 flex-grow">
        <Hand
          title="Main de la Banque"
          cards={dealerHand}
          score={dealerVisibleScore}
          isDealer
          isPlayerTurn={gameState === 'player-turn'}
        />

        <div className="relative h-16 sm:h-24 w-full flex items-center justify-center">
            {gameState === 'game-over' && result && (
                <div className="animate-slide-in opacity-0 text-center py-2 px-4 sm:py-3 sm:px-6 rounded-lg bg-card/80 backdrop-blur-sm shadow-2xl shadow-accent/10">
                    <h3 className="text-2xl sm:text-4xl font-bold text-accent">{result}</h3>
                </div>
            )}
        </div>

        <Hand
          title="Votre Main"
          cards={playerHand}
          score={playerHandValue}
          isPlayerTurn={gameState === 'player-turn'}
        />
      </main>

      <footer className="w-full max-w-5xl mt-6 sm:mt-8">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 p-4 rounded-lg">
          {gameState === 'player-turn' ? (
            <>
              <Button onClick={handleHit} size="lg" className="w-full sm:w-auto flex-1 bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-bold shadow-lg">
                <Dices className="mr-2" /> Tirer
              </Button>
              <Button onClick={handleStand} size="lg" className="w-full sm:w-auto flex-1 bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-semibold shadow-lg">
                <Shield className="mr-2" /> Rester
              </Button>
               <Button onClick={handleDoubleDown} size="lg" className="w-full sm:w-auto flex-1 bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-semibold shadow-lg" disabled={!canDoubleDown}>
                <LucideCopy className="mr-2" /> Doubler
              </Button>
               <Button onClick={handleSplit} size="lg" className="w-full sm:w-auto flex-1 bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-semibold shadow-lg" disabled={!canSplit}>
                <LucideGitCompare className="mr-2" /> Split
              </Button>
              <Button onClick={handleStrategy} size="lg" className="w-full sm:w-auto flex-1 bg-gray-600 hover:bg-gray-700 uppercase tracking-wider font-semibold shadow-lg">
                  <BarChart className="mr-2" /> Stats
              </Button>
            </>
          ) : (
            <Button onClick={startGame} size="lg" className="w-full sm:w-48 bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-bold shadow-lg">
                <RefreshCw className="mr-2" /> Rejouer
            </Button>
          )}
        </div>
      </footer>
      <AlertDialog open={showStrategyModal} onOpenChange={setShowStrategyModal}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Stratégie de base</AlertDialogTitle>
                  <AlertDialogDescription>
                      Selon la stratégie de base du Blackjack, le meilleur coup pour votre main actuelle contre la carte visible de la banque est de :
                      <strong className="block text-center text-lg text-accent mt-4">
                          {recommendedStrategy ? strategyText[recommendedStrategy] : "Calcul en cours..."}
                      </strong>
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setShowStrategyModal(false)}>Compris</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
