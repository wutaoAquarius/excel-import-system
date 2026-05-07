import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

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

    // 读取文件
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
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    if (data.length === 0) {
      return NextResponse.json(
        { message: '文件为空' },
        { status: 400 }
      )
    }

    // 获取表头
    const headers = Object.keys(data[0] || {})

    // 返回表头和前 5 行数据
    return NextResponse.json({
      success: true,
      headers,
      rows: data.slice(0, Math.max(5, data.length)),
      totalRows: data.length,
    })
  } catch (error) {
    console.error('解析文件错误:', error)
    return NextResponse.json(
      { message: '文件解析失败：' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}
