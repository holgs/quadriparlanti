import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ResetPasswordForm } from "./reset-form"
import { getSiteUrl } from '@/lib/utils'

export default async function ResetPasswordPage() {
    const supabase = await createClient()

    // Get current user to verify the session
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // If no user/session found, the token is invalid or expired
    if (!user) {
        redirect("/login?error=invalid_token")
    }

    // Render the client form with user email
    return <ResetPasswordForm email={user.email} />
}
