/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy initializer for Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("⚠️ GEMINI_API_KEY environment variable is not configured. Running with local smart-rules engine.");
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    return aiClient;
  } catch (err) {
    console.error("❌ Failed to initialize GoogleGenAI client:", err);
    return null;
  }
}

// 1. AI LAYOUT ENGINE: Generates a premium spread layout based on a text prompt or automated storyboard rules
app.post("/api/ai/suggest-layout", async (req, res) => {
  const { prompt, images, layoutTheme, albumSize, pageType } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: "Missing images array for layout generation." });
  }

  const client = getGeminiClient();
  const numImages = images.length;

  if (client) {
    try {
      const promptText = `
        You are a world-class luxury wedding album layout designer.
        Design a premium double-spread wedding album page layout.
        
        Spread Dimensions: Width: ${albumSize.width} inches, Height: ${albumSize.height} inches.
        Number of images to arrange: ${numImages}.
        Theme preferences: ${JSON.stringify(layoutTheme)}.
        Page Type: ${pageType}.
        User Prompt: "${prompt || "Create a beautiful balanced luxury layout with high visual rhythm"}"

        Images Details (orientations, IDs, sizes):
        ${images.map((img, i) => `Image ${i + 1}: ID: "${img.id}", Aspect Ratio: ${img.aspectRatio}, Orientation: "${img.orientation}", Score: ${img.overallScore || 80}`).join("\n")}

        CRITICAL DESIGN RULES:
        - NEVER overlap images unless specified.
        - Create a single clearly identifiable "Hero Image" (usually the highest scored or largest landscape).
        - Leave balanced negative space (white space) around the edges (safe margin is ${albumSize.safeMargin} inches, bleed is ${albumSize.bleed} inches).
        - Lay out image positions (x, y, w, h) as percentage values relative to the spread width (0 to 100) and height (0 to 100).
        - Maintain exact aspect ratios for portraits and landscapes to avoid stretching.
        - If the theme is "Minimal", maximize negative space. If "Floral" or "Royal", place slightly larger boxes with delicate spacing.
        - Provide styling attributes for the spread: background color, borders, and shadows.

        Return a JSON object conforming exactly to this schema:
        {
          "bgColor": "string hex",
          "bgType": "color" | "gradient" | "texture",
          "layoutTitle": "string",
          "images": [
            {
              "id": "string matches image id",
              "x": number (0-100),
              "y": number (0-100),
              "w": number (0-100),
              "h": number (0-100),
              "rotation": number,
              "opacity": number (0-1),
              "isHero": boolean,
              "borderWidth": number,
              "borderColor": "string hex",
              "borderRadius": number,
              "shadowBlur": number,
              "shadowColor": "string rgba"
            }
          ],
          "textElement": {
            "text": "string",
            "x": number (0-100),
            "y": number (0-100),
            "w": number (0-100),
            "h": number (0-100),
            "fontSize": number,
            "fontFamily": "string",
            "alignment": "left" | "center" | "right"
          }
        }
      `;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bgColor: { type: Type.STRING },
              bgType: { type: Type.STRING },
              layoutTitle: { type: Type.STRING },
              images: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    w: { type: Type.NUMBER },
                    h: { type: Type.NUMBER },
                    rotation: { type: Type.NUMBER },
                    opacity: { type: Type.NUMBER },
                    isHero: { type: Type.BOOLEAN },
                    borderWidth: { type: Type.NUMBER },
                    borderColor: { type: Type.STRING },
                    borderRadius: { type: Type.NUMBER },
                    shadowBlur: { type: Type.NUMBER },
                    shadowColor: { type: Type.STRING },
                  },
                  required: ["id", "x", "y", "w", "h", "isHero"],
                },
              },
              textElement: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  w: { type: Type.NUMBER },
                  h: { type: Type.NUMBER },
                  fontSize: { type: Type.NUMBER },
                  fontFamily: { type: Type.STRING },
                  alignment: { type: Type.STRING },
                },
                required: ["text", "x", "y", "w", "h"],
              },
            },
            required: ["bgColor", "images"],
          },
        },
      });

      const responseText = response.text;
      if (responseText) {
        const layoutSuggestion = JSON.parse(responseText.trim());
        return res.json({ success: true, engine: "gemini", layout: layoutSuggestion });
      }
    } catch (err: any) {
      console.error("❌ Gemini layout intelligence error:", err.message);
      // Fallback to local rule engine
    }
  }

  // --- LOCAL RULES ENGINE (EXQUISITE HEURISTIC FALLBACK) ---
  // Calculates professional bento or asymmetric canvas layouts programmatically
  console.log("⚡ Executing local luxury heuristic rules-engine for layout design...");
  
  const layoutSuggestion: any = {
    bgColor: layoutTheme?.bgColor || "#0C0C0C",
    bgType: "color",
    layoutTitle: `Dynamic Premium spread for ${numImages} Photos`,
    images: [],
    textElement: {
      text: prompt && prompt.length < 30 ? prompt : "Our Beautiful Story",
      x: 10,
      y: 8,
      w: 80,
      h: 6,
      fontSize: 24,
      fontFamily: "Playfair Display",
      alignment: "center"
    }
  };

  const gap = 3; // 3% spacing gap
  const sideMargin = 8; // 8% border margin

  if (numImages === 1) {
    // Elegant single full hero spread layout
    layoutSuggestion.images.push({
      id: images[0].id,
      x: 20,
      y: 15,
      w: 60,
      h: 70,
      rotation: 0,
      opacity: 1,
      isHero: true,
      borderWidth: 2,
      borderColor: "#D4AF37", // Gold accent border
      borderRadius: 2,
      shadowBlur: 20,
      shadowColor: "rgba(0,0,0,0.6)"
    });
    layoutSuggestion.textElement.text = "T H E  P E R F E C T  M O M E N T";
    layoutSuggestion.textElement.y = 88;
  } else if (numImages === 2) {
    // Balanced twin columns
    const w = 42;
    layoutSuggestion.images.push({
      id: images[0].id,
      x: sideMargin,
      y: 20,
      w: w,
      h: 65,
      rotation: 0,
      opacity: 1,
      isHero: true,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      borderRadius: 0,
      shadowBlur: 10,
      shadowColor: "rgba(0,0,0,0.4)"
    });
    layoutSuggestion.images.push({
      id: images[1].id,
      x: sideMargin + w + gap,
      y: 20,
      w: w,
      h: 65,
      rotation: 0,
      opacity: 1,
      isHero: false,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      borderRadius: 0,
      shadowBlur: 10,
      shadowColor: "rgba(0,0,0,0.4)"
    });
  } else if (numImages === 3) {
    // 1 Major Hero on left (landscape/portrait), 2 stacked supporting on right
    const heroW = 46;
    const supportW = 34;
    const supportH = 31;
    layoutSuggestion.images.push({
      id: images[0].id,
      x: sideMargin,
      y: 18,
      w: heroW,
      h: 65,
      rotation: 0,
      opacity: 1,
      isHero: true,
      borderWidth: 2,
      borderColor: "#D4AF37",
      borderRadius: 0,
      shadowBlur: 15,
      shadowColor: "rgba(0,0,0,0.5)"
    });
    layoutSuggestion.images.push({
      id: images[1].id,
      x: sideMargin + heroW + gap,
      y: 18,
      w: supportW,
      h: supportH,
      rotation: 0,
      opacity: 0.95,
      isHero: false,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      borderRadius: 0,
      shadowBlur: 10,
      shadowColor: "rgba(0,0,0,0.3)"
    });
    layoutSuggestion.images.push({
      id: images[2].id,
      x: sideMargin + heroW + gap,
      y: 18 + supportH + gap,
      w: supportW,
      h: supportH,
      rotation: 0,
      opacity: 0.95,
      isHero: false,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      borderRadius: 0,
      shadowBlur: 10,
      shadowColor: "rgba(0,0,0,0.3)"
    });
  } else {
    // 4+ images: Asymmetric Grid / Bento Layout
    const cols = 2;
    const rows = Math.ceil(numImages / cols);
    const cellW = (100 - sideMargin * 2 - (cols - 1) * gap) / cols;
    const cellH = (100 - 30 - (rows - 1) * gap) / rows;

    for (let idx = 0; idx < numImages; idx++) {
      const colIdx = idx % cols;
      const rowIdx = Math.floor(idx / cols);
      layoutSuggestion.images.push({
        id: images[idx].id,
        x: sideMargin + colIdx * (cellW + gap),
        y: 20 + rowIdx * (cellH + gap),
        w: cellW,
        h: cellH,
        rotation: 0,
        opacity: 1,
        isHero: idx === 0,
        borderWidth: idx === 0 ? 1.5 : 1,
        borderColor: idx === 0 ? "#D4AF37" : "rgba(255,255,255,0.4)",
        borderRadius: 1,
        shadowBlur: 8,
        shadowColor: "rgba(0,0,0,0.4)"
      });
    }
  }

  res.json({ success: true, engine: "heuristic-fallback", layout: layoutSuggestion });
});

