import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FileText, QrCode, TrendingUp, CheckCircle, Clock, Users } from "lucide-react"
import { isAdmin } from "@/lib/actions/auth.actions"
import { getPendingWorks } from "@/lib/data/works"

export default async function AdminDashboard() {
  const admin = await isAdmin()

  if (!admin) {
    redirect("/login")
  }

  const pendingWorks = await getPendingWorks()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage works, themes, and system settings
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Link href="/admin/works/pending">
              <Card className="group cursor-pointer transition-all hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                  <Clock className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingWorks.length}</div>
                  <p className="text-xs text-muted-foreground">Works awaiting approval</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/themes">
              <Card className="group cursor-pointer transition-all hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Themes</CardTitle>
                  <FileText className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">Manage themes</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/teachers">
              <Card className="group cursor-pointer transition-all hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">Manage teachers</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/qr">
              <Card className="group cursor-pointer transition-all hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
                  <QrCode className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">Generate & manage QR codes</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/analytics">
              <Card className="group cursor-pointer transition-all hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">View statistics</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Pending Works */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Work Reviews</CardTitle>
                  <CardDescription>
                    Review and approve student works submitted by teachers
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href="/admin/works/pending">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingWorks.length > 0 ? (
                <div className="divide-y">
                  {pendingWorks.slice(0, 5).map((work) => (
                    <div key={work.id} className="flex items-center justify-between py-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{work.title_it}</h3>
                        <p className="text-sm text-muted-foreground">
                          {work.class_name} • {work.school_year} • Submitted {new Date(work.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/works/${work.id}/review`}>
                            Review
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-success" />
                  <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No pending works to review at the moment
                  </p>
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
