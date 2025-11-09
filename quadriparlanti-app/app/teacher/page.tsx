import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Plus, FileText, Clock, CheckCircle, XCircle } from "lucide-react"
import { getCurrentUser } from "@/lib/actions/auth.actions"
import { getWorksByTeacher } from "@/lib/data/works"

export default async function TeacherDashboard() {
  const user = await getCurrentUser()

  if (!user || !user.profile) {
    redirect("/login")
  }

  if (user.profile.role !== "docente" && user.profile.role !== "admin") {
    redirect("/")
  }

  const works = await getWorksByTeacher(user.id)

  const stats = {
    total: works.length,
    draft: works.filter(w => w.status === "draft").length,
    pending: works.filter(w => w.status === "pending_review").length,
    published: works.filter(w => w.status === "published").length,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Teacher Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user.profile.name}!
              </p>
            </div>

            <Button asChild size="lg">
              <Link href="/teacher/works/new">
                <Plus className="mr-2 h-4 w-4" />
                New Work
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Works</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.draft}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.published}</div>
              </CardContent>
            </Card>
          </div>

          {/* Works List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Works</CardTitle>
              <CardDescription>
                Manage and track all your student work submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {works.length > 0 ? (
                <div className="divide-y">
                  {works.map((work) => (
                    <div key={work.id} className="flex items-center justify-between py-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{work.title_it}</h3>
                        <p className="text-sm text-muted-foreground">
                          {work.class_name} • {work.school_year}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            work.status === "published"
                              ? "bg-success/10 text-success"
                              : work.status === "pending_review"
                              ? "bg-warning/10 text-warning"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {work.status}
                        </span>

                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/teacher/works/${work.id}`}>
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No works yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Get started by creating your first student work submission
                  </p>
                  <Button asChild>
                    <Link href="/teacher/works/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Work
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
