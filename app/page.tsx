'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 首页重定向到 /import
    router.push('/import')
  }, [router])

  return null
}
