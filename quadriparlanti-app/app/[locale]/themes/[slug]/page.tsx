import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ArrowLeft, FileText, ExternalLink } from "lucide-react"
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

    // If already a valid URL, return it
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }

    const { data: { publicUrl } } = supabase.storage
      .from('theme-images')
      .getPublicUrl(imagePath)

    // Validate URL - must start with http:// or https://
    if (publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://'))) {
      return publicUrl
    }

    return null
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

        {/* Works Table */}
        <section className="py-12">
          <div className="container">
            <h2 className="mb-8 text-2xl font-bold">Student Works ({works.length})</h2>

            {works.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Class</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Year</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Teacher</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Published</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold">Views</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {works.map((work: any) => (
                      <tr key={work.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="px-6 py-4 text-sm font-medium">{work.title_it}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{work.class_name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{work.school_year}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{work.teacher_name || "—"}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {work.published_at ? new Date(work.published_at).toLocaleDateString('it-IT') : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-muted-foreground">{work.view_count || 0}</td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/works/${work.id}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <ExternalLink className="h-4 w-4" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mx-auto max-w-md rounded-lg border border-dashed py-12 text-center">
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
            )}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
