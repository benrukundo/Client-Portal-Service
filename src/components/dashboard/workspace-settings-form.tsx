'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type Workspace = {
  id: string
  name: string
  brandColor: string | null
  website: string | null
  address: string | null
  phone: string | null
}

export function WorkspaceSettingsForm({ workspace }: { workspace: Workspace }) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: workspace.name,
    brandColor: workspace.brandColor || '#6366f1',
    website: workspace.website || '',
    address: workspace.address || '',
    phone: workspace.phone || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update workspace')
      }

      toast.success('Workspace settings saved!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Workspace Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="My Agency"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandColor">Brand Color</Label>
        <div className="flex gap-2">
          <Input
            id="brandColor"
            type="color"
            value={formData.brandColor}
            onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
            className="w-16 h-10 p-1 cursor-pointer"
          />
          <Input
            value={formData.brandColor}
            onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
            placeholder="#6366f1"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          placeholder="https://myagency.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="123 Main St, City, Country"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
