import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- Helpers ---
function cleanJson(text: string | null | undefined): string {
    if (!text) return "";
    return text.replace(/```json\n?|```\n?/g, "").trim();
}

// --- Health ---
app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "Family Movie Night API (Firebase)" });
});

// --- Gemini Routes ---
app.get("/gemini/test", async (_req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }
    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-flash-lite-latest",
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

app.post("/gemini/vibe", async (req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }
    const { vibe, allowR } = req.body;
    if (!vibe) {
        return res.status(400).json({ error: "Vibe parameter is required" });
    }
    const ratingInstruction = allowR
        ? ''
        : 'Do NOT include any R-rated, TV-MA, or NC-17 movies. Only return family-friendly, G, PG, or PG-13 movies.';
    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-flash-lite-latest",
            contents: `Suggest 10 movie titles that match this vibe: "${vibe}". 
      ${ratingInstruction}
      Return ONLY a JSON array of 10 movie titles.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const titles = JSON.parse(cleanJson(response.text) || '[]');
        res.json({ titles });
    } catch (error: any) {
        console.error("Gemini Vibe Search error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/gemini/recommend", async (req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }
    const { history, currentUser, profileNames, allowR } = req.body;
    if (!history || !currentUser || !profileNames) {
        return res.status(400).json({ error: "Missing required parameters" });
    }
    const ratingInstruction = allowR
        ? ''
        : 'Do NOT include any R-rated, TV-MA, or NC-17 movies. Only return family-friendly, G, PG, or PG-13 movies.';
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
            model: "gemini-flash-lite-latest",
            contents: `We are a family (${profileNames.join(', ')}) having a movie night. It's ${currentUser}'s turn to pick. 
      
      Here is our watch history, including summaries and how we rated them:
      ${historyText}
      
      Suggest 10 new movies that ${currentUser} would like, but also consider the family's general taste based on their ratings. 
      Heavily prioritize genres and styles that received high ratings (4/5 or 5/5) and avoid those that were rated poorly.
      ${ratingInstruction}
      
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
        const recommendations = JSON.parse(cleanJson(response.text) || '[]');
        res.json({ recommendations });
    } catch (error: any) {
        console.error("Gemini Recommender error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/gemini/party", async (req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }
    const { title, genres, summary } = req.body;
    if (!title) {
        return res.status(400).json({ error: "Title is required" });
    }
    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const genresContext = genres && genres.length > 0 ? ` (Genres: ${genres.join(', ')})` : '';
        const summaryContext = summary ? ` Summary: ${summary}` : '';
        
        const prompt = `Create a matching "Watch Party Pack" for the movie "${title}"${genresContext}.${summaryContext}
      
      Generate context-relevant, family-friendly themed ideas for:
      1. A unique themed snack or drink idea.
      2. A simple themed activity or game to play before or after.
      3. A thoughtful conversation starter or discussion question.
      
      Return ONLY a raw JSON object (NO markdown formatting, NO backticks) with exact properties: "snack", "activity", "prompt". Keep each response to 1 concise sentence.`;

        const response = await ai.models.generateContent({
            model: "gemini-flash-lite-latest",
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
        
        // Ensure we strip any accidental markdown that gemini might still inject
        let cleanText = cleanJson(response.text);
        
        // Failsafe JSON parsing
        let partyPack;
        try {
            partyPack = JSON.parse(cleanText || '{}');
            
            // Validate payload structure
            if (!partyPack.snack || !partyPack.activity || !partyPack.prompt) {
                console.warn("[Gemini Party] Model returned incomplete schema, applying fallbacks", partyPack);
                partyPack = {
                    snack: partyPack.snack || "Popcorn with M&Ms!",
                    activity: partyPack.activity || "See who can quote the best line.",
                    prompt: partyPack.prompt || "What was your favorite part of the movie?"
                };
            }
        } catch (parseError) {
            console.error("[Gemini Party] JSON Parse execution failed on:", cleanText);
             // Return safe fallback instead of hard-crashing the feature
             partyPack = {
                 snack: "Classic pizza and popcorn night!",
                 activity: "Try to guess what happens next during the boring parts.",
                 prompt: "If you were in this movie, what would you do differently?"
             };
        }
        
        res.json(partyPack);
    } catch (error: any) {
        console.error("Gemini Party Pack top-level error:", error);
        res.status(500).json({ error: error.message || "Failed to generate party pack" });
    }
});

// --- TMDB Routes ---
app.get("/tmdb/search", async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
    if (!TMDB_API_KEY) {
        return res.status(500).json({ error: "TMDB_API_KEY not configured on server" });
    }
    const { query, year, allowR } = req.query;
    if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
    }
    const shouldFilterRated = allowR !== 'true';
    try {
        const BASE_URL = "https://api.themoviedb.org/3";
        let url = `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query as string)}&include_adult=false`;
        if (year) {
            url += `&primary_release_year=${year}`;
        }
        
        const [res1, res2] = await Promise.all([
            fetch(url),
            fetch(`${url}&page=2`)
        ]);

        if (!res1.ok) throw new Error(`TMDB API error: ${res1.status}`);

        const data1 = await res1.json();
        const data2 = res2.ok ? await res2.json() : { results: [] };

        let allResults = [...(data1.results || []), ...(data2.results || [])];

        const seen = new Set();
        allResults = allResults.filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
        });

        const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedQuery = normalize(query as string);

        allResults.sort((a, b) => {
            const normA = normalize(a.title);
            const normB = normalize(b.title);

            const isExactA = normA === normalizedQuery;
            const isExactB = normB === normalizedQuery;

            if (isExactA && !isExactB) return -1;
            if (!isExactA && isExactB) return 1;

            return 0;
        });

        if (!shouldFilterRated) {
            res.json({ results: allResults.slice(0, 15) });
            return;
        }

        const filteredResults: any[] = [];

        for (let i = 0; i < allResults.length && filteredResults.length < 15; i += 5) {
            const chunk = allResults.slice(i, i + 5);
            await Promise.all(chunk.map(async (movie: any) => {
                try {
                    const releaseDatesRes = await fetch(`${BASE_URL}/movie/${movie.id}/release_dates?api_key=${TMDB_API_KEY}`);
                    const releaseDatesData = await releaseDatesRes.json();

                    if (!releaseDatesData.results) {
                        filteredResults.push(movie);
                        return;
                    }

                    const usRelease = releaseDatesData.results.find((r: any) => r.iso_3166_1 === 'US');

                    if (!usRelease || !usRelease.release_dates || usRelease.release_dates.length === 0) {
                        filteredResults.push(movie);
                        return;
                    }

                    const isRatedR = usRelease.release_dates.some((rd: any) =>
                        rd.certification === 'R' || rd.certification === 'NC-17'
                    );

                    if (!isRatedR) {
                        filteredResults.push(movie);
                    }
                } catch (e) {
                    filteredResults.push(movie);
                }
            }));
        }

        filteredResults.sort((a, b) => {
            const indexA = allResults.findIndex((r: any) => r.id === a.id);
            const indexB = allResults.findIndex((r: any) => r.id === b.id);
            return indexA - indexB;
        });

        res.json({ results: filteredResults.slice(0, 15) });
    } catch (error: any) {
        console.error("TMDB search error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/tmdb/details/:id", async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
    if (!TMDB_API_KEY) {
        return res.status(500).json({ error: "TMDB_API_KEY not configured on server" });
    }
    try {
        const BASE_URL = "https://api.themoviedb.org/3";
        const response = await fetch(`${BASE_URL}/movie/${req.params.id}?api_key=${TMDB_API_KEY}&append_to_response=videos`);
        if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (error: any) {
        console.error("TMDB details error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- EmailJS Route ---
app.post("/email/send", async (req, res) => {
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
            headers: { "Content-Type": "application/json" },
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

// --- Family Movie Wrapped ---
// POST /gemini/wrapped
// Accepts watch history, returns AI-generated year-in-review personality & roast
app.post("/gemini/wrapped", async (req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    const { movies, profiles, year } = req.body;
    if (!movies || !Array.isArray(movies) || movies.length === 0) {
        return res.status(400).json({ error: "movies array is required" });
    }

    // --- Compute data-driven stats server-side ---
    const watchedMovies = movies.filter((m: any) => m.status === "watched");
    if (watchedMovies.length === 0) {
        return res.status(400).json({ error: "No watched movies found" });
    }

    // Top picker by count
    const pickerCounts: Record<string, number> = {};
    watchedMovies.forEach((m: any) => {
        if (m.pickedBy) pickerCounts[m.pickedBy] = (pickerCounts[m.pickedBy] || 0) + 1;
    });
    const topPickerId = Object.entries(pickerCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "Unknown";
    const topPickerProfile = profiles?.find((p: any) => p.id === topPickerId);
    const topPickerName = topPickerProfile?.name || topPickerId;
    const topPickerCount = pickerCounts[topPickerId] || 0;

    // Movie of the year (highest avg rating)
    let movieOfTheYear = watchedMovies[0];
    let highestAvg = 0;
    watchedMovies.forEach((m: any) => {
        const vals = Object.values(m.ratings || {}).filter((v): v is number => typeof v === "number" && v > 0);
        if (vals.length === 0) return;
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        if (avg > highestAvg) { highestAvg = avg; movieOfTheYear = m; }
    });

    // Top genres by frequency in watched list
    const genreCounts: Record<string, number> = {};
    watchedMovies.forEach((m: any) => {
        (m.genres || []).forEach((g: string) => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
    });
    const topGenres = Object.entries(genreCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([g]) => g);

    // Titles list for AI context
    const movieTitles = watchedMovies.map((m: any) => m.title).join(", ");

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const prompt = `You are a witty, warm family movie night narrator. A family watched ${watchedMovies.length} movies${year ? ` in ${year}` : ""}. 

Movies watched: ${movieTitles}
Top genres: ${topGenres.join(", ")}
Most picks by: ${topPickerName} (${topPickerCount} movies)
Movie of the year: ${movieOfTheYear.title} (rated ${highestAvg.toFixed(1)}/5)

Return ONLY a JSON object (no markdown) with these exact fields:
{
  "personalityLabel": "A fun 2-4 word label for this family's movie taste (e.g. 'The Cozy Adventurers', 'Drama Royalty')",
  "genreVibe": "One sentence describing their genre vibe based on what they watched (warm, not clinical)",
  "topPickerSummary": "One sentence celebrating ${topPickerName} as the top movie picker this year (funny and affectionate)",
  "movieOfYearInsight": "One sentence about why ${movieOfTheYear.title} was probably the crowd favorite (speculative, fun)",
  "familyRoast": "One affectionate, funny sentence roasting the family's overall taste based on all their movies — think gentle, like a family member teasing them"
}`;

        const response = await ai.models.generateContent({
            model: "gemini-flash-lite-latest",
            contents: prompt,
        });

        const raw = cleanJson(response.text);
        const aiData = JSON.parse(raw);

        res.json({
            // Data-driven fields (reliable)
            totalWatched: watchedMovies.length,
            topPickerName,
            topPickerCount,
            topGenres,
            movieOfTheYear: {
                title: movieOfTheYear.title,
                poster_url: movieOfTheYear.poster_url || "",
                avgRating: highestAvg.toFixed(1),
            },
            year: year || new Date().getFullYear(),
            // AI fields
            ...aiData,
        });
    } catch (error: any) {
        console.error("Wrapped generation error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Use secrets array directly for Firebase deployment if they use Secret Manager.
// But we fallback to env variables since that's what's currently configured.
export const api = onRequest({ region: "us-central1", invoker: "public" }, app);
