
import React, { useState } from 'react';
import type { LeaderboardEntry, GameType, QuizQuestion, PlayerQuizQuestion } from '../types';
import { TrophyIcon, GameControllerIcon, AIIcon, SendIcon, LinkIcon, XMarkIcon } from './icons';

interface Challenger {
  name: string;
  score: number;
}

interface GameResultsProps {
  score: number;
  topic: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
  gameType: GameType | null;
  questions: (QuizQuestion | PlayerQuizQuestion)[];
  challenger: Challenger | null;
}

const ChallengeModal: React.FC<{ link: string; onClose: () => void }> = ({ link, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Challenge a Friend</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <p className="text-sm text-gray-400 mb-4">Share this link with a friend. They'll play the same quiz, and you can compare scores!</p>
                <div className="flex gap-2">
                    <input type="text" readOnly value={link} className="flex-1 bg-gray-800 border border-gray-700 rounded-full py-2 px-4 text-sm text-gray-300"/>
                    <button onClick={handleCopy} className="gradient-button whitespace-nowrap !text-sm !py-2 !px-4">
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const GameResults: React.FC<GameResultsProps> = ({ score, topic, onPlayAgain, onGoHome, gameType, questions, challenger }) => {
  const [playerName, setPlayerName] = useState('');
  const [isScoreSaved, setIsScoreSaved] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const totalQuestions = 10;
  const percentage = gameType !== 'fastestFinger' ? Math.round((score / totalQuestions) * 100) : 100;

  const getResultMessage = () => {
    if (challenger) {
        if (score > challenger.score) return `Congratulations! You beat ${challenger.name}!`;
        if (score < challenger.score) return `So close! ${challenger.name} won this time.`;
        return `It's a tie! What a match!`;
    }
    if (gameType === 'fastestFinger') {
      if (score > 10000) return "Incredible Speed! A true champion!";
      if (score > 5000) return "Excellent Job! You're fast and accurate.";
      return "Good try! Keep practicing to improve your speed.";
    }
    if (percentage === 100) return "Perfect Score! You're a true expert!";
    if (percentage >= 80) return "Excellent Job! You really know your stuff.";
    if (percentage >= 50) return "Well Done! A solid performance.";
    return "Good try! Keep learning and try again.";
  };

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isScoreSaved) return;

    const newEntry: LeaderboardEntry = {
      name: playerName.trim(),
      score,
      topic,
      date: new Date().toISOString(),
      gameMode: gameType || 'trivia',
    };

    try {
      const savedLeaderboard = localStorage.getItem('quizLeaderboard');
      const leaderboard = savedLeaderboard ? JSON.parse(savedLeaderboard) : [];
      leaderboard.push(newEntry);
      localStorage.setItem('quizLeaderboard', JSON.stringify(leaderboard));
      setIsScoreSaved(true);
    } catch (error) {
      console.error("Failed to save score:", error);
    }
  };
  
  const handleChallenge = () => {
    if (!playerName.trim() && !isScoreSaved) {
        alert("Please save your score first to set your name for the challenge!");
        return;
    }
    setShowChallengeModal(true);
  };
  
  const generateChallengeLink = () => {
      const challengeData = {
          gameType,
          topic,
          questions,
          challenger: {
              name: playerName.trim(),
              score: score,
          }
      };
      const encoded = btoa(JSON.stringify(challengeData));
      return `${window.location.origin}${window.location.pathname}?challenge=${encoded}`;
  };

  return (
    <>
      {showChallengeModal && <ChallengeModal link={generateChallengeLink()} onClose={() => setShowChallengeModal(false)} />}
      <div className="flex flex-col items-center justify-center h-full text-center">
        <TrophyIcon className="w-16 h-16 text-white mb-4" />
        <h2 className="text-2xl font-bold text-white">{challenger ? 'Challenge Complete!' : 'Quiz Complete!'}</h2>
        <p className="text-gray-400 mt-2">{getResultMessage()}</p>
        
        <div className="my-6 flex flex-wrap justify-center gap-x-8 gap-y-4">
            <div>
                <p className="text-sm text-gray-500">Your Score for "{topic}"</p>
                {gameType === 'fastestFinger' ? (
                <p className="text-5xl font-bold text-white">{score.toLocaleString()}<span className="text-2xl text-gray-400"> points</span></p>
                ) : (
                <p className="text-5xl font-bold text-white">{score}<span className="text-3xl text-gray-400">/{totalQuestions}</span></p>
                )}
            </div>
            {challenger && (
                <div>
                    <p className="text-sm text-gray-500">{challenger.name}'s Score</p>
                    {gameType === 'fastestFinger' ? (
                    <p className="text-5xl font-bold text-white">{challenger.score.toLocaleString()}<span className="text-2xl text-gray-400"> points</span></p>
                    ) : (
                    <p className="text-5xl font-bold text-white">{challenger.score}<span className="text-3xl text-gray-400">/{totalQuestions}</span></p>
                    )}
                </div>
            )}
        </div>

        {!challenger && (
            !isScoreSaved ? (
                <form onSubmit={handleSaveScore} className="w-full max-w-xs flex flex-col gap-3 mb-4">
                <p className="text-sm text-gray-300">Enter your name to save your score:</p>
                <div className="flex gap-2">
                    <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Your Name"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    maxLength={15}
                    />
                    <button type="submit" disabled={!playerName.trim()} className="gradient-button" style={{padding: '0.6em'}}>
                    <SendIcon className="w-5 h-5" style={{margin: 0}}/>
                    </button>
                </div>
                </form>
            ) : (
                <p className="text-green-400 text-sm mb-4">Your score has been saved as {playerName}!</p>
            )
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          {!challenger && (
            <button 
              onClick={handleChallenge}
              disabled={!isScoreSaved}
              className="gradient-button w-full"
            >
              <LinkIcon/>
              <span>Challenge a Friend</span>
            </button>
          )}
          <button 
            onClick={onPlayAgain}
            className="gradient-button w-full"
          >
            <GameControllerIcon/>
            <span>Play Again</span>
          </button>
          <button 
            onClick={onGoHome}
            className="gradient-button w-full"
          >
            <GameControllerIcon/>
            <span>Games Menu</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default GameResults;
