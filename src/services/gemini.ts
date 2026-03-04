export const isGeminiConfigured = () => true; // Handled on backend

export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/gemini/test');
    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message || 'Gemini is connected!' };
    }
    const err = await response.json().catch(() => ({}));
    return { success: false, message: `Connection failed: ${err.error || response.status}` };
  } catch (error: any) {
    return { success: false, message: `Connection failed: ${error.message}` };
  }
}

export interface Recommendation {
  title: string;
  reason: string;
}

/**
 * Get movie titles matching a vibe using Gemini. Throws on failure.
 */
export async function getVibeSearchTerms(vibe: string, allowRatedR?: boolean): Promise<string[]> {
  const response = await fetch('/api/gemini/vibe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vibe, allowR: allowRatedR ?? false }),
  });

  if (!response.ok) {
    let message = `Vibe search failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const data = await response.json();
  return data.titles || [];
}

/**
 * Get personalized movie recommendations using Gemini. Throws on failure.
 */
export async function getFamilyRecommendations(
  history: any[],
  currentUser: string,
  profileNames: string[],
  allowRatedR?: boolean
): Promise<Recommendation[]> {
  const response = await fetch('/api/gemini/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, currentUser, profileNames, allowR: allowRatedR ?? false }),
  });

  if (!response.ok) {
    let message = `Recommendation failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const data = await response.json();
  return data.recommendations || [];
}
