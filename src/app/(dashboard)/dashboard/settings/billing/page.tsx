import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const plans = [
  {
    name: 'Starter',
    price: 29,
    description: 'For freelancers and small teams',
    features: ['5 clients', '3 team members', '10GB storage', 'Email support'],
  },
  {
    name: 'Professional',
    price: 59,
    description: 'For growing agencies',
    features: ['20 clients', '10 team members', '50GB storage', 'Priority support', 'Custom branding'],
  },
  {
    name: 'Agency',
    price: 99,
    description: 'For large teams',
    features: ['Unlimited clients', 'Unlimited team members', '200GB storage', 'Priority support', 'Custom domain', 'API access'],
  },
]

export default async function BillingSettingsPage() {
  const session = await auth()

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session?.user?.id },
    include: { workspace: true },
  })

  if (!workspaceMember) {
    return null
  }

  const workspace = workspaceMember.workspace
  const currentPlan = workspace.plan

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold capitalize">{currentPlan}</p>
              {currentPlan === 'trial' && workspace.trialEndsAt && (
                <p className="text-sm text-muted-foreground">
                  Trial ends on {formatDate(workspace.trialEndsAt)}
                </p>
              )}
            </div>
            {currentPlan !== 'trial' && (
              <Button variant="outline">Manage Subscription</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentPlan = currentPlan === plan.name.toLowerCase()
              return (
                <div
                  key={plan.name}
                  className={`border rounded-lg p-6 ${
                    isCurrentPlan ? 'border-primary ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {isCurrentPlan && (
                      <Badge>Current</Badge>
                    )}
                  </div>
                  <p className="text-3xl font-bold mb-2">
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
