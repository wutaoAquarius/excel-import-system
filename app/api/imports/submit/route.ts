import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 标记此路由为动态，因为访问数据库
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { rows } = await request.json()

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { message: '缺少 rows 参数' },
        { status: 400 }
      )
    }

    // 生成批次号
    const randomStr = Math.random().toString(36).substring(2, 10)
    const batchNumber = `BATCH-${new Date().getTime()}-${randomStr}`

    // 开始事务
    const result = await prisma.$transaction(async (tx) => {
      // 1. 创建导入批次记录
      const batch = await tx.importBatch.create({
        data: {
          batch_number: batchNumber,
          total_count: rows.length,
          success_count: rows.length,
          failed_count: 0,
          status: 'success',
        },
      })

      // 2. 批量创建订单
      const orders = await tx.order.createMany({
        data: rows.map((row: Record<string, any>) => ({
          external_code: row.external_code || null,
          sender_name: row.sender_name || '',
          sender_phone: row.sender_phone || '',
          sender_address: row.sender_address || '',
          receiver_name: row.receiver_name || '',
          receiver_phone: row.receiver_phone || '',
          receiver_address: row.receiver_address || '',
          weight: parseFloat(row.weight) || 0,
          quantity: parseInt(row.quantity) || 0,
          temperature: row.temperature || '常温',
          remark: row.remark || null,
          batch_number: batchNumber,
        })),
      })

      return {
        batch,
        orders,
      }
    })

    return NextResponse.json({
      success: true,
      message: '数据导入成功',
      batchNumber,
      count: rows.length,
      data: result,
    })
  } catch (error) {
    console.error('数据提交错误:', error)
    return NextResponse.json(
      { message: '数据提交失败：' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}
