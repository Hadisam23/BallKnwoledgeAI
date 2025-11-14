
import React, { useState, useEffect, useRef } from 'react';
import type { GameStatus, LeaderboardEntry, GameType, QuizQuestion, PlayerQuizQuestion } from '../types';
import { generateQuizQuestions, generatePlayerQuizQuestions } from '../services/geminiService';
import GamePlay from './GamePlay';
import GameResults from './GameResults';
import PlayerQuizPlay from './PlayerQuizPlay';
import FastestFingerPlay from './FastestFingerPlay';
import { GameControllerIcon, TrophyIcon, ChevronDownIcon, PhotoIcon, BoltIcon, SpinnerIcon, UKFlagIcon, StarIcon, GermanyFlagIcon, SpainFlagIcon } from './icons';

interface GamesHomeProps {
    challengeData?: any;
    setChallengeData?: (data: any | null) => void;
}

interface Challenger {
    name: string;
    score: number;
}

const leagueOptions = [
    { value: 'Premier League', label: 'Premier League', icon: <UKFlagIcon className="w-5 h-5 rounded-sm" /> },
    { value: 'Champions League', label: 'Champions League', icon: <StarIcon className="w-5 h-5 text-yellow-400" /> },
    { value: 'Bundesliga', label: 'Bundesliga', icon: <GermanyFlagIcon className="w-5 h-5 rounded-sm" /> },
    { value: 'La Liga', label: 'La Liga', icon: <SpainFlagIcon className="w-5 h-5 rounded-sm" /> },
];

