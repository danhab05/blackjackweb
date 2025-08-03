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

type GameState = "setup" | "player-turn" | "ai-turn" | "dealer-turn" | "game-over";
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
  const [results, setResults] = useState<string[]>([]);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const [numPlayers, setNumPlayers] = useState(1);
  const [playerHands, setPlayerHands] = useState<Card[][]>([[]]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const dealCard = useCallback((currentDeck: Card[]): { card: Card; newDeck: Card[] } => {
    let deckToUse = [...currentDeck];
    if (deckToUse.length < 20) { // Keep a buffer
        deckToUse = shuffleDeck(createDeck());
        setResults(prev => ["Nouveau paquet mélangé.", ...prev])
    }
    const card = deckToUse[0];
    const newDeck = deckToUse.slice(1);
    return { card, newDeck };
  }, []);

  const startGame = useCallback(() => {
    let currentDeck = shuffleDeck(createDeck());
    
    const initialPlayerHands: Card[][] = Array(numPlayers).fill(0).map(() => []);
    let initialDealerHand: Card[] = [];
    
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < numPlayers; j++) {
        const { card, newDeck } = dealCard(currentDeck);
        initialPlayerHands[j].push(card);
        currentDeck = newDeck;
      }
      const { card, newDeck } = dealCard(currentDeck);
      initialDealerHand.push(card);
      currentDeck = newDeck;
    }
    
    setPlayerHands(initialPlayerHands);
    setDealerHand(initialDealerHand);
    setDeck(currentDeck);
    setCurrentPlayerIndex(0);
    setGameState("player-turn");
    setResults([]);

    const humanPlayerValue = getBestScore(calculateHandValue(initialPlayerHands[0]));
    if (humanPlayerValue === 21) {
        setGameState("ai-turn");
    }

  }, [dealCard, numPlayers]);

  useEffect(() => {
    if(isClient && gameState === "setup"){
      startGame();
    }
  }, [isClient, startGame, gameState]);

  const playerHand = useMemo(() => playerHands[currentPlayerIndex] ?? [], [playerHands, currentPlayerIndex]);
  const playerHandValue = useMemo(() => calculateHandValue(playerHand), [playerHand]);
  const dealerHandValue = useMemo(() => calculateHandValue(dealerHand), [dealerHand]);
  
  const dealerVisibleScore = useMemo(() => {
    if (gameState !== 'game-over' && dealerHand.length > 1) {
      return calculateHandValue([dealerHand[1]]);
    }
    return dealerHandValue;
  }, [gameState, dealerHand, dealerHandValue]);

  const canDoubleDown = useMemo(() => playerHands[0].length === 2 && gameState === "player-turn", [playerHands, gameState]);
  const canSplit = useMemo(() => {
      return playerHands[0].length === 2 && playerHands[0][0].rank === playerHands[0][1].rank && gameState === "player-turn";
  }, [playerHands, gameState]);
  
  const recommendedStrategy = useMemo(() => {
    if (gameState === 'player-turn' && playerHands[0] && playerHands[0].length > 0 && dealerHand.length > 1) {
        return getStrategy(playerHands[0], dealerHand[1]);
    }
    return null;
  }, [gameState, playerHands, dealerHand]);

  const handleHit = () => {
    if (gameState !== "player-turn" || currentPlayerIndex !== 0) return;

    const { card, newDeck } = dealCard(deck);
    const newPlayerHands = [...playerHands];
    newPlayerHands[0] = [...newPlayerHands[0], card]; 
    
    setPlayerHands(newPlayerHands);
    setDeck(newDeck);

    if (getBestScore(calculateHandValue(newPlayerHands[0])) > 21) {
      setGameState("ai-turn");
    }
  };

  const handleStand = () => {
    if (gameState !== "player-turn" || currentPlayerIndex !== 0) return;
    setGameState("ai-turn");
  };

  const handleDoubleDown = () => {
    if (!canDoubleDown) return;

    const { card, newDeck } = dealCard(deck);
    const newPlayerHands = [...playerHands];
    newPlayerHands[0] = [...newPlayerHands[0], card];
    
    setPlayerHands(newPlayerHands);
    setDeck(newDeck);
    setGameState("ai-turn");
  }

  const handleSplit = () => {
    if (!canSplit) return;
    alert("La fonctionnalité de Split n'est pas encore implémentée.");
  }
  
  const handleStrategy = () => {
    setShowStrategyModal(true);
  }

  const resetGame = () => {
    setGameState("setup");
  }

  // AI Players' Turn
  useEffect(() => {
    if (gameState === "ai-turn") {
      if (numPlayers <= 1) {
        setGameState("dealer-turn");
        return;
      }

      let currentHands = [...playerHands];
      let currentDeck = [...deck];
      
      const playAiTurn = (aiPlayerIndex: number) => {
        if (aiPlayerIndex >= numPlayers) {
            setPlayerHands(currentHands);
            setDeck(currentDeck);
            setGameState("dealer-turn");
            return;
        }
        
        if(aiPlayerIndex === 0) {
            playAiTurn(aiPlayerIndex + 1);
            return;
        }

        setCurrentPlayerIndex(aiPlayerIndex);
        let aiHand = [...currentHands[aiPlayerIndex]];
        let handValue = getBestScore(calculateHandValue(aiHand));
        
        const aiDecisionLoop = () => {
            const move = getStrategy(aiHand, dealerHand[1]);
            
            if (move === 'T' && handValue < 17) {
                const { card, newDeck } = dealCard(currentDeck);
                aiHand.push(card);
                currentHands[aiPlayerIndex] = aiHand;
                currentDeck = newDeck;
                handValue = getBestScore(calculateHandValue(aiHand));
                setPlayerHands([...currentHands]); 
                setDeck(currentDeck);
                setTimeout(aiDecisionLoop, 1000);
            } else {
                setTimeout(() => playAiTurn(aiPlayerIndex + 1), 800);
            }
        };

        setTimeout(aiDecisionLoop, 800);
      };

      playAiTurn(1);
    }
  }, [gameState, playerHands, dealerHand, deck, dealCard, numPlayers]);


  // Dealer's Turn
  useEffect(() => {
    if (gameState === "dealer-turn") {
      setCurrentPlayerIndex(-1); // No player is active
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
          setTimeout(dealerPlay, 1000);
        } else {
          const dealerScore = handValue;
          const finalResults: string[] = [];
          
          playerHands.forEach((pHand, index) => {
              const playerValue = getBestScore(calculateHandValue(pHand));
              const playerLabel = index === 0 ? "Vous" : `Bot ${index}`;

              if (playerValue > 21) {
                  finalResults.push(`${playerLabel} : Bust !`);
              } else if (dealerScore > 21 || playerValue > dealerScore) {
                   finalResults.push(`${playerLabel} : Gagné !`);
              } else if (playerValue < dealerScore) {
                  finalResults.push(`${playerLabel} : Perdu.`);
              } else {
                  finalResults.push(`${playerLabel} : Égalité.`);
              }
          });
          
          setResults(finalResults);
          setGameState("game-over");
        }
      };
      
      setTimeout(dealerPlay, 800);
    }
  }, [gameState, dealerHand, deck, playerHands, dealCard]);
  
  if (!isClient) {
    return null; 
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 sm:p-6 md:p-8 font-body bg-zinc-900 text-zinc-50 overflow-hidden">
      <header className="w-full max-w-7xl text-center mb-4 sm:mb-8">
        <h1 className="text-4xl sm:text-6xl font-bold text-sky-400 font-headline tracking-tighter uppercase">
          Blackjack Rapide
        </h1>
        <p className="text-zinc-400 mt-2 text-sm sm:text-base">Le moyen le plus rapide de jouer une main. Bonne chance !</p>
      </header>
      
      <main className="flex flex-col items-center justify-center w-full max-w-7xl space-y-4 sm:space-y-8 flex-grow">
        {gameState !== "setup" && (
            <Hand
              title="Main de la Banque"
              cards={dealerHand}
              score={dealerVisibleScore}
              isDealer
              isPlayerTurn={gameState !== 'game-over'}
            />
        )}

        <div className="relative h-12 sm:h-24 w-full flex items-center justify-center">
            {gameState === 'game-over' && results.length > 0 && (
                <div className="animate-pop-in opacity-0 text-center py-2 px-4 sm:py-3 sm:px-6 rounded-lg bg-zinc-800/80 backdrop-blur-sm shadow-2xl shadow-sky-500/10 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                    {results.map((res, i) => <h3 key={i} className="text-md sm:text-lg font-bold text-sky-400">{res}</h3>)}
                </div>
            )}
        </div>

        {gameState !== "setup" && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {playerHands.map((pHand, index) => (
                <Hand
                  key={index}
                  title={index === 0 ? "Votre Main" : `Bot ${index + 1}`}
                  cards={pHand}
                  score={calculateHandValue(pHand)}
                  isPlayerTurn={gameState.startsWith('player') || (gameState === 'ai-turn' && currentPlayerIndex === index)}
                  isActive={currentPlayerIndex === index && gameState !== 'game-over'}
                />
            ))}
           </div>
        )}
      </main>

      <footer className="w-full max-w-5xl mt-4 sm:mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row justify-center items-center md:space-x-4 p-2 sm:p-4 rounded-lg">
          {gameState === 'game-over' ? (
              <div className="col-span-2 sm:col-span-3 md:flex md:items-center md:gap-4 w-full flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-lg">
                    <Users className="text-sky-400" />
                    <label htmlFor="player-count">Joueurs (vous + bots) :</label>
                    <Select value={String(numPlayers)} onValueChange={(val) => setNumPlayers(Number(val))}>
                        <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700">
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
                  <Button onClick={resetGame} size="lg" className="w-full sm:w-auto bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-bold shadow-lg">
                      <RefreshCw className="mr-2" /> Nouvelle Partie
                  </Button>
              </div>
          ) : gameState === 'player-turn' ? (
            <>
              <Button onClick={handleHit} size="lg" className="bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-bold shadow-lg col-span-1 text-xs px-2">
                <Dices className="mr-1 sm:mr-2" /> Tirer
              </Button>
              <Button onClick={handleStand} size="lg" className="bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-semibold shadow-lg col-span-1 text-xs px-2">
                <Shield className="mr-1 sm:mr-2" /> Rester
              </Button>
               <Button onClick={handleDoubleDown} size="lg" className="bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-semibold shadow-lg col-span-1 text-xs px-2" disabled={!canDoubleDown}>
                <LucideCopy className="mr-1 sm:mr-2" /> Doubler
              </Button>
               <Button onClick={handleSplit} size="lg" className="bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-semibold shadow-lg col-span-1 text-xs px-2" disabled={!canSplit}>
                <LucideGitCompare className="mr-1 sm:mr-2" /> Split
              </Button>
              <Button onClick={handleStrategy} size="lg" className="w-full bg-zinc-600 hover:bg-zinc-700 uppercase tracking-wider font-semibold shadow-lg col-span-2 sm:col-span-1 text-xs px-2">
                  <BarChart className="mr-1 sm:mr-2" /> Stratégie
              </Button>
            </>
          ) : (
            <div className="text-center col-span-full w-full">
              <p className="text-sky-400 text-lg animate-pulse">Tour des bots...</p>
            </div>
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
