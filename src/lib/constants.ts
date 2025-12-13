export const PROJECT_STATUSES = [
  { value: 'not-started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
  { value: 'active', label: 'Active', color: 'bg-blue-100 text-blue-800' },
  { value: 'on-hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
] as const

export type ProjectStatus = typeof PROJECT_STATUSES[number]['value']

export function getStatusColor(status: string): string {
  const found = PROJECT_STATUSES.find((s) => s.value === status)
  return found?.color || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string): string {
  const found = PROJECT_STATUSES.find((s) => s.value === status)
  return found?.label || status
}

export const APPROVAL_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'changes-requested', label: 'Changes Requested', color: 'bg-orange-100 text-orange-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
] as const

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
] as const

export const WORKSPACE_ROLES = [
  { value: 'owner', label: 'Owner', description: 'Full access, can delete workspace' },
  { value: 'admin', label: 'Admin', description: 'Full access, cannot delete workspace' },
  { value: 'member', label: 'Member', description: 'Can manage clients and projects' },
] as const
