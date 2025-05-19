"use client"

import { TabsTrigger } from "@/components/ui/tabs"
import { TabsList } from "@/components/ui/tabs"
import type React from "react"
import { useState, useRef, type KeyboardEvent, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  Loader2,
  ArrowRight,
  Info,
  ArrowLeft,
  Globe,
  ImageIcon,
  Wand2,
  CheckCircle,
  XCircle,
  Download,
  Share2,
  Clock,
  Sparkles,
} from "lucide-react"
import type { ImageSize } from "../actions/edit-image"
import { editImageAction } from "../actions/edit-image"
import { ImageUpload } from "../components/image-upload"
import { Header } from "../components/header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
import Link from "next/link"
import { getDefaultTemplate, getTemplateById } from "../config/templates"
import { Badge } from "@/components/ui/badge"
import { extractProductInfo, type ProductInfo } from "../actions/extract-product-info"
import { ExtractionResultDisplay } from "../components/extraction-result-display"
import { motion } from "framer-motion"

type ProcessStep = {
  id: number
  message: string
  status: "pending" | "processing" | "completed" | "error"
  details?: string
  icon: React.ReactNode
}

// Type definition for history items
type HistoryItem = {
  id: string | number
  date: string
  time: string
  imageUrl: string
  productName: string
  brandName: string
  templateId: string
}

