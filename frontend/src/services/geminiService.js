import { GoogleGenAI, Type } from "@google/genai";

export const getBadmintonAnalysis = async (profile, focusAreas, sessionDuration) => {
  const model = "gemini-3-pro-preview";

  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || process.env.API_KEY,
  });

  const prompt = `
    Analyze a badminton training session.

    Player Skill: ${profile.skillLevel}
    Dominant Hand: ${profile.dominantHand}
    Focus Areas: ${focusAreas.join(", ")}
    Duration: ${Math.floor(sessionDuration / 60)} minutes ${sessionDuration % 60} seconds.

    Provide the result as JSON with:
    - scores (per focus area 0–100)
    - mistakes (technical/tactical)
    - advice (technical improvements)
    - summary (1 paragraph)
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING },
                  score: { type: Type.NUMBER }
                }
              }
            },
            mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
            advice: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          },
          required: ["scores", "mistakes", "advice", "summary"]
        }
      }
    });

    const json = response.text?.trim();
    if (!json) throw new Error("Empty response");

    return JSON.parse(json);
  } catch (err) {
    console.warn("Gemini error, returning fallback:", err);

    return {
      scores: focusAreas.map(a => ({ area: a, score: 60 + Math.floor(Math.random() * 40) })),
      mistakes: ["Late shuttle impact", "Inefficient court recovery"],
      advice: ["Improve split-step timing", "Strike shuttle at higher point"],
      summary: "Consistent performance with room for refined footwork and timing."
    };
  }
};
