import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

/**
 * 检查第一行是否包含合并单元格
 */
function hasFirstRowMergedCells(worksheet: XLSX.WorkSheet): boolean {
  if (!worksheet['!merges']) {
    return false
  }

  // 检查是否有跨越第一行的合并单元格
  for (const merge of worksheet['!merges']) {
    // merge 格式: { s: { r: startRow, c: startCol }, e: { r: endRow, c: endCol } }
    // 如果合并单元格的起始行是 0（第一行），则说明第一行有合并单元格
    if (merge.s.r === 0) {
      return true
    }
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: '未提供文件' },
        { status: 400 }
      )
    }

    // 读取文件（保留原始格式，以便检测合并单元格）
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })

    // 获取第一个 sheet
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return NextResponse.json(
        { message: '无法找到有效的数据表' },
        { status: 400 }
      )
    }

    const worksheet = workbook.Sheets[sheetName]

    // 检查第一行是否有合并单元格
    const hasMergedFirstRow = hasFirstRowMergedCells(worksheet)
    
    // 使用 range 选项跳过第一行（如果有合并单元格）
    const data = hasMergedFirstRow
      ? XLSX.utils.sheet_to_json(worksheet, { defval: '', range: 1 })
      : XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    if (data.length === 0) {
      return NextResponse.json(
        { message: '文件为空或数据行数不足' },
        { status: 400 }
      )
    }

    // 获取表头
    const headers = Object.keys(data[0] || {})

    // 返回表头、数据和合并单元格标志
    return NextResponse.json({
      success: true,
      headers,
      rows: data.slice(0, Math.max(5, data.length)),
      totalRows: data.length,
      hasMergedFirstRow, // 返回标志以便前端显示提示信息
      dataStartRow: hasMergedFirstRow ? 2 : 1, // 返回实际数据起始行号（1-indexed）
    })
  } catch (error) {
    console.error('解析文件错误:', error)
    return NextResponse.json(
      { message: '文件解析失败：' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}
