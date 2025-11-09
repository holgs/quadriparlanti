import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ArrowLeft, FileText, Video, Image as ImageIcon, Link2 } from "lucide-react"

// Mock data - will be replaced with actual data fetching
const themeData = {
  title_it: "Progetto Sandro Pertini",
  title_en: "Sandro Pertini Project",
  description_it: "Un'esplorazione multidisciplinare della vita, del pensiero e dell'eredità del Presidente Sandro Pertini attraverso progetti creativi e ricerche approfondite degli studenti.",
  description_en: "A multidisciplinary exploration of President Sandro Pertini's life, thought, and legacy through creative student projects and in-depth research.",
}

const works = [
  {
    id: 1,
    title_it: "La Costituzione Italiana - Un Podcast",
    title_en: "The Italian Constitution - A Podcast",
    class_name: "4ALS",
    school_year: "2025-26",
    type: "audio",
    icon: Video
  },
  {
    id: 2,
    title_it: "Sandro Pertini: Una Vita in Foto",
    title_en: "Sandro Pertini: A Life in Photos",
    class_name: "3BLS",
    school_year: "2025-26",
    type: "image",
    icon: ImageIcon
  },
  {
    id: 3,
    title_it: "Analisi dei Discorsi di Pertini",
    title_en: "Analysis of Pertini's Speeches",
    class_name: "5CLS",
    school_year: "2025-26",
    type: "pdf",
    icon: FileText
  },
  {
    id: 4,
    title_it: "Il Legacy di Pertini: Un Documentario",
    title_en: "The Pertini Legacy: A Documentary",
    class_name: "4DLS",
    school_year: "2025-26",
    type: "video",
    icon: Video
  },
  {
    id: 5,
    title_it: "Le Lettere di Pertini: Una Collezione",
    title_en: "Pertini's Letters: A Collection",
    class_name: "3ELS",
    school_year: "2025-26",
    type: "link",
    icon: Link2
  },
]

export default function ThemeDetailPage({ params }: { params: { slug: string } }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section with Theme Image */}
        <section className="relative overflow-hidden">
          <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
          </div>
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
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
                {themeData.title_it}
              </h1>
              <p className="max-w-3xl text-lg text-muted-foreground">
                {themeData.description_it}
              </p>
            </div>
          </div>
        </section>

        {/* Works List */}
        <section className="py-8">
          <div className="container">
            <h2 className="mb-6 text-2xl font-bold">Student Works ({works.length})</h2>

            <div className="grid gap-4">
              {works.map((work) => (
                <Link key={work.id} href={`/works/${work.id}`}>
                  <Card className="group transition-all hover:shadow-lg hover:border-primary/50">
                    <div className="flex items-center gap-4 p-6">
                      {/* Icon */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <work.icon className="h-6 w-6" />
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
              ))}
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
