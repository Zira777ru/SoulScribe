import { GoogleGenAI, Type } from "@google/genai";
import { Language, PrayerResponse, PrayerStyle, Denomination } from "../types";

// NOTE: In a production environment, never expose keys on the client side.
// This is for demonstration purposes within the secure sandbox.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const prayerSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A short, comforting title for the prayer (3-5 words)." },
    prayer: { type: Type.STRING, description: "The content of the prayer." },
    verse: { type: Type.STRING, description: "A relevant Bible verse text." },
    reference: { type: Type.STRING, description: "The book, chapter, and verse reference (e.g., Psalm 23:1)." },
  },
  required: ["title", "prayer", "verse", "reference"],
};

export const generatePrayer = async (
  userInput: string, 
  language: Language,
  style: PrayerStyle,
  denomination: Denomination
): Promise<PrayerResponse> => {
  const modelName = 'gemini-2.5-flash';
  
  // Style Logic
  let styleInstruction = "";
  switch (style) {
    case 'modern': 
      styleInstruction = "Write in simple, warm, contemporary language. Like a conversation with a close friend. Avoid archaic words."; 
      break;
    case 'classic': 
      styleInstruction = "Write in a solemn, liturgical, and poetic style. Use reverence similar to the Psalms. (For English use formal language if appropriate; For Russian use high style)."; 
      break;
    case 'short': 
      styleInstruction = "Keep the prayer extremely concise (max 3-4 short sentences). Focus strictly on the core request. Micro-prayer format."; 
      break;
  }

  // Denomination Logic
  let denomInstruction = "";
  switch (denomination) {
    case 'orthodox': 
      denomInstruction = "Reflect Eastern Orthodox Christian theology and spirituality. Focus on humility, mercy, and mystery."; 
      break;
    case 'catholic': 
      denomInstruction = "Reflect Catholic Christian tradition. You may subtly reference grace, intercession, or sacramental themes if relevant."; 
      break;
    case 'protestant': 
      denomInstruction = "Reflect Protestant/Evangelical spirituality. Focus on personal relationship, grace, and scripture reliance."; 
      break;
    case 'general': 
      denomInstruction = "Use general Christian spirituality acceptable to all denominations. Focus on universal biblical themes."; 
      break;
  }

  const systemInstruction = `You are a Christian prayer assistant named SoulScribe.
  Your goal is to help users articulate their feelings into prayer.
  Target Language: "${language === 'ru' ? 'Russian' : 'English'}".
  
  INSTRUCTIONS:
  1. Analyze the User Input to understand their emotion.
  2. Compose a supportive, structured prayer based on the input.
  3. Find 1 most relevant Bible verse (Synodal translation for Russian, KJV/WEB for English).
  4. Ensure the tone is empathetic, non-judgmental, and deeply spiritual.
  
  PERSONALIZATION SETTINGS:
  - Tone/Style: ${styleInstruction}
  - Tradition/Denomination: ${denomInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userInput,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: prayerSchema,
        temperature: 0.7, 
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as PrayerResponse;
  } catch (error) {
    console.error("Error generating prayer:", error);
    throw error;
  }
};