"use client"

import { CheckCircle2, AlertCircle, ChevronRight } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { ExtractionResult } from "../actions/extract-product-info"

interface ExtractionResultDisplayProps {
  result: ExtractionResult | null
  showCard?: boolean
}

export function ExtractionResultDisplay({ result, showCard = true }: ExtractionResultDisplayProps) {
  if (!result) return null

  const Content = () => (
    <>
      {result.success && (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1">
            <TabsTrigger value="summary" className="data-[state=active]:bg-white">
              Summary
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-white">
              JSON Data
            </TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-4 space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
              <h3 className="font-medium mb-3 text-primary">Product Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Product:</span>
                  <span className="text-sm text-gray-600">{result.productInfo.productName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Brand:</span>
                  <span className="text-sm text-gray-600">{result.productInfo.brandName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Headline:</span>
                  <span className="text-sm text-gray-600">{result.productInfo.headline}</span>
                </div>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="benefits" className="border-gray-200">
                <AccordionTrigger className="text-sm font-medium text-gray-700 py-3 hover:no-underline">
                  Product Benefits
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {result.productInfo.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <span className="font-medium text-gray-700">{benefit.name}:</span>{" "}
                          <span className="text-gray-600">{benefit.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {result.productInfo.productImageAnalysis && (
                <AccordionItem value="analysis" className="border-gray-200">
                  <AccordionTrigger className="text-sm font-medium text-gray-700 py-3 hover:no-underline">
                    Image Analysis
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-gray-600">{result.productInfo.productImageAnalysis}</p>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </TabsContent>

          <TabsContent value="details">
            <div className="mt-4 rounded-lg bg-gray-50 p-4 max-h-60 overflow-y-auto border border-gray-100">
              <pre className="text-xs whitespace-pre-wrap text-gray-700">
                {JSON.stringify(result.productInfo, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </>
  )

  if (!showCard) {
    return <Content />
  }

  return (
    <Card className={`${result.success ? "border-green-100" : "border-red-100"} shadow-sm`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <CardTitle className="text-lg">{result.success ? "Information Extracted" : "Extraction Failed"}</CardTitle>
          </div>
          {result.source && (
            <Badge variant="outline" className="ml-auto bg-blue-50 text-primary border-blue-200">
              {result.source}
            </Badge>
          )}
        </div>
        <CardDescription>
          {result.success
            ? "Product information was successfully extracted."
            : result.error || "Failed to extract product information."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <Content />
      </CardContent>
    </Card>
  )
}
