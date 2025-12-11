import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  FolderOpen, 
  FileCheck, 
  MessageSquare, 
  Receipt,
  Palette
} from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Client Management',
    description: 'Organize all your clients and their contacts in one place.',
  },
  {
    icon: FolderOpen,
    title: 'Project Tracking',
    description: 'Keep projects on track with status updates and timelines.',
  },
  {
    icon: FileCheck,
    title: 'Approval Workflows',
    description: 'Get client sign-off on deliverables with structured approvals.',
  },
  {
    icon: MessageSquare,
    title: 'Built-in Messaging',
    description: 'Communicate with clients without leaving the platform.',
  },
  {
    icon: Receipt,
    title: 'Invoicing',
    description: 'Create and send invoices, collect payments online.',
  },
  {
    icon: Palette,
    title: 'White-Label Portal',
    description: 'Your brand, your portal. Fully customizable for your agency.',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            The Client Portal Built for{' '}
            <span className="text-primary">Service Businesses</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop chasing clients for updates. Give them a branded portal where they can 
            see project progress, approve deliverables, and pay invoices — all in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                See Features
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            14-day free trial · No credit card required
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to manage clients professionally
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Ready to impress your clients?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join hundreds of agencies using ClientHub to deliver a better client experience.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}