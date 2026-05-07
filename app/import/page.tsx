'use client'

import { useState } from 'react'
import Header from '@/app/components/Header'
import ProgressIndicator from '@/app/components/ProgressIndicator'
import FileUpload from '@/app/components/FileUpload'
import ColumnMapping from '@/app/components/ColumnMapping'
import ErrorSummary, { ValidationError } from '@/app/components/ErrorSummary'

interface ImportState {
  currentStep: number
  fileName: string
  headers: string[]
  rows: any[]
  mapping: Record<string, string>
  fingerprint: string
  confidence: number
  errors: ValidationError[]
  validRows: any[]
  invalidRows: any[]
  isLoading: boolean
}

export default function ImportPage() {
  const [state, setState] = useState<ImportState>({
    currentStep: 1,
    fileName: '',
    headers: [],
    rows: [],
    mapping: {},
    fingerprint: '',
    confidence: 0,
    errors: [],
    validRows: [],
    invalidRows: [],
    isLoading: false,
  })

  // 步骤 1：文件上传
  const handleFileSelect = async (
    file: File,
    preview: { headers: string[]; rows: any[] }
  ) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      // 保存文件信息
      setState((prev) => ({
        ...prev,
        fileName: file.name,
        headers: preview.headers,
        rows: preview.rows,
      }))

      // 调用模板匹配 API
      const response = await fetch('/api/template-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: preview.headers }),
      })

      if (!response.ok) throw new Error('模板匹配失败')

      const result = await response.json()

      // 更新映射和指纹
      setState((prev) => ({
        ...prev,
        mapping: result.mapping || {},
        fingerprint: result.fingerprint || '',
        confidence: result.confidence || 0,
        currentStep: 2,
      }))
    } catch (error) {
      alert('处理文件失败：' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  // 步骤 2-3：映射编辑
  const handleMappingChange = (mapping: Record<string, string>) => {
    setState((prev) => ({ ...prev, mapping }))
  }

  const handleContinueToValidation = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      // 保存映射规则到数据库
      if (state.fingerprint) {
        await fetch('/api/mapping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save',
            fingerprint: state.fingerprint,
            mapping: state.mapping,
            headers: state.headers,
          }),
        })
      }

      // 调用校验 API
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: state.rows,
          mapping: state.mapping,
          headers: state.headers,
        }),
      })

      if (!response.ok) throw new Error('数据校验失败')

      const result = await response.json()

      setState((prev) => ({
        ...prev,
        errors: result.errors || [],
        validRows: result.validRows || [],
        invalidRows: result.invalidRows || [],
        currentStep: 4,
      }))
    } catch (error) {
      alert('校验失败：' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  // 重置映射
  const handleResetMapping = () => {
    setState((prev) => ({
      ...prev,
      mapping: {},
    }))
  }

  // 返回到映射步骤
  const handleBackToMapping = () => {
    setState((prev) => ({ ...prev, currentStep: 3 }))
  }

  // 导出数据
  const handleExport = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: state.validRows,
          errors: state.errors,
          headers: state.headers,
          mapping: state.mapping,
        }),
      })

      if (!response.ok) throw new Error('导出失败')

      // 下载文件
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `导入数据_${new Date().getTime()}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('导出失败：' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  // 提交导入
  const handleSubmit = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      // 再次校验
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: state.validRows,
          mapping: state.mapping,
          headers: state.headers,
        }),
      })

      if (!response.ok) throw new Error('数据校验失败')

      const result = await response.json()

      if (result.errors && result.errors.length > 0) {
        alert('仍存在校验错误，请修正后再提交')
        return
      }

      // 提交到数据库
      const submitResponse = await fetch('/api/imports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: state.validRows,
        }),
      })

      if (!submitResponse.ok) throw new Error('提交失败')

      await submitResponse.json()

      // 显示成功信息
      setState((prev) => ({
        ...prev,
        currentStep: 5,
      }))
    } catch (error) {
      alert('提交失败：' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  // 重新开始
  const handleRestart = () => {
    setState({
      currentStep: 1,
      fileName: '',
      headers: [],
      rows: [],
      mapping: {},
      fingerprint: '',
      confidence: 0,
      errors: [],
      validRows: [],
      invalidRows: [],
      isLoading: false,
    })
  }

  return (
    <>
      <Header
        title="📤 批量导入"
        description="上传Excel文件，系统将自动识别列名并进行数据校验"
      />

      <div className="content-inner">
        <ProgressIndicator currentStep={state.currentStep} />

        {/* 步骤 1：上传文件 */}
        {state.currentStep === 1 && (
          <FileUpload
            onFileSelect={handleFileSelect}
            onLoading={(isLoading) =>
              setState((prev) => ({ ...prev, isLoading }))
            }
            disabled={state.isLoading}
          />
        )}

        {/* 步骤 2：自动识别结果 */}
        {state.currentStep === 2 && state.headers.length > 0 && (
          <div className="card">
            <h3>📊 原始数据预览（前 5 行）</h3>
            <div style={{ marginTop: '15px' }}>
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>
                <strong>文件名：</strong> {state.fileName}
              </p>
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>
                <strong>行数：</strong> {state.rows.length}
              </p>
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '15px' }}>
                <strong>列数：</strong> {state.headers.length}
              </p>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      {state.headers.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.rows.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        {state.headers.map((header) => (
                          <td key={`${idx}-${header}`}>{row[header] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                className="btn btn-primary"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    currentStep: 3,
                  }))
                }
              >
                继续编辑映射
              </button>
            </div>
          </div>
        )}

        {/* 步骤 3：列映射编辑 */}
        {state.currentStep === 3 && state.headers.length > 0 && (
          <ColumnMapping
            headers={state.headers}
            mapping={state.mapping}
            onMappingChange={handleMappingChange}
            fingerprint={state.fingerprint}
            confidence={state.confidence}
            onContinue={handleContinueToValidation}
            onReset={handleResetMapping}
          />
        )}

        {/* 步骤 4：数据校验 */}
        {state.currentStep === 4 && (
          <>
            <ErrorSummary
              errors={state.errors}
              validCount={state.validRows.length}
              errorCount={state.invalidRows.length}
              errorTypes={new Set(state.errors.map((e) => e.message)).size}
            />

            {state.errors.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: '48px', marginBottom: '15px' }}>✨</p>
                <h3 style={{ color: '#10b981', marginBottom: '10px' }}>
                  数据校验完成
                </h3>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  共 <strong style={{ color: '#10b981', fontSize: '18px' }}>
                    {state.validRows.length}
                  </strong>{' '}
                  条有效数据，可直接提交
                </p>

                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={state.isLoading}
                >
                  {state.isLoading ? '提交中...' : '提交导入'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleExport}
                  style={{ marginLeft: '10px' }}
                  disabled={state.isLoading}
                >
                  导出为 Excel
                </button>
              </div>
            )}

            {state.errors.length > 0 && (
              <div className="card" style={{ marginTop: '20px' }}>
                <h3>📋 修正后的数据预览（可在线编辑）</h3>
                <p style={{ color: '#666', fontSize: '13px', marginBottom: '15px' }}>
                  点击单元格可编辑数据，Tab 键移动到下一个单元格，Esc 取消编辑
                </p>

                <div
                  className="table-wrapper"
                  style={{ maxHeight: '400px', overflow: 'auto' }}
                >
                  <table>
                    <thead>
                      <tr>
                        {state.headers.map((header) => (
                          <th key={header}>{state.mapping[header] || header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.validRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          {state.headers.map((header) => {
                            const mappedField = state.mapping[header]
                            const hasError = state.errors.some(
                              (e) =>
                                e.rowIndex === idx + 1 &&
                                e.field === mappedField
                            )
                            return (
                              <td
                                key={`${idx}-${header}`}
                                className={hasError ? 'error-cell' : ''}
                              >
                                {row[mappedField] || row[header] || '-'}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleBackToMapping}
                  >
                    返回编辑映射
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleExport}
                    style={{ marginLeft: '10px' }}
                    disabled={state.isLoading}
                  >
                    导出为 Excel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 步骤 5：完成导入 */}
        {state.currentStep === 5 && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '48px', marginBottom: '15px' }}>✨</p>
            <h3 style={{ color: '#10b981', marginBottom: '10px' }}>导入完成</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              成功导入{' '}
              <strong style={{ color: '#10b981', fontSize: '18px' }}>
                {state.validRows.length}
              </strong>{' '}
              条有效数据
            </p>

            <div>
              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={state.isLoading}
              >
                导出为 Excel
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleRestart}
                style={{ marginLeft: '10px' }}
                disabled={state.isLoading}
              >
                重新导入
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
