export const isGeminiConfigured = () => true; // Handled on backend

export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/gemini/test');
    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message || "Gemini is connected and responding via backend!" };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: `Connection failed: ${errorData.error || "Unknown error"}` };
    }
  } catch (error: any) {
    console.error("Gemini Test Error:", error);
    return { success: false, message: `Connection failed: ${error.message || "Unknown error"}` };
  }
}

export async function getVibeSearchTerms(vibe: string, allowRatedR?: boolean): Promise<string[]> {
  try {
    const response = await fetch('/api/gemini/vibe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vibe, allowR: allowRatedR ?? false }),
    });

    if (!response.ok) {
      console.warn("Backend Gemini vibe search failed, returning dummy search terms.");
      return ["Space Adventure", "Funny Robots"];
    }

    const data = await response.json();
    return data.titles || [];
  } catch (error) {
    console.error("Gemini Vibe Search error:", error);
    return ["Space Adventure", "Funny Robots"];
  }
}

export interface Recommendation {
  title: string;
  reason: string;
}

export async function getFamilyRecommendations(history: any[], currentUser: string, profileNames: string[], allowRatedR?: boolean): Promise<Recommendation[]> {
  try {
    const response = await fetch('/api/gemini/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history, currentUser, profileNames, allowR: allowRatedR ?? false }),
    });

    if (!response.ok) {
      console.warn("Backend Gemini recommend failed, returning dummy recommendations.");
      return [
        { title: "The Incredibles", reason: "A superhero classic for the whole family." },
        { title: "Toy Story", reason: "A heartwarming tale of friendship." }
      ];
    }

    const data = await response.json();
    return data.recommendations || [];
  } catch (error) {
    console.error("Gemini Recommender error:", error);
    return [
      { title: "The Incredibles", reason: "A superhero classic for the whole family." },
      { title: "Toy Story", reason: "A heartwarming tale of friendship." }
    ];
  }
}
