"use server"

import { GoogleGenAI } from "@google/genai"

// Exponential backoff retry logic
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000, backoffFactor = 2): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 0) throw error

    console.log(`Retrying after ${delay}ms, ${retries} attempts left`)
    await new Promise((resolve) => setTimeout(resolve, delay))

    return withRetry(fn, retries - 1, delay * backoffFactor, backoffFactor)
  }
}

// Initialize the Google Generative AI client
export async function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not defined")
  }
  return new GoogleGenAI({ apiKey })
}

// Get available models for debugging
export async function listAvailableModels() {
  try {
    const genAI = getGeminiClient()
    const models = await genAI.models.list()
    return models
  } catch (error) {
    console.error("Failed to list models:", error)
    return []
  }
}

// Function to clean JSON from text responses
export async function extractJsonFromText(text: string): Promise<string> {
  // If empty or undefined, return empty object
  if (!text || text.trim() === "") {
    return "{}"
  }

  // Try to find JSON between code blocks
  if (text.includes("```json") && text.includes("```")) {
    const start = text.indexOf("```json") + 7
    const end = text.indexOf("```", start)
    if (start > 7 && end > start) {
      return text.substring(start, end).trim()
    }
  }

  // Try to find JSON between any code blocks
  if (text.includes("```") && text.lastIndexOf("```") > text.indexOf("```")) {
    const start = text.indexOf("```") + 3
    const end = text.indexOf("```", start)
    if (start > 3 && end > start) {
      return text.substring(start, end).trim()
    }
  }

  // Try to find JSON between { and }
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1)
  }

  // Return the original text if no JSON pattern found
  return text
}

// Validate JSON against expected schema
export async function validateProductInfo(data: any): Promise<boolean> {
  return (
    data &&
    typeof data === "object" &&
    typeof data.productName === "string" &&
    typeof data.brandName === "string" &&
    Array.isArray(data.benefits)
  )
}
