import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  if (!genAI) genAI = new GoogleGenerativeAI(key);
  return genAI;
}

export function getGeminiModel() {
  return getGemini().getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 2048,
    },
  });
}
