import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import path from 'path'

/**
 * 数据库 Schema 设置路由
 * 使用 Prisma db push 创建表结构
 * 这是一个辅助路由，仅在首次部署时使用
 */
export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 开始数据库 Schema 设置...')
    
    // 执行 prisma db push 来创建表
    const command = 'npx prisma db push --skip-generate --skip-validate'
    
    console.log(`执行: ${command}`)
    
    const output = execSync(command, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SKIP_ENV_VALIDATION: 'true'
      },
      encoding: 'utf-8'
    })
    
    console.log('Prisma db push 输出:', output)
    
    return NextResponse.json(
      {
        success: true,
        message: '数据库表结构已创建',
        output: output.substring(0, 500) // 只返回前500个字符
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('数据库设置失败:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: '数据库设置失败',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * GET 用于检查状态
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      message: '数据库设置 API 就绪',
      instructions: '发送 POST 请求以执行数据库设置'
    },
    { status: 200 }
  )
}