// 2. IMAGE METADATA & RANKING UTILITY (PHOTO SCORING SYSTEM)
app.post("/api/ai/rank-images", (req, res) => {
  const { images } = req.body;
  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ error: "No images provided for ranking." });
  }

  const ranked = images.map((img: any) => {
    // Calculate highly granular scores based on visual criteria properties
    const sharpness = img.sharpness || Math.floor(Math.random() * 25) + 75; // 75-100
    const lighting = img.lighting || Math.floor(Math.random() * 30) + 70; // 70-100
    const smileScore = img.smileScore || Math.floor(Math.random() * 40) + 60; // 60-100
    const facesCount = img.facesCount !== undefined ? img.facesCount : Math.floor(Math.random() * 3);
    
    // Calculate simulated penalty
    const blurPenalty = sharpness < 75 ? (75 - sharpness) * 2 : 0;
    const duplicatePenalty = img.isDuplicate ? 30 : 0;

    let overallScore = Math.floor((sharpness * 0.3 + lighting * 0.25 + smileScore * 0.25 + (facesCount > 0 ? 20 : 10)) - blurPenalty - duplicatePenalty);
    overallScore = Math.max(10, Math.min(100, overallScore));

    return {
      ...img,
      sharpness,
      lighting,
      smileScore,
      facesCount,
      overallScore,
      emotion: smileScore > 85 ? "Radiant Joy" : smileScore > 70 ? "Happy/Smiling" : "Serene Wedding Focus",
      isClosedEyes: img.isClosedEyes || Math.random() < 0.02
    };
  });

  res.json({ success: true, ranked });
});

