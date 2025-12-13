import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromR2 } from '@/lib/r2'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Find file and verify access
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        project: {
          client: {
            workspace: {
              members: {
                some: { userId: session.user.id },
              },
            },
          },
        },
      },
    })

    if (!file) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 })
    }

    // Delete from R2
    await deleteFromR2(file.key)

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    })

    return NextResponse.json({ message: 'File deleted' })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