const GamesHome: React.FC<GamesHomeProps> = ({ challengeData, setChallengeData }) => {
  const [gameStatus, setGameStatus] = useState<GameStatus | 'idle'>('idle');
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [topic, setTopic] = useState('Premier League');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  const [questions, setQuestions] = useState<(QuizQuestion | PlayerQuizQuestion)[]>([]);
  const [lastScore, setLastScore] = useState(0);
  const [challenger, setChallenger] = useState<Challenger | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This effect runs when returning to the home screen to refresh the leaderboard
    if (gameStatus === 'idle') {
      try {
        const savedLeaderboard = localStorage.getItem('quizLeaderboard');
        if (savedLeaderboard) {
          const parsed = JSON.parse(savedLeaderboard) as LeaderboardEntry[];
          parsed.sort((a, b) => b.score - a.score);
          setLeaderboard(parsed.slice(0, 5));
        }
      } catch (e) {
        console.error("Could not load leaderboard:", e);
      }
    }
  }, [gameStatus]);

  useEffect(() => {
    // This effect handles incoming challenges from a URL
    if (challengeData && setChallengeData) {
        setGameType(challengeData.gameType);
        setTopic(challengeData.topic);
        setQuestions(challengeData.questions);
        setChallenger(challengeData.challenger);
        setGameStatus('playing');
        
        // Clear challenge data and URL to prevent re-triggering on refresh
        setChallengeData(null);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [challengeData, setChallengeData]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartGame = async (type: GameType) => {
    if (!topic.trim()) return;
    setError(null);
    setChallenger(null);
    setGameType(type);
    setGameStatus('loading');
    
    try {
        let fetchedQuestions;
        if (type === 'player') {
            fetchedQuestions = await generatePlayerQuizQuestions(topic);
        } else {
            fetchedQuestions = await generateQuizQuestions(topic);
        }
        setQuestions(fetchedQuestions);
        setGameStatus('playing');
    } catch (e: any) {
        console.error("Failed to start game:", e);
        setError(e.message || "Could not start the game. Please try again.");
        setGameStatus('idle');
    }
  };
  
  const handleGameEnd = (score: number) => {
    setLastScore(score);
    setGameStatus('finished');
  };

  const handleGoHome = () => {
    setGameStatus('idle');
    setGameType(null);
    setError(null);
    setChallenger(null);
  }

  const handlePlayAgain = () => {
      if (gameType) {
          handleStartGame(gameType);
      } else {
          handleGoHome();
      }
  }

  if (gameStatus === 'loading') {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <SpinnerIcon className="w-8 h-8 text-white" />
            <p className="mt-4 text-gray-400">Generating your quiz on "{topic}"...</p>
        </div>
    );
  }

  if (gameStatus === 'playing' && questions.length > 0) {
    if (gameType === 'player') {
        return <PlayerQuizPlay topic={topic} questions={questions as PlayerQuizQuestion[]} onGameEnd={handleGameEnd} />;
    }
    if (gameType === 'fastestFinger') {
        return <FastestFingerPlay topic={topic} questions={questions as QuizQuestion[]} onGameEnd={handleGameEnd} />;
    }
    return <GamePlay topic={topic} questions={questions as QuizQuestion[]} onGameEnd={handleGameEnd} />;
  }

  if (gameStatus === 'finished') {
    return <GameResults 
        score={lastScore} 
        topic={topic} 
        onPlayAgain={handlePlayAgain} 
        onGoHome={handleGoHome} 
        gameType={gameType}
        questions={questions}
        challenger={challenger}
    />;
  }

  const selectedLeague = leagueOptions.find(opt => opt.value === topic) || leagueOptions[0];

  return (
    <div className="flex flex-col h-full">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Sports Quiz Challenge</h2>
            <p className="text-gray-400 mb-6">Test your knowledge with AI-powered quizzes.</p>
        </div>

        {error && <p className="text-red-400 mb-4 text-sm text-center">{error}</p>}

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-sm font-medium text-gray-300">Choose your topic:</span>
                <div className="relative w-full sm:w-64" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm flex items-center justify-between"
                        aria-haspopup="listbox"
                        aria-expanded={isDropdownOpen}
                    >
                        <div className="flex items-center gap-3">
                            {selectedLeague.icon}
                            <span className="truncate">{selectedLeague.label}</span>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden" role="listbox">
                            {leagueOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setTopic(option.value);
                                        setIsDropdownOpen(false);
                                    }}
                                    className="w-full text-left text-sm flex items-center gap-3 px-4 py-3 hover:bg-purple-600/20 transition-colors"
                                    role="option"
                                    aria-selected={topic === option.value}
                                >
                                    {option.icon}
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-black/30 p-4 rounded-lg flex flex-col items-center text-center">
                    <h3 className="font-semibold text-white mb-2">Trivia Quiz</h3>
                    <p className="text-gray-400 text-xs flex-grow mb-4">Tough multiple-choice questions.</p>
                    <button onClick={() => handleStartGame('trivia')} disabled={!topic.trim()} className="gradient-button !rounded-full !p-3" aria-label="Start Trivia">
                        <GameControllerIcon className="w-6 h-6" style={{margin: 0}}/>
                    </button>
                </div>
                
                <div className="bg-black/30 p-4 rounded-lg flex flex-col items-center text-center">
                    <h3 className="font-semibold text-white mb-2">Guess The Player</h3>
                    <p className="text-gray-400 text-xs flex-grow mb-4">Identify players from AI images.</p>
                    <button onClick={() => handleStartGame('player')} disabled={!topic.trim()} className="gradient-button !rounded-full !p-3" aria-label="Start Guessing">
                        <PhotoIcon className="w-6 h-6" style={{margin: 0}}/>
                    </button>
                </div>

                <div className="bg-black/30 p-4 rounded-lg flex flex-col items-center text-center">
                    <h3 className="font-semibold text-white mb-2">Fastest Finger</h3>
                    <p className="text-gray-400 text-xs flex-grow mb-4">Race against the clock for points.</p>
                    <button onClick={() => handleStartGame('fastestFinger')} disabled={!topic.trim()} className="gradient-button !rounded-full !p-3" aria-label="Start Race">
                        <BoltIcon className="w-6 h-6" style={{margin: 0}}/>
                    </button>
                </div>
            </div>
        </div>
      
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <div className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="font-semibold text-lg text-white mb-4 flex items-center justify-center gap-2"><TrophyIcon className="w-5 h-5"/> Leaderboard</h3>
                {leaderboard.length > 0 ? (
                    <ul className="space-y-2 text-left">
                    {leaderboard.map((entry, index) => (
                        <li key={index} className="flex justify-between items-center text-sm bg-black/30 p-2 rounded">
                        <div className="flex items-baseline truncate">
                            <span className="font-semibold text-white truncate">{index + 1}. {entry.name}</span>
                            <span className="text-gray-400 text-xs truncate ml-2">({entry.topic} - {entry.gameMode})</span>
                        </div>
                        <span className="font-bold text-white">{entry.gameMode === 'fastestFinger' ? entry.score.toLocaleString() : `${entry.score}/10`}</span>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-sm text-center mt-8">No scores yet. Be the first to play!</p>
                )}
            </div>
        </div>
    </div>
  );
};

export default GamesHome;