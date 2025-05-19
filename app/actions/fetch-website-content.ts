"use server"

export async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    // Validate URL
    const validatedUrl = await validateAndFormatUrl(url)
    if (!validatedUrl) {
      throw new Error("Invalid URL provided")
    }

    // Fetch the website content
    const response = await fetch(validatedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ProductInfoBot/1.0; +http://example.com/bot)",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    return html
  } catch (error) {
    console.error("Error fetching website content:", error)
    throw error
  }
}

async function validateAndFormatUrl(url: string): Promise<string | null> {
  try {
    // If URL doesn't start with http:// or https://, add https://
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }

    // Check if URL is valid
    new URL(url)
    return url
  } catch (e) {
    return null
  }
}
