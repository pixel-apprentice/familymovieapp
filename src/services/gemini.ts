import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

export const isGeminiConfigured = () => !!ai;

export async function getVibeSearchTerms(vibe: string): Promise<string[]> {
  if (!ai) {
    console.warn("No Gemini API key found, returning dummy search terms.");
    return ["Space Adventure", "Funny Robots"];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 10 movie titles that match this vibe: "${vibe}". 
      Do NOT include any R-rated, TV-MA, or NC-17 movies. Only return family-friendly, G, PG, or PG-13 movies.
      Return ONLY a JSON array of 10 movie titles.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Vibe Search error:", error);
    return ["Space Adventure", "Funny Robots"];
  }
}

export interface Recommendation {
  title: string;
  reason: string;
}

export async function getFamilyRecommendations(history: any[], currentUser: string, profileNames: string[]): Promise<Recommendation[]> {
  if (!ai) {
    console.warn("No Gemini API key found, returning dummy recommendations.");
    return [
      { title: "The Incredibles", reason: "A superhero classic for the whole family." },
      { title: "Toy Story", reason: "A heartwarming tale of friendship." }
    ];
  }

  try {
    const historyText = history.map(h => {
      const ratings = Object.entries(h.ratings || {})
        .filter(([_, r]) => (r as number) > 0)
        .map(([name, r]) => `${name}: ${r}/5`)
        .join(', ');
      return `- ${h.title} (Picked by: ${h.pickedBy}, Ratings: ${ratings || 'No ratings'}${h.summary ? `, Summary: ${h.summary}` : ''})`;
    }).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `We are a family (${profileNames.join(', ')}) having a movie night. It's ${currentUser}'s turn to pick. 
      
      Here is our watch history, including summaries and how we rated them:
      ${historyText}
      
      Suggest 10 new movies that ${currentUser} would like, but also consider the family's general taste based on their ratings. 
      Heavily prioritize genres and styles that received high ratings (4/5 or 5/5) and avoid those that were rated poorly.
      Do NOT include any R-rated, TV-MA, or NC-17 movies. Only return family-friendly, G, PG, or PG-13 movies.
      
      For each movie, provide a 1-sentence reason why it was recommended.
      Return ONLY a JSON array of objects with "title" and "reason" properties.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["title", "reason"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Recommender error:", error);
    return [
      { title: "The Incredibles", reason: "A superhero classic for the whole family." },
      { title: "Toy Story", reason: "A heartwarming tale of friendship." }
    ];
  }
}
