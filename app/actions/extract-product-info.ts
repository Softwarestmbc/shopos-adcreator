"use server"

import { GoogleGenAI } from "@google/genai"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { ImageSize } from "./edit-image"
import { getDefaultTemplate, getTemplateById } from "../config/templates"

export type ProductInfo = {
  productName: string
  productDescription: string
  brandName: string
  benefits: Array<{
    name: string
    description: string
  }>
  disclaimer?: string
  backgroundColor?: string
  textColor?: string
  headline?: string
  productImageAnalysis?: string
  templateId?: string
  // Add a flag to indicate that this product info should not override the uploaded image
  preserveUploadedImage?: boolean
}

// Default product info to use as fallback
export async function getDefaultProductInfo(): Promise<ProductInfo> {
  return {
    productName: "Advanced Skincare Solution",
    productDescription: "Premium skincare product for radiant, healthy skin",
    brandName: "BeautyEssentials",
    benefits: [
      {
        name: "Hyaluronic Acid",
        description: "Deeply hydrates and plumps skin",
      },
      {
        name: "Vitamin C",
        description: "Brightens and evens skin tone",
      },
      {
        name: "Retinol",
        description: "Reduces fine lines and wrinkles",
      },
      {
        name: "Niacinamide",
        description: "Minimizes pores and improves texture",
      },
    ],
    disclaimer: "*Results may vary. Consult with a dermatologist.",
    backgroundColor: "#0047AB", // Royal blue
    textColor: "#FFFFFF", // White
    headline: "TRANSFORM YOUR SKIN WITH PROVEN INGREDIENTS",
    preserveUploadedImage: true, // Always preserve the uploaded image
  }
}

export type ExtractionResult = {
  success: boolean
  productInfo: ProductInfo
  error?: string
  rawResponse?: string
  source?: string
}

// Add this function near the top of the file
function cleanExtractedProductInfo(productInfo: ProductInfo): ProductInfo {
  // Create a deep copy of the product info
  const cleanedInfo = JSON.parse(JSON.stringify(productInfo)) as ProductInfo

  // Always set the flag to preserve the uploaded image
  cleanedInfo.preserveUploadedImage = true

  // Remove unwanted brand references if they don't belong
  const unwantedBrands = ["Amazon", "Amazon brand", "Amazon Basics", "Amazon's Choice"]

  // Only clean if the brand isn't actually Amazon
  const isActuallyAmazon =
    cleanedInfo.brandName === "Amazon" ||
    cleanedInfo.brandName === "Amazon Basics" ||
    (cleanedInfo.brandName.includes("Amazon") && !cleanedInfo.brandName.includes("by Amazon"))

  if (!isActuallyAmazon) {
    // Clean the product name
    unwantedBrands.forEach((brand) => {
      if (cleanedInfo.productName.includes(brand)) {
        cleanedInfo.productName = cleanedInfo.productName.replace(new RegExp(brand, "gi"), "").trim()
      }
    })

    // Clean the brand name
    if (unwantedBrands.some((brand) => cleanedInfo.brandName.includes(brand))) {
      // If we have a different brand name in the product info, use that instead
      if (cleanedInfo.brandName.includes("by")) {
        const parts = cleanedInfo.brandName.split("by")
        if (parts.length > 1) {
          cleanedInfo.brandName = parts[1].trim()
        }
      } else {
        // Default to a generic brand if we can't extract it
        cleanedInfo.brandName = "Brand"
      }
    }

    // Clean the headline
    if (cleanedInfo.headline) {
      unwantedBrands.forEach((brand) => {
        if (cleanedInfo.headline.includes(brand)) {
          cleanedInfo.headline = cleanedInfo.headline.replace(new RegExp(brand, "gi"), "").trim()
        }
      })
    }
  }

  return cleanedInfo
}

