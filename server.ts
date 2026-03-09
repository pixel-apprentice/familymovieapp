import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    console.log("Health check. GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
    res.json({ status: "ok", geminiKey: !!process.env.GEMINI_API_KEY });
  });

  // --- Gemini Routes ---
  app.get("/api/gemini/test", async (req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY or API_KEY not configured on server" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: "Test connection. Reply with 'OK'.",
      });

      if (response.text) {
        res.json({ success: true, message: "Gemini is connected and responding!" });
      } else {
        res.status(500).json({ error: "Gemini connected but returned no text." });
      }
    } catch (error: any) {
      console.error("Gemini Test Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/vibe", async (req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY or API_KEY not configured on server" });
    }

    const { vibe } = req.body;
    if (!vibe) {
      return res.status(400).json({ error: "Vibe parameter is required" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
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

      const titles = JSON.parse(response.text || '[]');
      res.json({ titles });
    } catch (error: any) {
      console.error("Gemini Vibe Search error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/recommend", async (req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY or API_KEY not configured on server" });
    }

    const { history, currentUser, profileNames } = req.body;
    if (!history || !currentUser || !profileNames) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const historyText = history.map((h: any) => {
        const ratings = Object.entries(h.ratings || {})
          .filter(([_, r]) => (r as number) > 0)
          .map(([name, r]) => `${name}: ${r}/5`)
          .join(', ');
        return `- ${h.title} (Picked by: ${h.pickedBy}, Ratings: ${ratings || 'No ratings'}${h.summary ? `, Summary: ${h.summary}` : ''})`;
      }).join('\n');

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
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

      const recommendations = JSON.parse(response.text || '[]');
      res.json({ recommendations });
    } catch (error: any) {
      console.error("Gemini Recommender error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/party", async (req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY or API_KEY not configured on server" });
    }

    const { title, genres, summary } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = `Create a "Watch Party Pack" for the movie "${title}"${genres ? ` (Genres: ${genres.join(', ')})` : ''}.${summary ? ` Summary: ${summary}` : ''}
      
      Generate context-relevant, themed ideas for:
      1. A unique snack or drink idea.
      2. A simple themed activity or game.
      3. A thoughtful discussion question.
      
      Return ONLY a JSON object with properties: "snack", "activity", "prompt". Keep each response to 1 concise sentence.`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              snack: { type: Type.STRING },
              activity: { type: Type.STRING },
              prompt: { type: Type.STRING }
            },
            required: ["snack", "activity", "prompt"]
          }
        }
      });

      const partyPack = JSON.parse(response.text || '{}');
      res.json(partyPack);
    } catch (error: any) {
      console.error("Gemini Party Pack error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- TMDB Routes ---
  app.get("/api/tmdb/search", async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: "TMDB_API_KEY not configured on server" });
    }

    const { query, year } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    try {
      const [res1, res2] = await Promise.all([
        fetch(url),
        fetch(`${url}&page=2`).catch(() => null)
      ]);

      if (!res1.ok) throw new Error(`TMDB API error: ${res1.status}`);
      const data1 = await res1.json();
      const data2 = res2 ? await res2.json() : { results: [] };

      let allResults = [...(data1.results || []), ...(data2.results || [])];

      // Dedupe by ID
      const seen = new Set();
      allResults = allResults.filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      // Internal Re-ranking: Move exact title matches to the very top
      // This ensures "WALL-E" wins even if TMDB ranks it at #37
      const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedQuery = normalize(query as string);

      allResults.sort((a, b) => {
        const normA = normalize(a.title);
        const normB = normalize(b.title);

        const isExactA = normA === normalizedQuery;
        const isExactB = normB === normalizedQuery;

        if (isExactA && !isExactB) return -1;
        if (!isExactA && isExactB) return 1;

        // Maintain relative TMDB order otherwise
        return 0;
      });

      const topResults = allResults.slice(0, 30); // Inspect more for filtering
      const filteredResults: any[] = [];

      // Filter out R-rated movies
      await Promise.all(topResults.map(async (movie: any) => {
        try {
          const releaseDatesRes = await fetch(`${BASE_URL}/movie/${movie.id}/release_dates?api_key=${TMDB_API_KEY}`);
          const releaseDatesData = await releaseDatesRes.json();
          const usRelease = releaseDatesData.results?.find((r: any) => r.iso_3166_1 === 'US');
          const certification = usRelease?.release_dates?.[0]?.certification || '';

          if (!['R', 'NC-17'].includes(certification)) {
            filteredResults.push(movie);
          }
        } catch (e) {
          filteredResults.push(movie);
        }
      }));

      // Sort to maintain original search relevance order
      filteredResults.sort((a, b) => {
        const indexA = topResults.findIndex((r: any) => r.id === a.id);
        const indexB = topResults.findIndex((r: any) => r.id === b.id);
        return indexA - indexB;
      });

      res.json({ results: filteredResults });
    } catch (error: any) {
      console.error("TMDB search error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tmdb/details/:id", async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: "TMDB_API_KEY not configured on server" });
    }

    try {
      const BASE_URL = "https://api.themoviedb.org/3";
      const response = await fetch(`${BASE_URL}/movie/${req.params.id}?api_key=${TMDB_API_KEY}`);
      if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("TMDB details error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- EmailJS Route ---
  app.post("/api/email/send", async (req, res) => {
    const { type, details, subject } = req.body;

    const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID;
    const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY;
    const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || process.env.VITE_EMAILJS_PRIVATE_KEY;

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY || !PRIVATE_KEY) {
      return res.status(500).json({ error: "EmailJS credentials not fully configured on server" });
    }

    try {
      const payload = {
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: PUBLIC_KEY,
        accessToken: PRIVATE_KEY,
        template_params: {
          subject: subject || `New ${type} request`,
          message: details,
          type: type,
        }
      };

      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        res.json({ success: true });
      } else {
        const text = await response.text();
        console.error("EmailJS API Error:", text);
        res.status(response.status).json({ error: text });
      }
    } catch (error: any) {
      console.error("EmailJS send error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from dist
    app.use(express.static(path.resolve(__dirname, "dist")));

    // SPA fallback for production
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
