import { PrismaClient } from '@prisma/client'

// 避免在开发环境中多次实例化 Prisma Client
declare global {
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
