export type TemplateConfig = {
  id: string
  title: string
  imageSrc: string
  description: string
  backgroundColor: string
  textColor: string
  referenceImage: string
  category?: string
  config: any
}

export const templates: TemplateConfig[] = [
  {
    id: "product-showcase",
    title: "Product Showcase",
    imageSrc: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-Wu3DAYco1jsT3Qjz9Bidxj761bkJae.png", // Update to use the blob URL
    description: "Highlight your product with benefits",
    backgroundColor: "#0047AB", // Royal blue
    textColor: "#FFFFFF", // White
    referenceImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-Wu3DAYco1jsT3Qjz9Bidxj761bkJae.png", // Update to use the blob URL
    category: "Product",
    config: {
      // Original Curology template config
      templateType: "product-showcase",
      backgroundColor: "#0047AB", // Royal blue
      textColor: "#FFFFFF", // White
    },
  },
  {
    id: "beauty-products",
    title: "Beauty Products",
    imageSrc: "/images/template-beauty.png",
    description: "Perfect for hair and skincare",
    backgroundColor: "#E6C0E9", // Light purple
    textColor: "#000000", // Black
    referenceImage: "/images/template-beauty.png",
    category: "Beauty",
    config: {
      templateType: "beauty-products",
      backgroundColor: "#E6C0E9", // Light purple
      textColor: "#000000", // Black
      ad_config: {
        image_specs: {
          style: "photorealistic",
          resolution: "4K",
          aspect_ratio: "1:1",
          orientation: "square",
          file_format: "PNG",
        },
        subject: {
          type: "product",
          position: "centered",
        },
        background: {
          setting: "solid pastel color",
          elements: [
            {
              type: "decorative",
              items: ["subtle wavy lines"],
              position: "top-left and bottom-right corners",
            },
          ],
        },
        text_overlay: {
          headline: {
            font: "bold sans-serif",
            size: "36pt",
            position: "top-center",
            alignment: "center",
          },
          benefits: [
            {
              font: "sans-serif",
              size: "18pt",
              background: "white box with rounded edges",
              position: "left of the product",
            },
            {
              font: "sans-serif",
              size: "18pt",
              background: "white box with rounded edges",
              position: "right of the product",
            },
            {
              font: "sans-serif",
              size: "18pt",
              background: "white box with rounded edges",
              position: "bottom-left of the product",
            },
          ],
          social_proof: {
            text: "5 Stars",
            icon: "five yellow stars",
            background: "white box",
            position: "top-right, near headline",
            alignment: "center",
          },
          badge: {
            font: "sans-serif",
            size: "16pt",
            background: "yellow circle",
            position: "bottom-right",
          },
        },
        lighting: {
          primary: "soft natural light from above",
          effects: ["subtle shadows for depth"],
        },
        additional_instructions: {
          mood: "playful, approachable, benefit-focused",
        },
      },
    },
  },
  {
    id: "health-supplements",
    title: "Health Supplements",
    imageSrc: "/images/template-health.png",
    description: "Showcase health benefits",
    backgroundColor: "#FFFFFF", // White
    textColor: "#000000", // Black
    referenceImage: "/images/template-health.png",
    category: "Health",
    config: {
      templateType: "health-supplements",
      backgroundColor: "#FFFFFF", // White
      textColor: "#000000", // Black
      ad_config: {
        image_specs: {
          style: "photorealistic",
          resolution: "4K",
          aspect_ratio: "1:1",
          orientation: "square",
          file_format: "PNG",
        },
        subject: {
          type: "product",
          position: "center-right",
        },
        background: {
          setting: "solid color",
        },
        text_overlay: {
          headline: {
            font: "bold sans-serif",
            size: "36pt",
            position: "top-center",
            alignment: "center",
          },
          benefits: [
            {
              font: "sans-serif",
              size: "16pt",
              position: "left side, top",
            },
            {
              font: "sans-serif",
              size: "16pt",
              position: "left side, second from top",
            },
            {
              font: "sans-serif",
              size: "16pt",
              position: "left side, third from top",
            },
            {
              font: "sans-serif",
              size: "16pt",
              position: "left side, bottom",
            },
          ],
          cta: {
            font: "bold sans-serif",
            size: "24pt",
            position: "bottom-left",
          },
        },
        lighting: {
          primary: "soft natural light from above",
          effects: ["subtle shadows for depth"],
        },
        additional_instructions: {
          mood: "clean, minimal, benefit-focused",
        },
      },
    },
  },
  {
    id: "wellness-products",
    title: "Wellness Products",
    imageSrc: "/images/template-wellness.png",
    description: "Highlight natural ingredients",
    backgroundColor: "#8BC34A", // Light green
    textColor: "#333333", // Dark gray
    referenceImage: "/images/template-wellness.png",
    category: "Wellness",
    config: {
      templateType: "wellness-products",
      backgroundColor: "#8BC34A", // Light green
      textColor: "#333333", // Dark gray
      ad_config: {
        image_specs: {
          style: "photorealistic",
          resolution: "4K",
          aspect_ratio: "1:1",
          orientation: "square",
          file_format: "PNG",
        },
        subject: {
          type: "product",
          position: "centered, slightly tilted for dynamic effect",
        },
        background: {
          setting: "solid color with slight gradient",
        },
        text_overlay: {
          headline: {
            font: "bold sans-serif",
            size: "36pt",
            position: "top-center",
            alignment: "center",
          },
          benefits: [
            {
              font: "sans-serif",
              size: "16pt",
              position: "top-left of product",
            },
            {
              font: "sans-serif",
              size: "14pt",
              position: "top-right of product",
            },
            {
              font: "sans-serif",
              size: "18pt",
              position: "right of product, middle",
            },
            {
              font: "sans-serif",
              size: "16pt",
              position: "bottom-right of product",
            },
            {
              font: "sans-serif",
              size: "14pt",
              position: "left of product, middle",
            },
            {
              font: "sans-serif",
              size: "16pt",
              position: "bottom-left of product",
            },
            {
              font: "sans-serif",
              size: "14pt",
              position: "right of product, bottom",
            },
            {
              font: "sans-serif",
              size: "16pt",
              position: "left of product, top",
            },
          ],
          cta: {
            font: "sans-serif",
            size: "18pt",
            position: "bottom-center",
          },
        },
        lighting: {
          primary: "soft natural light from above",
          effects: ["subtle shadows for depth"],
        },
        additional_instructions: {
          mood: "playful, vibrant, benefit-focused",
        },
      },
    },
  },
  // Add the new product images in the second row with their JSON configurations
  {
    id: "nucao-chocolate",
    title: "Nu+cao Chocolate",
    imageSrc: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-OJ4kVNC4BVGZFm7FcGlrj51ZGSanSy.png", // Updated to use the provided URL
    description: "Eco-friendly chocolate bars",
    backgroundColor: "#F9A826", // Orange
    textColor: "#FFFFFF", // White
    referenceImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-OJ4kVNC4BVGZFm7FcGlrj51ZGSanSy.png", // Updated to use the provided URL
    category: "Food",
    config: {
      templateType: "nucao-chocolate",
      backgroundColor: "#F9A826", // Orange
      textColor: "#FFFFFF", // White
      ad_config: {
        image_specs: {
          style: "photorealistic",
          resolution: "4K",
          aspect_ratio: "9:16",
          orientation: "vertical",
          file_format: "PNG",
        },
        subject: {
          type: "product",
          description: "Nu+cao white chocolate bar with hazelnuts",
          position: "centered",
          details: {
            size: "40g",
            branding: "nu+cao",
          },
        },
        background: {
          setting: "solid color",
          color: "#F9A826", // Orange
        },
        text_overlay: {
          headline: {
            text: "Now in Sainsbury's Springfield.",
            font: "bold sans-serif",
            size: "36pt",
            color: "#FFFFFF",
            position: "top-center",
            alignment: "center",
          },
          benefits: [
            {
              text: "Home compostable wrapper.",
              font: "sans-serif",
              size: "16pt",
              color: "#FFFFFF",
              position: "top-left of product",
              arrow: "pointing to product",
            },
            {
              text: "65% less sugar.",
              font: "sans-serif",
              size: "16pt",
              color: "#FFFFFF",
              position: "top-right of product",
              arrow: "pointing to product",
            },
            {
              text: "You buy a bar. We plant a tree.",
              font: "sans-serif",
              size: "16pt",
              color: "#FFFFFF",
              position: "bottom-left of product",
              arrow: "pointing to product",
            },
          ],
          cta: {
            text: "Try it now!",
            font: "sans-serif",
            size: "18pt",
            color: "#FFFFFF",
            background: "circle, #E67E22",
            position: "bottom-right",
          },
        },
        lighting: {
          primary: "soft natural light from above",
          effects: ["subtle shadows for depth"],
        },
        additional_instructions: {
          mood: "vibrant, energetic, benefit-focused",
          reference: "use the user-uploaded product images to ensure accuracy",
        },
      },
    },
  },
  {
    id: "agemate-longevity",
    title: "AgeMate Longevity",
    imageSrc: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-MJOjI8SA2s5rsCSKxjdXke8b27jx0y.png", // Updated to use the provided URL
    description: "Daily longevity supplements",
    backgroundColor: "#6B46C1", // Purple
    textColor: "#FFFFFF", // White
    referenceImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-MJOjI8SA2s5rsCSKxjdXke8b27jx0y.png", // Updated to use the provided URL
    category: "Health",
    config: {
      templateType: "agemate-longevity",
      backgroundColor: "#6B46C1", // Purple
      textColor: "#FFFFFF", // White
      ad_config: {
        image_specs: {
          style: "photorealistic",
          resolution: "4K",
          aspect_ratio: "9:16",
          orientation: "vertical",
          file_format: "PNG",
        },
        subject: {
          type: "product",
          description: "AgeMate Daily Longevity Blend supplement jar",
          position: "center, held by a hand",
          details: {
            size: "90g powder",
            branding: "AgeMate",
          },
        },
        background: {
          setting: "gradient",
          colors: ["#EDF2F7", "#E2E8F0"], // Light gray gradient
          direction: "top to bottom",
        },
        text_overlay: {
          headline: {
            text: "Feel like you again.",
            font: "bold sans-serif",
            size: "36pt",
            color: "#1A202C", // Dark gray
            position: "top-center",
            alignment: "center",
            highlight: {
              text: "you",
              color: "#6B46C1", // Purple
            },
          },
        },
        lighting: {
          primary: "soft natural light from above",
          effects: ["subtle shadows for depth"],
        },
        additional_instructions: {
          mood: "minimal, elegant, health-focused",
          reference: "use the user-uploaded product images to ensure accuracy",
        },
      },
    },
  },
  {
    id: "hydration-products",
    title: "Hydration Products",
    imageSrc: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-RoGyehSjEJp4YujqB3mXPGAwyHKtTl.png", // Updated to use the provided URL
    description: "Athletic recovery drinks",
    backgroundColor: "#4ECDC4", // Teal
    textColor: "#333333", // Dark gray
    referenceImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-RoGyehSjEJp4YujqB3mXPGAwyHKtTl.png", // Updated to use the provided URL
    category: "Fitness",
    config: {
      templateType: "hydration-products",
      backgroundColor: "#4ECDC4", // Teal
      textColor: "#333333", // Dark gray
      ad_config: {
        image_specs: {
          style: "photorealistic",
          resolution: "4K",
          aspect_ratio: "9:16",
          orientation: "vertical",
          file_format: "PNG",
        },
        background: {
          setting: "split background",
          top_half: "#DCFCE7", // Light mint green
          bottom_half: "#F5F5F5", // Light gray
        },
        text_overlay: {
          headline: {
            text: "GET THE MOIST OUT YOUR WORKOUT WITH WATERBOY",
            font: "bold sans-serif",
            size: "36pt",
            color: "#166534", // Dark green
            position: "top-center",
            alignment: "center",
          },
        },
        comparison: {
          product_1: {
            description: "Waterboy Athletic Recovery hydration packet",
            position: "left",
            details: {
              branding: "Waterboy",
            },
            stats: {
              title: "PER STICK OF WATERBOY ATHLETIC RECOVERY:",
              electrolytes: "1,899 MG",
              sugar: "0 GRAMS",
              calories: "10 CAL",
              vitamin_b12: "1,000% DAILY VALUE",
              vitamin_c: "100% DAILY VALUE",
              l_glutamine: "✓",
            },
            font: "sans-serif",
            size: "16pt",
            color: "#166534", // Dark green
            position: "top section, right of product 1",
          },
          product_2: {
            description: "Liquid IV Hydration Multiplier packet",
            position: "right",
            details: {
              branding: "Liquid IV",
            },
            stats: {
              title: "PER STICK OF LIQUID IV HYDRATION MULTIPLIER:",
              electrolytes: "870 MG",
              sugar: "11 GRAMS",
              calories: "45 CAL",
              vitamin_b12: "280% DAILY VALUE",
              vitamin_c: "80% DAILY VALUE",
              l_glutamine: "✗",
            },
            font: "sans-serif",
            size: "16pt",
            color: "#166534", // Dark green
            position: "bottom section, right of product 2",
          },
        },
        lighting: {
          primary: "soft natural light from above",
          effects: ["subtle shadows for depth"],
        },
        additional_instructions: {
          mood: "clean, comparative, health-focused",
          reference: "use the user-uploaded product images to ensure accuracy",
        },
      },
    },
  },
  {
    id: "mushroom-coffee",
    title: "Mushroom Coffee",
    imageSrc: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4-lApDDPtxXfCkiZq1N3WGH7u9F9HAZu.png", // Updated to use the provided URL
    description: "Healthier coffee alternative",
    backgroundColor: "#FFFFFF", // White
    textColor: "#000000", // Black
    referenceImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/4-lApDDPtxXfCkiZq1N3WGH7u9F9HAZu.png", // Updated to use the provided URL
    category: "Wellness",
    config: {
      templateType: "mushroom-coffee",
      backgroundColor: "#FFFFFF", // White
      textColor: "#000000", // Black
      ad_config: {
        image_specs: {
          style: "infographic",
          resolution: "4K",
          aspect_ratio: "1:1",
          orientation: "square",
          file_format: "PNG",
        },
        subject: {
          type: "product",
          description: "Cup of mushroom coffee in the center",
          position: "centered",
        },
        background: {
          setting: "solid color",
          color: "#FFFFFF", // White
        },
        text_overlay: {
          headline: {
            text: "WHY YOU NEED MUSHROOM COFFEE",
            font: "bold sans-serif",
            size: "36pt",
            color: "#000000",
            position: "top-center",
            alignment: "center",
          },
          brand: {
            text: "@ryzesuperfoods",
            font: "sans-serif",
            size: "16pt",
            color: "#000000",
            position: "top-center",
            alignment: "center",
          },
          benefits: [
            {
              text: "Low acidity",
              font: "sans-serif",
              size: "18pt",
              color: "#000000",
              position: "top-left of product",
              icon: "person with thumbs up",
            },
            {
              text: "No jitters",
              font: "sans-serif",
              size: "18pt",
              color: "#000000",
              position: "top-right of product",
              icon: "person with raised hands",
            },
            {
              text: "Less caffeine",
              font: "sans-serif",
              size: "18pt",
              color: "#000000",
              position: "bottom-left of product",
              icon: "person with OK sign",
            },
            {
              text: "No brain fog",
              font: "sans-serif",
              size: "18pt",
              color: "#000000",
              position: "bottom-right of product",
              icon: "person with light bulb thought",
            },
            {
              text: "Balanced digestion",
              font: "sans-serif",
              size: "18pt",
              color: "#000000",
              position: "bottom-center of product",
              icon: "person with OK sign",
            },
          ],
          logo: {
            text: "RYZE",
            font: "sans-serif",
            size: "24pt",
            color: "#000000",
            position: "bottom-center",
            alignment: "center",
          },
        },
        lighting: {
          primary: "flat lighting for infographic style",
          effects: ["no shadows"],
        },
        additional_instructions: {
          mood: "clean, informative, health-focused",
          reference: "use the user-uploaded product images to ensure accuracy",
        },
      },
    },
  },
]

export function getTemplateById(id: string): TemplateConfig | undefined {
  return templates.find((template) => template.id === id)
}

export function getDefaultTemplate(): TemplateConfig {
  return templates[0]
}
