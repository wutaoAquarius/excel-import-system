import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// 标记此路由为动态，因为访问数据库
export const dynamic = 'force-dynamic'

/**
 * 初始化数据库
 * 创建默认用户和模板
 */
export async function POST(_request: NextRequest) {
  try {
    // 首先检查数据库连接和表结构
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✓ 数据库连接成功')
      
      // 检查 "user" 表是否存在
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'User'
        ) as exists
      `
      
      if (!(tableExists as any)[0]?.exists) {
        console.log('⚠️  表结构不存在，需要执行 prisma db push')
        
        // 因为我们无法在 Vercel 上执行 CLI 命令，所以返回错误
        // 用户需要手动运行 prisma db push
        return NextResponse.json(
          { 
            success: false, 
            message: '数据库表结构不存在，需要手动初始化',
            instructions: '请在本地运行: npx prisma db push',
            details: '表结构需要通过 Prisma 迁移在数据库中创建'
          },
          { status: 409 }
        )
      }
      
      console.log('✓ 数据库表结构已就绪')
    } catch (connError) {
      console.error('数据库检查失败:', connError)
      return NextResponse.json(
        { 
          success: false, 
          message: '数据库连接或查询失败',
          error: (connError as Error).message 
        },
        { status: 503 }
      )
    }

    // 检查管理员用户是否已存在
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    })

    if (adminExists) {
      return NextResponse.json(
        { success: false, message: '数据库已初始化' },
        { status: 400 }
      )
    }

    // 创建管理员用户
    const hashedPassword = await bcrypt.hash('admin@123456', 10)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: '系统管理员',
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    // 创建默认导入模板
    const template = await prisma.importTemplate.create({
      data: {
        name: '标准订单导入模板',
        description: '用于导入标准格式的物流订单数据',
        createdBy: admin.id,
        columns: {
          create: [
            {
              columnName: 'external_code',
              displayName: '外部编码',
              dataType: 'text',
              required: false,
              unique: true,
              order: 1,
            },
            {
              columnName: 'sender_name',
              displayName: '寄件人',
              dataType: 'text',
              required: true,
              minLength: 2,
              maxLength: 100,
              order: 2,
            },
            {
              columnName: 'sender_phone',
              displayName: '寄件人电话',
              dataType: 'text',
              required: true,
              pattern: '^1[3-9]\\d{9}$',
              order: 3,
            },
            {
              columnName: 'sender_address',
              displayName: '寄件地址',
              dataType: 'text',
              required: true,
              minLength: 5,
              order: 4,
            },
            {
              columnName: 'receiver_name',
              displayName: '收件人',
              dataType: 'text',
              required: true,
              minLength: 2,
              maxLength: 100,
              order: 5,
            },
            {
              columnName: 'receiver_phone',
              displayName: '收件人电话',
              dataType: 'text',
              required: true,
              pattern: '^1[3-9]\\d{9}$',
              order: 6,
            },
            {
              columnName: 'receiver_address',
              displayName: '收件地址',
              dataType: 'text',
              required: true,
              minLength: 5,
              order: 7,
            },
            {
              columnName: 'weight',
              displayName: '重量(kg)',
              dataType: 'number',
              required: true,
              order: 8,
            },
            {
              columnName: 'quantity',
              displayName: '数量',
              dataType: 'number',
              required: true,
              order: 9,
            },
            {
              columnName: 'temperature',
              displayName: '温度要求',
              dataType: 'text',
              required: true,
              order: 10,
            },
            {
              columnName: 'remark',
              displayName: '备注',
              dataType: 'text',
              required: false,
              maxLength: 500,
              order: 11,
            },
          ],
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: '数据库初始化成功',
        data: {
          admin: {
            email: admin.email,
            name: admin.name,
          },
          template: {
            id: template.id,
            name: template.name,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return NextResponse.json(
      { success: false, message: '数据库初始化失败' },
      { status: 500 }
    )
  }
}

/**
 * 获取初始化状态
 */
export async function GET(_request: NextRequest) {
  try {
    const userCount = await prisma.user.count()
    const templateCount = await prisma.importTemplate.count()

    return NextResponse.json(
      {
        success: true,
        initialized: userCount > 0,
        stats: {
          users: userCount,
          templates: templateCount,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取初始化状态失败:', error)
    return NextResponse.json(
      { success: false, message: '获取初始化状态失败' },
      { status: 500 }
    )
  }
}
