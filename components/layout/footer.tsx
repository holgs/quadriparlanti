import Link from "next/link"
import { useTranslations } from "next-intl"

export function Footer() {
  const t = useTranslations("footer")
  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {t('access')}
          </Link>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ISI Carlo Piaggia - Viareggio. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
