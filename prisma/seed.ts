import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')

  // 创建默认管理员用户
  try {
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    })

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123456', 10)
      await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: '管理员',
          password: hashedPassword,
          role: 'ADMIN',
        },
      })
      console.log('✓ 管理员用户创建成功')
    } else {
      console.log('✓ 管理员用户已存在')
    }
  } catch (error) {
    console.error('创建管理员用户失败:', error)
  }

  // 创建默认模板
  try {
    const defaultTemplate = await prisma.importTemplate.create({
      data: {
        name: '标准订单导入模板',
        description: '用于导入标准格式的订单数据',
        createdBy: 'system',
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
              order: 4,
            },
            {
              columnName: 'receiver_name',
              displayName: '收件人',
              dataType: 'text',
              required: true,
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
              order: 11,
            },
          ],
        },
      },
    })
    console.log('✓ 默认模板创建成功:', defaultTemplate.id)
  } catch (error) {
    console.error('创建默认模板失败:', error)
  }

  console.log('数据库初始化完成！')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('初始化错误:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
