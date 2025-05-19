"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useState } from "react"
import { ImageIcon } from "lucide-react"

interface TemplateCardProps {
  id: string
  title: string
  imageSrc: string
  description: string
  category?: string
  backgroundColor?: string
}

export function TemplateCard({
  id,
  title,
  imageSrc,
  description,
  category,
  backgroundColor = "#f5f5f5",
}: TemplateCardProps) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleClick = () => {
    router.push(`/create?template=${id}`)
  }

  const handleImageError = () => {
    console.error(`Failed to load image: ${imageSrc}`)
    setImageError(true)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  // Fallback to a default image if the specified image source fails
  const getFallbackImageSrc = () => {
    if (id === "product-showcase") {
      return "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-Wu3DAYco1jsT3Qjz9Bidxj761bkJae.png" // Direct URL as fallback for product showcase
    }
    return "/images/template-adcreator.png" // Default fallback
  }

  return (
    <div className="flex flex-col">
      {/* Image Card */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 500, damping: 10, mass: 0.5 }}
        onClick={handleClick}
        className="cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all duration-150"
        style={{ backgroundColor }}
      >
        <div className="relative aspect-square w-full overflow-hidden">
          <motion.div
            className="w-full h-full"
            whileHover={{ scale: 1.08 }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              </div>
            )}

            {imageError ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{title}</p>
                </div>
              </div>
            ) : (
              <Image
                src={imageSrc || getFallbackImageSrc()}
                alt={title}
                fill
                className="object-cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={true}
              />
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Description below the card */}
      <div className="mt-3 px-1">
        <h3 className="font-medium text-base text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  )
}
