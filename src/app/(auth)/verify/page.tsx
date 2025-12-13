import Link from 'next/link'
import NextImage from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default function VerifyPage() {
  return (
    <Card className="text-center">
      <CardHeader>
        <Link href="/" className="inline-block mb-4">
          <NextImage
            src="/portivo.svg"
            alt="Portivo"
            width={140}
            height={40}
            style={{ width: '140px', height: 'auto' }}
            className="mx-auto"
          />
        </Link>
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We&apos;ve sent you a magic link to sign in to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Click the link in the email to continue. The link will expire in 15 minutes.
        </p>
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the email? Check your spam folder or{' '}
          <Link href="/login" className="text-primary hover:underline">
            try again
          </Link>
          .
        </p>
        <Link href="/">
          <Button variant="outline" className="mt-4">
            Back to Home
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
