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

    // 验证数据：检查同批数据中的 external_code 重复
    const externalCodes = new Set<string>()
    const duplicateExternalCodes: string[] = []
    const externalCodesToCheck: string[] = []
    
    for (const row of rows) {
      const code = (row.external_code || '').trim()
      // 只检查非空的 external_code
      if (code) {
        if (externalCodes.has(code)) {
          duplicateExternalCodes.push(code)
        }
        externalCodes.add(code)
        externalCodesToCheck.push(code)
      }
    }

    if (duplicateExternalCodes.length > 0) {
      return NextResponse.json(
        { 
          message: `导入数据中存在重复的外部编码: ${[...new Set(duplicateExternalCodes)].join(', ')}`,
          duplicateExternalCodes: [...new Set(duplicateExternalCodes)]
        },
        { status: 400 }
      )
    }

    // 检查数据库中是否已存在这些 external_code
    if (externalCodesToCheck.length > 0) {
      const existingCodes = await prisma.order.findMany({
        where: {
          external_code: {
            in: externalCodesToCheck,
          },
        },
        select: {
          external_code: true,
        },
      })

      const existingCodeSet = new Set(existingCodes.map((o) => o.external_code))
      const conflictingCodes = externalCodesToCheck.filter((code) => existingCodeSet.has(code))

      if (conflictingCodes.length > 0) {
        return NextResponse.json(
          { 
            message: `这些外部编码已在系统中存在，无法导入: ${conflictingCodes.join(', ')}`,
            conflictingExternalCodes: conflictingCodes,
          },
          { status: 400 }
        )
      }
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
      // 注：已移除 external_code 的 @unique 约束以支持多个 NULL 值
      // 重复检查已在上面进行过，这里可以直接创建
      const orders = await tx.order.createMany({
        data: rows.map((row: Record<string, any>) => ({
          external_code: (row.external_code || '').trim() || null,
          sender_name: String(row.sender_name || '').trim(),
          sender_phone: String(row.sender_phone || '').trim(),
          sender_address: String(row.sender_address || '').trim(),
          receiver_name: String(row.receiver_name || '').trim(),
          receiver_phone: String(row.receiver_phone || '').trim(),
          receiver_address: String(row.receiver_address || '').trim(),
          weight: parseFloat(row.weight) || 0,
          quantity: parseInt(row.quantity) || 0,
          temperature: String(row.temperature || '常温').trim(),
          remark: row.remark ? String(row.remark).trim() : null,
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
