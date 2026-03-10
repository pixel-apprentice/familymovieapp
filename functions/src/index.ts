import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import { GoogleGenAI, SchemaType } from "@google/genai";

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
app.use(express.json());

// --- Health ---
app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "Family Movie Night API (Firebase)" });
});

// --- Gemini Routes ---
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
        ? ""
        : "Do NOT include any R-rated, TV-MA, or NC-17 movies. Only return family-friendly, G, PG, or PG-13 movies.";
    try {
        const ai = new GoogleGenAI(GEMINI_API_KEY);
        const model = ai.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                },
            },
        });

        const result = await model.generateContent(`Suggest 10 movie titles that match this vibe: "${vibe}". 
      ${ratingInstruction}
      Return ONLY a JSON array of 10 movie titles.`);

        const response = await result.response;
        const titles = JSON.parse(response.text() || "[]");
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
        ? ""
        : "Do NOT include any R-rated, TV-MA, or NC-17 movies. Only return family-friendly, G, PG, or PG-13 movies.";
    try {
        const ai = new GoogleGenAI(GEMINI_API_KEY);
        const model = ai.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            title: { type: SchemaType.STRING },
                            reason: { type: SchemaType.STRING },
                        },
                        required: ["title", "reason"],
                    },
                },
            },
        });

        const historyText = (history as any[]).map((h) => {
            const ratings = Object.entries(h.ratings || {})
                .filter(([_, r]) => (r as number) > 0)
                .map(([name, r]) => `${name}: ${r}/5`)
                .join(", ");
            return `- ${h.title} (Picked by: ${h.pickedBy}, Ratings: ${ratings || "No ratings"}${h.summary ? `, Summary: ${h.summary}` : ""})`;
        }).join("\n");

        const result = await model.generateContent(`We are a family (${profileNames.join(", ")}) having a movie night. It's ${currentUser}'s turn to pick. 
      
      Here is our watch history, including summaries and how we rated them:
      ${historyText}
      
      Suggest 10 new movies that ${currentUser} would specifically love. Since it is ${currentUser}'s turn, their personal tastes (based on movies they picked or rated highly) should be the PRIMARY driver for these suggestions. 
        
      Also consider the rest of the family's general taste to ensure everyone will enjoy it, but ${currentUser}'s preference is the tie-breaker.
      Heavily prioritize genres and styles that received high ratings (4/5 or 5/5) from ${currentUser} and the family, and strictly avoid those that were rated poorly.
      ${ratingInstruction}
      
      For each movie, provide a 1-sentence reason why it fits ${currentUser}'s taste specifically.
      Return ONLY a JSON array of objects with "title" and "reason" properties.`);

        const response = await result.response;
        const recommendations = JSON.parse(response.text() || "[]");
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
        const ai = new GoogleGenAI(GEMINI_API_KEY);
        const model = ai.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        snack: { type: SchemaType.STRING },
                        activity: { type: SchemaType.STRING },
                        prompt: { type: SchemaType.STRING },
                    },
                    required: ["snack", "activity", "prompt"],
                },
            },
        });

        const promptText = `Create a "Watch Party Pack" for the movie "${title}"${genres ? ` (Genres: ${genres.join(", ")})` : ""}.${summary ? ` Summary: ${summary}` : ""}
      
      Generate context-relevant, themed ideas for:
      1. A unique snack or drink idea.
      2. A simple themed activity or game.
      3. A thoughtful discussion question.
      
      Return ONLY a JSON object with properties: "snack", "activity", "prompt". Keep each response to 1 concise sentence.`;

        const result = await model.generateContent(promptText);
        const response = await result.response;
        const partyPack = JSON.parse(response.text() || "{}");
        res.json(partyPack);
    } catch (error: any) {
        console.error("Gemini Party Pack error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- TMDB Routes ---
app.get("/tmdb/search", async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
    if (!TMDB_API_KEY) {
        return res.status(500).json({ error: "TMDB_API_KEY not configured on server" });
    }
    const { query, year, allowR } = req.query as any;
    if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
    }
    const shouldFilterRated = allowR !== "true";
    try {
        const BASE_URL = "https://api.themoviedb.org/3";
        let url = `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;
        if (year) {
            url += `&primary_release_year=${year}`;
        }

        const [res1, res2] = await Promise.all([
            fetch(url),
            fetch(`${url}&page=2`).catch(() => null),
        ]);

        if (!res1.ok) throw new Error(`TMDB API error: ${res1.status}`);

        const data1 = await res1.json();
        const data2 = res2 && res2.ok ? await res2.json() : { results: [] };

        let allResults: any[] = [...(data1.results || []), ...(data2.results || [])];

        const seen = new Set();
        allResults = allResults.filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
        });

        const normalize = (t: string) => (t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const normalizedQuery = normalize(query);

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
            await Promise.all(
                chunk.map(async (movie) => {
                    try {
                        const releaseDatesRes = await fetch(`${BASE_URL}/movie/${movie.id}/release_dates?api_key=${TMDB_API_KEY}`);
                        const releaseDatesData = await releaseDatesRes.json();
                        if (!releaseDatesData.results) {
                            filteredResults.push(movie);
                            return;
                        }
                        const usRelease = releaseDatesData.results.find((r: any) => r.iso_3166_1 === "US");
                        if (!usRelease || !usRelease.release_dates || usRelease.release_dates.length === 0) {
                            filteredResults.push(movie);
                            return;
                        }
                        const isRatedR = usRelease.release_dates.some(
                            (rd: any) => rd.certification === "R" || rd.certification === "NC-17"
                        );
                        if (!isRatedR) filteredResults.push(movie);
                    } catch (e) {
                        filteredResults.push(movie);
                    }
                })
            );
        }

        filteredResults.sort((a, b) => {
            const indexA = allResults.findIndex((r) => r.id === a.id);
            const indexB = allResults.findIndex((r) => r.id === b.id);
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
    const { type, details, subject } = req.query as any;
    const { type: typeB, details: detailsB, subject: subjectB } = req.body;

    const finalType = typeB || type;
    const finalDetails = detailsB || details;
    const finalSubject = (subjectB || subject) || `New ${finalType} request`;

    const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID;
    const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY;
    const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || process.env.VITE_EMAILJS_PRIVATE_KEY;

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY || !PRIVATE_KEY) {
        return res.status(500).json({ error: "EmailJS credentials not configured on server" });
    }

    try {
        const payload = {
            service_id: SERVICE_ID,
            template_id: TEMPLATE_ID,
            user_id: PUBLIC_KEY,
            accessToken: PRIVATE_KEY,
            template_params: {
                subject: finalSubject,
                message: finalDetails,
                type: finalType,
            },
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
            res.status(response.status).json({ error: text });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Export the "api" function
export const api = onRequest({ region: "us-central1" }, app);
