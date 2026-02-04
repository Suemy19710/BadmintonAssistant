import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function verifyCourtImage(base64Image) {
  const prompt = `
You are a computer vision QA assistant for badminton line tracking.
Analyze the image and respond ONLY with valid JSON in this exact schema:

{
  "status": "scanning" | "ready" | "occluded",
  "confidence": number, 
  "notes": string,
  "missing": string[]
}

Rules:
- "ready" only if ALL court boundary lines are clearly visible and not blocked.
- "occluded" if any important line/corner is blocked by objects/people/bags or is out of frame.
- confidence is 0.0 to 1.0.
- missing should list what is missing/blocked (e.g. "top-left corner", "back baseline", "right sideline").
`;

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
  ]);

  const text = result.response.text();

  // Basic safe parse (you can improve with stricter extraction)
  return JSON.parse(text);
}
