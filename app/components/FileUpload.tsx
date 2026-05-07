'use client'

import { useRef } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File, preview: { headers: string[]; rows: any[] }) => Promise<void>
  onLoading?: (isLoading: boolean) => void
  disabled?: boolean
}

export default function FileUpload({
  onFileSelect,
  onLoading,
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAreaRef = useRef<HTMLDivElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const processFile = async (file: File) => {
    // 验证文件格式
    if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('请上传 .xlsx 或 .xls 格式的文件')
      return
    }

    // 验证文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过 10MB')
      return
    }

    try {
      onLoading?.(true)

      // 调用 /api/parse 解析文件
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        alert('文件解析失败：' + (error.message || '未知错误'))
        return
      }

      const data = await response.json()

      // 调用回调函数
      await onFileSelect(file, {
        headers: data.headers || [],
        rows: data.rows || [],
      })
    } catch (error) {
      console.error('文件处理失败:', error)
      alert('文件处理失败：' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      onLoading?.(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    uploadAreaRef.current?.classList.add('drag-over')
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    uploadAreaRef.current?.classList.remove('drag-over')
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    uploadAreaRef.current?.classList.remove('drag-over')

    const file = e.dataTransfer.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="card">
      <h3>📁 选择 Excel 文件</h3>

      {/* 上传区域 */}
      <div
        ref={uploadAreaRef}
        className="upload-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="upload-icon">📁</div>
        <div className="upload-text">点击选择或拖拽 Excel 文件</div>
        <div className="upload-hint">支持 .xlsx 和 .xls 格式，最大 10MB</div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* 按钮组 */}
      <div style={{ marginTop: '15px' }}>
        <button
          className="btn btn-primary"
          onClick={handleClick}
          disabled={disabled}
        >
          选择文件
        </button>
        <button
          className="btn btn-secondary"
          onClick={async () => {
            try {
              onLoading?.(true)
              const response = await fetch('/api/sample-data')
              if (!response.ok) throw new Error('获取示例数据失败')
              const data = await response.json()
              await onFileSelect(new File([], 'sample.xlsx'), {
                headers: data.headers || [],
                rows: data.rows || [],
              })
            } catch (error) {
              alert('加载示例数据失败')
            } finally {
              onLoading?.(false)
            }
          }}
          disabled={disabled}
        >
          加载示例数据
        </button>
      </div>
    </div>
  )
}
