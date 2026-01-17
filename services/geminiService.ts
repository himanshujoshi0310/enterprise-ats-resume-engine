
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeAnalysis, ExperienceLevel } from "../types";

export async function analyzeResume(
  resumeText: string,
  targetRole: string,
  experienceLevel: ExperienceLevel
): Promise<ResumeAnalysis> {
  // Initialize AI inside function to ensure fresh environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Act as an Enterprise-Level ATS Evaluation Engine for top tech companies (Google, Amazon, Meta, etc.).
      Analyze the following resume for the role of ${targetRole} at the ${experienceLevel} level.

      RESUME CONTENT:
      ${resumeText}

      INSTRUCTIONS:
      1. Perform deep semantic analysis, not just keyword matching.
      2. Calculate a realistic ATS score (0-100) based on industry standards.
      3. Predict matches for top companies.
      4. Provide specific, actionable bullet point upgrades.
      5. Identify readiness level (Beginner, Industry Ready, FAANG Ready).
      6. IMPORTANT: Return ONLY valid JSON matching the specified schema. Do not include markdown formatting, backticks, or "json" labels.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          atsScore: { type: Type.NUMBER },
          readinessLevel: { type: Type.STRING },
          shortlistProbability: { type: Type.STRING },
          breakdown: {
            type: Type.OBJECT,
            properties: {
              keywordMatch: { type: Type.NUMBER },
              skillsRelevance: { type: Type.NUMBER },
              experienceAlignment: { type: Type.NUMBER },
              projectImpact: { type: Type.NUMBER },
              structureFormatting: { type: Type.NUMBER },
              grammarTone: { type: Type.NUMBER }
            },
            required: ["keywordMatch", "skillsRelevance", "experienceAlignment", "projectImpact", "structureFormatting", "grammarTone"]
          },
          companyMatches: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                matchPercentage: { type: Type.NUMBER },
                status: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["name", "matchPercentage", "status", "reason"]
            }
          },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          summarySuggestion: {
            type: Type.OBJECT,
            properties: {
              current: { type: Type.STRING },
              optimized: { type: Type.STRING }
            },
            required: ["current", "optimized"]
          },
          skillOptimization: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["category", "skills"]
            }
          },
          experienceUpgrades: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING },
                upgraded: { type: Type.STRING },
                impactDescription: { type: Type.STRING }
              },
              required: ["original", "upgraded", "impactDescription"]
            }
          },
          futureSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          rejectionRisks: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: [
          "atsScore", "readinessLevel", "shortlistProbability", "breakdown", 
          "companyMatches", "strengths", "weaknesses", "summarySuggestion", 
          "skillOptimization", "experienceUpgrades", "futureSkills", "rejectionRisks"
        ]
      }
    }
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error("Analysis failed: Empty response from AI engine. Check your API key and network.");
  }

  // Handle case where model might still wrap JSON in markdown blocks despite instructions
  const cleanJson = rawText.replace(/```json\n?|\n?```/g, "").trim();
  
  try {
    return JSON.parse(cleanJson) as ResumeAnalysis;
  } catch (err) {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(rawText.substring(start, end + 1)) as ResumeAnalysis;
      } catch (nestedErr) {
        throw new Error("Analysis failed: Received malformed JSON from the intelligence engine.");
      }
    }
    throw new Error(`Analysis failed: Could not parse response. ${err instanceof Error ? err.message : ''}`);
  }
}
