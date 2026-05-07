import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 获取单个导入记录详情
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const record = await prisma.importRecord.findUnique({
      where: { id },
      include: {
        template: true,
        rows: {
          take: 100, // 只返回前100行
          orderBy: { rowIndex: 'asc' },
        },
      },
    })

    if (!record) {
      return NextResponse.json(
        { success: false, message: '导入记录不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: record }, { status: 200 })
  } catch (error) {
    console.error('获取导入记录失败:', error)
    return NextResponse.json(
      { success: false, message: '获取导入记录失败' },
      { status: 500 }
    )
  }
}

/**
 * 更新导入记录状态
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, successRows, failedRows, errorLog } = body

    const record = await prisma.importRecord.update({
      where: { id },
      data: {
        status,
        successRows: successRows !== undefined ? successRows : undefined,
        failedRows: failedRows !== undefined ? failedRows : undefined,
        errorLog: errorLog || undefined,
        ...(status === 'SUCCESS' || status === 'FAILED' || status === 'PARTIAL'
          ? { completedAt: new Date() }
          : {}),
        ...(status === 'PROCESSING' ? { startedAt: new Date() } : {}),
      },
      include: { template: true },
    })

    return NextResponse.json({ success: true, data: record }, { status: 200 })
  } catch (error) {
    console.error('更新导入记录失败:', error)
    return NextResponse.json(
      { success: false, message: '更新导入记录失败' },
      { status: 500 }
    )
  }
}

/**
 * 删除导入记录
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 同时删除相关的行数据（级联删除）
    await prisma.importRecord.delete({
      where: { id },
    })

    return NextResponse.json(
      { success: true, message: '导入记录已删除' },
      { status: 200 }
    )
  } catch (error) {
    console.error('删除导入记录失败:', error)
    return NextResponse.json(
      { success: false, message: '删除导入记录失败' },
      { status: 500 }
    )
  }
}
