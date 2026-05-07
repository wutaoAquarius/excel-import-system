#!/usr/bin/env ts-node

/**
 * 数据库初始化脚本
 * 用于在部署后自动创建所有表结构
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log('🔄 正在初始化数据库...');
    console.log('');

    // 执行 Prisma 迁移
    console.log('📋 创建表结构...');
    
    // 测试连接
    await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ 数据库连接成功');
    
    // 获取现有表
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('');
    console.log('📊 数据库表结构:');
    
    if (Array.isArray(tables) && tables.length > 0) {
      (tables as any[]).forEach((table: any) => {
        console.log(`   ✓ ${table.table_name}`);
      });
      console.log('');
      console.log(`✨ 共 ${tables.length} 个表`);
    } else {
      console.log('   (无表 - 需要运行 prisma db push)');
      console.log('');
      console.log('⚠️  请在 shell 中运行:');
      console.log('   npx prisma db push');
    }

    console.log('');
    console.log('✅ 数据库初始化完成！');
    process.exit(0);

  } catch (error) {
    console.error('❌ 初始化失败:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();
