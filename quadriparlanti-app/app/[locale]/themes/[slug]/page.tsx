import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ArrowLeft, FileText } from "lucide-react"
import { getThemeBySlug } from "@/lib/data/themes"
import { createClient } from "@/lib/supabase/server"

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

  // Helper to get image URL for a work
  const getWorkImageUrl = (work: any) => {
    // Try to get first image attachment
    const imageAttachment = work.work_attachments?.find((att: any) => att.file_type === 'image')

    if (imageAttachment) {
      const { data: { publicUrl } } = supabase.storage
        .from('work-attachments')
        .getPublicUrl(imageAttachment.storage_path)
      return publicUrl
    }

    // Fallback to theme image
    if (theme.featured_image_url) {
      return imageUrl
    }

    return null
  }

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

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {works.map((work: any) => {
                const workImageUrl = getWorkImageUrl(work)

                return (
                  <Link key={work.id} href={`/works/${work.id}`}>
                    <Card className="group overflow-hidden transition-all hover:shadow-xl">
                      <div className="relative aspect-square overflow-hidden bg-gradient-card">
                        {workImageUrl ? (
                          <>
                            <Image
                              src={workImageUrl}
                              alt={work.title_it}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
                        )}
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="rounded-lg bg-background/90 p-3 backdrop-blur-sm">
                            <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-1">
                              {work.title_it}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {work.class_name} • {work.school_year}
                            </p>
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
