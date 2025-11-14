
import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import type { ChatMessage, QuizQuestion, PlayerQuizQuestion } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const systemInstruction = "You are an expert AI assistant specializing in sports. Your knowledge comes from a comprehensive, up-to-date sports dataset. Your name is 'BallKnowledgeAI'. Answer user questions accurately and concisely based on your specialized knowledge base. Do not mention that you are a language model.";

let chat: Chat | null = null;

const getChat = (history: ChatMessage[]) => {
  if (!chat) {
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });
  }
  return chat;
}

export async function* runChatStream(prompt: string, history: ChatMessage[]): AsyncGenerator<string> {
  if (!API_KEY) {
    yield "API Key is not configured. Please check your environment variables.";
    return;
  }
  
  try {
    const chatInstance = getChat(history);
    const responseStream = await chatInstance.sendMessageStream({ message: prompt });
    for await (const chunk of responseStream) {
      yield chunk.text;
    }
  } catch (error) {
    console.error('Gemini API stream failed:', error);
    yield "There was an error communicating with the AI. Please try again later.";
  }
}

const quizQuestionSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            description: "A list of 10 quiz questions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: {
                        type: Type.STRING,
                        description: "The question text."
                    },
                    options: {
                        type: Type.ARRAY,
                        description: "An array of exactly 4 possible answers.",
                        items: { 
                            type: Type.OBJECT,
                            properties: {
                                answerText: { type: Type.STRING, description: "The answer text (e.g., player's name)." },
                            },
                            required: ["answerText"]
                        }
                    },
                    correctAnswer: {
                        type: Type.STRING,
                        description: "The correct answer, which must match one of the 'answerText' values from the 'options' array."
                    }
                },
                required: ["question", "options", "correctAnswer"]
            }
        }
    },
    required: ["questions"]
};


export const generateQuizQuestions = async (topic: string): Promise<QuizQuestion[]> => {
    if (!API_KEY) {
        throw new Error("API Key is not configured.");
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate 10 challenging multiple-choice quiz questions about ${topic}. Each question must have exactly 4 options. For each option, provide just the answer text. Ensure the correct answer is one of the options.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizQuestionSchema,
            }
        });
        
        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);
        
        const questionsData = parsed.questions;
        if (!Array.isArray(questionsData) || questionsData.length === 0) {
            throw new Error("Invalid question format received from API.");
        }
        
        return questionsData.slice(0, 10).map((q: any, index: number) => ({ 
            ...q, 
            id: index,
        }));

    } catch (error) {
        console.error('Failed to generate quiz questions:', error);
        throw new Error("Could not generate quiz questions. Please try again later.");
    }
};

const playerQuizQuestionSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            description: "A list of 10 'guess the player' quiz questions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    options: {
                        type: Type.ARRAY,
                        description: "An array of exactly 4 possible player name answers.",
                        items: { type: Type.STRING }
                    },
                    correctAnswer: {
                        type: Type.STRING,
                        description: "The correct player's name, which must match one of the values from the 'options' array."
                    }
                },
                required: ["options", "correctAnswer"]
            }
        }
    },
    required: ["questions"]
};

export const generatePlayerQuizQuestions = async (topic: string): Promise<PlayerQuizQuestion[]> => {
    if (!API_KEY) {
        throw new Error("API Key is not configured.");
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate 10 'guess the player' multiple-choice quiz questions about famous football players from the ${topic}. For each question, provide exactly 4 player names as options. One option must be the correct player. The other three options must be plausible distractors (e.g., from the same league or of similar stature).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: playerQuizQuestionSchema,
            }
        });
        
        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);
        
        const questionsData = parsed.questions;
        if (!Array.isArray(questionsData) || questionsData.length === 0) {
            throw new Error("Invalid question format received from API.");
        }

        const questionsWithImages = await Promise.all(
            questionsData.slice(0, 10).map(async (q: any, index: number) => {
                const imagePrompt = `A high-quality, realistic photograph of the football player ${q.correctAnswer} in his team kit. The image should be a clear portrait or action shot. No text or logos should be visible on the image.`;
                const imageUrl = await generateImageFromPrompt(imagePrompt);
                return { 
                    id: index,
                    image: imageUrl,
                    options: q.options,
                    correctAnswer: q.correctAnswer
                };
            })
        );
        
        return questionsWithImages;

    } catch (error) {
        console.error('Failed to generate player quiz questions:', error);
        throw new Error("Could not generate player quiz questions. Please try again later.");
    }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    if (!API_KEY) {
        throw new Error("API Key is not configured.");
    }

    try {
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                return `data:${mimeType};base64,${base64Data}`;
            }
        }

        throw new Error("No image found in the API response for prompt: " + prompt);

    } catch (error) {
        console.error(`Failed to generate image for prompt "${prompt}":`, error);
        // Return a placeholder or re-throw
        throw new Error("Could not generate the image.");
    }
};