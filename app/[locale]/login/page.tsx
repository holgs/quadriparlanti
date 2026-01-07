"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sparkles } from "lucide-react"
import { login } from "@/lib/actions/auth.actions"
import Image from "next/image"

export default function LoginPage() {
  const t = useTranslations("login")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await login({ email, password })

    if (!result.success) {
      setError(result.error!)
      setIsLoading(false)
    } else {
      // Redirect based on role
      if (result.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/teacher")
      }
    }
  }

  // ... inside component

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="relative h-12 w-12 overflow-hidden rounded-lg">
          <Image
            src="/logo.jpg"
            alt="ISI Carlo Piaggia"
            fill
            className="object-cover"
          />
        </div>
        <span className="text-2xl font-bold text-gradient">
          ISI Carlo Piaggia
        </span>
      </Link>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t('title')}</CardTitle>
          <CardDescription>
            {t('subtitle')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t('emailLabel')}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  {t('passwordLabel')}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? t('submitting') : t('submit')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/"
              className="hover:text-primary transition-colors"
            >
              ← {t('backToHome')}
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} ISI Carlo Piaggia - Viareggio. Tutti i diritti riservati.
      </p>
    </div>
  )
}
