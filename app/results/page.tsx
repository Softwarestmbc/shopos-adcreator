"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Loader2,
  Download,
  ArrowLeft,
  CheckCircle,
  Share2,
  Clock,
  FileText,
  ImageIcon,
  Globe,
  XCircle,
} from "lucide-react"
import { extractProductInfo, type ProductInfo } from "../actions/extract-product-info"
import { editImageAction, type ImageSize } from "../actions/edit-image"
import { Header } from "../components/header"
import Image from "next/image"
import { ExtractionResultDisplay } from "../components/extraction-result-display"
import { getDefaultTemplate, getTemplateById } from "../config/templates"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

type ProcessStep = {
  id: number
  message: string
  status: "pending" | "processing" | "completed" | "error"
  details?: string
  icon: React.ReactNode
}

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const url = searchParams.get("url")
  const imageData = searchParams.get("image")
  const sizeParam = searchParams.get("size") as ImageSize | null
  const templateId = searchParams.get("template") || "product-showcase"

  const size = sizeParam || "1024x1024"
  const template = getTemplateById(templateId) || getDefaultTemplate()

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
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 3,
      message: "Generating professional ad",
      status: "pending",
      icon: <ImageIcon className="h-5 w-5" />,
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
  const [error, setError] = useState<string | null>(null)
  const [extractionResult, setExtractionResult] = useState<any | null>(null)
  const [overallProgress, setOverallProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("preview")

  useEffect(() => {
    if (!url || !imageData) {
      router.push("/")
      return
    }

    const processUrl = async () => {
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
        const result = await extractProductInfo(url, size, imageData, templateId)
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
          imageBase64: imageData,
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
        updateStep(3, "completed", "Process completed successfully")
        setOverallProgress(100)
      } catch (err) {
        console.error("Error in ad generation process:", err)
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
        setError(errorMessage)

        // Mark current step as error
        const currentStepIndex = steps.findIndex((step) => step.status === "processing")
        if (currentStepIndex >= 0) {
          updateStep(currentStepIndex, "error", errorMessage)
        }
      }
    }

    processUrl()
  }, [url, imageData, size, templateId])

  const updateStep = (index: number, status: ProcessStep["status"], details?: string) => {
    setSteps((prevSteps) => prevSteps.map((step, i) => (i === index ? { ...step, status, details } : step)))

    if (status === "completed" && index < steps.length - 1) {
      setCurrentStep(index + 1)
    }
  }

  const simulateDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const handleDownload = () => {
    if (!generatedImage) return

    const link = document.createElement("a")
    link.href = `data:image/png;base64,${generatedImage}`
    link.download = `adcreator-${templateId}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleBackToHome = () => {
    router.push("/")
  }

  const renderStepIcon = (step: ProcessStep) => {
    switch (step.status) {
      case "pending":
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            {step.icon}
          </div>
        )
      case "processing":
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )
      case "completed":
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        )
      case "error":
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
        )
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="outline"
                onClick={handleBackToHome}
                className="border-gray-200 text-gray-700 rounded-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
              </Button>

              <Badge className="bg-blue-50 text-blue-600 border-0">
                {template?.category || "Template"}: {template?.title}
              </Badge>
            </div>

            <div className="mb-12 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Advertisement</h1>
              <div className="mt-4 w-full">
                <Progress value={overallProgress} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">
                  {overallProgress < 100 ? "Generating your advertisement..." : "Generation complete!"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left side: Process steps */}
              <div className="lg:col-span-1">
                <Card className="border-gray-100 shadow-sm overflow-hidden rounded-xl">
                  <CardHeader className="bg-white border-b border-gray-100 pb-4">
                    <CardTitle className="text-lg text-gray-800">Generation Process</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {steps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-4">
                          {renderStepIcon(step)}
                          <div className="flex-1">
                            <p
                              className={`font-medium ${
                                step.status === "processing"
                                  ? "text-blue-600"
                                  : step.status === "completed"
                                    ? "text-green-600"
                                    : step.status === "error"
                                      ? "text-red-600"
                                      : "text-gray-600"
                              }`}
                            >
                              {step.message}
                            </p>
                            {step.details && <p className="text-xs text-gray-500 mt-1">{step.details}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t border-gray-100 p-4">
                    <div className="flex items-center justify-between w-full text-sm">
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Generated just now</span>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        {size}
                      </Badge>
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Right side: Results */}
              <div className="lg:col-span-2">
                <Card className="border-gray-100 shadow-sm overflow-hidden rounded-xl">
                  <CardHeader className="bg-white border-b border-gray-100 pb-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg text-gray-800">Generated Advertisement</CardTitle>
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
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
                      </Tabs>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsContent value="preview" className="m-0">
                        {error ? (
                          <div className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-red-600"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-red-600 mb-2">Error Generating Ad</h3>
                            <p className="text-gray-600">{error}</p>
                            <Button variant="outline" onClick={handleBackToHome} className="mt-6 rounded-full" />
                          </div>
                        ) : generatedImage ? (
                          <Image
                            src={`data:image/png;base64,${generatedImage}`}
                            alt="Generated Ad"
                            width={512}
                            height={512}
                            className="w-full aspect-square object-cover rounded-md"
                          />
                        ) : (
                          <div className="p-8 text-center">
                            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500">Generating your advertisement...</p>
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="details" className="m-0">
                        {extractionResult && <ExtractionResultDisplay result={extractionResult} />}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t border-gray-100 p-4">
                    <div className="flex items-center justify-between w-full">
                      {generatedImage ? (
                        <Button onClick={handleDownload} className="rounded-full">
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                      ) : (
                        <Button variant="secondary" disabled className="rounded-full">
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                      )}
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" className="rounded-full">
                          <Share2 className="mr-2 h-4 w-4" /> Share
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
