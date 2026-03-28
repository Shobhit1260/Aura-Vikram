import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function analyzeSymptoms(symptoms: string[], language: string) {
  const prompt = `
    A user in India is experiencing the following symptoms: ${symptoms.join(", ")}.
    Provide a brief, professional analysis of potential health threats common in the Indian context (e.g., Dengue, Malaria, Typhoid, seasonal flu, etc.) in ${language}.
    Keep it concise and include a strong medical disclaimer.
    Format the response in clear sections: Potential Causes, Recommended Actions, and Urgency Level.
    Mention that they should consult a local doctor or call 102/108 in case of emergency.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}
