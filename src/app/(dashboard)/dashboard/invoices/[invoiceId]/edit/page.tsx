'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

type InvoiceItem = {
  id?: string
  description: string
  quantity: number
  unitPrice: number
}

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.invoiceId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clientName, setClientName] = useState('')
  const [formData, setFormData] = useState({
    status: 'draft',
    dueDate: '',
  })
  const [items, setItems] = useState<InvoiceItem[]>([])

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`)
        if (response.ok) {
          const invoice = await response.json()
          setClientName(invoice.client.name)
          setFormData({
            status: invoice.status || 'draft',
            dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
          })
          setItems(invoice.items.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice / 100, // Convert from cents
          })))
        } else {
          toast.error('Invoice not found')
          router.push('/dashboard/invoices')
        }
      } catch (error) {
        toast.error('Failed to load invoice')
        router.push('/dashboard/invoices')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [invoiceId, router])

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  function calculateTotal() {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    if (items.some(item => !item.description || item.quantity < 1 || item.unitPrice < 0)) {
      toast.error('Please fill in all item details')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          dueDate: formData.dueDate || undefined,
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: Math.round(item.unitPrice * 100), // Convert to cents
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update invoice')
      }

      toast.success('Invoice updated successfully')
      router.push(`/dashboard/invoices/${invoiceId}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update invoice')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href={`/dashboard/invoices/${invoiceId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Invoice
        </Link>
        <h1 className="text-2xl font-bold">Edit Invoice</h1>
        <p className="text-muted-foreground">Update invoice for {clientName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items yet. Add your first item.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Service or product description"
                      />
                    </div>
                    <div className="w-24 space-y-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label>Unit Price ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label>Total</Label>
                      <div className="h-10 flex items-center font-medium">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-7"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}

                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/invoices/${invoiceId}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
