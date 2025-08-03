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
import { RefreshCw, Dices, Shield, LucideGitCompare, LucideCopy, BarChart, Users, Sun, Moon } from 'lucide-react';
import { cn } from "@/lib/utils";

type GameState = "setup" | "player-turn" | "ai-turn" | "dealer-turn" | "game-over";
type StrategyMove = 'T' | 'R' | 'D' | 'S' | 'A';
type Theme = 'dark' | 'light';

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
  const [theme, setTheme] = useState<Theme>('dark');


  useEffect(() => {
    setIsClient(true);
    // Set initial theme
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };
  
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
    
    // Deal 2 cards to each player and the dealer
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

    // Check for player Blackjack
    const humanPlayerValue = getBestScore(calculateHandValue(initialPlayerHands[0]));
    if (humanPlayerValue === 21) {
        setGameState("ai-turn");
    }

  }, [dealCard, numPlayers]);

  const playerHand = useMemo(() => playerHands[currentPlayerIndex] ?? [], [playerHands, currentPlayerIndex]);
  const playerHandValue = useMemo(() => calculateHandValue(playerHand), [playerHand]);
  const dealerHandValue = useMemo(() => calculateHandValue(dealerHand), [dealerHand]);
  
  const dealerVisibleScore = useMemo(() => {
    if (gameState !== 'game-over' && dealerHand.length > 1) {
      // Show only the value of the visible card (the second one)
      return calculateHandValue([dealerHand[1]]);
    }
    return dealerHandValue;
  }, [gameState, dealerHand, dealerHandValue]);

  const canDoubleDown = useMemo(() => playerHands.length > 0 && playerHands[0].length === 2 && gameState === "player-turn", [playerHands, gameState]);
  const canSplit = useMemo(() => {
      // Basic split condition: two cards of the same rank
      return playerHands.length > 0 && playerHands[0].length === 2 && playerHands[0][0].rank === playerHands[0][1].rank && gameState === "player-turn";
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

    // Deal one more card and immediately stand.
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
    // To properly implement split, we would need to manage two separate hands for the player,
    // including separate betting, which adds significant complexity.
  }
  
  const handleStrategy = () => {
    setShowStrategyModal(true);
  }

  const resetGame = () => {
    setGameState('setup');
    setPlayerHands([[]]);
    setDealerHand([]);
    setResults([]);
  }

  // AI Players' Turn
  useEffect(() => {
    if (gameState === "ai-turn") {
      const playNextAi = async (aiIndex: number) => {
        if (aiIndex >= numPlayers) {
          setGameState("dealer-turn");
          return;
        }

        // Skip human player
        if (aiIndex === 0) {
          playNextAi(aiIndex + 1);
          return;
        }
        
        setCurrentPlayerIndex(aiIndex);

        let hands = [...playerHands];
        let currentDeck = deck;
        let hand = hands[aiIndex];
        let handValue = getBestScore(calculateHandValue(hand));

        while (handValue < 17) {
          const move = getStrategy(hand, dealerHand[1]);
          if (move !== 'T' && move !== 'D') { // AI can double, treat as hit for now
            break;
          }

          // Delay for visual effect
          await new Promise(resolve => setTimeout(resolve, 1000));

          const { card, newDeck } = dealCard(currentDeck);
          hand = [...hand, card];
          let newHands = [...playerHands];
          newHands[aiIndex] = hand;
          currentDeck = newDeck;
          
          setPlayerHands(newHands);
          setDeck(currentDeck);

          handValue = getBestScore(calculateHandValue(hand));
        }
        
        // Delay before moving to the next player
        await new Promise(resolve => setTimeout(resolve, 800));
        playNextAi(aiIndex + 1);
      };

      if (numPlayers > 1) {
        playNextAi(1);
      } else {
        setGameState("dealer-turn");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, numPlayers, dealerHand]);


  // Dealer's Turn
  useEffect(() => {
    if (gameState === "dealer-turn") {
      setCurrentPlayerIndex(-1); // No player is active
      let currentDealerHand = [...dealerHand];
      let currentDeck = [...deck];
      
      const dealerPlay = () => {
        let handValue = getBestScore(calculateHandValue(currentDealerHand));
        // Dealer hits until 17 or more
        if (handValue < 17) {
          const { card, newDeck } = dealCard(currentDeck);
          currentDealerHand = [...currentDealerHand, card];
          currentDeck = newDeck;
          setDealerHand(currentDealerHand);
          setDeck(currentDeck);
          setTimeout(dealerPlay, 1000);
        } else {
          // Determine results once dealer stands
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
      
      // Reveal hole card and start playing after a delay
      setTimeout(dealerPlay, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, dealCard]);
  
  if (!isClient) {
    return null; // Render nothing on the server
  }

  const playerGridClass = cn(
    "grid gap-4 md:gap-8 w-full transition-all duration-500",
    {
        "md:grid-cols-1 lg:grid-cols-1": numPlayers <= 2,
        "md:grid-cols-2 lg:grid-cols-3": numPlayers === 3,
        "md:grid-cols-2 lg:grid-cols-4": numPlayers === 4,
    }
  );

  return (
    <div className="flex flex-col min-h-screen items-center p-4 sm:p-6 md:p-8 font-body bg-zinc-900 text-zinc-50 overflow-y-auto">
      <header className="w-full max-w-7xl flex justify-between items-center my-4 sm:my-8 flex-shrink-0">
        <div className="text-left">
            <h1 className="text-4xl sm:text-6xl font-bold text-sky-400 font-headline tracking-tighter uppercase">
            Blackjack Rapide
            </h1>
            <p className="text-zinc-400 mt-2 text-sm sm:text-base">Le moyen le plus rapide de jouer une main. Bonne chance !</p>
        </div>
        <Button onClick={toggleTheme} variant="outline" size="icon" className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50">
            {theme === 'dark' ? <Sun className="h-[1.2rem] w-[1.2rem] text-sky-400" /> : <Moon className="h-[1.2rem] w-[1.2rem] text-sky-400" />}
            <span className="sr-only">Toggle theme</span>
        </Button>
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
           <div className={playerGridClass}>
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

      <footer className="w-full max-w-5xl my-4 sm:my-8 flex-shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row justify-center items-center md:space-x-4 p-2 sm:p-4 rounded-lg">
          {gameState === 'game-over' || gameState === 'setup' ? (
              <div className="col-span-full md:flex md:items-center md:gap-4 w-full flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-lg">
                    <Users className="text-sky-400" />
                    <label htmlFor="player-count">Joueurs (vous + bots) :</label>
                    <Select value={String(numPlayers)} onValueChange={(val) => setNumPlayers(Number(val))} disabled={gameState !== 'setup'}>
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
                   <Button onClick={startGame} size="lg" className="w-full sm:w-auto bg-blue-600 text-black hover:bg-blue-700 uppercase tracking-wider font-bold shadow-lg">
                      <RefreshCw className="mr-2" /> Nouvelle Partie
                  </Button>
                  {gameState === 'game-over' && (
                     <Button onClick={resetGame} size="lg" variant="outline" className="w-full sm:w-auto">
                        Changer les options
                    </Button>
                  )}
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