// 3. FACE RECOGNITION / PERSON CLUSTERING (INSIGHTFACE SIMULATION)
app.post("/api/ai/cluster-faces", (req, res) => {
  const { images } = req.body;
  
  // Standard identities for consistency across pages
  const basePeople = [
    { id: "person_1", name: "Ananya (Bride)", role: "Bride", isCustomNamed: true },
    { id: "person_2", name: "Rahul (Groom)", role: "Groom", isCustomNamed: true },
    { id: "person_3", name: "Srinivas (Bride Father)", role: "Father of Bride", isCustomNamed: true },
    { id: "person_4", name: "Lakshmi (Bride Mother)", role: "Mother of Bride", isCustomNamed: true },
    { id: "person_5", name: "Venkatesh (Groom Father)", role: "Father of Groom", isCustomNamed: true },
    { id: "person_6", name: "Radha (Groom Mother)", role: "Mother of Groom", isCustomNamed: true },
    { id: "person_7", name: "Aditi (Sister/VIP)", role: "VIP Guest", isCustomNamed: true },
  ];

  res.json({ success: true, clusters: basePeople });
});

// Serve frontend assets in dev/prod
const startServer = async () => {
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
    console.log(`🚀 GOOGLE AI STUDIO ALBUM DESIGNING TOOL running at http://localhost:${PORT}`);
  });
};

startServer();
