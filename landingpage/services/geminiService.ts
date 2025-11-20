import { GoogleGenAI, Type } from "@google/genai";
import { RecommendationResponse } from "../types";

// Initialize Gemini Client
// Note: process.env.API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMangaRecommendations = async (query: string): Promise<RecommendationResponse> => {
  try {
    const model = "gemini-2.5-flash";
    
    const response = await ai.models.generateContent({
      model: model,
      contents: `Recommend 3 manga titles based on this request: "${query}". Return the result in JSON format with a reasoning summary.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING, description: "Brief explanation of why these were chosen." },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  image: { type: Type.STRING, description: "A keyword to search for a cover image, e.g., 'cyberpunk' or 'romance'" },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  description: { type: Type.STRING },
                  author: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as RecommendationResponse;
    }
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback mock response if API fails (graceful degradation)
    return {
      reasoning: "We couldn't reach our AI librarians, but here are some classics.",
      recommendations: [
        { id: "err1", title: "Berserk", image: "dark fantasy", tags: ["Dark Fantasy", "Action"], author: "Kentaro Miura" },
        { id: "err2", title: "One Piece", image: "pirate", tags: ["Adventure", "Comedy"], author: "Eiichiro Oda" },
        { id: "err3", title: "Monster", image: "thriller", tags: ["Thriller", "Psychological"], author: "Naoki Urasawa" },
      ]
    };
  }
};