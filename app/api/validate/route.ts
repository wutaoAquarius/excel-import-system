import { NextRequest, NextResponse } from 'next/server'
import { validateAllRows } from '@/lib/validators'

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

    return NextResponse.json({
      success: true,
      errors: result.errors,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
    })
  } catch (error) {
    console.error('数据校验错误:', error)
    return NextResponse.json(
      { message: '数据校验失败：' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}
