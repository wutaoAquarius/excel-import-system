import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 获取单个模板
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const template = await prisma.importTemplate.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { order: 'asc' },
        },
        mappings: true,
        imports: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { success: false, message: '模板不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: template }, { status: 200 })
  } catch (error) {
    console.error('获取模板失败:', error)
    return NextResponse.json(
      { success: false, message: '获取模板失败' },
      { status: 500 }
    )
  }
}

/**
 * 更新模板
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, description, columns } = body

    // 先删除旧列
    await prisma.templateColumn.deleteMany({
      where: { templateId: id },
    })

    // 更新模板并创建新列
    const template = await prisma.importTemplate.update({
      where: { id },
      data: {
        name,
        description,
        updatedAt: new Date(),
        columns: {
          create: columns || [],
        },
      },
      include: {
        columns: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({ success: true, data: template }, { status: 200 })
  } catch (error) {
    console.error('更新模板失败:', error)
    return NextResponse.json(
      { success: false, message: '更新模板失败' },
      { status: 500 }
    )
  }
}

/**
 * 删除模板
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.importTemplate.delete({
      where: { id },
    })

    return NextResponse.json(
      { success: true, message: '模板已删除' },
      { status: 200 }
    )
  } catch (error) {
    console.error('删除模板失败:', error)
    return NextResponse.json(
      { success: false, message: '删除模板失败' },
      { status: 500 }
    )
  }
}
