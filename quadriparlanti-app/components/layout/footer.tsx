import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Accesso
          </Link>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Liceo Leonardo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
