"use client"

import { History, Menu } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 overflow-hidden rounded-lg">
            <Image
              src="/images/shopos-logo-blue.png"
              alt="ShopOS Logo"
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
          <Link href="/" className="flex items-center">
            <span className="font-bold text-xl text-blue-600">ShopOS AdCreator</span>
          </Link>
        </div>

        <div className="flex items-center space-x-1">
          {pathname !== "/" && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Templates
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex items-center text-gray-600 hover:text-gray-900 bg-blue-50 hover:bg-blue-100 rounded-full px-4"
          >
            <Link href="/history" className="flex items-center">
              <History className="mr-1 h-4 w-4" />
              History
            </Link>
          </Button>
        </div>

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {pathname !== "/" && (
                <DropdownMenuItem asChild>
                  <Link href="/">Templates</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/history" className="flex items-center">
                  <History className="mr-2 h-4 w-4" />
                  History
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
