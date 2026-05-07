import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 获取导入记录列表
 */
export async function GET(request: NextRequest) {
  // 使用 request 对象获取查询参数
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    const where = status ? { status: status as any } : {}

    const [records, total] = await Promise.all([
      prisma.importRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.importRecord.count({ where }),
    ])

    return NextResponse.json(
      {
        success: true,
        data: records,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取导入记录失败:', error)
    return NextResponse.json(
      { success: false, message: '获取导入记录失败' },
      { status: 500 }
    )
  }
}

/**
 * 创建新的导入记录
 */
export async function POST(request: NextRequest) {
  // 使用 request 对象获取请求体
  try {
    const body = await request.json()
    const { templateId, fileName, fileSize, mimeType } = body

    if (!templateId || !fileName) {
      return NextResponse.json(
        { success: false, message: '缺少必需参数' },
        { status: 400 }
      )
    }

    // 验证模板存在
    const template = await prisma.importTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return NextResponse.json(
        { success: false, message: '模板不存在' },
        { status: 404 }
      )
    }

    const record = await prisma.importRecord.create({
      data: {
        templateId,
        fileName,
        fileSize,
        mimeType,
        status: 'PENDING',
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(
      { success: true, data: record },
      { status: 201 }
    )
  } catch (error) {
    console.error('创建导入记录失败:', error)
    return NextResponse.json(
      { success: false, message: '创建导入记录失败' },
      { status: 500 }
    )
  }
}
