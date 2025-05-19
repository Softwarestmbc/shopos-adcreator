"use server"

import { experimental_generateImage } from "ai"
import { openai } from "@ai-sdk/openai"

export type ImageSize = "1024x1024" | "1792x1024" | "1024x1792"

export type ImageGenerationParams = {
  prompt: string
  size: ImageSize
  n: 1 | 2
  transparent: boolean
}

export async function generateImageAction(params: ImageGenerationParams) {
  try {
    const { prompt, size, n, transparent } = params

    // Combine the prompt with background preference
    const fullPrompt = transparent ? `${prompt} (transparent background)` : `${prompt} (white background)`

    const result = await experimental_generateImage({
      model: openai.image("gpt-image-1"),
      prompt: fullPrompt,
      n,
      size,
    })

    return {
      success: true,
      images: result.images.map((img) => img.base64),
      error: null,
    }
  } catch (error) {
    console.error("Error generating image:", error)
    return {
      success: false,
      images: [],
      error: error instanceof Error ? error.message : "Failed to generate image",
    }
  }
}
