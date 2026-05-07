import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

// 标记此路由为动态，因为生成动态文件
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { rows, errors, mapping } = await request.json()

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { message: '缺少 rows 参数' },
        { status: 400 }
      )
    }

    // 创建 Excel 工作簿
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('导入数据')

    // 获取映射后的字段名
    const systemFields: string[] = []
    for (const [, field] of Object.entries(mapping)) {
      if (field && field !== '不映射' && !systemFields.includes(String(field))) {
        systemFields.push(String(field))
      }
    }

    // 添加表头
    const headerRow = worksheet.addRow(systemFields)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF667EEA' },
    }

    // 添加数据行
    const errorMap = new Map<number, Set<string>>()
    errors?.forEach((error: any) => {
      const key = error.rowIndex - 1 // 对应行索引
      if (!errorMap.has(key)) {
        errorMap.set(key, new Set())
      }
      errorMap.get(key)?.add(error.field)
    })

    rows.forEach((row: Record<string, any>, index: number) => {
      const rowData = systemFields.map((field) => row[field] || '')
      const excelRow = worksheet.addRow(rowData)

      // 为错误单元格添加背景色
      const rowErrors = errorMap.get(index)
      if (rowErrors) {
        systemFields.forEach((field, colIndex) => {
          if (rowErrors.has(field)) {
            excelRow.getCell(colIndex + 1).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFEE2E2' }, // 红色背景
            }
          }
        })
      }
    })

    // 设置列宽
    systemFields.forEach((_, index) => {
      worksheet.getColumn(index + 1).width = 15
    })

    // 添加错误说明页（如果有错误）
    if (errors && errors.length > 0) {
      const errorSheet = workbook.addWorksheet('错误说明')
      errorSheet.addRow(['行号', '字段', '错误信息'])

      errors.forEach((error: any) => {
        errorSheet.addRow([error.rowIndex, error.field, error.message])
      })
    }

    // 导出 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="导入数据_${new Date().getTime()}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('导出 Excel 错误:', error)
    return NextResponse.json(
      { message: '导出失败：' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}
