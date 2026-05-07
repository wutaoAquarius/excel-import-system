# 数据库连接配置说明

## 📋 配置概述

本项目已完成 Vercel Neon PostgreSQL 数据库的连接配置。

## ✅ 完成的配置

### 1. 环境变量配置

#### `.env.local` (本地开发环境)
```
DATABASE_URL="postgres://d3f8c3028679a35bdbd925e41cf011e980e4058108fcbf2ee6f04ddbb22c995a:sk_yto6Q4Xzd6pKQ-WhKHrSb@db.prisma.io:5432/postgres?sslmode=require"
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### `.env.production.local` (生产环境)
```
DATABASE_URL="postgres://d3f8c3028679a35bdbd925e41cf011e980e4058108fcbf2ee6f04ddbb22c995a:sk_yto6Q4Xzd6pKQ-WhKHrSb@db.prisma.io:5432/postgres?sslmode=require"
NEXT_PUBLIC_API_URL=https://excel-import-system.vercel.app
```

### 2. Prisma 配置

- **ORM**: Prisma 6.19.3
- **数据库类型**: PostgreSQL (Neon)
- **Schema 文件**: `prisma/schema.prisma`
- **Prisma Client**: 已生成

### 3. 已定义的数据库表

1. **ImportTemplate** - 导入模板
2. **TemplateColumn** - 模板列定义
3. **FieldMapping** - 字段映射
4. **ImportRecord** - 导入记录
5. **ImportRow** - 导入行数据
6. **User** - 用户管理
7. **SystemLog** - 系统日志

## 🔧 下一步操作

### 在 Vercel 部署前

1. **添加环境变量到 Vercel**
   - 访问 https://vercel.com/dashboard
   - 进入 `excel-import-system` 项目
   - 点击 "Settings" → "Environment Variables"
   - 添加以下变量到所有环境 (Production, Preview, Development):
   ```
   DATABASE_URL=postgres://d3f8c3028679a35bdbd925e41cf011e980e4058108fcbf2ee6f04ddbb22c995a:sk_yto6Q4Xzd6pKQ-WhKHrSb@db.prisma.io:5432/postgres?sslmode=require
   ```

2. **重新部署应用**
   - 在 Vercel Dashboard 中手动触发部署
   - 或推送新代码到 GitHub 自动触发部署

### 部署后初始化数据库

1. **访问应用首页**
   - 打开 https://excel-import-system.vercel.app

2. **初始化数据库表**
   - 点击首页上的"初始化数据库"按钮
   - 或通过 API 调用 `POST /api/init-db`

3. **验证数据库连接**
   - 检查响应是否显示成功
   - 查看是否显示现有的表结构

## 🔐 安全注意事项

⚠️ **重要：不要将包含密码的 DATABASE_URL 提交到 GitHub**

- `.env.local` 和 `.env.production.local` 已添加到 `.gitignore`
- 环境变量仅存储在 Vercel Dashboard 中
- 确保不在代码注释或文档中暴露凭证

## 📊 Neon 数据库信息

| 项目 | 值 |
|------|-----|
| **提供商** | Vercel Neon |
| **服务器** | db.prisma.io:5432 |
| **数据库** | postgres |
| **SSL 模式** | require |
| **用户认证** | 使用密钥进行认证 |

## 🧪 测试连接

### 在 Vercel 部署后测试

通过应用的 API 端点测试数据库连接：

```bash
# 测试数据库连接和初始化
curl https://excel-import-system.vercel.app/api/init-db -X POST
```

### 预期响应

成功：
```json
{
  "success": true,
  "message": "Database initialized successfully",
  "tables": [...]
}
```

失败：
```json
{
  "success": false,
  "error": "Database connection failed",
  "details": "..."
}
```

## 📝 Prisma 常用命令

```bash
# 生成 Prisma Client
npm run prisma:generate

# 推送 schema 到数据库
npm run db:push

# 创建数据库迁移
npm run db:migrate

# 打开 Prisma Studio（可视化数据库）
npm run db:studio

# 刷新 Prisma Client
npm run postinstall
```

## ❓ 常见问题

### Q: 如何验证数据库连接是否成功？
A: 部署到 Vercel 后，访问 `/api/init-db` 端点。如果响应显示表列表，说明连接成功。

### Q: 能否在本地开发时使用 Neon 数据库？
A: 可以，使用相同的 DATABASE_URL 即可。如果出现连接问题，可能是网络限制或防火墙问题。

### Q: 如何重置数据库？
A: 访问 Neon Dashboard，删除所有表后，重新运行初始化脚本。

### Q: 数据库大小有限制吗？
A: Vercel 的免费 Neon 计划包含 3GB 的数据库容量。

## 🚀 部署检查清单

- [x] 更新 `.env.local` 和 `.env.production.local`
- [x] 验证 TypeScript 编译
- [x] 验证项目构建成功
- [x] Prisma schema 已验证
- [x] Prisma Client 已生成
- [ ] Vercel 环境变量已配置
- [ ] 应用已部署到 Vercel
- [ ] 数据库初始化成功
- [ ] API 连接测试通过

---

**配置完成日期**: 2026-05-07
**Prisma 版本**: 6.19.3
**Next.js 版本**: 14.0.0

