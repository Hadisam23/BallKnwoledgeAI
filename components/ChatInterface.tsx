import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { runChatStream } from '../services/geminiService';
import { SendIcon, UserIcon, BotIcon, ThumbsUpIcon, ThumbsDownIcon } from './icons';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const savedMessages = localStorage.getItem('chatHistory');
      if (savedMessages) {
        return JSON.parse(savedMessages).map((msg: any, index: number) => ({
          ...msg,
          id: msg.id || `msg-${index}-${Date.now()}`
        }));
      }
      return [
        { id: `initial-${Date.now()}`, role: 'model', text: "Hello! The AI engine is ready. I'm your AI Sports Agent. Ask me anything about sports!" },
      ];
    } catch (error) {
      console.error("Could not load chat history:", error);
      return [{ id: `initial-${Date.now()}`, role: 'model', text: "Hello! The AI engine is ready. I'm your AI Sports Agent. Ask me anything about sports!" }];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    } catch (error) {
      console.error("Could not save chat history:", error);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  const handleFeedback = (messageId: string, feedback: 'up' | 'down') => {
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          // Toggle feedback: if same button is clicked again, remove feedback.
          const newFeedback = msg.feedback === feedback ? null : feedback;
          return { ...msg, feedback: newFeedback };
        }
        return msg;
      })
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // FIX: The `runChatStream` function expects an array of `ChatMessage` objects which include the `id`.
      // The previous implementation was incorrectly stripping the `id` property.
      const stream = runChatStream(input, newMessages.slice(0, -1));
      
      const modelMessage: ChatMessage = { id: `model-${Date.now()}`, role: 'model', text: '' };
      setMessages(prev => [...prev, modelMessage]);

      for await (const chunk of stream) {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.role === 'model') {
            const updatedMessages = [...prev];
            updatedMessages[prev.length - 1] = { ...lastMsg, text: lastMsg.text + chunk };
            return updatedMessages;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error from Gemini API stream:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        text: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 flex-shrink-0 bg-gray-700 text-white rounded-full flex items-center justify-center">
                    <BotIcon className="w-5 h-5"/>
                </div>
              )}
              
              <div className="flex flex-col items-start gap-1">
                <div className={`max-w-xl p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-white text-black rounded-br-none'
                    : 'bg-gray-800 text-white rounded-bl-none'
                }`}>
                  {msg.text}
                  {isLoading && index === messages.length - 1 && msg.role === 'model' && (
                      <span className="inline-block w-2 h-4 bg-white/70 ml-1 animate-pulse" />
                  )}
                </div>
                
                {msg.role === 'model' && msg.text && (!isLoading || index !== messages.length - 1) && (
                  <div className="flex items-center gap-2 pl-1">
                    <button onClick={() => handleFeedback(msg.id, 'up')} className={`p-1 rounded-full transition-colors ${msg.feedback === 'up' ? 'text-green-400 bg-green-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'}`}>
                        <ThumbsUpIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleFeedback(msg.id, 'down')} className={`p-1 rounded-full transition-colors ${msg.feedback === 'down' ? 'text-red-400 bg-red-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'}`}>
                        <ThumbsDownIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 flex-shrink-0 bg-gray-300 text-black rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5"/>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSend} className="mt-4 flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about sports..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="gradient-button"
          style={{padding: '0.8em'}}
        >
          <SendIcon className="w-5 h-5" style={{margin: 0}}/>
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;