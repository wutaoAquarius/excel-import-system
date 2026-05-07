import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { action, fingerprint, mapping, headers } = await request.json()

    if (action === 'save') {
      // 保存或更新映射规则
      if (!fingerprint || !mapping) {
        return NextResponse.json(
          { message: '缺少 fingerprint 或 mapping 参数' },
          { status: 400 }
        )
      }

      const saved = await prisma.templateMapping.upsert({
        where: { template_fingerprint: fingerprint },
        update: {
          mapping_rules: mapping,
          header_names: headers,
          last_used_at: new Date(),
          usage_count: { increment: 1 },
        },
        create: {
          template_fingerprint: fingerprint,
          mapping_rules: mapping,
          header_names: headers,
          usage_count: 1,
        },
      })

      return NextResponse.json({
        success: true,
        message: '映射规则已保存',
        data: saved,
      })
    } else if (action === 'find') {
      // 查找相似的映射规则
      if (!fingerprint) {
        return NextResponse.json(
          { message: '缺少 fingerprint 参数' },
          { status: 400 }
        )
      }

      const found = await prisma.templateMapping.findUnique({
        where: { template_fingerprint: fingerprint },
      })

      return NextResponse.json({
        success: true,
        data: found,
      })
    } else {
      return NextResponse.json(
        { message: '未知的 action：' + action },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('映射规则处理错误:', error)
    return NextResponse.json(
      { message: '映射规则处理失败：' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}
