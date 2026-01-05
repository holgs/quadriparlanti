"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { adminUpdateUserPassword } from "@/lib/actions/teachers.actions"

interface ChangePasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string | null
    userName: string | null
}

export function ChangePasswordDialog({
    open,
    onOpenChange,
    userId,
    userName,
}: ChangePasswordDialogProps) {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!userId) return

        if (newPassword.length < 8) {
            toast.error("La password deve avere almeno 8 caratteri")
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error("Le password non corrispondono")
            return
        }

        setIsLoading(true)

        try {
            const result = await adminUpdateUserPassword(userId, newPassword)

            if (result.success) {
                toast.success("Password aggiornata con successo")
                onOpenChange(false)
                setNewPassword("")
                setConfirmPassword("")
            } else {
                toast.error(result.error || "Errore durante l'aggiornamento della password")
            }
        } catch (error) {
            toast.error("Si è verificato un errore inatteso")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cambia Password</DialogTitle>
                    <DialogDescription>
                        Imposta manualmente una nuova password per <b>{userName}</b>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Nuova Password</Label>
                        <div className="relative">
                            <Input
                                id="new-password"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Minimo 8 caratteri"
                                minLength={8}
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                        <Label htmlFor="confirm-password">Conferma Password</Label>
                        <Input
                            id="confirm-password"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ripeti la password"
                            minLength={8}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Annulla
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Aggiornamento..." : "Aggiorna Password"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
