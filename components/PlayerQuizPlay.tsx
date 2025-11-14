import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PlayerQuizQuestion } from '../types';
import { CheckIcon, XMarkIcon } from './icons';

interface PlayerQuizPlayProps {
  topic: string;
  questions: PlayerQuizQuestion[];
  onGameEnd: (score: number) => void;
}

const GAME_DURATION = 60;

const PlayerQuizPlay: React.FC<PlayerQuizPlayProps> = ({ topic, questions, onGameEnd }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      onGameEnd(score);
    }
  }, [timeLeft, score, onGameEnd]);

  useEffect(() => {
    if (questions.length > 0 && !isPaused && !isAnswered) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [questions.length, isPaused, isAnswered]);
  
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      onGameEnd(score);
    }
  }, [currentQuestionIndex, questions.length, onGameEnd, score]);

  useEffect(() => {
    if (isAnswered) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        const nextQuestionTimer = setTimeout(() => {
            handleNextQuestion();
        }, 1200);
        return () => clearTimeout(nextQuestionTimer);
    }
  }, [isAnswered, handleNextQuestion]);

  const handleAnswerSelect = (optionText: string) => {
    if (isAnswered || isPaused) return;
    
    setSelectedAnswer(optionText);
    if (optionText === questions[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
    setIsAnswered(true);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const getButtonClass = (optionText: string) => {
    if (!isAnswered) {
      return 'bg-gray-800 hover:bg-gray-700 border-gray-700';
    }
    if (optionText === currentQuestion.correctAnswer) {
      return 'bg-green-800/50 border-green-500 ring-2 ring-green-500';
    }
    if (optionText === selectedAnswer) {
      return 'bg-red-800/50 border-red-500';
    }
    return 'bg-gray-800 opacity-50 border-gray-700';
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-400">Question {currentQuestionIndex + 1}/{questions.length}</div>
        <div className="text-lg font-bold text-white bg-black/30 px-3 py-1 rounded-full">{timeLeft}s</div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
        <div className="bg-white h-2 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex-grow flex flex-col items-center text-center">
        <div className="w-full h-48 md:h-64 bg-black/50 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
            <img src={currentQuestion.image} alt="Football Player" className="w-full h-full object-cover"/>
        </div>

        <h3 className="text-xl font-semibold text-white mb-6">Who is this player?</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {currentQuestion.options.map((option, index) => (
            <button
              key={`${option}-${index}`}
              onClick={() => handleAnswerSelect(option)}
              disabled={isAnswered || isPaused}
              className={`rounded-lg text-left text-sm font-medium transition-all duration-300 border p-4 flex items-center justify-between ${getButtonClass(option)}`}
            >
              <span>{option}</span>
                {isAnswered && option === currentQuestion.correctAnswer && <CheckIcon className="w-5 h-5 text-white" />}
                {isAnswered && option === selectedAnswer && option !== currentQuestion.correctAnswer && <XMarkIcon className="w-5 h-5 text-white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerQuizPlay;