"use server"

import { experimental_generateImage } from "ai"
import { openai } from "@ai-sdk/openai"
import fs from "fs"
import path from "path"
import type { ProductInfo } from "./extract-product-info"
import { getDefaultTemplate, getTemplateById } from "../config/templates"
import { analyzeProductImage, type ProductImageAnalysis } from "./analyze-product-image"

export type ImageSize = "1024x1024" | "1792x1024" | "1024x1792"

export type ImageEditParams = {
  size: ImageSize
  imageBase64: string
  productInfo: ProductInfo
}

// Add this function near the top of the file
function cleanProductInfo(productInfo: ProductInfo): ProductInfo {
  // Create a deep copy of the product info
  const cleanedInfo = JSON.parse(JSON.stringify(productInfo)) as ProductInfo

  // Remove unwanted brand references if they don't belong
  const unwantedBrands = ["Amazon", "Amazon brand", "Amazon Basics", "Amazon's Choice"]

  // Clean the product name
  unwantedBrands.forEach((brand) => {
    if (cleanedInfo.productName.includes(brand) && !cleanedInfo.brandName.includes("Amazon")) {
      cleanedInfo.productName = cleanedInfo.productName.replace(new RegExp(brand, "gi"), "").trim()
    }
  })

  // Clean the brand name if it was incorrectly set
  if (
    unwantedBrands.some((brand) => cleanedInfo.brandName.includes(brand)) &&
    cleanedInfo.brandName !== "Amazon" &&
    cleanedInfo.brandName !== "Amazon Basics"
  ) {
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

  return cleanedInfo
}

// Helper function to fetch remote images
async function fetchRemoteImage(url: string): Promise<Uint8Array> {
  try {
    console.log(`Fetching remote image from: ${url}`)
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AdCreator/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  } catch (error) {
    console.error("Error fetching remote image:", error)
    throw error
  }
}

// Function to merge product image analysis with template configuration
function mergeProductWithTemplate(
  productAnalysis: ProductImageAnalysis,
  templateConfig: any,
  productInfo: ProductInfo,
  templateId: string,
): any {
  // Create a deep copy of the template configuration
  const mergedConfig = JSON.parse(JSON.stringify(templateConfig))

  // Add product analysis data to the configuration
  mergedConfig.product = {
    analysis: productAnalysis,
    info: {
      name: productInfo.productName,
      brand: productInfo.brandName,
      description: productInfo.productDescription,
      benefits: productInfo.benefits,
      headline: productInfo.headline,
      disclaimer: productInfo.disclaimer,
    },
  }

  // Add template-specific configurations
  if (templateId === "product-showcase") {
    mergedConfig.placement = {
      position: "center",
      scale: 0.7,
      rotation: 0,
      preserveOriginalImage: true, // Explicitly preserve the original image
      useUploadedProductImage: true, // Use the uploaded product image
    }
  } else if (templateId === "nucao-chocolate") {
    mergedConfig.placement = {
      position: "center",
      scale: 0.8,
      rotation: 0,
      preserveOriginalImage: true,
      useUploadedProductImage: true,
    }
  } else if (templateId === "agemate-longevity") {
    mergedConfig.placement = {
      position: "center",
      scale: 0.7,
      rotation: 0,
      hand: true,
      preserveOriginalImage: true,
      useUploadedProductImage: true,
    }
  } else if (templateId === "hydration-products") {
    mergedConfig.placement = {
      position: "top-section",
      scale: 0.5,
      rotation: 0,
      preserveOriginalImage: true,
      useUploadedProductImage: true,
    }
  } else if (templateId === "mushroom-coffee") {
    mergedConfig.placement = {
      position: "right-center",
      scale: 0.6,
      rotation: 5,
      preserveOriginalImage: true,
      useUploadedProductImage: true,
    }
  } else if (templateId === "beauty-products") {
    mergedConfig.placement = {
      position: "center",
      scale: 0.7,
      rotation: 0,
      preserveOriginalImage: true,
      useUploadedProductImage: true,
    }
  } else if (templateId === "health-supplements") {
    mergedConfig.placement = {
      position: "right",
      scale: 0.6,
      rotation: 0,
      preserveOriginalImage: true,
      useUploadedProductImage: true,
    }
  } else if (templateId === "wellness-products") {
    mergedConfig.placement = {
      position: "center",
      scale: 0.7,
      rotation: 10,
      preserveOriginalImage: true,
      useUploadedProductImage: true,
    }
  }

  return mergedConfig
}

// New function to create detailed color instructions from the analysis
function createDetailedColorInstructions(productAnalysis: ProductImageAnalysis): string {
  let instructions = "CRITICAL COLOR PRESERVATION REQUIREMENTS:\n\n"

  // Add main color information
  instructions += `The product's main color is ${productAnalysis.visualAppearance.mainColor}. `

  // Add secondary colors
  if (productAnalysis.visualAppearance.secondaryColors && productAnalysis.visualAppearance.secondaryColors.length > 0) {
    instructions += `Secondary colors include ${productAnalysis.visualAppearance.secondaryColors.join(", ")}. `
  }

  // Add hex codes if available
  if (
    productAnalysis.visualAppearance.colorHexCodes &&
    Object.keys(productAnalysis.visualAppearance.colorHexCodes).length > 0
  ) {
    instructions += "The exact color hex codes are:\n"
    for (const [colorName, hexCode] of Object.entries(productAnalysis.visualAppearance.colorHexCodes)) {
      instructions += `- ${colorName}: ${hexCode}\n`
    }
  }

  // Add dominant colors from color profile
  if (productAnalysis.colorProfile?.dominantColors && productAnalysis.colorProfile.dominantColors.length > 0) {
    instructions += "\nDominant colors with precise specifications:\n"
    productAnalysis.colorProfile.dominantColors.forEach((color) => {
      instructions += `- ${color.name} (${color.hexCode}): approximately ${color.percentage}% of the product\n`
    })
  }

  // Add detailed part colors
  if (productAnalysis.detailedParts && Object.keys(productAnalysis.detailedParts).length > 0) {
    instructions += "\nCritical color details for specific parts:\n"
    for (const [partName, part] of Object.entries(productAnalysis.detailedParts)) {
      if (part.exactColors && part.exactColors.length > 0) {
        instructions += `- ${part.name || partName}: ${part.exactColors.join(", ")}\n`
      }
    }
  }

  // Add color relationships
  if (productAnalysis.colorProfile?.colorRelationships) {
    instructions += `\n${productAnalysis.colorProfile.colorRelationships}\n`
  }

  // Add color accuracy statement
  if (productAnalysis.colorProfile?.colorAccuracy) {
    instructions += `\n${productAnalysis.colorProfile.colorAccuracy}\n`
  }

  // Add final emphasis
  instructions += `
ABSOLUTELY CRITICAL: You MUST preserve these EXACT colors in the generated image. 
Do not lighten, darken, or change the colors in ANY way. The product's colors must be 
IDENTICAL to the original image, especially for distinctive features like a penguin's 
orange beak, which must remain EXACTLY orange, not yellow or any other color.
`

  return instructions
}

// New function to create detailed part descriptions
function createDetailedPartDescriptions(productAnalysis: ProductImageAnalysis): string {
  if (!productAnalysis.detailedParts || Object.keys(productAnalysis.detailedParts).length === 0) {
    return ""
  }

  let descriptions = "CRITICAL PRODUCT PART DETAILS:\n\n"

  for (const [partName, part] of Object.entries(productAnalysis.detailedParts)) {
    descriptions += `${part.name || partName.toUpperCase()}:\n`
    descriptions += `- Description: ${part.description}\n`
    if (part.exactColors && part.exactColors.length > 0) {
      descriptions += `- Colors: ${part.exactColors.join(", ")}\n`
    }
    descriptions += `- Texture: ${part.texture}\n`
    descriptions += `- Shape: ${part.shape}\n`
    if (part.details && part.details.length > 0) {
      descriptions += `- Details: ${part.details.join(", ")}\n`
    }
    descriptions += `- Position: ${part.position}\n\n`
  }

  return descriptions
}

export async function editImageAction(params: ImageEditParams) {
  try {
    const { size, imageBase64, productInfo } = params

    // Clean the product info to remove unwanted brand references
    const cleanedProductInfo = cleanProductInfo(productInfo)

    // Get the template configuration
    const templateId = cleanedProductInfo.templateId || "product-showcase"
    const template = getTemplateById(templateId) || getDefaultTemplate()

    // Step 1: Analyze the product image to get detailed JSON description
    console.log("Step 1: Analyzing product image to get detailed JSON description")
    let productAnalysis: ProductImageAnalysis
    try {
      productAnalysis = await analyzeProductImage(imageBase64)
      console.log("Product analysis complete:", JSON.stringify(productAnalysis, null, 2))
    } catch (analysisError) {
      console.error("Error during product analysis:", analysisError)
      // Use default values if analysis fails
      productAnalysis = {
        productType: "Unknown product",
        exactColors: ["unknown"],
        materials: ["unknown"],
        shape: "Unknown shape",
        dimensions: "Unknown dimensions",
        brandingElements: [],
        uniqueFeatures: [],
        packaging: "Unknown packaging",
        fullDescription: cleanedProductInfo.productDescription || "No description available",
        marketingHighlights: cleanedProductInfo.benefits.map((b) => `${b.name}: ${b.description}`),
        visualAppearance: {
          mainColor: "unknown",
          secondaryColors: [],
          texture: "unknown",
          finish: "unknown",
        },
        productDetails: {
          category: "unknown",
          subcategory: "unknown",
          intendedUse: "unknown",
        },
        visualElements: {
          designFeatures: [],
        },
        detailedParts: {},
        colorProfile: {
          dominantColors: [],
          colorRelationships: "unknown",
          colorAccuracy: "Colors must be preserved exactly as they appear in the original image.",
        },
        preciseDetails: {
          edges: "unknown",
          highlights: "unknown",
          shadows: "unknown",
          reflections: "unknown",
          transparentAreas: [],
        },
      }
      console.log("Using fallback product analysis")
    }

    // Step 2: Merge the product analysis with the template configuration
    console.log("Step 2: Merging product analysis with template configuration")
    const mergedConfig = mergeProductWithTemplate(productAnalysis, template.config, cleanedProductInfo, templateId)
    console.log("Merged configuration:", JSON.stringify(mergedConfig, null, 2))

    // Get aspect ratio description and text boundaries for the prompt
    let aspectRatioGuidance = ""
    let textBoundaries = ""

    if (size === "1024x1024") {
      aspectRatioGuidance = "square (1:1) aspect ratio"
      textBoundaries = `
        - Top margin: 80px from top edge
        - Bottom margin: 80px from bottom edge
        - Left margin: 80px from left edge
        - Right margin: 80px from right edge
        - Text must stay within these boundaries to avoid being cut off
      `
    } else if (size === "1792x1024") {
      aspectRatioGuidance = "landscape (16:9) aspect ratio with more horizontal space"
      textBoundaries = `
        - Top margin: 80px from top edge
        - Bottom margin: 80px from bottom edge
        - Left margin: 100px from left edge
        - Right margin: 100px from right edge
        - Text must stay within these boundaries to avoid being cut off
      `
    } else if (size === "1024x1792") {
      aspectRatioGuidance = "portrait (9:16) aspect ratio with more vertical space"
      textBoundaries = `
        - Top margin: 120px from top edge
        - Bottom margin: 120px from bottom edge
        - Left margin: 60px from left edge
        - Right margin: 60px from right edge
        - Text must stay within these boundaries to avoid being cut off
      `
    }

    // Create enhanced color instructions using the new function
    const detailedColorInstructions = createDetailedColorInstructions(productAnalysis)

    // Create detailed part descriptions
    const detailedPartDescriptions = createDetailedPartDescriptions(productAnalysis)

    // Add specific product details from analysis
    const productDetails = `
COMPREHENSIVE PRODUCT DETAILS:

${productAnalysis.fullDescription}

${detailedPartDescriptions}

VISUAL APPEARANCE:
- Main Color: ${productAnalysis.visualAppearance.mainColor}
- Secondary Colors: ${productAnalysis.visualAppearance.secondaryColors.join(", ")}
- Texture: ${productAnalysis.visualAppearance.texture}
- Finish: ${productAnalysis.visualAppearance.finish}
${productAnalysis.visualAppearance.transparency ? `- Transparency: ${productAnalysis.visualAppearance.transparency}` : ""}
${productAnalysis.visualAppearance.patterns && productAnalysis.visualAppearance.patterns.length > 0 ? `- Patterns: ${productAnalysis.visualAppearance.patterns.join(", ")}` : ""}

PRECISE DETAILS:
- Edges: ${productAnalysis.preciseDetails.edges}
- Highlights: ${productAnalysis.preciseDetails.highlights}
- Shadows: ${productAnalysis.preciseDetails.shadows}
- Reflections: ${productAnalysis.preciseDetails.reflections}
${productAnalysis.preciseDetails.transparentAreas && productAnalysis.preciseDetails.transparentAreas.length > 0 ? `- Transparent Areas: ${productAnalysis.preciseDetails.transparentAreas.join(", ")}` : ""}
`

    // Common product preservation instructions to use in all templates
    const productPreservationInstructions = `
    CRITICAL PRODUCT PRESERVATION REQUIREMENTS:
    
    1. The product in the final image MUST be EXACTLY the same as the uploaded product image.
    2. DO NOT modify, stylize, or redraw the product in any way.
    3. PRESERVE ALL COLORS EXACTLY as they appear in the original product image.
    4. Maintain all branding, packaging details, text, and design elements from the original product.
    5. If the product is black, it MUST remain BLACK in the final image, not gray or any other color.
    6. If the product has specific colors (${productAnalysis.exactColors.join(", ")}), those EXACT colors must be preserved.
    7. Do NOT substitute with a similar product or create a new version.
    8. The product should be clearly visible and the main focus of the image.
    9. IMPORTANT: Use the EXACT uploaded product image - do not recreate or redraw it.
    
    IMPORTANT: This is a PHOTOREALISTIC advertisement. The product must look EXACTLY like the real product that was uploaded, not an illustration or stylized version.
    `

    // Enhanced product preservation instructions for all templates
    const enhancedProductPreservation = `
    CRITICAL IMAGE INTEGRATION INSTRUCTIONS:
    
    1. PRESERVE THE ORIGINAL PRODUCT IMAGE: The uploaded product image must be preserved exactly as it is. Do not redraw, recreate, or modify it in any way.
    2. COMPOSITE, DON'T RECREATE: Composite the original product image into the advertisement - do not attempt to recreate the product.
    3. MAINTAIN EXACT COLORS: The product's colors must remain exactly as they appear in the uploaded image.
    4. PRESERVE ALL DETAILS: All details, textures, text, and branding on the product must be preserved exactly.
    5. PROPER INTEGRATION: Integrate the product image naturally into the scene with appropriate lighting and shadows, but do not alter the product itself.
    
    This is CRITICAL: The final advertisement must use the actual uploaded product image, not a recreation or stylized version of it.
    `

    // Create template-specific prompt
    let templatePrompt = ""

    if (templateId === "nucao-chocolate") {
      templatePrompt = `
        Create a chocolate bar advertisement with the following specifications:
        
        1. PRODUCT: Place the uploaded product (${cleanedProductInfo.productName} by ${cleanedProductInfo.brandName}) in the center of the image. This is a chocolate bar product.
        
        ${productDetails}
        
        ${detailedColorInstructions}
        
        2. BACKGROUND: Use a vibrant orange background (#F9A826).
        
        3. TEXT LAYOUT:
           - Main headline (top): "${cleanedProductInfo.headline || `Now in Sainsbury's Springfield.`}"
           - Benefits with arrows pointing to the product:
             * "Home compostable wrapper." (top-left)
             * "65% less sugar." (top-right)
             * "You buy a bar. We plant a tree." (bottom-left)
           - "Try it now!" call-to-action in a circular badge (bottom-right)
        
        4. STYLE: Create a vibrant, energetic advertisement that highlights the eco-friendly aspects of the product. The final result should look like a high-quality chocolate bar advertisement.
        
        ${productPreservationInstructions}
        ${enhancedProductPreservation}
      `
    } else if (templateId === "agemate-longevity") {
      templatePrompt = `
        Create a longevity supplement advertisement with the following specifications:
        
        1. PRODUCT: Place the uploaded product (${cleanedProductInfo.productName} by ${cleanedProductInfo.brandName}) being held by a hand in the center of the image. This is a health/longevity supplement product.
        
        ${productDetails}
        
        ${detailedColorInstructions}
        
        2. BACKGROUND: Use a light gray gradient background (#EDF2F7 to #E2E8F0).
        
        3. TEXT LAYOUT:
           - Main headline (top): "${cleanedProductInfo.headline || `Feel like you again.`}" with the word "you" highlighted in purple (#6B46C1)
        
        4. STYLE: Create a minimal, elegant advertisement that focuses on the premium nature of the product. The final result should look like a high-quality supplement advertisement.
        
        ${productPreservationInstructions}
        ${enhancedProductPreservation}
      `
    } else if (templateId === "hydration-products") {
      templatePrompt = `
        Create a hydration product comparison advertisement with the following specifications:
        
        1. LAYOUT: Split the image into two sections:
           - Top section: Light mint green background (#DCFCE7) with Waterboy Athletic Recovery product
           - Bottom section: Light gray background (#F5F5F5) with Liquid IV Hydration Multiplier product
        
        ${productDetails}
        
        ${detailedColorInstructions}
        
        2. TEXT LAYOUT:
           - Main headline (top): "${cleanedProductInfo.headline || `GET THE MOIST OUT YOUR WORKOUT WITH WATERBOY`}"
           - Top section comparison data:
             * "PER STICK OF WATERBOY ATHLETIC RECOVERY:"
             * "ELECTROLYTES: 1,899 MG"
             * "SUGAR: 0 GRAMS"
             * "CALORIES: 10 CAL"
             * "VITAMIN B-12: 1,000% DAILY VALUE"
             * "VITAMIN C: 100% DAILY VALUE"
             * "L-GLUTAMINE: ✓"
           - Bottom section comparison data:
             * "PER STICK OF LIQUID IV HYDRATION MULTIPLIER:"
             * "ELECTROLYTES: 870 MG"
             * "SUGAR: 11 GRAMS"
             * "CALORIES: 45 CAL"
             * "VITAMIN B-12: 280% DAILY VALUE"
             * "VITAMIN C: 80% DAILY VALUE"
             * "L-GLUTAMINE: ✗"
        
        3. STYLE: Create a clean, comparative advertisement that clearly shows the benefits of Waterboy over Liquid IV. The final result should look like a high-quality product comparison.
        
        ${productPreservationInstructions}
        ${enhancedProductPreservation}
      `
    } else if (templateId === "mushroom-coffee") {
      templatePrompt = `
        Create a mushroom coffee infographic with the following specifications:
        
        1. CENTRAL ELEMENT: Place a cup of mushroom coffee in the center of the image, with the uploaded product visible next to it.
        
        ${productDetails}
        
        ${detailedColorInstructions}
        
        2. BACKGROUND: Use a clean white background.
        
        3. TEXT LAYOUT:
           - Brand name at top: "@ryzesuperfoods"
           - Main headline: "${cleanedProductInfo.headline || `WHY YOU NEED MUSHROOM COFFEE`}"
           - Benefits arranged around the coffee cup with icons:
             * "Low acidity" (top-left, with person giving thumbs up)
             * "No jitters" (top-right, with person raising hands)
             * "Less caffeine" (bottom-left, with person making OK sign)
             * "No brain fog" (bottom-right, with person having lightbulb thought)
             * "Balanced digestion" (bottom-center, with person making OK sign)
           - "RYZE" logo at the bottom
        
        4. STYLE: Create a clean, informative infographic that clearly explains the benefits of mushroom coffee. The final result should look like a high-quality social media post.
        
        ${productPreservationInstructions}
        ${enhancedProductPreservation}
      `
    } else if (templateId === "beauty-products") {
      templatePrompt = `
        Create a beauty product advertisement with the following specifications:
        
        1. PRODUCT: Place the uploaded product (${cleanedProductInfo.productName} by ${cleanedProductInfo.brandName}) in the center of the image.
        
        ${productDetails}
        
        ${detailedColorInstructions}
        
        2. BACKGROUND: Use a light purple background (#E6C0E9) with subtle wavy yellow lines in the corners.
        
        3. TEXT LAYOUT:
           - Main headline (centered top): "${cleanedProductInfo.headline || `${cleanedProductInfo.productName.toUpperCase()}`}"
           - 5-star rating displayed below the headline
           - Benefits displayed as rounded white pills/buttons around the product:
             * ${cleanedProductInfo.benefits[0].name}
             * ${cleanedProductInfo.benefits[1].name}
             * ${cleanedProductInfo.benefits[2].name}
           - "best seller" badge in a yellow circle at the bottom right
        
        4. STYLE: Create a clean, modern advertisement with a playful, approachable feel. The final result should look like a high-quality beauty product advertisement.
        
        ${productPreservationInstructions}
        ${enhancedProductPreservation}
      `
    } else if (templateId === "health-supplements") {
      templatePrompt = `
        Create a health supplement advertisement with the following specifications:
        
        1. PRODUCT: Place the uploaded product (${cleanedProductInfo.productName} by ${cleanedProductInfo.brandName}) on the right side of the image.
        
        ${productDetails}
        
        ${detailedColorInstructions}
        
        2. BACKGROUND: Use a clean white background.
        
        3. TEXT LAYOUT:
           - Main headline (top): "${cleanedProductInfo.headline || `${cleanedProductInfo.productName} benefits`}"
           - Benefits listed on the left side with small icons:
             * ${cleanedProductInfo.benefits[0].name}: ${cleanedProductInfo.benefits[0].description}
             * ${cleanedProductInfo.benefits[1].name}: ${cleanedProductInfo.benefits[1].description}
             * ${cleanedProductInfo.benefits[2].name}: ${cleanedProductInfo.benefits[2].description}
             * ${cleanedProductInfo.benefits[3].name}: ${cleanedProductInfo.benefits[3].description}
           - "Just add water and shake" text at the bottom in a black box
        
        4. STYLE: Create a clean, minimal advertisement with clear typography. The final result should look like a high-quality health supplement advertisement.
        
        ${productPreservationInstructions}
        ${enhancedProductPreservation}
      `
    } else if (templateId === "wellness-products") {
      templatePrompt = `
        Create a wellness product advertisement with the following specifications:
        
        1. PRODUCT: Place the uploaded product (${cleanedProductInfo.productName} by ${cleanedProductInfo.brandName}) in the center of the image, slightly tilted.
        
        ${productDetails}
        
        ${detailedColorInstructions}
        
        2. BACKGROUND: Use a green background (#8BC34A) with a subtle gradient.
        
        3. TEXT LAYOUT:
           - Main headline (top): "${cleanedProductInfo.headline || `SAY NO TO ${cleanedProductInfo.productName.toUpperCase()}`}"
           - Many benefits arranged around the product:
             * ${cleanedProductInfo.benefits[0].name}
             * ${cleanedProductInfo.benefits[1].name}
             * ${cleanedProductInfo.benefits[2].name}
             * ${cleanedProductInfo.benefits[3].name}
             * ${cleanedProductInfo.benefits[4].name}
             * ${cleanedProductInfo.benefits[5].name}
             * ${cleanedProductInfo.benefits[6].name}
             * ${cleanedProductInfo.benefits[7].name}
           - "FREE SHIPPING + FREE STIRRING SPOON" text at the bottom in a dark green box
        
        4. STYLE: Create a vibrant, benefit-focused advertisement. The final result should look like a high-quality wellness product advertisement.
        
        ${productPreservationInstructions}
        ${enhancedProductPreservation}
      `
    } else {
      // Default product showcase template (Curology style)
      templatePrompt = `
        Create a professional product advertisement image with the following specifications:
        
        1. PRODUCT: Replace the white Curology bottle in the reference image with the uploaded product (${cleanedProductInfo.productName} by ${cleanedProductInfo.brandName}).
        
        ${productDetails}
        
        ${detailedColorInstructions}
        
        2. EXACT COLOR PRESERVATION: Maintain the EXACT color of the uploaded product. Do not lighten dark colors or darken light colors. The product should look identical in color to the uploaded image.
        
        3. HAND: Show a realistic human hand holding the product, matching the hand position in the reference image but naturally adjusted to hold this specific product.
        
        4. BACKGROUND: Use EXACTLY the same royal blue background color (#0047AB) as in the reference image. Do not change or lighten this background color.
        
        5. TEXT LAYOUT:
           - Main headline (centered top): "${cleanedProductInfo.headline || `${cleanedProductInfo.brandName.toUpperCase()} THAT WORKS`}"
           - Benefits listed on the right side with small icons:
             * ${cleanedProductInfo.benefits[0].name}: ${cleanedProductInfo.benefits[0].description}
             * ${cleanedProductInfo.benefits[1].name}: ${cleanedProductInfo.benefits[1].description}
             * ${cleanedProductInfo.benefits[2].name}: ${cleanedProductInfo.benefits[2].description}
             * ${cleanedProductInfo.benefits[3].name}: ${cleanedProductInfo.benefits[3].description}
           ${cleanedProductInfo.disclaimer ? `- Small disclaimer text at bottom: "${cleanedProductInfo.disclaimer}"` : ""}
        
        6. STYLE: Create a clean, professional advertisement with proper lighting and shadows. The final result should look like a high-quality product advertisement.
        
        ${productPreservationInstructions}
        ${enhancedProductPreservation}
      `
    }

    // Create the final prompt with enhanced color preservation instructions
    const detailedPrompt = `
      ${templatePrompt}
      
      TEXT BOUNDARIES: All text must stay within these safe boundaries for the ${aspectRatioGuidance}:
      ${textBoundaries}
      
      TEXT FITTING: Ensure ALL text fits completely within the boundaries without being cut off. Adjust font sizes as needed to ensure everything is readable and fully visible.
      
      CRITICAL COLOR ACCURACY REQUIREMENTS:
      - The product MUST maintain its EXACT original colors from the uploaded image.
      - If the product is black, it MUST remain BLACK in the final image, not gray or any other color.
      - If the product has specific colors (${productAnalysis.exactColors.join(", ")}), those EXACT colors must be preserved.
      - Do NOT lighten dark colors or darken light colors on the product.
      - Do NOT apply any filters, effects, or adjustments that would alter the product's colors.
      - The product should look IDENTICAL in color to the uploaded image.
      
      BACKGROUND COLOR: The background MUST be the exact color specified for this template (${template?.backgroundColor}).
      
      PRODUCT ACCURACY: This is the most critical requirement - the product in the final image must be EXACTLY the same as the uploaded product image with no alterations to its appearance. Do not create a generic version or substitute with a similar product. Preserve ALL details, colors, text, packaging, and branding from the original uploaded product image.
      
      IMPORTANT FINAL CHECK: Before finalizing the image, verify that:
      1. The product shown is EXACTLY the same as the uploaded product image
      2. No details of the original product have been changed or simplified
      3. The product's colors match the original EXACTLY - this is CRITICAL
      4. All text and branding on the product is preserved
      5. The product is not a generic or similar version but the exact uploaded product
      
      FINAL COLOR CHECK: As a final step, compare the colors of the product in your generated image with the colors of the uploaded product. If there is ANY difference in color, adjust your generation to match the original colors EXACTLY.
      
      MERGED CONFIGURATION JSON: ${JSON.stringify(mergedConfig)}
    `

    console.log("Step 3: Creating detailed prompt for image generation")
    console.log("Prompt excerpt:", detailedPrompt.substring(0, 200) + "...")

    // Get the reference image
    console.log("Step 4: Fetching reference template image")
    let referenceImageUint8Array: Uint8Array

    try {
      // Check if the reference image is a URL or a local path
      if (template?.referenceImage && template.referenceImage.startsWith("http")) {
        try {
          // For remote images, fetch them
          console.log(`Attempting to fetch remote reference image: ${template.referenceImage}`)
          referenceImageUint8Array = await fetchRemoteImage(template.referenceImage)
          console.log("Successfully fetched remote reference image")
        } catch (error) {
          console.error("Error fetching remote reference image:", error)

          // Try the curology reference image as a fallback
          if (templateId === "product-showcase") {
            try {
              console.log("Trying to fetch Curology reference image directly")
              referenceImageUint8Array = await fetchRemoteImage(
                "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-Wu3DAYco1jsT3Qjz9Bidxj761bkJae.png",
              )
              console.log("Successfully fetched Curology reference image")
            } catch (secondError) {
              console.error("Error fetching Curology reference image:", secondError)
              throw new Error("Failed to fetch any reference image")
            }
          } else {
            throw error
          }
        }
      } else {
        // For local paths, try multiple possible locations
        try {
          console.log("Trying to load reference image from public path")
          const referenceImagePath = path.join(
            process.cwd(),
            "public",
            template?.referenceImage || "/images/reference-image.png",
          )
          console.log(`Attempting to load from path: ${referenceImagePath}`)
          const referenceImageBuffer = fs.readFileSync(referenceImagePath)
          referenceImageUint8Array = new Uint8Array(referenceImageBuffer)
          console.log("Successfully loaded reference image from public path")
        } catch (error) {
          console.error("Error loading reference image from public path:", error)

          // Try direct paths to image file
          try {
            console.log("Trying fallback path for reference image")
            let fallbackPath

            if (templateId === "product-showcase") {
              fallbackPath = path.join(process.cwd(), "public", "images", "template-adcreator.png")
            } else if (template?.imageSrc) {
              const filename = template.imageSrc.split("/").pop()
              fallbackPath = path.join(process.cwd(), "public", "images", filename || "reference-image.png")
            } else {
              fallbackPath = path.join(process.cwd(), "public", "images", "reference-image.png")
            }

            console.log(`Attempting to load from fallback path: ${fallbackPath}`)
            const fallbackBuffer = fs.readFileSync(fallbackPath)
            referenceImageUint8Array = new Uint8Array(fallbackBuffer)
            console.log("Successfully loaded reference image from fallback path")
          } catch (fallbackError) {
            console.error("Error loading reference image from fallback path:", fallbackError)

            // As a last resort, try to fetch the reference image directly
            try {
              console.log("Trying to fetch Curology reference image as last resort")
              referenceImageUint8Array = await fetchRemoteImage(
                "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-Wu3DAYco1jsT3Qjz9Bidxj761bkJae.png",
              )
              console.log("Successfully fetched Curology reference image as last resort")
            } catch (lastError) {
              console.error("All attempts to get reference image failed:", lastError)
              throw new Error("Failed to load reference image from any source")
            }
          }
        }
      }
    } catch (error) {
      console.error("Critical error handling reference image:", error)
      throw new Error(`Failed to get reference image: ${error.message}`)
    }

    // Process the uploaded image - ensure we're not modifying the image in any way that could affect colors
    console.log("Step 5: Processing uploaded product image")
    let processedImageBase64 = imageBase64
    if (imageBase64.includes("base64,")) {
      processedImageBase64 = imageBase64.split("base64,")[1]
    }

    // Convert base64 to Uint8Array for the uploaded image
    const uploadedImageBuffer = Buffer.from(processedImageBase64, "base64")
    const uploadedImageUint8Array = new Uint8Array(uploadedImageBuffer)

    console.log("Step 6: Calling OpenAI API for image generation")
    console.log(`Template ID: ${templateId}, Background Color: ${template?.backgroundColor}`)
    console.log(`Product Name: ${cleanedProductInfo.productName}, Brand: ${cleanedProductInfo.brandName}`)
    console.log(`Image Size: ${size}`)

    // Use a lower temperature to ensure more precise adherence to the prompt instructions
    const result = await experimental_generateImage({
      model: openai.image("gpt-image-1"),
      prompt: detailedPrompt,
      size,
      image: uploadedImageUint8Array,
      referenceImage: referenceImageUint8Array,
      temperature: 0.1, // Lower temperature for more precise color preservation
    })

    console.log("Step 7: Image generation successful")

    return {
      success: true,
      image: result.image.base64,
      error: null,
      productAnalysis: productAnalysis, // Return the product analysis for reference
      mergedConfig: mergedConfig, // Return the merged configuration for reference
    }
  } catch (error) {
    console.error("Error editing image:", error)
    return {
      success: false,
      image: null,
      error: error instanceof Error ? error.message : "Failed to edit image",
    }
  }
}
