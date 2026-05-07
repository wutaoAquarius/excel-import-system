#!/usr/bin/env node

/**
 * Vercel 自动部署和数据库配置脚本
 * 功能：
 * 1. 配置环境变量到 Vercel
 * 2. 触发部署
 * 3. 等待部署完成
 * 4. 初始化数据库
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 读取 .env.local 中的数据库 URL
const envLocalPath = path.join(__dirname, '.env.local');
const envLocalContent = fs.readFileSync(envLocalPath, 'utf-8');
const databaseUrlMatch = envLocalContent.match(/DATABASE_URL="([^"]+)"/);
const DATABASE_URL = databaseUrlMatch ? databaseUrlMatch[1] : null;

if (!DATABASE_URL) {
  console.error('❌ 无法从 .env.local 中读取 DATABASE_URL');
  process.exit(1);
}

// Vercel 项目信息
const projectConfig = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf-8'));
const PROJECT_ID = projectConfig.projectId;
const ORG_ID = projectConfig.orgId;

console.log('🚀 Vercel 自动化部署脚本');
console.log('================================');
console.log(`📦 项目 ID: ${PROJECT_ID}`);
console.log(`🏢 组织 ID: ${ORG_ID}`);
console.log(`🗄️  数据库: ${DATABASE_URL.split(':')[1].substring(0, 20)}...`);

// 提示用户手动操作
console.log('\n⚠️  后续步骤需要手动在 Vercel Dashboard 中进行：');
console.log('');
console.log('1️⃣  访问 Vercel Dashboard:');
console.log('   https://vercel.com/dashboard');
console.log('');
console.log('2️⃣  选择 "excel-import-system" 项目');
console.log('');
console.log('3️⃣  进入 Settings → Environment Variables');
console.log('');
console.log('4️⃣  添加新环境变量:');
console.log(`   名称: DATABASE_URL`);
console.log(`   值: ${DATABASE_URL}`);
console.log('');
console.log('5️⃣  应用到所有环境 (Production, Preview, Development)');
console.log('');
console.log('6️⃣  返回 Deployments 标签，点击最新部署的 "Redeploy" 按钮');
console.log('');
console.log('7️⃣  等待部署完成（约 1-2 分钟）');
console.log('');
console.log('8️⃣  访问应用首页: https://excel-import-system.vercel.app');
console.log('');
console.log('9️⃣  点击 "初始化数据库" 按钮');
console.log('');
console.log('✅ 完成！');
console.log('');

console.log('💡 或者，使用 Vercel CLI 自动化:');
console.log('   vercel env add DATABASE_URL');
console.log('   vercel redeploy');
