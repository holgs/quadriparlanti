import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ArrowRight } from "lucide-react"
import { getWorks } from "@/lib/data/works"
import { createClient } from "@/lib/supabase/server"

export default async function WorksPage() {
  const { works } = await getWorks({ limit: 100 })
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
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="container relative">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                Tutti i <span className="text-gradient">Lavori</span>
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Sfoglia tutti i progetti degli studenti organizzati per anno e classe
              </p>
            </div>
          </div>
        </section>

        {/* Works Grid */}
        <section className="py-16">
          <div className="container">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {works.length > 0 ? (
                works.map((work) => {
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
                <div className="col-span-full text-center py-16">
                  <p className="text-muted-foreground">Nessun lavoro disponibile al momento.</p>
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
                Cerchi qualcosa di specifico?
              </h2>
              <p className="mb-8 text-muted-foreground">
                Sfoglia i lavori per tema o usa la ricerca per trovare progetti
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/themes">Sfoglia per Tema</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/works?search=true">Cerca Progetti</Link>
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
