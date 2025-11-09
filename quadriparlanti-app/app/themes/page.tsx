import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Palette, Atom, Cpu, ArrowRight } from "lucide-react"

const themes = [
  {
    id: 1,
    slug: "sandro-pertini-project",
    title_it: "Progetto Sandro Pertini",
    title_en: "Sandro Pertini Project",
    description_it: "Esplorazione della vita e del legacy del Presidente Pertini attraverso progetti multidisciplinari",
    description_en: "Exploring the life and legacy of President Pertini through multidisciplinary projects",
    department: "Artistic",
    icon: Palette,
    worksCount: 12,
    color: "from-purple-500 to-pink-500"
  },
  {
    id: 2,
    slug: "scientific-innovation",
    title_it: "Innovazione Scientifica",
    title_en: "Scientific Innovation",
    description_it: "Progetti di ricerca scientifica e sperimentazione sportiva",
    description_en: "Scientific research projects and sports experimentation",
    department: "Scientific-Sports",
    icon: Atom,
    worksCount: 8,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: 3,
    slug: "technical-excellence",
    title_it: "Eccellenza Tecnica",
    title_en: "Technical Excellence",
    description_it: "Progetti di robotica, programmazione e ingegneria",
    description_en: "Robotics, programming and engineering projects",
    department: "Technical",
    icon: Cpu,
    worksCount: 15,
    color: "from-orange-500 to-red-500"
  },
]

export default function ThemesPage() {
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
              {themes.map((theme) => (
                <Link key={theme.id} href={`/themes/${theme.slug}`}>
                  <Card className="group relative overflow-hidden border-none shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${theme.color} opacity-10 transition-opacity group-hover:opacity-20`}></div>

                    <div className="relative p-6">
                      {/* Icon */}
                      <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${theme.color} text-white shadow-lg`}>
                        <theme.icon className="h-7 w-7" />
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        <h3 className="mb-2 text-2xl font-bold group-hover:text-primary transition-colors">
                          {theme.title_it}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {theme.department}
                        </p>
                      </div>

                      <p className="mb-6 text-sm text-muted-foreground line-clamp-2">
                        {theme.description_it}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          {theme.worksCount} works
                        </span>
                        <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                          View Theme
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted/50">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Can't find what you're looking for?
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
