import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ArrowRight, Sparkles, QrCode, Globe, Shield } from "lucide-react"
import { getRecentWorks } from "@/lib/data/works"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const recentWorks = await getRecentWorks(6)
  const supabase = await createClient()

  // Helper to get image URL for a work (uses theme image)
  const getWorkImageUrl = (work: any) => {
    // Use theme image
    const themeImageUrl = work.work_themes?.[0]?.themes?.featured_image_url
    if (themeImageUrl) {
      if (themeImageUrl.startsWith('http://') || themeImageUrl.startsWith('https://')) {
        return themeImageUrl
      }

      const { data: { publicUrl } } = supabase.storage
        .from('theme-images')
        .getPublicUrl(themeImageUrl)

      // Validate URL - must start with http:// or https://
      if (publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://'))) {
        return publicUrl
      }
    }

    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="container relative">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Showcasing Student Creativity
              </div>
              <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Bringing{" "}
                <span className="text-gradient">Student Work</span>{" "}
                to Life
              </h1>
              <p className="mb-10 text-lg text-muted-foreground md:text-xl">
                Explore diverse projects from talented students across all departments.
                Scan QR codes to discover the stories behind physical displays.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild className="group">
                  <Link href="/themes">
                    Explore Projects
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/50">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
              How It Works
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <CardTitle>Scan QR Codes</CardTitle>
                  <CardDescription>
                    Find QR codes next to physical artworks displayed throughout the school corridors
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Globe className="h-6 w-6" />
                  </div>
                  <CardTitle>Explore Content</CardTitle>
                  <CardDescription>
                    Access rich multimedia content including videos, PDFs, presentations, and images
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Shield className="h-6 w-6" />
                  </div>
                  <CardTitle>Privacy First</CardTitle>
                  <CardDescription>
                    Student privacy protected - no personal data or faces visible to public
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Recent Works Section */}
        <section className="py-16">
          <div className="container">
            <div className="mb-12 flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Recent Uploads
              </h2>
              <Button variant="ghost" asChild>
                <Link href="/works">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentWorks.length > 0 ? (
                recentWorks.map((work) => {
                  const imageUrl = getWorkImageUrl(work)

                  return (
                    <Link key={work.id} href={`/works/${work.id}`}>
                      <Card className="group overflow-hidden transition-all hover:shadow-xl">
                        <div className="relative aspect-square overflow-hidden bg-gradient-card">
                          {imageUrl ? (
                            <>
                              <Image
                                src={imageUrl}
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
                              <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
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
                })
              ) : (
                // Fallback for empty state
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="relative aspect-square overflow-hidden bg-gradient-card">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="rounded-lg bg-background/90 p-3 backdrop-blur-sm">
                          <div className="h-5 w-3/4 bg-muted animate-pulse rounded mb-2"></div>
                          <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div className="mt-12 text-center">
              <Button size="lg" variant="outline" asChild>
                <Link href="/works">View All Projects</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10"></div>
          <div className="container relative">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Ready to Explore?
              </h2>
              <p className="mb-10 text-lg text-muted-foreground">
                Discover amazing student projects organized by themes and departments
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/themes">Browse Themes</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/works">All Works</Link>
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