export default function ImageEditor() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get("template")

  const [size, setSize] = useState<ImageSize>("1024x1024")
  const [uploadedImage, setUploadedImage] = useState<string>("")
  const [productUrl, setProductUrl] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [progress, setProgress] = useState(0)
  const urlInputRef = useRef<HTMLInputElement>(null)

  // Results state
  const [steps, setSteps] = useState<ProcessStep[]>([
    {
      id: 1,
      message: "Analyzing product URL",
      status: "pending",
      icon: <Globe className="h-5 w-5" />,
    },
    {
      id: 2,
      message: "Extracting product information",
      status: "pending",
      icon: <ImageIcon className="h-5 w-5" />,
    },
    {
      id: 3,
      message: "Generating professional ad",
      status: "pending",
      icon: <Wand2 className="h-5 w-5" />,
    },
    {
      id: 4,
      message: "Finalizing results",
      status: "pending",
      icon: <CheckCircle className="h-5 w-5" />,
    },
  ])
  const [currentStep, setCurrentStep] = useState(0)
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [extractionResult, setExtractionResult] = useState<any | null>(null)
  const [overallProgress, setOverallProgress] = useState(0)
  const [activeResultTab, setActiveResultTab] = useState("preview")

  // Get the selected template or default
  const template = templateId ? getTemplateById(templateId) : getDefaultTemplate()

  const handleImageSelect = (base64: string) => {
    setUploadedImage(base64)
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleContinueToGenerate()
    }
  }

  // Effect to automatically start generation when navigating to the generate tab
  useEffect(() => {
    if (activeTab === "generate" && !isProcessing && !generatedImage) {
      handleGenerateAd()
    }
  }, [activeTab])

  const handleContinueToGenerate = () => {
    if (!uploadedImage) {
      setError("Please upload a product image")
      return
    }

    if (!productUrl) {
      setError("Please enter a product website URL")
      return
    }

    setError(null)
    setActiveTab("generate")
    // Generation will be triggered by the useEffect
  }

  const updateStep = (index: number, status: ProcessStep["status"], details?: string) => {
    setSteps((prevSteps) => prevSteps.map((step, i) => (i === index ? { ...step, status, details } : step)))

    if (status === "completed" && index < steps.length - 1) {
      setCurrentStep(index + 1)
    }
  }

  const simulateDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  // Function to save ad to history
  const saveToHistory = (imageBase64: string, productData: ProductInfo, templateId: string) => {
    try {
      // Create history item
      const historyItem: HistoryItem = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        imageUrl: `data:image/png;base64,${imageBase64}`,
        productName: productData.productName || "Unnamed Product",
        brandName: productData.brandName || "Unnamed Brand",
        templateId: templateId || "product-showcase",
      }

      // Get existing history
      const existingHistory = JSON.parse(localStorage.getItem("adHistory") || "[]") as HistoryItem[]

      // Add new item at the beginning
      const newHistory = [historyItem, ...existingHistory]

      // Save back to localStorage
      localStorage.setItem("adHistory", JSON.stringify(newHistory))

      console.log("Ad saved to history:", historyItem.productName)
    } catch (error) {
      console.error("Error saving to history:", error)
    }
  }

  const handleGenerateAd = async () => {
    if (isProcessing) return

    setIsProcessing(true)
    setOverallProgress(0)
    setGeneratedImage(null)
    setExtractionResult(null)

    // Reset steps
    setSteps((prevSteps) =>
      prevSteps.map((step) => ({
        ...step,
        status: "pending",
        details: undefined,
      })),
    )
    setCurrentStep(0)

    try {
      // Step 1: Analyzing URL
      updateStep(0, "processing")
      setOverallProgress(10)
      await simulateDelay(1000)
      updateStep(0, "completed", "URL validated and ready for processing")
      setOverallProgress(25)

      // Step 2: Extracting product information
      updateStep(1, "processing")
      setOverallProgress(30)
      const result = await extractProductInfo(productUrl, size, uploadedImage, templateId || "product-showcase")
      setOverallProgress(50)

      if (!result.success) {
        throw new Error(result.error || "Failed to extract product information")
      }

      setProductInfo(result.productInfo)
      setExtractionResult(result)
      updateStep(1, "completed", "Successfully extracted product details")
      setOverallProgress(60)

      // Step 3: Generating ad
      updateStep(2, "processing")
      setOverallProgress(65)
      await simulateDelay(1000) // Give UI time to update

      const adResult = await editImageAction({
        size,
        imageBase64: uploadedImage,
        productInfo: result.productInfo,
      })

      setOverallProgress(85)

      if (!adResult.success || !adResult.image) {
        throw new Error(adResult.error || "Failed to generate ad image")
      }

      setGeneratedImage(adResult.image)
      updateStep(2, "completed", "Ad generated successfully")
      setOverallProgress(95)

      // Step 4: Finalizing
      updateStep(3, "processing")
      await simulateDelay(800)

      // Save to history automatically
      saveToHistory(adResult.image, result.productInfo, templateId || "product-showcase")

      updateStep(3, "completed", "Process completed and saved to history")
      setOverallProgress(100)
      setIsProcessing(false)
    } catch (err) {
      console.error("Error in ad generation process:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)

      // Mark current step as error
      const currentStepIndex = steps.findIndex((step) => step.status === "processing")
      if (currentStepIndex >= 0) {
        updateStep(currentStepIndex, "error", errorMessage)
      }
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return

    const link = document.createElement("a")
    link.href = `data:image/png;base64,${generatedImage}`
    link.download = `adcreator-${templateId}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderStepIcon = (step: ProcessStep) => {
    switch (step.status) {
      case "pending":
        return (
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            {step.icon}
          </div>
        )
      case "processing":
        return (
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
        )
      case "completed":
        return (
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle className="h-3 w-3" />
          </div>
        )
      case "error":
        return (
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <XCircle className="h-3 w-3" />
          </div>
        )
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to templates
              </Link>

              <Badge className="bg-blue-50 text-blue-600 border-0">
                {template?.category || "Template"}: {template?.title}
              </Badge>
            </div>

            <div className="mb-12 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create Your Advertisement</h1>
              <p className="mt-2 text-gray-600">Follow the steps below to generate your professional ad</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-12">
              <div className="flex justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>

                <div className="flex flex-col items-center z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${activeTab === "upload" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}
                  >
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs ${activeTab === "upload" ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                    Upload
                  </span>
                </div>

                <div className="flex flex-col items-center z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${activeTab === "info" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}
                  >
                    <Globe className="h-5 w-5" />
                  </div>
                  <span className={`text-xs ${activeTab === "info" ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                    Website
                  </span>
                </div>

                <div className="flex flex-col items-center z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${activeTab === "generate" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}
                  >
                    <Wand2 className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs ${activeTab === "generate" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                  >
                    Generate
                  </span>
                </div>
              </div>
            </div>

            <Card className="border-gray-100 shadow-sm overflow-hidden rounded-xl mb-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="upload" className="p-8 bg-white space-y-8 m-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="size" className="text-gray-700 font-medium">
                            Output Size
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent className="bg-white">
                                <p>Select the aspect ratio for your ad</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Select value={size} onValueChange={(value) => setSize(value as ImageSize)}>
                          <SelectTrigger id="size" className="w-full bg-white border-gray-200">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                            <SelectItem value="1792x1024">Landscape (1792x1024)</SelectItem>
                            <SelectItem value="1024x1792">Portrait (1024x1792)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="mb-2 block text-gray-700 font-medium">Upload Your Product Image</Label>
                        <ImageUpload onImageSelect={handleImageSelect} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="mb-2 block text-gray-700 font-medium">Template Preview</Label>
                        <Card className="overflow-hidden border-gray-100 rounded-xl">
                          <CardContent className="p-0">
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                              <Image
                                src={template?.referenceImage || "/images/reference-image.png"}
                                alt="Reference image"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </CardContent>
                        </Card>
                        <p className="text-xs text-gray-500 mt-3">
                          Your product will be integrated into this {template?.title} template with a{" "}
                          {template?.backgroundColor} background
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <strong>Tip:</strong> For best results, upload a product image with a transparent or simple
                          background
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => setActiveTab("info")}
                      disabled={!uploadedImage}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="info" className="p-8 bg-white space-y-6 m-0">
                  <div className="space-y-6">
                    <div>
                      <div className="mb-3">
                        <Label htmlFor="productUrl" className="text-gray-700 font-medium">
                          Enter Your Exact Product URL
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="productUrl"
                            className="pl-10 bg-white border-gray-200 rounded-full py-6"
                            placeholder="https://your-product-website.com"
                            value={productUrl}
                            onChange={(e) => setProductUrl(e.target.value)}
                            onKeyDown={handleKeyPress}
                            ref={urlInputRef}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Enter your product website URL to extract information and generate an ad
                      </p>
                    </div>

                    {error && (
                      <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("upload")}
                      className="border-gray-200 text-gray-700 rounded-full"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleContinueToGenerate}
                      disabled={!uploadedImage || !productUrl}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6"
                    >
                      Generate Ad
                      <Wand2 className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="generate" className="bg-white m-0">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      {isProcessing
                        ? "Generating Your Ad"
                        : generatedImage
                          ? "Your Advertisement"
                          : "Ready to Generate"}
                    </h3>
                    <p className="text-gray-600">
                      {isProcessing
                        ? "We're analyzing your product and creating a professional advertisement."
                        : generatedImage
                          ? "Your professional advertisement has been generated and saved to history."
                          : "We'll use your product image and website information to create a professional advertisement."}
                    </p>
                  </div>

                  <div className="p-6">
                    {isProcessing ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="text-center w-full max-w-md">
                          <div className="relative mb-8">
                            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-20"
                                animate={{
                                  rotate: [0, 360],
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Number.POSITIVE_INFINITY,
                                  ease: "linear",
                                }}
                              />
                              <motion.div
                                animate={{ scale: [0.8, 1.1, 0.8] }}
                                transition={{
                                  duration: 2,
                                  repeat: Number.POSITIVE_INFINITY,
                                  ease: "easeInOut",
                                }}
                              >
                                <Sparkles className="h-10 w-10 text-blue-600" />
                              </motion.div>
                            </div>
                            <motion.div
                              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white"
                              animate={{ rotate: [0, 360] }}
                              transition={{
                                duration: 4,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "linear",
                              }}
                            >
                              <Sparkles className="h-4 w-4" />
                            </motion.div>
                          </div>

                          <h3 className="text-xl font-medium text-gray-800 mb-3">ShopOS is thinking...</h3>
                          <p className="text-gray-600 mb-6">
                            We're analyzing your product and generating a professional advertisement.
                          </p>

                          <div className="space-y-4 w-full">
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: `${overallProgress}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Generating your ad...</span>
                              <span>{overallProgress}%</span>
                            </div>
                          </div>

                          <div className="mt-8 border-t border-gray-100 pt-6">
                            <div className="grid grid-cols-1 gap-4">
                              {steps.map((step) => (
                                <div key={step.id} className="flex items-center gap-3">
                                  {renderStepIcon(step)}
                                  <span
                                    className={`text-sm ${
                                      step.status === "processing"
                                        ? "text-blue-600 font-medium"
                                        : step.status === "completed"
                                          ? "text-green-600"
                                          : step.status === "error"
                                            ? "text-red-600"
                                            : "text-gray-500"
                                    }`}
                                  >
                                    {step.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-8">
                        {error ? (
                          <div className="p-8 text-center border rounded-lg bg-gray-50">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                              <XCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-red-600 mb-2">Error Generating Ad</h3>
                            <p className="text-gray-600">{error}</p>
                            <Button
                              onClick={() => {
                                setError(null)
                                handleGenerateAd()
                              }}
                              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                            >
                              Try Again
                            </Button>
                          </div>
                        ) : generatedImage ? (
                          <div>
                            <Tabs defaultValue="preview" className="w-full">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-medium text-gray-700">Advertisement Preview</h4>
                                <TabsList className="bg-gray-100 p-1 rounded-full">
                                  <TabsTrigger
                                    value="preview"
                                    className="text-xs px-3 py-1 rounded-full data-[state=active]:bg-white"
                                  >
                                    Preview
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="details"
                                    className="text-xs px-3 py-1 rounded-full data-[state=active]:bg-white"
                                  >
                                    Details
                                  </TabsTrigger>
                                </TabsList>
                              </div>

                              <TabsContent value="preview" className="m-0">
                                <div className="border rounded-lg overflow-hidden">
                                  <Image
                                    src={`data:image/png;base64,${generatedImage}`}
                                    alt="Generated Ad"
                                    width={512}
                                    height={512}
                                    className="w-full aspect-square object-cover"
                                  />
                                </div>
                              </TabsContent>

                              <TabsContent value="details" className="m-0">
                                <div className="border rounded-lg overflow-hidden">
                                  {extractionResult ? (
                                    <ExtractionResultDisplay result={extractionResult} showCard={false} />
                                  ) : (
                                    <div className="p-8 text-center bg-gray-50">
                                      <p className="text-gray-500">No details available yet</p>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>

                            <div className="flex items-center justify-between mt-6">
                              <Button onClick={handleDownload} className="rounded-full">
                                <Download className="mr-2 h-4 w-4" /> Download
                              </Button>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" className="rounded-full border-gray-200" asChild>
                                  <Link href="/history">
                                    <Clock className="mr-2 h-4 w-4" /> View History
                                  </Link>
                                </Button>
                                <Button variant="ghost" className="rounded-full">
                                  <Share2 className="mr-2 h-4 w-4" /> Share
                                </Button>
                              </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center text-gray-500">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>Generated just now</span>
                                </div>
                                <Badge variant="outline" className="bg-white">
                                  {size}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <CardFooter className="bg-gray-50 border-t border-gray-100 p-4">
                    <div className="flex items-center justify-between w-full">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("info")}
                        disabled={isProcessing}
                        className="border-gray-200 text-gray-700 rounded-full"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <div className="text-xs text-gray-500">
                        {isProcessing ? "Generating..." : generatedImage ? "Generation complete" : "Ready to generate"}
                      </div>
                    </div>
                  </CardFooter>
                </TabsContent>
              </Tabs>
            </Card>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>© 2025 ShopOS AdCreator. All rights reserved.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
