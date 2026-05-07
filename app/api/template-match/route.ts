import { NextRequest, NextResponse } from 'next/server'
import { matchTemplate } from '@/lib/template-matcher'

export async function POST(request: NextRequest) {
  try {
    const { headers } = await request.json()

    if (!headers || !Array.isArray(headers)) {
      return NextResponse.json(
        { message: '缺少 headers 参数' },
        { status: 400 }
      )
    }

    // 匹配模板
    const result = matchTemplate(headers)

    return NextResponse.json({
      success: true,
      fingerprint: result.fingerprint,
      mapping: result.mapping,
      confidence: result.confidence,
    })
  } catch (error) {
    console.error('模板匹配错误:', error)
    return NextResponse.json(
      { message: '模板匹配失败：' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}
