
import React, { useState, useEffect } from 'react';
import type { PipelineStep as PipelineStepType } from './types';
import { PipelineStepStatus } from './types';
import PipelineStepComponent from './components/PipelineStep';
import ChatInterface from './components/ChatInterface';
import GamesHome from './components/GamesHome';
import Home from './components/Home';
import { AIIcon, ChevronLeftIcon } from './components/icons';

const initialSteps: PipelineStepType[] = [
  { id: 1, text: "Loading Sports Dataset...", status: PipelineStepStatus.PENDING },
  { id: 2, text: "Building Guardrails...", status: PipelineStepStatus.PENDING },
  { id: 3, text: "Generating Synthetic Q&A Data...", status: PipelineStepStatus.PENDING },
  { id: 4, text: "Creating Vector Index with Embedders...", status: PipelineStepStatus.PENDING },
  { id: 5, text: "Deploying Pipeline...", status: PipelineStepStatus.PENDING },
];

export type View = 'pipeline' | 'home' | 'chat' | 'games';

// Helper to determine the initial view based on URL parameters
const getInitialView = (): View => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('challenge') ? 'games' : 'pipeline';
  } catch (e) {
    return 'pipeline';
  }
};

const App: React.FC = () => {
  const [steps, setSteps] = useState<PipelineStepType[]>(initialSteps);
  const [view, setView] = useState<View>(getInitialView());
  const [challengeData, setChallengeData] = useState<any | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const challengeParam = urlParams.get('challenge');
    if (challengeParam) {
        try {
            const decodedString = atob(challengeParam);
            return JSON.parse(decodedString);
        } catch (error) {
            console.error("Failed to parse challenge data from URL:", error);
            // Clear invalid params
            window.history.replaceState({}, document.title, window.location.pathname);
            return null;
        }
    }
    return null;
  });


  useEffect(() => {
    if (view === 'pipeline') {
      const runSimulation = async () => {
        for (let i = 0; i < steps.length; i++) {
          setSteps(prevSteps => prevSteps.map(step =>
            step.id === i + 1 ? { ...step, status: PipelineStepStatus.RUNNING } : step
          ));
          await new Promise(resolve => setTimeout(resolve, 800));
          setSteps(prevSteps => prevSteps.map(step =>
            step.id === i + 1 ? { ...step, status: PipelineStepStatus.COMPLETED } : step
          ));
        }
        setTimeout(() => setView('home'), 500);
      };
      runSimulation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const renderPipeline = () => (
    <div className="min-h-screen bg-black font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-white/5 overflow-hidden relative p-6">
            <div className="flex flex-col gap-4 w-full">
                <p className="text-center text-gray-400 mb-4">Initializing AI engine...</p>
                {steps.map(step => (
                    <PipelineStepComponent key={step.id} text={step.text} status={step.status} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(view) {
      case 'home':
        return <Home setView={setView} />;
      case 'chat':
        return <ChatInterface />;
      case 'games':
        return <GamesHome challengeData={challengeData} setChallengeData={setChallengeData} />;
      default:
        return <Home setView={setView} />;
    }
  }

  if (view === 'pipeline') {
    return renderPipeline();
  }

  return (
    <div className="min-h-screen bg-black font-sans flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-4xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-white/5 overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {/* FIX: The check `view !== 'pipeline'` is redundant because the 'pipeline' view is handled by an earlier return statement, which narrows the type of `view` and causes a TS error. */}
                {(view !== 'home') && (
                    <button 
                        onClick={() => setView('home')} 
                        className="p-2 rounded-full hover:bg-gray-700 transition-colors -ml-2"
                        aria-label="Back to home"
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-gray-300" />
                    </button>
                )}
                <button onClick={() => setView('home')} className="flex items-center gap-3 group">
                  <AIIcon className="w-8 h-8 text-white group-hover:text-purple-400 transition-colors"/>
                  <h1 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">BallKnowledgeAI</h1>
                </button>
            </div>
          </div>
          
          <div className="p-6 h-[75vh] max-h-[800px] flex flex-col">
            {renderContent()}
          </div>

        </div>
        <footer className="text-center mt-6 text-gray-500 text-sm">
            <p>Powered by Gemini.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;