import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

export async function getVibeSearchTerms(vibe: string): Promise<string[]> {
  if (!ai) {
    console.warn("No Gemini API key found, returning dummy search terms.");
    return ["Space", "Comedy", "Kids"];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract up to 3 movie search keywords from this vibe: "${vibe}"`,
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
    return ["Space", "Comedy", "Kids"];
  }
}

export async function getFamilyRecommendations(history: any[], currentUser: string): Promise<string[]> {
  if (!ai) {
    console.warn("No Gemini API key found, returning dummy recommendations.");
    return ["The Incredibles", "Toy Story", "Shrek", "Finding Nemo", "Up"];
  }

  try {
    const historyText = history.map(h => {
      const ratings = Object.entries(h.ratings || {})
        .filter(([_, r]) => (r as number) > 0)
        .map(([name, r]) => `${name}: ${r}/5`)
        .join(', ');
      return `- ${h.title} (Picked by: ${h.pickedBy}, Ratings: ${ratings || 'No ratings'})`;
    }).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `We are a family (Jack, Simone, Mom, Dad) having a movie night. It's ${currentUser}'s turn to pick. 
      
      Here is our watch history and how we rated them:
      ${historyText}
      
      Suggest 5 new movies that ${currentUser} would like, but also consider the family's general taste. 
      Return ONLY a JSON array of 5 movie titles.`,
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
    console.error("Gemini Recommender error:", error);
    return ["The Incredibles", "Toy Story", "Shrek", "Finding Nemo", "Up"];
  }
}
