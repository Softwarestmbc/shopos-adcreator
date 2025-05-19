"use client"

import { useState, useEffect } from "react"
import { Header } from "../components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Download, Trash2, Filter, Search, ImageIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { templates } from "../config/templates"

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

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("all")
  const [userHistory, setUserHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load history from localStorage when component mounts
  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem("adHistory") || "[]") as HistoryItem[]
      setUserHistory(savedHistory)
    } catch (error) {
      console.error("Error loading history from localStorage:", error)
      // If there's an error, set an empty array
      setUserHistory([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle deleting an item from history
  const handleDeleteItem = (id: string | number) => {
    const updatedHistory = userHistory.filter((item) => item.id !== id)
    setUserHistory(updatedHistory)

    // Update localStorage
    try {
      localStorage.setItem("adHistory", JSON.stringify(updatedHistory))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  }

  // Handle clearing all history
  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all history? This action cannot be undone.")) {
      setUserHistory([])
      localStorage.removeItem("adHistory")
    }
  }

  // Handle downloading an image
  const handleDownload = (imageUrl: string, productName: string) => {
    // For base64 images
    if (imageUrl.startsWith("data:")) {
      const link = document.createElement("a")
      link.href = imageUrl
      link.download = `${productName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // For regular URLs, open in new tab (can't download directly due to CORS)
      window.open(imageUrl, "_blank")
    }
  }

  // Filter history based on search and template filter
  const filteredHistory = userHistory.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brandName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTemplate = selectedTemplate === "all" || item.templateId === selectedTemplate

    // Filter by tab
    if (activeTab === "recent") {
      // Get items from the last 24 hours
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const itemDate = new Date(`${item.date} ${item.time}`)
      return matchesSearch && matchesTemplate && itemDate >= yesterday
    } else if (activeTab === "favorites") {
      // In a real app, you'd have a favorites flag
      // For now, let's just show a subset of items
      return matchesSearch && matchesTemplate && Number.parseInt(String(item.id)) % 2 === 0
    }

    return matchesSearch && matchesTemplate
  })

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Ad History</h1>
              <p className="mt-2 text-gray-600">View and manage your previously generated advertisements</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-gray-100 p-1 rounded-full">
                  <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-white">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="recent" className="rounded-full data-[state=active]:bg-white">
                    Recent
                  </TabsTrigger>
                  <TabsTrigger value="favorites" className="rounded-full data-[state=active]:bg-white">
                    Favorites
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-10 bg-white border-gray-200 rounded-full"
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex-1 sm:w-48">
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="w-full bg-white border-gray-200 rounded-full">
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="Filter by template" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Templates</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredHistory.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm text-gray-500">
                    Showing {filteredHistory.length} {filteredHistory.length === 1 ? "item" : "items"}
                  </p>
                  {userHistory.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearHistory}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200 rounded-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Clear All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredHistory.map((item) => {
                    const template = templates.find((t) => t.id === item.templateId)

                    return (
                      <Card
                        key={item.id}
                        className="overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-all rounded-xl"
                      >
                        <div className="relative aspect-square w-full overflow-hidden">
                          {item.imageUrl ? (
                            <div className="w-full h-full relative">
                              <Image
                                src={item.imageUrl || "/placeholder.svg"}
                                alt={item.productName}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  // Fallback to template image if the actual image fails to load
                                  const target = e.target as HTMLImageElement
                                  target.src = template?.imageSrc || "/images/template-adcreator.png"
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="h-10 w-10 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <h3 className="font-medium text-white">{item.productName}</h3>
                              <p className="text-sm text-white/80">{item.brandName}</p>
                            </div>
                          </div>
                          <Badge className="absolute top-2 right-2 bg-white/80 text-blue-600 backdrop-blur-sm">
                            {template?.category || "Template"}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>
                                {item.date} at {item.time}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-gray-200 text-gray-700 rounded-full"
                              onClick={() => handleDownload(item.imageUrl, item.productName)}
                            >
                              <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-200 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            ) : (
              <Card className="border-gray-100 shadow-sm rounded-xl">
                <CardContent className="flex flex-col items-center justify-center p-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No generations found</h3>
                  <p className="text-gray-600 text-center mb-6">
                    {searchQuery || selectedTemplate !== "all"
                      ? "No items match your search criteria. Try adjusting your filters."
                      : "You haven't created any ads yet. Start by creating your first ad."}
                  </p>
                  <Button asChild className="rounded-full bg-blue-500 hover:bg-blue-600">
                    <Link href="/">Create New Ad</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
