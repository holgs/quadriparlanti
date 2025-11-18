import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Palette, Atom, Cpu, ArrowRight, Sparkles } from "lucide-react"
import { getThemes } from "@/lib/data/themes"
import { createClient } from "@/lib/supabase/server"

// Icon mapping helper
const getIconForTheme = (index: number) => {
  const icons = [Palette, Atom, Cpu, Sparkles]
  return icons[index % icons.length]
}

// Color mapping helper
const getColorForTheme = (index: number) => {
  const colors = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-orange-500 to-red-500",
    "from-green-500 to-emerald-500"
  ]
  return colors[index % colors.length]
}

export default async function ThemesPage() {
  const themes = await getThemes()
  const supabase = await createClient()

  // Helper to get image URL
  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath

    const { data: { publicUrl } } = supabase.storage
      .from('theme-images')
      .getPublicUrl(imagePath)

    return publicUrl
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="container relative">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                Explore <span className="text-gradient">Themes</span>
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Browse student work organized by themes and departments
              </p>
            </div>
          </div>
        </section>

        {/* Themes Grid */}
        <section className="py-16">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {themes.length > 0 ? (
                themes.map((theme, index) => {
                  const Icon = getIconForTheme(index)
                  const color = getColorForTheme(index)
                  const imageUrl = getImageUrl(theme.featured_image_url)

                  return (
                    <Link key={theme.id} href={`/themes/${theme.slug}`}>
                      <Card className="group relative overflow-hidden border-none shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
                        {/* Theme Image or Gradient Background */}
                        {imageUrl ? (
                          <div className="relative h-48 w-full overflow-hidden">
                            <Image
                              src={imageUrl}
                              alt={theme.title_it}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          </div>
                        ) : (
                          <div className={`h-48 bg-gradient-to-br ${color} opacity-20`}></div>
                        )}

                        <div className="relative p-6">
                          {/* Icon (only if no image) */}
                          {!imageUrl && (
                            <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}>
                              <Icon className="h-7 w-7" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="mb-4">
                            <h3 className="mb-2 text-2xl font-bold group-hover:text-primary transition-colors">
                              {theme.title_it}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Theme {index + 1}
                            </p>
                          </div>

                          <p className="mb-6 text-sm text-muted-foreground line-clamp-2">
                            {theme.description_it}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              {theme.worksCount} {theme.worksCount === 1 ? 'work' : 'works'}
                            </span>
                            <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                              View Theme
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )
                })
              ) : (
                <div className="col-span-full text-center py-16">
                  <p className="text-muted-foreground">No themes available yet.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted/50">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Can&apos;t find what you&apos;re looking for?
              </h2>
              <p className="mb-8 text-muted-foreground">
                Browse all works or use the search function to find specific projects
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/works">Browse All Works</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/#search">Search Projects</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
