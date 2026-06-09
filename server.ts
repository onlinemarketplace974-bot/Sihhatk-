import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parser with increased limit for base64 images
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Initialize Google Gemini Client (Server-side ONLY)
const geminiApiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is not set. Please set it in Settings > Secrets.");
}

// Food analysis endpoint
app.post("/api/analyze-food", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: "Gemini API client is not initialized. Please verify your GEMINI_API_KEY in the Secrets panel.",
      });
    }

    const { base64Image, language, profile } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: "Missing base64Image field." });
    }

    // Prepare profile context to customize the advice
    const userLanguage = language === "ar" ? "Arabic" : "English";
    const profileContext = profile 
      ? `User Profile Context (Tailor nutritional advice and suggestions to this):
         - Age: ${profile.age || "N/A"}
         - Gender: ${profile.gender === "male" ? "Male" : profile.gender === "female" ? "Female" : "N/A"}
         - Daily Calorie Target: ${profile.dailyCalorieTarget || "N/A"} kcal
         - Exercise/Sports: ${profile.exercise || "N/A"}
         - Goes to Gym: ${profile.goesToGym ? "Yes" : "No"}
         - Follows Diet Routine: ${profile.followsDiet ? "Yes" : "No"}
         - Favorite Foods: ${profile.favoriteFoods || "N/A"}`
      : "No user profile details provided.";

    // Elaborate system prompt to ensure accurate analysis, healthy recipes, and credible sources
    const systemPrompt = `You are "Sihhatk" (صحتك), a highly skilled, certified clinical nutritionist and AI Food Analysis Expert.
Your primary task is to carefully analyze the food image provided.
Identify the food precisely, estimate portion sizes, and calculate calories, carbohydrates, protein, fats, and micro-nutrients.
Provide actionable suggestions to help the user become healthier and suggest healthier alternative ideas or recipes.

CRITICAL INSTRUCTIONS:
1. Output MUST be in ${userLanguage} as requested by the user. If the requested language is Arabic, translate all text values, recipe instructions, names, and guidelines into natural and elegant Arabic, while keys stay standard.
2. Every recipe, healthy alternative, and custom suggestion MUST cite a credible national or international nutrition institution (such as: USDA FoodData Central, NHS Choices, WHO Nutritional guidelines, American Heart Association, CDC, National Institute of Nutrition, or corresponding national food authorities). ALWAYS include this in the "source" field of each recipe.
3. Keep nutritional details highly realistic and precise. No guessing random enormous numbers; verify visual portion standards.
4. Give a Health Score rating from 0 to 100 on how nutritious this meal is, explaining why.`;

    // Prompt for Gemini's structured output
    const promptText = `Analyze this meal. Detect the food, generate exact nutritional estimates, fill in dietary highlights, explain the nutritional value, and suggest 2-3 healthier recipes or ideas that align with their goals and profiles.
    
    ${profileContext}`;

    // Inline image data
    const mimeType = base64Image.substring(base64Image.indexOf(":") + 1, base64Image.indexOf(";"));
    const base64Data = base64Image.substring(base64Image.indexOf(",") + 1);

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: base64Data,
      },
    };

    const textPart = {
      text: promptText,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "foodName",
            "confidence",
            "calories",
            "carbohydrates",
            "protein",
            "fat",
            "nutritionalSummary",
            "nutritionalHighlights",
            "healthScore",
            "suggestedRecipes"
          ],
          properties: {
            foodName: {
              type: Type.STRING,
              description: "The name of the detected food (e.g. Traditional Hummus with Olive Oil / Grilled Chicken Breast with Broccoli)"
            },
            confidence: {
              type: Type.STRING,
              description: "Confidence level of detection: High, Medium, or Low"
            },
            calories: {
              type: Type.INTEGER,
              description: "Estimated total calories in kcal"
            },
            carbohydrates: {
              type: Type.INTEGER,
              description: "Estimated total carbohydrates in grams"
            },
            protein: {
              type: Type.INTEGER,
              description: "Estimated total protein in grams"
            },
            fat: {
              type: Type.INTEGER,
              description: "Estimated total fat in grams"
            },
            fiber: {
              type: Type.INTEGER,
              description: "Estimated dietary fiber in grams"
            },
            sugar: {
              type: Type.INTEGER,
              description: "Estimated sugar in grams"
            },
            sodium: {
              type: Type.INTEGER,
              description: "Estimated sodium in milligrams"
            },
            nutritionalSummary: {
              type: Type.STRING,
              description: "A comprehensive analysis of the ingredients, portion sizes, and health impact of this meal."
            },
            nutritionalHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 quick key tags summarizing nutrients, e.g. ['High Protein', 'Rich in Iron', 'Low Sodium']"
            },
            healthScore: {
              type: Type.INTEGER,
              description: "Overall health score from 0 to 100"
            },
            suggestedRecipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: [
                  "recipeName",
                  "source",
                  "calories",
                  "benefits",
                  "ingredients",
                  "instructions"
                ],
                properties: {
                  recipeName: {
                    type: Type.STRING,
                    description: "Name of the healthy alternative or suggested recipe"
                  },
                  source: {
                    type: Type.STRING,
                    description: "Explicit citation of the authority, e.g., 'USDA Guidelines / NHS Healthy Choice Network/ World Health Organization'"
                  },
                  calories: {
                    type: Type.INTEGER,
                    description: "Approximate calories for this suggested meal option"
                  },
                  benefits: {
                    type: Type.STRING,
                    description: "Detailed description of why this is better for user's goals"
                  },
                  ingredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of ingredients required"
                  },
                  instructions: {
                    type: Type.STRING,
                    description: "Step-by-step cooking instructions"
                  }
                }
              },
              description: "2 or 3 healthy ideas/recipes with official institution sources"
            }
          }
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response received from the Gemini API.");
    }

    const parsedResult = JSON.parse(resultText);
    return res.json(parsedResult);
  } catch (error: any) {
    console.error("Error analyzing food image:", error);
    return res.status(500).json({
      error: "Failed to analyze food photo.",
      details: error.message || error,
    });
  }
});

// Configure Vite or Static Assets based on environment
async function setupRouting() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Sihhatk Server running on http://localhost:${PORT} under NODE_ENV=${process.env.NODE_ENV}`);
  });
}

setupRouting();