// Function to extract JSON from text responses
async function extractJsonFromText(text: string): Promise<string> {
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
async function validateProductInfo(data: any): Promise<boolean> {
  return (
    data &&
    typeof data === "object" &&
    typeof data.productName === "string" &&
    typeof data.brandName === "string" &&
    Array.isArray(data.benefits)
  )
}

// Analyze product image using Gemini
export async function analyzeProductImage(imageBase64: string, templateId?: string): Promise<string> {
  try {
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "" })

    // Clean the base64 string if it includes the data URL prefix
    let cleanImageBase64 = imageBase64
    if (cleanImageBase64.includes("base64,")) {
      cleanImageBase64 = cleanImageBase64.split("base64,")[1]
    }

    // Get template-specific analysis instructions
    let templateInstructions = ""
    if (templateId === "nucao-chocolate") {
      templateInstructions = `
        This appears to be a chocolate product. Focus on:
        - Exact packaging color and design
        - Any visible ingredients (nuts, cocoa, etc.)
        - Eco-friendly packaging features
        - Nutritional claims visible on packaging
      `
    } else if (templateId === "agemate-longevity") {
      templateInstructions = `
        This appears to be a health/longevity supplement. Focus on:
        - Container type (jar, bottle, etc.)
        - Product form (powder, capsules, etc.)
        - Premium/luxury aspects of packaging
        - Any visible health claims or ingredients
      `
    } else if (templateId === "hydration-products") {
      templateInstructions = `
        This appears to be a hydration/sports product. Focus on:
        - Product format (packet, bottle, stick, etc.)
        - Key electrolyte or hydration claims
        - Athletic/sports positioning elements
        - Any visible nutritional information
      `
    } else if (templateId === "mushroom-coffee") {
      templateInstructions = `
        This appears to be a coffee alternative or mushroom coffee. Focus on:
        - Product format (ground coffee, instant, etc.)
        - Mushroom varieties visible on packaging
        - Health benefits mentioned on packaging
        - Brewing instructions if visible
      `
    }

    // Create a prompt for Gemini to analyze the product image with emphasis on precision
    const prompt = `
      Analyze this product image and provide an EXTREMELY PRECISE and DETAILED description.
      
      ${templateInstructions}
      
      Focus on:
      1. Product type and category (be very specific)
      2. EXACT COLOR (be extremely precise - exact shade like "jet black", "navy blue", "forest green", etc.)
      3. Material and texture (leather, plastic, metal, fabric, glass, etc.)
      4. Shape, dimensions, and proportions
      5. All visible text, logos, and branding elements
      6. Unique design features and distinguishing characteristics
      7. Any visible details like packaging, labels, ingredients list
      
      Start your description with the product type and its EXACT color.
      Be extremely precise about colors - use specific color names, not general terms.
      
      Your description must be HIGHLY ACCURATE and DETAILED, as it will be used to create a perfect representation of this product.
      Keep your description under 200 words, focusing only on what's clearly visible.
      
      IMPORTANT: This analysis will be used to generate a product advertisement, so focus on marketable features and visual elements that would be important in an ad.
      
      DO NOT identify the product as an Amazon brand unless you can clearly see "Amazon" or "Amazon Basics" text on the product itself.
    `

    try {
      console.log("Analyzing product image with Gemini 2.5 Flash")

      // Generate content using the Gemini 2.5 Flash model with image input
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: cleanImageBase64 } }],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Very low temperature for maximum precision
          thinkingBudget: 500,
        },
      })

      const analysis = response.response?.text() || ""
      console.log("Image analysis result:", analysis)

      return analysis
    } catch (error) {
      console.error("Error analyzing image:", error)
      return "Unable to analyze product image."
    }
  } catch (error) {
    console.error("Error in analyzeProductImage:", error)
    return "Unable to analyze product image."
  }
}

