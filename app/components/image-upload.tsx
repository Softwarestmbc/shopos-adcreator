"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, ImageIcon, Camera, FileUp } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ImageUploadProps {
  onImageSelect: (base64: string) => void
  className?: string
}

export function ImageUpload({ onImageSelect, className = "" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const processFile = (file: File) => {
    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setPreview(base64)
      onImageSelect(base64)
      setIsLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleClear = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onImageSelect("")
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className={cn("relative", className)}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {preview ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden border-gray-100 shadow-sm rounded-xl">
            <CardContent className="p-0 relative">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                <Image src={preview || "/placeholder.svg"} alt="Uploaded image" fill className="object-cover" />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all",
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50",
            "cursor-pointer",
          )}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base font-medium text-gray-700">Processing image...</h3>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base font-medium text-gray-700">Upload product image</h3>
              <p className="text-sm text-gray-500">Drag and drop or click to upload</p>
              <div className="mt-2">
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 rounded-full">
                  <FileUp className="mr-2 h-4 w-4" />
                  Browse Files
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
