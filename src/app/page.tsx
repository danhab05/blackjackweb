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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Dices, Shield, LucideGitCompare, LucideCopy, BarChart, Users } from 'lucide-react';

type GameState = "setup" | "player-turn" | "dealer-turn" | "game-over";
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
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>("setup");
  const [result, setResult] = useState<string | null>(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const [numPlayers, setNumPlayers] = useState(1);
  const [playerHands, setPlayerHands] = useState<Card[][]>([[]]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const playerHand = useMemo(() => playerHands[currentPlayerIndex] ?? [], [playerHands, currentPlayerIndex]);
  const playerHandValue = useMemo(() => calculateHandValue(playerHand), [playerHand]);
  const dealerHandValue = useMemo(() => calculateHandValue(dealerHand), [dealerHand]);
  
  const dealerVisibleScore = useMemo(() => {
    if (gameState !== 'game-over' && dealerHand.length > 1) {
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
    let deckToUse = [...currentDeck];
    if (deckToUse.length < 20) { // Keep a buffer
        deckToUse = shuffleDeck(createDeck());
        console.log("Deck re-shuffled");
    }
    const card = deckToUse[0];
    const newDeck = deckToUse.slice(1);
    return { card, newDeck };
  }, []);

  const startGame = useCallback(() => {
    let currentDeck = shuffleDeck(createDeck());
    
    // Deal to players
    const initialPlayerHands: Card[][] = Array(numPlayers).fill(0).map(() => []);
    
    // Deal one card to each player, then one to dealer, then second to each player, then second to dealer
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < numPlayers; j++) {
        const { card, newDeck } = dealCard(currentDeck);
        initialPlayerHands[j].push(card);
        currentDeck = newDeck;
      }
      if(i === 0) { // Deal dealer's first card
         const { card, newDeck } = dealCard(currentDeck);
         setDealerHand([card]);
         currentDeck = newDeck;
      } else { // Deal dealer's second card
         const { card, newDeck } = dealCard(currentDeck);
         setDealerHand(prev => [...prev, card]);
         currentDeck = newDeck;
      }
    }
    
    setPlayerHands(initialPlayerHands);
    setDeck(currentDeck);
    setCurrentPlayerIndex(0);
    setGameState("player-turn");
    setResult(null);

    // Immediate check for player blackjack
    const playerOneValue = getBestScore(calculateHandValue(initialPlayerHands[0]));
    if (playerOneValue === 21) {
      // For now, we only handle single player blackjack at start
      if(numPlayers === 1) {
        const dealerValue = getBestScore(calculateHandValue(dealerHand));
        setGameState("game-over");
        setResult(dealerValue === 21 ? "Égalité ! Vous avez tous les deux Blackjack." : "Blackjack ! Vous gagnez !");
      }
    }

  }, [dealCard, numPlayers, dealerHand]);

  // Initial deck setup
  useEffect(() => {
    if(isClient){
      setDeck(shuffleDeck(createDeck()));
    }
  }, [isClient]);

  const handleHit = () => {
    if (gameState !== "player-turn") return;

    const { card, newDeck } = dealCard(deck);
    const newPlayerHands = [...playerHands];
    newPlayerHands[currentPlayerIndex] = [...newPlayerHands[currentPlayerIndex], card];
    
    setPlayerHands(newPlayerHands);
    setDeck(newDeck);

    if (getBestScore(calculateHandValue(newPlayerHands[currentPlayerIndex])) > 21) {
      // For now, simple game over. Will need to advance to next player in multi-player
      setGameState("game-over");
      setResult("Bust ! Vous perdez.");
    }
  };

  const handleStand = () => {
    if (gameState !== "player-turn") return;
    // TODO: Add logic to move to next player. For now, just goes to dealer.
    setGameState("dealer-turn");
  };

  const handleDoubleDown = () => {
    if (!canDoubleDown) return;

    const { card, newDeck } = dealCard(deck);
    const newPlayerHands = [...playerHands];
    newPlayerHands[currentPlayerIndex] = [...newPlayerHands[currentPlayerIndex], card];
    
    setPlayerHands(newPlayerHands);
    setDeck(newDeck);
    
    if (getBestScore(calculateHandValue(newPlayerHands[currentPlayerIndex])) > 21) {
        setGameState("game-over");
        setResult("Bust ! Vous perdez.");
    } else {
        // TODO: Move to next player or dealer
        setGameState("dealer-turn");
    }
  }

  const handleSplit = () => {
    if (!canSplit) return;
    alert("La fonctionnalité de Split n'est pas encore complètement implémentée pour le multi-joueur.");
    // In a real scenario, we'd create a new hand for the player
  }
  
  const handleStrategy = () => {
    setShowStrategyModal(true);
  }

  const resetGame = () => {
    setGameState("setup");
    setResult(null);
    setDealerHand([]);
    setPlayerHands([[]]);
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
          // TODO: Compare each player's hand to the dealer's
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
  }, [gameState, dealerHand, deck, playerHandValue, dealCard]);
  
  if (!isClient) {
    return null; 
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-between p-4 sm:p-6 md:p-8 font-body bg-zinc-900 text-zinc-50">
      <header className="w-full max-w-5xl text-center mb-4 sm:mb-8">
        <h1 className="text-4xl sm:text-6xl font-bold text-sky-400 font-headline tracking-tighter uppercase">
          Blackjack Rapide
        </h1>
        <p className="text-zinc-400 mt-2 text-sm sm:text-base">Le moyen le plus rapide de jouer une main. Bonne chance !</p>
      </header>
      
      <main className="flex flex-col items-center justify-center w-full max-w-5xl space-y-4 sm:space-y-8 flex-grow">
        {gameState !== "setup" && (
            <Hand
              title="Main de la Banque"
              cards={dealerHand}
              score={dealerVisibleScore}
              isDealer
              isPlayerTurn={gameState === 'player-turn'}
            />
        )}

        <div className="relative h-12 sm:h-24 w-full flex items-center justify-center">
            {gameState === 'game-over' && result && (
                <div className="animate-slide-in opacity-0 text-center py-2 px-4 sm:py-3 sm:px-6 rounded-lg bg-zinc-800/80 backdrop-blur-sm shadow-2xl shadow-sky-500/10">
                    <h3 className="text-2xl sm:text-4xl font-bold text-sky-400">{result}</h3>
                </div>
            )}
        </div>

        {gameState !== "setup" && (
          <Hand
            title={`Main du Joueur ${currentPlayerIndex + 1}`}
            cards={playerHand}
            score={playerHandValue}
            isPlayerTurn={gameState === 'player-turn'}
          />
        )}
      </main>

      <footer className="w-full max-w-5xl mt-4 sm:mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row justify-center items-center md:space-x-4 p-2 sm:p-4 rounded-lg">
          {gameState === 'setup' ? (
              <div className="col-span-2 sm:col-span-3 md:flex md:items-center md:gap-4 w-full flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-lg">
                    <Users className="text-sky-400" />
                    <label htmlFor="player-count">Nombre de joueurs :</label>
                    <Select value={String(numPlayers)} onValueChange={(val) => setNumPlayers(Number(val))}>
                        <SelectTrigger className="w-20 bg-zinc-800 border-zinc-700">
                            <SelectValue placeholder="Joueurs" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-50">
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={startGame} size="lg" className="w-full sm:w-auto bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-bold shadow-lg">
                      Commencer la partie
                  </Button>
              </div>
          ) : gameState === 'player-turn' ? (
            <>
              <Button onClick={handleHit} size="lg" className="w-full bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-bold shadow-lg col-span-1 text-xs px-2">
                <Dices className="mr-1 sm:mr-2" /> Tirer
              </Button>
              <Button onClick={handleStand} size="lg" className="w-full bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-semibold shadow-lg col-span-1 text-xs px-2">
                <Shield className="mr-1 sm:mr-2" /> Rester
              </Button>
               <Button onClick={handleDoubleDown} size="lg" className="w-full bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-semibold shadow-lg col-span-1 text-xs px-2" disabled={!canDoubleDown}>
                <LucideCopy className="mr-1 sm:mr-2" /> Doubler
              </Button>
               <Button onClick={handleSplit} size="lg" className="w-full bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-semibold shadow-lg col-span-1 text-xs px-2" disabled={!canSplit}>
                <LucideGitCompare className="mr-1 sm:mr-2" /> Split
              </Button>
              <Button onClick={handleStrategy} size="lg" className="w-full bg-zinc-600 hover:bg-zinc-700 uppercase tracking-wider font-semibold shadow-lg col-span-2 sm:col-span-1 text-xs px-2">
                  <BarChart className="mr-1 sm:mr-2" /> Stratégie
              </Button>
            </>
          ) : (
            <Button onClick={resetGame} size="lg" className="w-full sm:w-auto bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-bold shadow-lg col-span-2 sm:col-start-2">
                <RefreshCw className="mr-2" /> Nouvelle Partie
            </Button>
          )}
        </div>
      </footer>
      <AlertDialog open={showStrategyModal} onOpenChange={setShowStrategyModal}>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800">
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-sky-400">Stratégie de base</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                      Selon la stratégie de base du Blackjack, le meilleur coup pour votre main actuelle contre la carte visible de la banque est de :
                      <strong className="block text-center text-lg text-sky-400 mt-4">
                          {recommendedStrategy ? strategyText[recommendedStrategy] : "Calcul en cours..."}
                      </strong>
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogAction className="bg-sky-500 hover:bg-sky-600" onClick={() => setShowStrategyModal(false)}>Compris</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    