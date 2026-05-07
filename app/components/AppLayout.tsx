'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()

  const menuItems = [
    { label: '批量导入', icon: '📤', href: '/import', section: 'main' },
    { label: '历史记录', icon: '📑', href: '/history', section: 'main' },
    { label: '使用指南', icon: '❓', href: '/guide', section: 'help' },
  ]

  const isActive = (href: string) => {
    // 首页重定向到 /import
    if (pathname === '/' || pathname === '/import') {
      return href === '/import'
    }
    return pathname === href
  }

  return (
    <div className="app-container">
      {/* 顶部栏 */}
      <div className="app-header">
        <h1>📊 万能导入系统</h1>
        <p>支持多模板自动识别的Excel导入和运单管理系统</p>
      </div>

      {/* 主体容器 */}
      <div className="app-main">
        {/* 侧边栏 */}
        <div className="app-sidebar">
          {/* 主菜单 */}
          <div className="menu-section">
            <div className="menu-title">主菜单</div>
            {menuItems
              .filter((item) => item.section === 'main')
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`menu-item ${isActive(item.href) ? 'active' : ''}`}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
          </div>

          {/* 帮助菜单 */}
          <div className="menu-section">
            <div className="menu-title">帮助</div>
            {menuItems
              .filter((item) => item.section === 'help')
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`menu-item ${isActive(item.href) ? 'active' : ''}`}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="app-content">{children}</div>
      </div>
    </div>
  )
}
