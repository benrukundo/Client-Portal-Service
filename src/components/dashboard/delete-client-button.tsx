'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

type DeleteClientButtonProps = {
  clientId: string
  clientName: string
  projectCount: number
  invoiceCount: number
}

export function DeleteClientButton({ 
  clientId, 
  clientName, 
  projectCount, 
  invoiceCount 
}: DeleteClientButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    setDeleting(true)

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete client')
      }

      toast.success('Client deleted successfully')
      router.push('/dashboard/clients')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete client')
      setDeleting(false)
      setOpen(false)
    }
  }

  const hasRelatedData = projectCount > 0 || invoiceCount > 0

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Client
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Client
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to delete <strong>"{clientName}"</strong>?
              </p>
              
              {hasRelatedData && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-red-800 mb-2">
                    This will permanently delete:
                  </p>
                  <ul className="list-disc list-inside text-red-700 space-y-1">
                    {projectCount > 0 && (
                      <li>{projectCount} project{projectCount !== 1 ? 's' : ''} (including all updates, files, messages, and approvals)</li>
                    )}
                    {invoiceCount > 0 && (
                      <li>{invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''}</li>
                    )}
                    <li>All client contacts</li>
                  </ul>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Client
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
