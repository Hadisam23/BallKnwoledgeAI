import React from 'react';
import type { View } from '../App';
import { BotIcon, GameControllerIcon } from './icons';

interface HomeProps {
  setView: (view: View) => void;
}

const Home: React.FC<HomeProps> = ({ setView }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-4xl font-bold text-white mb-2">Welcome to BallKnowledgeAI</h1>
      <p className="text-lg text-gray-400 mb-12">Your All-in-One AI Sports Companion</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        {/* Chat Agent Card */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 flex flex-col items-center hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all">
          <BotIcon className="w-12 h-12 text-white mb-4" />
          <h3 className="font-semibold text-lg text-white mb-2">Chat Agent</h3>
          <p className="text-gray-400 text-sm mb-6 flex-grow">Ask me anything about sports stats, history, or rules. I have access to a vast knowledge base.</p>
          <button onClick={() => setView('chat')} className="gradient-button w-full">
            <BotIcon />
            <span>Start Chat</span>
          </button>
        </div>

        {/* Games Card */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 flex flex-col items-center hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all">
          <GameControllerIcon className="w-12 h-12 text-white mb-4" />
          <h3 className="font-semibold text-lg text-white mb-2">Quiz Challenge</h3>
          <p className="text-gray-400 text-sm mb-6 flex-grow">Test your sports knowledge with our AI-generated quizzes. Can you beat the clock?</p>
          <button onClick={() => setView('games')} className="gradient-button w-full">
            <GameControllerIcon />
            <span>Play Games</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;