'use client'

import { useEffect, useState } from 'react'

interface InitStatus {
  initialized: boolean
  stats?: {
    users: number
    templates: number
  }
}

export default function Home() {
  const [initStatus, setInitStatus] = useState<InitStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)

  useEffect(() => {
    checkInitStatus()
  }, [])

  const checkInitStatus = async () => {
    try {
      const res = await fetch('/api/init-db')
      const data = await res.json()
      setInitStatus(data)
    } catch (error) {
      console.error('检查初始化状态失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInitialize = async () => {
    setInitializing(true)
    try {
      const res = await fetch('/api/init-db', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        alert('数据库初始化成功！\n\n管理员账号：admin@example.com\n初始密码：admin@123456')
        await checkInitStatus()
      } else {
        alert('初始化失败：' + data.message)
      }
    } catch (error) {
      alert('初始化出错：' + error)
    } finally {
      setInitializing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          万能导入系统
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          支持多模板的自动识别与导入下单系统
        </p>

        {/* 系统状态卡片 */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            系统状态
          </h2>
          {loading ? (
            <p className="text-gray-600">检查中...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">数据库状态</span>
                <span
                  className={`px-4 py-2 rounded-full text-white font-semibold ${
                    initStatus?.initialized ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                >
                  {initStatus?.initialized ? '已初始化' : '未初始化'}
                </span>
              </div>
              {initStatus?.initialized && initStatus?.stats && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">用户数</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {initStatus.stats.users}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">导入模板</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {initStatus.stats.templates}
                    </p>
                  </div>
                </div>
              )}
              {!initStatus?.initialized && (
                <button
                  onClick={handleInitialize}
                  disabled={initializing}
                  className="mt-4 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded transition"
                >
                  {initializing ? '初始化中...' : '点击初始化数据库'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            功能特性
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <span>支持多种 Excel 模板格式的自动识别</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <span>模板记忆学习功能，一次调整永久生效</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <span>支持 1000+ 条数据的无缝导入</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <span>完整的数据校验与错误提示</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <span>在线数据编辑和导出</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 快速开始</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ API 文档：/api/templates - 模板管理</li>
            <li>✓ API 文档：/api/imports - 导入记录</li>
            <li>✓ API 文档：/api/init-db - 数据库初始化</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
