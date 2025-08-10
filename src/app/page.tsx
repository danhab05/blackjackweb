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
import { RefreshCw, Dices, Shield, LucideGitCompare, LucideCopy, BarChart, Users, Sun, Moon, Armchair, BadgeDollarSign, CircleDotDashed, Eraser } from 'lucide-react';
import { cn } from "@/lib/utils";

type GameState = "setup" | "betting" | "player-turn" | "ai-turn" | "dealer-turn" | "game-over";
type StrategyMove = 'T' | 'R' | 'D' | 'S' | 'A';
type Theme = 'dark' | 'light';

const strategyText: Record<StrategyMove, string> = {
    'T': "Tirer une carte.",
    'R': "Rester.",
    'D': "Doubler votre mise.",
    'S': "Séparer votre main (Split).",
    'A': "Abandonner (si possible)."
};

const chipValues = [5, 10, 50, 100];

export default function BlackjackPage() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>("setup");
  const [results, setResults] = useState<string[]>([]);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const [numPlayers, setNumPlayers] = useState(1);
  const [humanPlayerPosition, setHumanPlayerPosition] = useState(0);
  const [playerHands, setPlayerHands] = useState<Card[][]>([[]]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [theme, setTheme] = useState<Theme>('dark');
  
  // Betting state
  const [balance, setBalance] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);
  const [lastBet, setLastBet] = useState(0);
  const [isDoubled, setIsDoubled] = useState(false);


  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('blackjack-theme') as Theme || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    // Start with betting phase if player has money
    if (gameState === 'setup') {
      if (balance > 0) {
        setGameState('betting');
      }
    }
  }, [gameState, balance]);

  useEffect(() => {
    if (humanPlayerPosition >= numPlayers) {
        setHumanPlayerPosition(numPlayers - 1);
    }
  }, [numPlayers, humanPlayerPosition]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('blackjack-theme', newTheme);
  };
  
  const dealCard = useCallback((currentDeck: Card[]): { card: Card; newDeck: Card[] } => {
    let deckToUse = [...currentDeck];
    if (deckToUse.length < 20) {
        deckToUse = shuffleDeck(createDeck());
        setResults(prev => ["Nouveau paquet mélangé.", ...prev])
    }
    const card = deckToUse[0];
    const newDeck = deckToUse.slice(1);
    return { card, newDeck };
  }, []);

  const placeBetAndStartGame = () => {
    if (currentBet === 0) {
        alert("Veuillez placer une mise.");
        return;
    }
    if (currentBet > balance) {
        alert("Votre mise ne peut pas dépasser votre solde.");
        return;
    }

    setBalance(prev => prev - currentBet);
    setLastBet(currentBet);
    setIsDoubled(false);

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
    
    const isHumanPlayerBlackjack = getBestScore(calculateHandValue(initialPlayerHands[humanPlayerPosition])) === 21;
    
    if (isHumanPlayerBlackjack) {
        setCurrentPlayerIndex(0);
        setGameState("ai-turn");
    } else {
        setCurrentPlayerIndex(humanPlayerPosition);
        setGameState("player-turn");
    }

    setResults([]);
  };

  const playerHand = useMemo(() => playerHands[humanPlayerPosition] ?? [], [playerHands, humanPlayerPosition]);
  const playerHandValue = useMemo(() => calculateHandValue(playerHand), [playerHand]);
  const dealerHandValue = useMemo(() => calculateHandValue(dealerHand), [dealerHand]);
  
  const dealerVisibleScore = useMemo(() => {
    if (gameState !== 'game-over' && dealerHand.length > 1) {
      return calculateHandValue([dealerHand[1]]);
    }
    return dealerHandValue;
  }, [gameState, dealerHand, dealerHandValue]);

  const canDoubleDown = useMemo(() => playerHand.length === 2 && gameState === "player-turn" && currentPlayerIndex === humanPlayerPosition && balance >= currentBet, [playerHand, gameState, currentPlayerIndex, humanPlayerPosition, balance, currentBet]);
  const canSplit = useMemo(() => {
      return playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank && gameState === "player-turn" && currentPlayerIndex === humanPlayerPosition;
  }, [playerHand, gameState, currentPlayerIndex, humanPlayerPosition]);
  
  const recommendedStrategy = useMemo(() => {
    if (gameState === 'player-turn' && currentPlayerIndex === humanPlayerPosition && playerHand.length > 0 && dealerHand.length > 1) {
        return getStrategy(playerHand, dealerHand[1]);
    }
    return null;
  }, [gameState, playerHand, dealerHand, currentPlayerIndex, humanPlayerPosition]);

  const handleHit = () => {
    if (gameState !== "player-turn" || currentPlayerIndex !== humanPlayerPosition) return;

    const { card, newDeck } = dealCard(deck);
    const newPlayerHands = [...playerHands];
    newPlayerHands[humanPlayerPosition] = [...newPlayerHands[humanPlayerPosition], card]; 
    
    setPlayerHands(newPlayerHands);
    setDeck(newDeck);

    if (getBestScore(calculateHandValue(newPlayerHands[humanPlayerPosition])) > 21) {
      setGameState("ai-turn");
      setCurrentPlayerIndex(0);
    }
  };

  const handleStand = () => {
    if (gameState !== "player-turn" || currentPlayerIndex !== humanPlayerPosition) return;
    setGameState("ai-turn");
    setCurrentPlayerIndex(0);
  };

  const handleDoubleDown = () => {
    if (!canDoubleDown) return;

    setBalance(prev => prev - currentBet);
    setCurrentBet(prev => prev * 2);
    setIsDoubled(true);

    const { card, newDeck } = dealCard(deck);
    const newPlayerHands = [...playerHands];
    newPlayerHands[humanPlayerPosition] = [...newPlayerHands[humanPlayerPosition], card];
    
    setPlayerHands(newPlayerHands);
    setDeck(newDeck);
    setGameState("ai-turn");
    setCurrentPlayerIndex(0);
  }

  const handleSplit = () => {
    if (!canSplit) return;
    alert("La fonctionnalité de Split n'est pas encore implémentée.");
  }
  
  const handleStrategy = () => {
    setShowStrategyModal(true);
  }

  const resetGame = (fullReset = false) => {
    if (fullReset) {
      setBalance(1000);
      setNumPlayers(1);
      setHumanPlayerPosition(0);
    }
    setGameState('betting');
    setCurrentBet(0);
    setPlayerHands([[]]);
    setDealerHand([]);
    setResults([]);
  }

  const addToBet = (amount: number) => {
    if (currentBet + amount <= balance) {
        setCurrentBet(prev => prev + amount);
    } else {
        alert("Vous ne pouvez pas miser plus que votre solde.");
    }
  }

  const clearBet = () => {
      setCurrentBet(0);
  }

  // AI Players' Turn
  const playAiTurns = useCallback(async () => {
    let hands = [...playerHands];
    let currentDeck = [...deck];
    
    for (let i = 0; i < numPlayers; i++) {
      if (i === humanPlayerPosition) continue;

      setCurrentPlayerIndex(i);
      
      let botHand = hands[i];
      let botHandValue = getBestScore(calculateHandValue(botHand));
      
      while (botHandValue < 17) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { card, newDeck: updatedDeck } = dealCard(currentDeck);
        currentDeck = updatedDeck;
        botHand = [...botHand, card];
        hands[i] = botHand;
        botHandValue = getBestScore(calculateHandValue(botHand));
        
        setPlayerHands([...hands]);
        setDeck(currentDeck);
      }
    }
    
    setGameState("dealer-turn");
  }, [playerHands, deck, numPlayers, humanPlayerPosition, dealCard]);

  useEffect(() => {
    if (gameState === "ai-turn") {
        playAiTurns();
    }
  }, [gameState, playAiTurns]);


  // Dealer's Turn
  useEffect(() => {
    if (gameState === "dealer-turn") {
      setCurrentPlayerIndex(-1); // No player is active
      let currentDealerHand = [...dealerHand];
      let currentDeck = [...deck];
      
      const dealerPlay = () => {
        let handValue = getBestScore(calculateHandValue(currentDealerHand));
        if (handValue < 17) {
          const { card, newDeck } = dealCard(currentDeck);
          currentDealerHand = [...currentDealerHand, card];
          currentDeck = newDeck;
          setDealerHand(currentDealerHand);
          setDeck(currentDeck);
          setTimeout(dealerPlay, 1000);
        } else {
          const dealerScore = handValue;
          const finalResults: string[] = [];
          
          playerHands.forEach((pHand, index) => {
              const playerValue = getBestScore(calculateHandValue(pHand));
              const playerLabel = index === humanPlayerPosition ? "Vous" : `Bot ${index + 1}`;
              const isHuman = index === humanPlayerPosition;

              if (playerValue > 21) {
                  finalResults.push(`${playerLabel} : Bust !`);
                  if (isHuman) setResults(prev => [...prev, "Vous perdez votre mise."]);
              } else if (dealerScore > 21 || playerValue > dealerScore) {
                   finalResults.push(`${playerLabel} : Gagné !`);
                   if (isHuman) {
                       const isBlackjack = playerValue === 21 && pHand.length === 2;
                       const winnings = isBlackjack ? lastBet * 1.5 : lastBet;
                       const totalPayout = winnings + (isDoubled ? lastBet * 2 : lastBet);
                       setBalance(prev => prev + totalPayout);
                       setResults(prev => [...prev, `Vous gagnez ${isDoubled ? winnings*2 : winnings} !`]);
                   }
              } else if (playerValue < dealerScore) {
                  finalResults.push(`${playerLabel} : Perdu.`);
                  if (isHuman) setResults(prev => [...prev, "Vous perdez votre mise."]);
              } else {
                  finalResults.push(`${playerLabel} : Égalité.`);
                   if (isHuman) {
                       setBalance(prev => prev + lastBet);
                       setResults(prev => [...prev, "Mise remboursée."]);
                   }
              }
          });
          
          setResults(prev => [...finalResults.reverse(), ...prev]);
          setGameState("game-over");
        }
      };
      
      setTimeout(dealerPlay, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, dealCard, humanPlayerPosition, playerHands, lastBet, isDoubled]);
  
  if (!isClient) {
    return null;
  }

  const playerGridClass = cn(
    "grid gap-4 md:gap-8 w-full transition-all duration-500",
    {
        "grid-cols-1 md:grid-cols-1 lg:grid-cols-1": numPlayers <= 2,
        "grid-cols-2 md:grid-cols-3 lg:grid-cols-3": numPlayers === 3,
        "grid-cols-2 md:grid-cols-2 lg:grid-cols-4": numPlayers === 4,
    }
  );

  const MainContent = () => {
    if (gameState === "betting") {
        return (
            <div className="flex flex-col items-center justify-center text-center">
                <h2 className="text-3xl font-bold text-primary mb-2">Placez votre mise</h2>
                <p className="text-muted-foreground mb-6">Solde actuel : <span className="font-bold text-foreground">{balance} $</span></p>

                <div className="bg-card/80 p-6 rounded-lg shadow-lg mb-6">
                    <h3 className="text-lg text-muted-foreground mb-2">Mise actuelle</h3>
                    <p className="text-5xl font-bold text-primary">{currentBet} $</p>
                </div>
                
                <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
                    {chipValues.map(value => (
                        <Button key={value} onClick={() => addToBet(value)} variant="outline" className="rounded-full h-16 w-16 sm:h-20 sm:w-20 text-xl font-bold border-4 border-primary/50 flex flex-col">
                            {value}
                            <span className="text-xs font-normal">$</span>
                        </Button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                     <Button onClick={clearBet} variant="ghost" size="lg">
                        <Eraser className="mr-2"/>
                        Annuler
                    </Button>
                    <Button onClick={() => setCurrentBet(lastBet > 0 ? lastBet : 0)} variant="outline" size="lg" disabled={lastBet === 0 || lastBet > balance}>
                        <CircleDotDashed className="mr-2"/>
                        Miser {lastBet > 0 ? lastBet : ''}
                    </Button>
                </div>
            </div>
        );
    }

    if (gameState === 'setup' && balance <= 0) {
        return (
            <div className="text-center">
                <h2 className="text-3xl font-bold text-destructive mb-4">Partie terminée</h2>
                <p className="text-muted-foreground mb-6">Vous n'avez plus d'argent. Voulez-vous recommencer ?</p>
                <Button onClick={() => resetGame(true)} size="lg">
                    <RefreshCw className="mr-2"/>
                    Recommencer avec 1000 $
                </Button>
            </div>
        )
    }

    return (
        <>
            <Hand
              title="Main de la Banque"
              cards={dealerHand}
              score={dealerVisibleScore}
              isDealer
              isPlayerTurn={gameState !== 'game-over'}
            />

            <div className="relative h-12 sm:h-24 w-full flex items-center justify-center">
                {gameState === 'game-over' && results.length > 0 && (
                    <div className="animate-pop-in opacity-0 text-center py-2 px-4 sm:py-3 sm:px-6 rounded-lg bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/10 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                        {results.map((res, i) => <h3 key={i} className="text-md sm:text-lg font-bold text-primary">{res}</h3>)}
                    </div>
                )}
            </div>

           <div className={playerGridClass}>
            {playerHands.map((pHand, index) => (
                <Hand
                  key={index}
                  title={index === humanPlayerPosition ? `Votre Main (${isDoubled ? currentBet / 2 : currentBet}$)` : `Bot ${index + 1}`}
                  cards={pHand}
                  score={calculateHandValue(pHand)}
                  isPlayerTurn={gameState.startsWith('player') || (gameState === 'ai-turn')}
                  isActive={currentPlayerIndex === index && gameState !== 'game-over'}
                />
            ))}
           </div>
        </>
    )
  }

  return (
    <div className="flex flex-col min-h-screen items-center p-4 sm:p-6 md:p-8 font-body bg-background text-foreground">
      <header className="w-full max-w-7xl flex justify-between items-center my-4 sm:my-8 flex-shrink-0">
        <div className="text-left">
            <h1 className="text-4xl sm:text-6xl font-bold text-primary font-headline tracking-tighter uppercase">
            Blackjack Rapide
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                {gameState === 'betting' || gameState === 'game-over' || gameState === 'setup' ?
                `Solde : ${balance}$` :
                `Mise actuelle : ${currentBet}$`
                }
            </p>
        </div>
        <Button onClick={toggleTheme} variant="outline" size="icon">
            {theme === 'dark' ? <Sun className="h-[1.2rem] w-[1.2rem] text-primary" /> : <Moon className="h-[1.2rem] w-[1.2rem] text-primary" />}
            <span className="sr-only">Toggle theme</span>
        </Button>
      </header>
      
      <main className="flex flex-col items-center justify-center w-full max-w-7xl space-y-4 sm:space-y-8 flex-grow">
        <MainContent />
      </main>

      <footer className="w-full max-w-5xl my-4 sm:my-8 flex-shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row justify-center items-center md:space-x-4 p-2 sm:p-4 rounded-lg">
          {gameState === 'game-over' ? (
               <div className="col-span-full md:flex md:items-center md:gap-4 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button onClick={() => resetGame()} size="lg" variant="default" className="w-full sm:w-auto uppercase tracking-wider font-bold shadow-lg bg-primary text-primary-foreground hover:bg-primary/90">
                      <RefreshCw className="mr-2" /> Rejouer
                  </Button>
                   <Button onClick={() => resetGame(true)} size="lg" variant="outline" className="w-full sm:w-auto">
                        Changer les options & Réinitialiser
                    </Button>
               </div>
          ) : gameState === 'betting' ? (
                <div className="col-span-full md:flex md:items-center md:gap-4 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                     <Button onClick={placeBetAndStartGame} size="lg" variant="default" className="w-full sm:w-auto uppercase tracking-wider font-bold shadow-lg bg-primary text-primary-foreground hover:bg-primary/90" disabled={currentBet === 0}>
                        <BadgeDollarSign className="mr-2" /> Lancer la partie
                    </Button>
                </div>
          ) : gameState === 'setup' && balance > 0 ? (
              <div className="col-span-full md:flex md:items-center md:gap-4 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="flex items-center gap-2 text-lg">
                    <Users className="text-primary" />
                    <label htmlFor="player-count">Joueurs:</label>
                    <Select value={String(numPlayers)} onValueChange={(val) => setNumPlayers(Number(val))}>
                        <SelectTrigger className="w-24 bg-card border-border">
                            <SelectValue placeholder="Joueurs" />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                   <div className="flex items-center gap-2 text-lg">
                    <Armchair className="text-primary" />
                    <label htmlFor="player-position">Position:</label>
                    <Select value={String(humanPlayerPosition + 1)} onValueChange={(val) => setHumanPlayerPosition(Number(val) - 1)}>
                        <SelectTrigger className="w-24 bg-card border-border">
                            <SelectValue placeholder="Position" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: numPlayers }, (_, i) => i + 1).map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                   <Button onClick={() => setGameState('betting')} size="lg" variant="default" className="w-full sm:w-auto uppercase tracking-wider font-bold shadow-lg bg-primary text-primary-foreground hover:bg-primary/90">
                       Suivant
                  </Button>
              </div>
          ) : gameState === 'player-turn' && currentPlayerIndex === humanPlayerPosition ? (
            <>
              <Button onClick={handleHit} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider font-bold shadow-lg col-span-1 text-xs px-2">
                <Dices className="mr-1 sm:mr-2" /> Tirer
              </Button>
              <Button onClick={handleStand} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider font-semibold shadow-lg col-span-1 text-xs px-2">
                <Shield className="mr-1 sm:mr-2" /> Rester
              </Button>
               <Button onClick={handleDoubleDown} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider font-semibold shadow-lg col-span-1 text-xs px-2" disabled={!canDoubleDown}>
                <LucideCopy className="mr-1 sm:mr-2" /> Doubler
              </Button>
               <Button onClick={handleSplit} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider font-semibold shadow-lg col-span-1 text-xs px-2" disabled={!canSplit}>
                <LucideGitCompare className="mr-1 sm:mr-2" /> Split
              </Button>
              <Button onClick={handleStrategy} size="lg" variant="secondary" className="w-full uppercase tracking-wider font-semibold shadow-lg col-span-2 sm:col-span-1 text-xs px-2">
                  <BarChart className="mr-1 sm:mr-2" /> Stratégie
              </Button>
            </>
          ) : (
            <div className="text-center col-span-full w-full">
              <p className="text-primary text-lg animate-pulse">
                {gameState.includes('turn') ? `Tour du ${currentPlayerIndex === humanPlayerPosition ? 'Joueur' : `Bot ${currentPlayerIndex + 1}`}...` : ''}
              </p>
            </div>
          )}
        </div>
      </footer>
      <AlertDialog open={showStrategyModal} onOpenChange={setShowStrategyModal}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-primary">Stratégie de base</AlertDialogTitle>
                  <AlertDialogDescription>
                      Selon la stratégie de base du Blackjack, le meilleur coup pour votre main actuelle contre la carte visible de la banque est de :
                      <strong className="block text-center text-lg text-primary mt-4">
                          {recommendedStrategy ? strategyText[recommendedStrategy] : "Calcul en cours..."}
                      </strong>
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <Button onClick={() => setShowStrategyModal(false)}>Compris</Button>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
