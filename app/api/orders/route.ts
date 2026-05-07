import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const code = searchParams.get('code') || ''
    const name = searchParams.get('name') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    // 构建 where 条件
    const where: any = {}

    if (code) {
      where.external_code = { contains: code }
    }

    if (name) {
      where.receiver_name = { contains: name }
    }

    if (startDate) {
      const start = new Date(startDate)
      where.created_at = { ...where.created_at, gte: start }
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.created_at = { ...where.created_at, lte: end }
    }

    // 查询总数
    const total = await prisma.order.count({ where })

    // 查询数据
    const data = await prisma.order.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('查询订单错误:', error)
    return NextResponse.json(
      { message: '查询失败：' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}
