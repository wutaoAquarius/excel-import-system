# Vercel 部署指南

本指南说明如何将 Excel 导入系统完全部署到 Vercel。

## 前置条件

- GitHub 账户和仓库已关联
- Vercel 账户已创建
- Node.js 20+ 环境

## 1. 项目已完成的工作

✅ 项目结构已初始化
✅ Next.js 应用框架配置完成
✅ Prisma ORM 已集成
✅ 完整的数据库 Schema 已定义
✅ REST API 路由已实现
✅ 数据库初始化脚本已创建
✅ 代码已推送到 GitHub 的 main 分支

## 2. Vercel 数据库配置

### 方式 A：使用 Vercel Postgres (推荐)

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入 `excel-import-system` 项目
3. 点击 "Storage" 标签
4. 选择 "Connect Store"
5. 选择 "Neon PostgreSQL"（或 "Vercel Postgres"）
6. 按照提示完成数据库创建
7. 复制生成的 `DATABASE_URL`

### 方式 B：使用 Neon PostgreSQL

1. 访问 [Neon Console](https://console.neon.tech)
2. 创建新项目
3. 创建数据库
4. 复制连接字符串

## 3. 环境变量配置

复制 `DATABASE_URL` 后，添加到 Vercel 项目：

```bash
# 在项目目录运行
vercel env add DATABASE_URL
# 粘贴你的 DATABASE_URL
```

或在 Vercel 控制面板中：
1. 项目设置 → Environment Variables
2. 新增环境变量
3. 名称: `DATABASE_URL`
4. 值: 粘贴你的数据库连接字符串
5. 生产环境勾选

## 4. 数据库迁移

Vercel 会自动触发部署，首次部署后：

```bash
# 本地运行迁移（可选，Vercel 构建时会自动执行）
npx prisma migrate deploy
```

## 5. 初始化数据库

### 方式 1：通过 API 初始化 (推荐)

部署完成后，访问：
```
https://your-project.vercel.app/
```

点击"初始化数据库"按钮，系统会自动：
- 创建管理员用户 (admin@example.com / admin@123456)
- 创建标准订单导入模板
- 初始化所有必需的数据

### 方式 2：通过 CLI 初始化

```bash
# 本地初始化（需要本地 .env.local 配置）
npm run db:seed
```

## 6. 项目结构说明

```
excel-import-system/
├── app/
│   ├── api/                    # API 路由
│   │   ├── init-db/           # 数据库初始化
│   │   ├── templates/         # 导入模板管理
│   │   └── imports/           # 导入记录管理
│   ├── page.tsx               # 首页（包含初始化按钮）
│   └── layout.tsx             # 根布局
├── lib/
│   ├── prisma.ts              # Prisma 客户端单例
│   ├── db.ts                  # 原有数据库函数
│   └── types.ts               # TypeScript 类型定义
├── prisma/
│   ├── schema.prisma          # 数据库 Schema 定义
│   └── seed.ts                # 数据库初始化脚本
├── package.json               # 项目配置
└── vercel.json                # Vercel 配置
```

## 7. 数据库 Schema 说明

系统已定义以下主要表：

- **User** - 用户管理
- **ImportTemplate** - 导入模板定义
- **TemplateColumn** - 模板列配置
- **FieldMapping** - 字段映射规则
- **ImportRecord** - 导入记录日志
- **ImportRow** - 导入行数据
- **SystemLog** - 系统日志

## 8. API 端点

### 数据库初始化
- `GET /api/init-db` - 检查初始化状态
- `POST /api/init-db` - 初始化数据库

### 模板管理
- `GET /api/templates` - 获取所有模板
- `POST /api/templates` - 创建新模板
- `GET /api/templates/[id]` - 获取模板详情
- `PUT /api/templates/[id]` - 更新模板
- `DELETE /api/templates/[id]` - 删除模板

### 导入管理
- `GET /api/imports` - 获取导入记录列表
- `POST /api/imports` - 创建导入记录
- `GET /api/imports/[id]` - 获取导入详情
- `PATCH /api/imports/[id]` - 更新导入状态
- `DELETE /api/imports/[id]` - 删除导入记录

## 9. 本地开发

### 安装依赖
```bash
npm install
```

### 配置本地数据库 (可选)

创建 `.env.local`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/excel_import_db
```

### 运行开发服务器
```bash
npm run dev
```

访问 `http://localhost:3000`

### 数据库管理
```bash
# 创建迁移
npm run db:migrate

# 查看数据库 UI
npm run db:studio

# 初始化种子数据
npm run db:seed
```

## 10. 环境变量列表

| 变量名 | 必需 | 说明 |
|-------|------|------|
| `DATABASE_URL` | ✓ | PostgreSQL 连接字符串 |
| `NEXT_PUBLIC_API_URL` | 否 | API 基础 URL（客户端可见） |
| `MAX_FILE_SIZE` | 否 | 最大文件大小（字节） |
| `BATCH_SIZE` | 否 | 批处理大小 |

## 11. 常见问题

### Q: 部署后无法连接数据库？
A: 检查 DATABASE_URL 环境变量是否正确配置

### Q: 初始化数据库时出错？
A: 确保数据库连接正常，查看 API 响应的错误信息

### Q: 如何修改管理员密码？
A: 需要直接操作数据库或添加密码重置 API

## 12. 下一步

部署完成后，你可以：

1. 创建更多导入模板
2. 集成文件上传功能
3. 实现用户认证系统
4. 添加更多业务逻辑
5. 配置自定义域名

## 支持

如有问题，请查看：
- Vercel 文档: https://vercel.com/docs
- Prisma 文档: https://www.prisma.io/docs
- Next.js 文档: https://nextjs.org/docs
