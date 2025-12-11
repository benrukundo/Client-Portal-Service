import type {
    User,
    Workspace,
    WorkspaceMember,
    Client,
    ClientContact,
    Project,
    ProjectUpdate,
    File,
    ApprovalRequest,
    Message,
    Invoice,
    InvoiceItem,
  } from '@prisma/client'
  
  // Extended types with relations
  export type WorkspaceWithMembers = Workspace & {
    members: (WorkspaceMember & {
      user: User
    })[]
  }
  
  export type ClientWithContacts = Client & {
    contacts: (ClientContact & {
      user: User
    })[]
    projects: Project[]
  }
  
  export type ProjectWithDetails = Project & {
    client: Client
    updates: (ProjectUpdate & {
      author: User
      attachments: File[]
    })[]
    files: File[]
    approvals: (ApprovalRequest & {
      requestedBy: User
      respondedBy: User | null
      files: File[]
    })[]
    messages: (Message & {
      author: User
    })[]
  }
  
  export type InvoiceWithItems = Invoice & {
    items: InvoiceItem[]
    client: Client
  }
  
  // Form input types
  export type CreateWorkspaceInput = {
    name: string
    slug: string
    logo?: string
    brandColor?: string
  }
  
  export type UpdateWorkspaceInput = Partial<CreateWorkspaceInput> & {
    website?: string
    address?: string
    phone?: string
  }
  
  export type CreateClientInput = {
    name: string
    email: string
    notes?: string
  }
  
  export type CreateProjectInput = {
    name: string
    description?: string
    status?: string
    startDate?: Date
    dueDate?: Date
  }
  
  export type CreateUpdateInput = {
    content: string
    fileIds?: string[]
  }
  
  export type CreateApprovalInput = {
    title: string
    description?: string
    fileIds: string[]
  }
  
  export type ApprovalResponse = {
    status: 'approved' | 'changes-requested' | 'rejected'
    responseNote?: string
  }
  
  export type CreateInvoiceInput = {
    clientId: string
    currency?: string
    dueDate?: Date
    items: {
      description: string
      quantity: number
      unitPrice: number
    }[]
  }
  
  // Session types
  export type SessionUser = {
    id: string
    email: string
    name?: string | null
    avatar?: string | null
  }
  
  export type WorkspaceRole = 'owner' | 'admin' | 'member'
  
  // Plan types
  export type PlanType = 'trial' | 'starter' | 'professional' | 'agency'
  
  export type PlanLimits = {
    clients: number
    members: number
    storage: number // in bytes
  }
  
  export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    trial: {
      clients: 20,
      members: 10,
      storage: 50 * 1024 * 1024 * 1024, // 50GB
    },
    starter: {
      clients: 5,
      members: 3,
      storage: 10 * 1024 * 1024 * 1024, // 10GB
    },
    professional: {
      clients: 20,
      members: 10,
      storage: 50 * 1024 * 1024 * 1024, // 50GB
    },
    agency: {
      clients: Infinity,
      members: Infinity,
      storage: 200 * 1024 * 1024 * 1024, // 200GB
    },
  }
  