import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PreviewBanner } from "@/components/work-display/preview-banner"
import { ImageGallery } from "@/components/work-display/image-gallery"
import { PDFViewer } from "@/components/work-display/pdf-viewer"
import { VideoEmbed } from "@/components/work-display/video-embed"
import { LinkCard } from "@/components/work-display/link-card"
import { ArrowLeft, Eye, Calendar, User, GraduationCap } from "lucide-react"
import { getWorkByIdForPreview } from "@/lib/data/works"
import { createClient } from "@/lib/supabase/server"

export default async function WorkPreviewPage({
  params
}: {
  params: { id: string }
}) {
  // Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/login')
  }

  // Get work for preview
  const work = await getWorkByIdForPreview(params.id, user.id, userData.role)

  if (!work) {
    notFound()
  }

  const themes = work.work_themes?.map((wt: any) => wt.themes).filter(Boolean) || []
  const attachments = work.work_attachments || []
  const links = work.work_links || []

  // Separate attachments by type
  const imageAttachments = attachments.filter((att: any) =>
    att.file_type?.toLowerCase() === 'image' ||
    att.mime_type?.toLowerCase().startsWith('image/')
  )
  const pdfAttachments = attachments.filter((att: any) =>
    att.file_type?.toLowerCase() === 'pdf' ||
    att.mime_type?.toLowerCase().includes('pdf')
  )

  // Separate links by type
  const videoLinks = links.filter((link: any) =>
    ['youtube', 'vimeo'].includes(link.link_type?.toLowerCase())
  )
  const otherLinks = links.filter((link: any) =>
    !['youtube', 'vimeo'].includes(link.link_type?.toLowerCase())
  )

  const baseStorageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/work-attachments`

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Preview Banner */}
      <PreviewBanner workId={work.id} status={work.status} />

      <main className="flex-1">
        {/* Breadcrumb & Meta */}
        <section className="border-b bg-muted/30 py-6">
          <div className="container">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href={userData.role === 'admin' ? '/admin/works/pending' : '/teacher'}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
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
                    <Button key={theme.id} variant="outline" size="sm" disabled>
                      {theme.title_it}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="py-8 bg-muted/10">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-4 text-xl font-semibold">About This Work</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-line">
                  {work.description_it}
                </p>
              </div>

              {work.teacher_name && (
                <Card className="mt-6 bg-card">
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Supervised by</p>
                      <p className="font-medium">{work.teacher_name}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Images */}
        {imageAttachments.length > 0 && (
          <section className="border-t py-8 bg-muted/10">
            <div className="container">
              <div className="mx-auto max-w-4xl">
                <h2 className="mb-6 text-2xl font-bold">
                  Images {imageAttachments.length > 1 && `(${imageAttachments.length})`}
                </h2>
                <ImageGallery
                  images={imageAttachments}
                  baseUrl={baseStorageUrl}
                />
              </div>
            </div>
          </section>
        )}

        {/* PDF Documents */}
        {pdfAttachments.length > 0 && (
          <section className="border-t py-8">
            <div className="container">
              <div className="mx-auto max-w-4xl">
                <h2 className="mb-6 text-2xl font-bold">
                  Documents {pdfAttachments.length > 1 && `(${pdfAttachments.length})`}
                </h2>
                <div className="space-y-6">
                  {pdfAttachments.map((attachment: any) => (
                    <PDFViewer
                      key={attachment.id}
                      fileName={attachment.file_name}
                      fileUrl={`${baseStorageUrl}/${attachment.storage_path}`}
                      fileSize={attachment.file_size_bytes}
                      mimeType={attachment.mime_type}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Videos */}
        {videoLinks.length > 0 && (
          <section className="border-t py-8">
            <div className="container">
              <div className="mx-auto max-w-4xl">
                <h2 className="mb-6 text-2xl font-bold">Videos</h2>
                <div className="space-y-6">
                  {videoLinks.map((link: any) => (
                    <VideoEmbed
                      key={link.id}
                      url={link.url}
                      title={link.title}
                      linkType={link.link_type}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Other External Links */}
        {otherLinks.length > 0 && (
          <section className="border-t py-8 bg-muted/10">
            <div className="container">
              <div className="mx-auto max-w-4xl">
                <h2 className="mb-6 text-2xl font-bold">External Resources</h2>
                <div className="grid gap-4">
                  {otherLinks.map((link: any) => (
                    <LinkCard
                      key={link.id}
                      url={link.url}
                      title={link.title}
                      linkType={link.link_type}
                      description={link.preview_title}
                    />
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
