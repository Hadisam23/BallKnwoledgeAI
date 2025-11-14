import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { QuizQuestion } from '../types';
import { CheckIcon, XMarkIcon } from './icons';

interface FastestFingerPlayProps {
  topic: string;
  questions: QuizQuestion[];
  onGameEnd: (score: number) => void;
}

const PER_QUESTION_TIME = 10;
const POINTS_MULTIPLIER = 100;

const FastestFingerPlay: React.FC<FastestFingerPlayProps> = ({ topic, questions, onGameEnd }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PER_QUESTION_TIME);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(PER_QUESTION_TIME);
    } else {
      onGameEnd(score);
    }
  }, [currentQuestionIndex, questions.length, onGameEnd, score]);

  useEffect(() => {
    if (questions.length > 0 && !isAnswered) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsAnswered(true); // Times up
            setSelectedAnswer(null); // No answer selected
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [questions.length, isAnswered, currentQuestionIndex]);

  useEffect(() => {
    if (isAnswered) {
        if (timerRef.current) clearInterval(timerRef.current);
        const nextQuestionTimer = setTimeout(() => {
            handleNextQuestion();
        }, 1200);
        return () => clearTimeout(nextQuestionTimer);
    }
  }, [isAnswered, handleNextQuestion]);

  const handleAnswerSelect = (optionText: string) => {
    if (isAnswered) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(optionText);
    if (optionText === questions[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + (timeLeft * POINTS_MULTIPLIER));
    }
    setIsAnswered(true);
  };
  
  const currentQuestion = questions[currentQuestionIndex];
  const timerProgress = (timeLeft / PER_QUESTION_TIME) * 100;

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
        <div className="text-lg font-bold text-white bg-black/30 px-3 py-1 rounded-full">{score.toLocaleString()}</div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4">
        <div className={`h-2.5 rounded-full transition-all duration-1000 linear ${timerProgress > 50 ? 'bg-green-500' : timerProgress > 25 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${timerProgress}%` }}></div>
      </div>

      <div className="flex-grow flex flex-col items-center text-center">
        <h3 className="text-xl font-semibold text-white mb-6">{currentQuestion.question}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {currentQuestion.options.map((option, index) => (
            <button
              key={option.answerText + index}
              onClick={() => handleAnswerSelect(option.answerText)}
              disabled={isAnswered}
              className={`rounded-lg text-left text-sm font-medium transition-all duration-300 border p-4 flex items-center justify-between ${getButtonClass(option.answerText)}`}
            >
              <span>{option.answerText}</span>
                {isAnswered && option.answerText === currentQuestion.correctAnswer && <CheckIcon className="w-5 h-5 text-white" />}
                {isAnswered && option.answerText === selectedAnswer && option.answerText !== currentQuestion.correctAnswer && <XMarkIcon className="w-5 h-5 text-white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FastestFingerPlay;