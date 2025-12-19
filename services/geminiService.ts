
import { GoogleGenAI, Type } from "@google/genai";
import { SectorLore } from "../types";

export const getSectorLore = async (score: number): Promise<SectorLore> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      // Use gemini-3-flash-preview for basic text tasks like lore generation
      model: "gemini-3-flash-preview",
      contents: `Generate a short, sci-fi sector description for a space game. The player's current distance is ${score} light-years.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Cool sci-fi name for the sector." },
            description: { type: Type.STRING, description: "A 1-2 sentence ominous or atmospheric description." },
            hazardLevel: { type: Type.STRING, description: "A hazard classification like 'CLASS-C' or 'EXTREME'." }
          },
          // Using propertyOrdering as recommended in the SDK guidelines for JSON responseSchema
          propertyOrdering: ["name", "description", "hazardLevel"]
        }
      }
    });

    // Extracting text directly from the response property and trimming it as per guidelines
    const text = response.text?.trim() || "{}";
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error("Error generating lore:", error);
    return {
      name: "The Silent Void",
      description: "Communications are jammed. You are alone in the darkness.",
      hazardLevel: "UNKNOWN"
    };
  }
};
