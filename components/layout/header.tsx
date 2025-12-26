"use client"

import Link from "next/link"
import { Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"

import Image from "next/image"

export function Header() {
  const t = useTranslations("nav")
  const tHeader = useTranslations("header")

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg">
              <Image
                src="/logo.jpg"
                alt="ISI Carlo Piaggia"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              ISI Carlo Piaggia
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/themes"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {t('themes')}
            </Link>
            <Link
              href="/works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {t('myWorks').replace('I miei ', '')}
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {t('about')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={tHeader('searchPlaceholder')}
              className="pl-9"
            />
          </div>
          <ThemeToggle />
          <Button variant="outline" asChild className="hidden sm:inline-flex">
            <Link href="/login">{tHeader('access')}</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
