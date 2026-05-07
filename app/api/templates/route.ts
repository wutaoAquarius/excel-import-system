import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 获取所有导入模板
 */
export async function GET(_request: NextRequest) {
  try {
    const templates = await prisma.importTemplate.findMany({
      include: {
        columns: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { imports: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      { success: true, data: templates },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取模板列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取模板列表失败' },
      { status: 500 }
    )
  }
}

/**
 * 创建新模板
 */
export async function POST(request: NextRequest) {
  // 使用 request 获取请求体
  try {
    const body = await request.json()
    const { name, description, columns } = body

    if (!name) {
      return NextResponse.json(
        { success: false, message: '模板名称不能为空' },
        { status: 400 }
      )
    }

    const template = await prisma.importTemplate.create({
      data: {
        name,
        description,
        createdBy: 'system', // 实际应该从认证信息获取
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

    return NextResponse.json(
      { success: true, data: template },
      { status: 201 }
    )
  } catch (error) {
    console.error('创建模板失败:', error)
    return NextResponse.json(
      { success: false, message: '创建模板失败' },
      { status: 500 }
    )
  }
}
