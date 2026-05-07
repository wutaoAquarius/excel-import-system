// jest.setup.js
// Jest初始化配置文件

// 设置环境变量
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test_db'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
process.env.MAX_FILE_SIZE = '52428800'
process.env.BATCH_SIZE = '500'

// 全局测试超时
jest.setTimeout(10000)

// 抑制控制台输出（可选）
// global.console.log = jest.fn()
// global.console.error = jest.fn()
// global.console.warn = jest.fn()
