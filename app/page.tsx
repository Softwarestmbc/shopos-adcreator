import { Search, Sparkles } from "lucide-react"
import { TemplateCard } from "./components/template-card"
import { templates } from "./config/templates"
import { Header } from "./components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1">
        <div className="container py-16 px-4 md:px-6">
          {/* Hero Section */}
          <div className="mx-auto max-w-4xl text-center mb-16">
            <Badge className="mb-6 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors py-1.5 px-3 rounded-full">
              <Sparkles className="mr-1 h-3 w-3" /> AI-Powered Ad Creation
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-blue-600 mb-6">
              Create Beautiful Ads in Minutes
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform your brand into stunning advertisements with our AI-powered platform. No design skills needed.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-3xl mx-auto mb-16">
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                className="pl-12 pr-12 py-6 rounded-full border-gray-200 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
                placeholder="Search for ad templates (e.g., product, social media, skincare)..."
              />
              <Button
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 bg-blue-50 hover:bg-blue-100 text-blue-600"
              >
                <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M7.5 0C7.77614 0 8 0.223858 8 0.5V7H14.5C14.7761 7 15 7.22386 15 7.5C15 7.77614 14.7761 8 14.5 8H8V14.5C8 14.7761 7.77614 15 7.5 15C7.22386 15 7 14.7761 7 14.5V8H0.5C0.223858 8 0 7.77614 0 7.5C0 7.22386 0.223858 7 0.5 7H7V0.5C7 0.223858 7.22386 0 7.5 0Z"
                    fill="currentColor"
                  />
                </svg>
              </Button>
            </div>
          </div>

          {/* Templates Section */}
          <div className="mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800">Choose a Template</h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                >
                  <path
                    d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.0749 12.975 13.8623 12.975 13.5999C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  ></path>
                </svg>
                8 templates available
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  id={template.id}
                  title={template.title}
                  imageSrc={template.imageSrc}
                  description={template.description}
                  category={template.category}
                  backgroundColor={template.backgroundColor}
                />
              ))}
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mt-24 mx-auto max-w-5xl">
            <h2 className="text-2xl font-semibold text-center mb-12 text-gray-800">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-6 text-blue-600">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-medium text-lg text-gray-800 mb-3">Select Template</h3>
                <p className="text-gray-600">
                  Choose from our professionally designed templates for your product or service
                </p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h3 className="font-medium text-lg text-gray-800 mb-3">Upload Product</h3>
                <p className="text-gray-600">Upload your product image and website URL to extract key information</p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h3 className="font-medium text-lg text-gray-800 mb-3">Generate Ad</h3>
                <p className="text-gray-600">
                  Our AI creates a professional ad in seconds that you can download and use
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="container text-center text-sm text-gray-500">
          <p>© 2025 AdCreator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
