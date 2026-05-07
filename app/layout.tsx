import type { Metadata } from 'next'
import AppLayout from './components/AppLayout'
import './globals.css'

export const metadata: Metadata = {
  title: '万能导入系统',
  description: '多模板自动导入下单系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
