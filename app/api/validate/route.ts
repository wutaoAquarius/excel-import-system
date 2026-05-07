import { NextRequest, NextResponse } from 'next/server'
import { validateAllRows } from '@/lib/validators'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { rows, headers, mapping } = await request.json()

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { message: '缺少 rows 参数' },
        { status: 400 }
      )
    }

    if (!headers || !Array.isArray(headers)) {
      return NextResponse.json(
        { message: '缺少 headers 参数' },
        { status: 400 }
      )
    }

    if (!mapping || typeof mapping !== 'object') {
      return NextResponse.json(
        { message: '缺少 mapping 参数' },
        { status: 400 }
      )
    }

    // 校验所有行
    const result = validateAllRows(rows, headers, mapping)

    // 检查数据库中是否存在相同的 external_code
    const databaseErrors = await checkDatabaseConflicts(result.validRows, rows, headers, mapping)
    
    // 合并数据库检查的错误
    const allErrors = [...result.errors, ...databaseErrors]
    
    // 如果有新的数据库冲突错误，需要更新 validRows 和 invalidRows
    let finalValidRows = result.validRows
    let finalInvalidRows = result.invalidRows
    
    if (databaseErrors.length > 0) {
      // 找出有数据库冲突的行索引（在 validRows 中的位置）
      const conflictIndicesInValidRows = new Set(
        databaseErrors.map(e => e.rowIndex - 1) // rowIndex 是 1-based，转换为 0-based
      )
      
      // 过滤有效行，移除冲突的行
      finalValidRows = result.validRows.filter((_, idx) => !conflictIndicesInValidRows.has(idx))
      
      // 将冲突的行加入无效行
      databaseErrors.forEach((err) => {
        const rowIdx = err.rowIndex - 1 // 转换为 0-based
        if (rowIdx >= 0 && rowIdx < result.validRows.length) {
          finalInvalidRows.push(result.validRows[rowIdx])
        }
      })
    }

    return NextResponse.json({
      success: true,
      errors: allErrors,
      validRows: finalValidRows,
      invalidRows: finalInvalidRows,
    })
  } catch (error) {
    console.error('数据校验错误:', error)
    return NextResponse.json(
      { message: '数据校验失败：' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}

/**
 * 检查数据库中是否存在相同的 external_code
 * @param validRows 已经映射后的有效行数据
 */
async function checkDatabaseConflicts(
  validRows: Record<string, any>[],
  _originalRows: Record<string, any>[],
  _headers: string[],
  _mapping: Record<string, string>
) {
  const errors: Array<{
    rowIndex: number
    field: string
    message: string
    value?: any
  }> = []

  // 收集所有需要检查的 external_code 及其在原始数据中的行号
  const externalCodesToCheck = new Map<string, number>() // code -> rowIndex(1-based)
  
  validRows.forEach((row, index) => {
    const externalCode = (row.external_code || '').trim()
    if (externalCode) {
      externalCodesToCheck.set(externalCode, index + 1) // 保存 1-based 索引
    }
  })

  if (externalCodesToCheck.size === 0) {
    return errors
  }

  try {
    // 查询数据库中是否存在这些编码
    const existingOrders = await prisma.order.findMany({
      where: {
        external_code: {
          in: Array.from(externalCodesToCheck.keys()),
        },
      },
      select: {
        external_code: true,
      },
    })

    const existingCodes = new Set(existingOrders.map((o) => o.external_code))

    // 为每个冲突的行添加错误
    externalCodesToCheck.forEach((rowIndex, externalCode) => {
      if (existingCodes.has(externalCode)) {
        errors.push({
          rowIndex,
          field: 'external_code',
          message: `external_code: "${externalCode}" 已存在于系统中，无法重复导入`,
          value: externalCode,
        })
      }
    })
  } catch (dbError) {
    console.error('检查数据库冲突时出错:', dbError)
    // 数据库错误不应该中断校验过程，只记录日志
  }

  return errors
}
