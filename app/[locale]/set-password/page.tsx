"use client"

/**
 * Set Password Page
 * Allows teachers to set their password after accepting an invite
 * or to reset their password after requesting a password reset
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Eye, EyeOff } from "lucide-react"
import { updatePassword } from "@/lib/actions/auth.actions"
import { toast } from "sonner"

export default function SetPasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation
    if (newPassword.length < 8) {
      setError("La password deve avere almeno 8 caratteri")
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Le password non corrispondono")
      setIsLoading(false)
      return
    }

    // Update password
    const result = await updatePassword(newPassword)

    if (!result.success) {
      setError(result.error || "Errore durante l'aggiornamento della password")
      setIsLoading(false)
      return
    }

    // Success
    toast.success("Password impostata con successo!")

    // Redirect to teacher dashboard after a brief delay
    setTimeout(() => {
      router.push("/teacher")
    }, 1000)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-gradient">
          ISI Carlo Piaggia
        </span>
      </Link>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Imposta Password</CardTitle>
          <CardDescription>
            Scegli una password sicura per il tuo account
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
              <Label htmlFor="newPassword">Nuova Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Inserisci password (minimo 8 caratteri)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Conferma la password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <p className="font-medium mb-1">Requisiti password:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Minimo 8 caratteri</li>
                <li>Usa una combinazione di lettere e numeri</li>
                <li>Considera l&apos;uso di caratteri speciali</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Impostazione..." : "Imposta Password"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="hover:text-primary transition-colors"
            >
              ← Torna al login
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} ISI Carlo Piaggia. All rights reserved.
      </p>
    </div>
  )
}
