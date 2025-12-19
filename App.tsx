
import React, { useState, useCallback, useEffect } from 'react';
import { GameState, SectorLore } from './types';
import GameCanvas from './components/GameCanvas';
import { getSectorLore } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [sectorLore, setSectorLore] = useState<SectorLore | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [isLoadingLore, setIsLoadingLore] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('nebula_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const startGame = () => {
    setScore(0);
    setDifficulty(1);
    setGameState(GameState.PLAYING);
    setSectorLore(null);
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('nebula_highscore', finalScore.toString());
    }
    setGameState(GameState.GAME_OVER);
  };

  const handleSectorComplete = async (currentScore: number) => {
    setScore(currentScore);
    setGameState(GameState.SECTOR_BREAK);
    setIsLoadingLore(true);
    
    const lore = await getSectorLore(currentScore);
    setSectorLore(lore);
    setIsLoadingLore(false);
    setDifficulty(prev => prev + 0.2);
  };

  const resumeGame = () => {
    setGameState(GameState.PLAYING);
    setSectorLore(null);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden text-white bg-slate-950">
      <GameCanvas 
        gameState={gameState} 
        onGameOver={handleGameOver} 
        onSectorComplete={handleSectorComplete}
        difficultyMultiplier={difficulty}
      />

      {/* Score HUD */}
      {gameState === GameState.PLAYING && (
        <div className="fixed top-6 left-6 z-10 flex flex-col gap-1 pointer-events-none">
          <div className="text-sky-400 font-orbitron text-sm tracking-widest uppercase">Distance</div>
          <div className="text-4xl font-orbitron font-bold drop-shadow-md">{score} LY</div>
          <div className="text-xs text-slate-400 mt-2">Hazard: {Math.round(difficulty * 100)}%</div>
        </div>
      )}

      {/* Main Menu Overlay */}
      {gameState === GameState.MENU && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center p-8 bg-slate-900/80 border border-sky-500/30 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <h1 className="text-6xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500 mb-2">NEBULA</h1>
            <p className="text-xl font-orbitron text-sky-200 mb-8 tracking-[0.3em]">VOYAGER</p>
            <div className="space-y-4 mb-8 text-slate-300 text-sm">
              <p>Move your mouse or finger to pilot the ship.</p>
              <p>Dodge asteroids and survive as long as possible.</p>
            </div>
            {highScore > 0 && (
              <p className="mb-8 text-sky-400 font-semibold uppercase tracking-widest text-xs">Personal Best: {highScore} LY</p>
            )}
            <button 
              onClick={startGame}
              className="w-full py-4 bg-sky-600 hover:bg-sky-500 transition-colors rounded-xl font-orbitron font-bold text-lg shadow-lg shadow-sky-900/40"
            >
              INITIATE JUMP
            </button>
          </div>
        </div>
      )}

      {/* Sector Break Overlay (AI Content) */}
      {gameState === GameState.SECTOR_BREAK && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="max-w-xl w-full mx-4 p-8 bg-slate-900 border border-sky-500/50 rounded-2xl">
            <h2 className="text-xs font-orbitron text-sky-400 tracking-[0.4em] uppercase mb-4 text-center">New Sector Discovered</h2>
            
            {isLoadingLore ? (
              <div className="flex flex-col items-center py-12">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-orbitron text-slate-400 text-sm animate-pulse">SCANNING DEEP SPACE...</p>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-4xl font-orbitron font-bold mb-4">{sectorLore?.name}</h3>
                <div className="inline-block px-3 py-1 bg-red-950/50 border border-red-500/30 text-red-400 text-xs font-bold rounded mb-6 tracking-widest uppercase">
                  HAZARD: {sectorLore?.hazardLevel}
                </div>
                <p className="text-slate-300 text-lg leading-relaxed italic mb-10">
                  "{sectorLore?.description}"
                </p>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={resumeGame}
                    className="w-full py-4 bg-sky-600 hover:bg-sky-500 transition-colors rounded-xl font-orbitron font-bold shadow-lg"
                  >
                    CONTINUE FLIGHT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === GameState.GAME_OVER && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-red-950/30 backdrop-blur-sm">
          <div className="text-center p-8 bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            <h2 className="text-4xl font-orbitron font-bold text-red-500 mb-2">SYSTEM FAILURE</h2>
            <p className="text-slate-400 text-sm mb-8 uppercase tracking-widest">Ship Destroyed in Deep Space</p>
            
            <div className="bg-slate-950/50 rounded-lg p-4 mb-8">
              <div className="text-slate-500 text-xs uppercase mb-1">Total Distance</div>
              <div className="text-4xl font-orbitron font-bold text-white">{score} LY</div>
            </div>

            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-bold mb-8 animate-bounce">NEW GALACTIC RECORD!</p>
            )}

            <button 
              onClick={startGame}
              className="w-full py-4 bg-slate-100 text-slate-900 hover:bg-white transition-colors rounded-xl font-orbitron font-bold"
            >
              RESTART MISSION
            </button>
            <button 
              onClick={() => setGameState(GameState.MENU)}
              className="w-full mt-4 py-3 text-slate-400 hover:text-white transition-colors text-sm uppercase tracking-widest font-semibold"
            >
              Return to Base
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
