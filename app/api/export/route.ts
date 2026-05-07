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

    // 创建字段名映射（英文→中文），用于导出表头
    const fieldEnToCn: Record<string, string> = {
      'external_code': '外部编码',
      'sender_name': '发件人姓名',
      'sender_phone': '发件人电话',
      'sender_address': '发件人地址',
      'receiver_name': '收件人姓名',
      'receiver_phone': '收件人电话',
      'receiver_address': '收件人地址',
      'weight': '重量(kg)',
      'quantity': '件数',
      'temperature': '温层',
      'remark': '备注',
    }

    // 获取映射后的字段名（英文）
    const systemFields: string[] = []
    for (const [, field] of Object.entries(mapping)) {
      if (field && field !== '不映射' && !systemFields.includes(String(field))) {
        systemFields.push(String(field))
      }
    }

    // 转换为中文表头
    const headerNames = systemFields.map((f) => fieldEnToCn[f] || f)

    // 添加表头
    const headerRow = worksheet.addRow(headerNames)
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

    // 处理文件名，支持中文字符
    const timestamp = new Date().getTime()
    const filename = `导入数据_${timestamp}.xlsx`
    // 使用 RFC 5987 编码中文文件名
    const encodedFilename = encodeURIComponent(filename)
    const contentDisposition = `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': contentDisposition,
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