// Extract product info using OpenAI as a fallback
async function extractWithOpenAI(url: string, templateId: string): Promise<ExtractionResult> {
  try {
    console.log("Attempting extraction with OpenAI for template:", templateId)

    const template = templateId ? getTemplateById(templateId) : getDefaultTemplate()

    // Create a system prompt to set the context
    const systemPrompt = `
      You are a product information extraction assistant. Your task is to extract product details from a website URL.
      You will return ONLY a valid JSON object with no markdown formatting or additional text.
      
      The extracted information will be used to create an advertisement in the "${template?.title}" style.
      
      IMPORTANT: Your extracted information will ONLY be used for text elements in the ad. The actual product image will be provided separately, so focus on extracting accurate text information only.
      
      CRITICAL INSTRUCTIONS FOR PRODUCT NAME EXTRACTION:
      1. Extract the EXACT product name from the page title or product description
      2. DO NOT include phrases like "Amazon brand", "Amazon's Choice", or "Amazon Basics" in the product name UNLESS the product is actually made by Amazon
      3. If the URL is from Amazon or another marketplace, look for the actual manufacturer's brand name
      4. Remove any marketplace-specific prefixes or suffixes from the product name
      5. The product name should be concise, accurate, and reflect what the product actually is
    `

    // Create template-specific instructions
    let templateInstructions = ""
    if (templateId === "nucao-chocolate") {
      templateInstructions = `
        This is for a chocolate bar ad with an orange background.
        - The headline should mention availability (e.g., "Now in Sainsbury's")
        - Include 3 key benefits like "Home compostable wrapper", "65% less sugar", etc.
        - Consider adding a call-to-action like "Try it now!"
      `
    } else if (templateId === "agemate-longevity") {
      templateInstructions = `
        This is for a longevity supplement ad with a light gradient background.
        - The headline should be simple and impactful (e.g., "Feel like you again")
        - Focus on the product's premium appearance and benefits
        - No need for multiple benefit points, just a clean presentation
      `
    } else if (templateId === "hydration-products") {
      templateInstructions = `
        This is for a hydration product comparison ad.
        - The headline should be bold and direct about hydration
        - Include comparison points between two products
        - Focus on electrolytes, sugar content, calories, and vitamins
      `
    } else if (templateId === "mushroom-coffee") {
      templateInstructions = `
        This is for a mushroom coffee infographic.
        - The headline should explain why someone needs mushroom coffee
        - Include 5 benefits like "Low acidity", "No jitters", "Less caffeine", etc.
        - Arrange benefits around a central coffee cup image
      `
    } else {
      templateInstructions = `
        This is for a product showcase ad with a ${template?.backgroundColor} background.
        - The headline should be in all caps and focus on the brand and effectiveness
        - Include 4 key benefits with short descriptions
        - Consider adding a disclaimer if relevant
      `
    }

    // Create a user prompt for OpenAI
    const userPrompt = `
      Extract product information from this URL: ${url}
      
      ${templateInstructions}
      
      Return a JSON object with these fields:
      - productName: The name of the product (extract the EXACT product name, not including marketplace phrases like "Amazon's Choice")
      - productDescription: A brief description of the product
      - brandName: The name of the brand (the actual manufacturer, not the marketplace)
      - benefits: An array of ${templateId === "wellness-products" || templateId === "mushroom-coffee" ? "8" : "4"} objects, each with "name" and "description" for key ingredients or benefits
      - disclaimer: Any disclaimer text (optional)
      - backgroundColor: "${template?.backgroundColor}" (to match the template)
      - textColor: "${template?.textColor}" (to match the template)
      - headline: A catchy headline for an advertisement
      - preserveUploadedImage: true (this is required to ensure the original product image is used)
      
      If you can't find specific information, use reasonable defaults that would work well with the "${template?.title}" template.
      
      IMPORTANT: Return ONLY the raw JSON with no markdown formatting, code blocks, or additional text.
      
      CRITICAL: The actual product image will be provided separately, so focus on extracting accurate text information only.
      
      PRODUCT NAME EXTRACTION GUIDELINES:
      1. For Amazon URLs: Look for the product title in the page, ignoring phrases like "Amazon's Choice" or "Amazon brand"
      2. For other e-commerce sites: Extract the main product title, ignoring site-specific labels
      3. The product name should be the actual name that appears on the product packaging
      4. Remove any promotional text or badges from the product name
    `

    // Use OpenAI's model to extract the information
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2, // Lower temperature for more factual responses
    })

    // Clean and parse the response
    let cleanedText = result.text.trim()

    // If response starts with \`\`\` and ends with \`\`\`, remove those
    if (cleanedText.startsWith("```") && cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(cleanedText.indexOf("\n") + 1, cleanedText.lastIndexOf("```")).trim()
    }

    // If response still contains markdown code block indicators, try to extract just the JSON
    if (cleanedText.includes("```")) {
      const jsonStart = cleanedText.indexOf("{")
      const jsonEnd = cleanedText.lastIndexOf("}")
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
      }
    }

    console.log("OpenAI response:", cleanedText)

    try {
      // Parse the JSON response
      const productInfo = JSON.parse(cleanedText) as ProductInfo

      // Add the template ID
      productInfo.templateId = templateId

      // Ensure the preserveUploadedImage flag is set
      productInfo.preserveUploadedImage = true

      // Validate the parsed object
      if (!(await validateProductInfo(productInfo))) {
        throw new Error("Invalid product info structure")
      }

      // Ensure we have enough benefits
      const requiredBenefits = templateId === "wellness-products" || templateId === "mushroom-coffee" ? 8 : 4
      while (productInfo.benefits.length < requiredBenefits) {
        const defaultBenefits = (await getDefaultProductInfo()).benefits
        productInfo.benefits.push(defaultBenefits[productInfo.benefits.length % defaultBenefits.length])
      }

      // Clean the product info
      const cleanedProductInfo = cleanExtractedProductInfo(productInfo)

      return {
        success: true,
        productInfo: cleanedProductInfo,
        rawResponse: result.text,
        source: "openai",
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError)
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`)
    }
  } catch (error) {
    console.error("Error with OpenAI extraction:", error)
    throw error
  }
}

// Then modify the extractProductInfo function to use this cleaning function
export async function extractProductInfo(
  url: string,
  imageSize?: ImageSize,
  imageBase64?: string,
  templateId = "product-showcase",
): Promise<ExtractionResult> {
  try {
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "" })

    // Get the template configuration
    const template = templateId ? getTemplateById(templateId) : getDefaultTemplate()

    // Analyze the product image if provided
    let imageAnalysis = ""
    if (imageBase64) {
      imageAnalysis = await analyzeProductImage(imageBase64, templateId)
    }

    // Determine aspect ratio guidance based on image size
    let aspectRatioGuidance = ""
    if (imageSize) {
      if (imageSize === "1024x1024") {
        aspectRatioGuidance = "The text should be optimized for a square (1:1) aspect ratio."
      } else if (imageSize === "1792x1024") {
        aspectRatioGuidance =
          "The text should be optimized for a landscape (16:9) aspect ratio with more horizontal space."
      } else if (imageSize === "1024x1792") {
        aspectRatioGuidance =
          "The text should be optimized for a portrait (9:16) aspect ratio with more vertical space."
      }
    }

    // Inside the extractProductInfo function, update the template-specific instructions
    // Create template-specific instructions
    let templateInstructions = ""
    if (templateId === "nucao-chocolate") {
      templateInstructions = `
  This is for a chocolate bar ad with an orange background.
  - The headline should mention availability (e.g., "Now in Sainsbury's")
  - Include 3 key benefits like "Home compostable wrapper", "65% less sugar", etc.
  - Consider adding a call-to-action like "Try it now!"
  - Focus on eco-friendly aspects and sustainability features
`
    } else if (templateId === "agemate-longevity") {
      templateInstructions = `
  This is for a longevity supplement ad with a light gradient background.
  - The headline should be simple and impactful (e.g., "Feel like you again")
  - Focus on the product's premium appearance and health benefits
  - No need for multiple benefit points, just a clean presentation
  - Emphasize longevity, anti-aging, or wellness aspects
`
    } else if (templateId === "hydration-products") {
      templateInstructions = `
  This is for a hydration product comparison ad.
  - The headline should be bold and direct about hydration
  - Include comparison points between two products (Waterboy vs. Liquid IV)
  - Focus on electrolytes, sugar content, calories, and vitamins
  - Highlight athletic performance and recovery benefits
`
    } else if (templateId === "mushroom-coffee") {
      templateInstructions = `
  This is for a mushroom coffee infographic.
  - The headline should explain why someone needs mushroom coffee
  - Include 5 benefits like "Low acidity", "No jitters", "Less caffeine", etc.
  - Arrange benefits around a central coffee cup image
  - Focus on health benefits compared to regular coffee
`
    } else if (templateId === "beauty-products") {
      templateInstructions = `
  This is for a beauty product ad with a pastel background.
  - The headline should be catchy and focus on the product's main benefit
  - Include 3 key benefits that would look good in rounded boxes
  - Consider adding a "best seller" or similar badge text
  - Focus on skin benefits, ingredients, or visible results
`
    } else if (templateId === "health-supplements") {
      templateInstructions = `
  This is for a health supplement ad with a clean, minimal style.
  - The headline should mention health benefits and possibly price per serving
  - Include 4 key benefits with potential icons (Calcium, Vitamin C, Zinc, Vitamin D, etc.)
  - Consider adding a call-to-action like "Just add water and shake"
  - Focus on nutritional benefits and health improvements
`
    } else if (templateId === "wellness-products") {
      templateInstructions = `
  This is for a wellness product ad with a green background and many benefits listed.
  - The headline should be bold and direct (e.g., "SAY NO TO BLOATING")
  - Include 8 different benefits positioned around the product
  - Consider adding a call-to-action like "FREE SHIPPING + FREE STIRRING SPOON"
  - Focus on natural ingredients and holistic wellness benefits
`
    } else {
      templateInstructions = `
  This is for a product showcase ad with a royal blue background.
  - The headline should be in all caps and focus on the brand and effectiveness
  - Include 4 key benefits with short descriptions
  - Consider adding a disclaimer if relevant
  - Focus on the product's main selling points and unique features
`
    }

    // Create a prompt for Gemini to extract product information from the URL
    const prompt = `
      Extract product information from this URL: ${url}
      ${
        imageAnalysis
          ? `
I've also analyzed the product image and found: ${imageAnalysis}

Use this information to enhance your extraction.`
          : ""
      }
      
      ${templateInstructions}
      
      CRITICAL INSTRUCTIONS FOR PRODUCT NAME EXTRACTION:
      1. Extract the EXACT product name from the page title or product description
      2. DO NOT include phrases like "Amazon brand", "Amazon's Choice", or "Amazon Basics" in the product name UNLESS the product is actually made by Amazon
      3. If the URL is from Amazon or another marketplace, look for the actual manufacturer's brand name
      4. Remove any marketplace-specific prefixes or suffixes from the product name
      5. The product name should be concise, accurate, and reflect what the product actually is
      
      Return a JSON object with these fields:
      - productName: The name of the product (keep it concise, extract the EXACT product name without marketplace phrases)
      - productDescription: A brief description of the product (under 15 words)
      - brandName: The name of the brand (the actual manufacturer, not the marketplace)
      - benefits: An array of ${templateId === "wellness-products" || templateId === "mushroom-coffee" ? "8" : "4"} objects, each with "name" and "description" for key ingredients or benefits
        * Keep benefit names very short (1-2 words)
        * Keep benefit descriptions very concise (under 6 words each)
      - disclaimer: Any disclaimer text (optional, keep it under 10 words)
      - backgroundColor: "${template?.backgroundColor}" (to match the template)
      - textColor: "${template?.textColor}" (to match the template)
      - headline: A catchy headline for an advertisement (keep it under 30 characters)
      - preserveUploadedImage: true (this is required to ensure the original product image is used)
      
      ${aspectRatioGuidance}
      
      If you can't find specific information, use reasonable defaults based on the product image analysis.
      
      IMPORTANT: Return ONLY the raw JSON with no markdown formatting, code blocks, or additional text.
      All text must be concise to ensure it fits properly in the advertisement without being cut off.
      
      CRITICAL: The actual product image will be provided separately, so focus on extracting accurate text information only.
      
      PRODUCT NAME EXTRACTION GUIDELINES:
      1. For Amazon URLs: Look for the product title in the page, ignoring phrases like "Amazon's Choice" or "Amazon brand"
      2. For other e-commerce sites: Extract the main product title, ignoring site-specific labels
      3. The product name should be the actual name that appears on the product packaging
      4. Remove any promotional text or badges from the product name
    `

    try {
      console.log(`Attempting extraction with Gemini 2.5 Flash for template: ${templateId}`)

      // Generate content using the Gemini 2.5 Flash model as specified
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        generationConfig: {
          temperature: 0.2,
          thinkingBudget: 500,
        },
      })

      const rawResponse = response.response?.text() || ""
      console.log("Raw response from Gemini:", rawResponse)

      if (!rawResponse || rawResponse.trim() === "") {
        throw new Error("Empty response from Gemini API")
      }

      // Extract JSON from the response
      const cleanedText = await extractJsonFromText(rawResponse)
      console.log("Cleaned JSON:", cleanedText)

      // Parse the JSON response
      let productInfo = JSON.parse(cleanedText) as ProductInfo

      // Add the template ID
      productInfo.templateId = templateId

      // Ensure the preserveUploadedImage flag is set
      productInfo.preserveUploadedImage = true

      // Validate the parsed object
      if (!(await validateProductInfo(productInfo))) {
        throw new Error("Invalid product info structure")
      }

      // Ensure we have enough benefits
      const requiredBenefits = templateId === "wellness-products" || templateId === "mushroom-coffee" ? 8 : 4
      while (productInfo.benefits.length < requiredBenefits) {
        const defaultBenefits = (await getDefaultProductInfo()).benefits
        productInfo.benefits.push(defaultBenefits[productInfo.benefits.length % defaultBenefits.length])
      }

      // Force the background and text colors to match the template
      productInfo.backgroundColor = template?.backgroundColor || "#0047AB"
      productInfo.textColor = template?.textColor || "#FFFFFF"

      // Add the image analysis to the product info
      if (imageAnalysis) {
        productInfo.productImageAnalysis = imageAnalysis
      }

      // After parsing the JSON response and before returning
      if (productInfo) {
        // Clean the product info to remove unwanted brand references
        productInfo = cleanExtractedProductInfo(productInfo)
      }

      return {
        success: true,
        productInfo,
        rawResponse,
        source: "gemini-2.5-flash",
      }
    } catch (geminiError) {
      console.log(`Gemini extraction failed for template ${templateId}, falling back to OpenAI:`, geminiError)
      // Fall back to OpenAI if Gemini fails
      return await extractWithOpenAI(url, templateId)
    }
  } catch (error) {
    console.error("Error extracting product info:", error)
    const defaultInfo = await getDefaultProductInfo()
    return {
      success: false,
      productInfo: {
        ...defaultInfo,
        templateId,
        preserveUploadedImage: true, // Always preserve the uploaded image
      },
      error: error instanceof Error ? error.message : "Unknown error occurred",
      rawResponse: error instanceof Error ? error.message : undefined,
    }
  }
}
