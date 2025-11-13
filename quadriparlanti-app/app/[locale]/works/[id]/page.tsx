import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ArrowLeft, FileText, Download, ExternalLink, Eye, Calendar, User } from "lucide-react"
import { getWorkById } from "@/lib/data/works"

export default async function WorkDetailPage({
  params
}: {
  params: { id: string }
}) {
  const work = await getWorkById(params.id)

  if (!work) {
    notFound()
  }

  const themes = work.work_themes?.map((wt: any) => wt.themes).filter(Boolean) || []
  const attachments = work.work_attachments || []
  const links = work.work_links || []

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb & Meta */}
        <section className="border-b bg-muted/30 py-6">
          <div className="container">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href="/works">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Works
              </Link>
            </Button>

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <h1 className="mb-3 text-3xl font-extrabold tracking-tight md:text-4xl">
                  {work.title_it}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span>{work.class_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{work.school_year}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span>{work.view_count || 0} views</span>
                  </div>
                </div>
              </div>

              {themes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme: any) => (
                    <Link key={theme.id} href={`/themes/${theme.slug}`}>
                      <Button variant="outline" size="sm">
                        {theme.title_it}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="py-8">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-4 text-xl font-semibold">About This Work</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">
                  {work.description_it}
                </p>
              </div>

              {work.teacher_name && (
                <div className="mt-6 rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Teacher:</span> {work.teacher_name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Attachments */}
        {attachments.length > 0 && (
          <section className="border-t py-8 bg-muted/10">
            <div className="container">
              <div className="mx-auto max-w-4xl">
                <h2 className="mb-6 text-xl font-semibold">Attachments</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  {attachments.map((attachment: any) => (
                    <Card key={attachment.id} className="group hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-6 w-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                            {attachment.file_name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {attachment.file_type?.toUpperCase()} •{" "}
                            {(attachment.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        <Button size="sm" variant="ghost" asChild>
                          <a
                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/work-attachments/${attachment.storage_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* External Links */}
        {links.length > 0 && (
          <section className="border-t py-8">
            <div className="container">
              <div className="mx-auto max-w-4xl">
                <h2 className="mb-6 text-xl font-semibold">External Resources</h2>

                <div className="grid gap-4">
                  {links.map((link: any) => (
                    <Card key={link.id} className="group hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                          <ExternalLink className="h-6 w-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {link.title || "External Link"}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {link.link_type?.toUpperCase()} • {link.url}
                          </p>
                        </div>

                        <Button size="sm" asChild>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Visit
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* License Info */}
        {work.license && (
          <section className="border-t py-8 bg-muted/10">
            <div className="container">
              <div className="mx-auto max-w-4xl">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="mb-2 font-semibold">License</h3>
                  <p className="text-sm text-muted-foreground">
                    This work is licensed under: <span className="font-medium">{work.license}</span>
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tags */}
        {work.tags && work.tags.length > 0 && (
          <section className="border-t py-8">
            <div className="container">
              <div className="mx-auto max-w-4xl">
                <h3 className="mb-4 text-lg font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {work.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
