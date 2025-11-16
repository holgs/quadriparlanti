import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ArrowLeft, FileText, Video, Image as ImageIcon, Link2, File } from "lucide-react"
import { getThemeBySlug } from "@/lib/data/themes"
import { createClient } from "@/lib/supabase/server"

// Helper to determine icon based on work attachments
const getWorkIcon = (work: any) => {
  // This would be more sophisticated in production
  // For now, rotate through icons
  const icons = [FileText, Video, ImageIcon, Link2, File]
  return icons[work.id % icons.length]
}

export default async function ThemeDetailPage({
  params
}: {
  params: { slug: string }
}) {
  const theme = await getThemeBySlug(params.slug)

  if (!theme) {
    notFound()
  }

  const supabase = await createClient()

  // Get image URL if available
  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath

    const { data: { publicUrl } } = supabase.storage
      .from('theme-images')
      .getPublicUrl(imagePath)

    return publicUrl
  }

  const imageUrl = getImageUrl(theme.featured_image_url)
  const works = theme.works || []

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section with Theme Image */}
        <section className="relative overflow-hidden">
          {imageUrl ? (
            <div className="relative h-64 md:h-80">
              <Image
                src={imageUrl}
                alt={theme.title_it}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background"></div>

              {/* Title overlay on image */}
              <div className="absolute inset-0 flex items-end">
                <div className="container pb-8">
                  <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl text-white drop-shadow-lg">
                    {theme.title_it}
                  </h1>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
            </div>
          )}
        </section>

        {/* Theme Info */}
        <section className="py-8">
          <div className="container">
            <Button variant="ghost" size="sm" asChild className="mb-6">
              <Link href="/themes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Themes
              </Link>
            </Button>

            <div className="mb-8">
              {/* Only show title if no image (otherwise it's in the hero overlay) */}
              {!imageUrl && (
                <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
                  {theme.title_it}
                </h1>
              )}
              <p className="max-w-3xl text-lg text-muted-foreground">
                {theme.description_it}
              </p>
            </div>
          </div>
        </section>

        {/* Works List */}
        <section className="py-8">
          <div className="container">
            <h2 className="mb-6 text-2xl font-bold">Student Works ({works.length})</h2>

            <div className="grid gap-4">
              {works.map((work: any) => {
                const Icon = getWorkIcon(work)

                return (
                  <Link key={work.id} href={`/works/${work.id}`}>
                    <Card className="group transition-all hover:shadow-lg hover:border-primary/50">
                      <div className="flex items-center gap-4 p-6">
                        {/* Icon */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <Icon className="h-6 w-6" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="mb-1 font-semibold group-hover:text-primary transition-colors truncate">
                            {work.title_it}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {work.class_name} • {work.school_year}
                          </p>
                        </div>

                        {/* Arrow */}
                        <div className="shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            <ArrowLeft className="h-4 w-4 rotate-180" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Empty State Example (hidden when works exist) */}
        {works.length === 0 && (
          <section className="py-16">
            <div className="container">
              <div className="mx-auto max-w-md text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-semibold">No works yet</h3>
                <p className="text-muted-foreground">
                  There are no published works for this theme at the moment.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
