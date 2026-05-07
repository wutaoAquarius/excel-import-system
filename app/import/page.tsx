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
  stepProgress: number // 当前步骤进度 0-100
  hasMergedFirstRow?: boolean // 第一行是否有合并单元格
  dataStartRow?: number // 实际数据起始行号（1-indexed）
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
    stepProgress: 0,
    hasMergedFirstRow: false,
    dataStartRow: 1,
  })

  // 步骤 1：文件上传
  const handleFileSelect = async (
    file: File,
    preview: { headers: string[]; rows: any[]; hasMergedFirstRow?: boolean; dataStartRow?: number }
  ) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, stepProgress: 20 }))

      // 如果第一行有合并单元格，显示提示信息
      if (preview.hasMergedFirstRow) {
        alert('✓ 检测到第一行存在合并单元格，已自动跳过第一行，使用第二行作为表头行')
      }

      // 保存文件信息
      setState((prev) => ({
        ...prev,
        fileName: file.name,
        headers: preview.headers,
        rows: preview.rows,
        hasMergedFirstRow: preview.hasMergedFirstRow || false,
        dataStartRow: preview.dataStartRow || 1,
        stepProgress: 30,
      }))

      // 步骤1：调用模板匹配 API 获取自动识别的映射
      setState((prev) => ({ ...prev, stepProgress: 50 }))
      const matchResponse = await fetch('/api/template-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: preview.headers }),
      })

      if (!matchResponse.ok) throw new Error('模板匹配失败')

      const matchResult = await matchResponse.json()
      const fingerprint = matchResult.fingerprint || ''

      // 步骤2：检查是否有之前保存的相同模板映射规则
      let finalMapping = matchResult.mapping || {}
      let confidence = matchResult.confidence || 0
      
      if (fingerprint) {
        setState((prev) => ({ ...prev, stepProgress: 70 }))
        try {
          const findResponse = await fetch('/api/mapping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'find',
              fingerprint,
            }),
          })

          if (findResponse.ok) {
            const findResult = await findResponse.json()
            if (findResult.data && findResult.data.mapping_rules) {
              // 使用之前保存的映射规则
              finalMapping = findResult.data.mapping_rules
              confidence = 100 // 完全匹配之前保存的规则
            }
          }
        } catch (err) {
          // 查找失败不影响流程，继续使用自动识别的映射
          console.log('查找保存的映射规则失败，继续使用自动识别')
        }
      }

      // 更新映射和指纹
      setState((prev) => ({
        ...prev,
        mapping: finalMapping,
        fingerprint,
        confidence,
        currentStep: 2,
        stepProgress: 100,
      }))
    } catch (error) {
      alert('处理文件失败：' + (error instanceof Error ? error.message : '未知错误'))
      setState((prev) => ({ ...prev, stepProgress: 0 }))
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  // 步骤 2-3：映射编辑
  const handleMappingChange = (mapping: Record<string, string>) => {
    // 新映射格式：系统字段 -> Excel列
    setState((prev) => ({ ...prev, mapping }))
  }

  const handleContinueToValidation = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, stepProgress: 20 }))

      // 保存映射规则到数据库
      if (state.fingerprint) {
        setState((prev) => ({ ...prev, stepProgress: 40 }))
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
      setState((prev) => ({ ...prev, stepProgress: 60 }))
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
        stepProgress: 100,
      }))
    } catch (error) {
      alert('校验失败：' + (error instanceof Error ? error.message : '未知错误'))
      setState((prev) => ({ ...prev, stepProgress: 0 }))
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
      setState((prev) => ({ ...prev, isLoading: true, stepProgress: 20 }))

      // 再次校验
      setState((prev) => ({ ...prev, stepProgress: 40 }))
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
        setState((prev) => ({ ...prev, stepProgress: 0 }))
        return
      }

      // 提交到数据库
      setState((prev) => ({ ...prev, stepProgress: 70 }))
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
        stepProgress: 100,
      }))
    } catch (error) {
      alert('提交失败：' + (error instanceof Error ? error.message : '未知错误'))
      setState((prev) => ({ ...prev, stepProgress: 0 }))
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  // 返回上一步
  const handlePreviousStep = () => {
    setState((prev) => {
      const newStep = Math.max(1, prev.currentStep - 1)
      // 如果从步骤 4 返回到步骤 3，需要清除验证结果
      if (prev.currentStep === 4 && newStep === 3) {
        return {
          ...prev,
          currentStep: newStep,
          errors: [],
          validRows: [],
          invalidRows: [],
          stepProgress: 0,
        }
      }
      return { ...prev, currentStep: newStep, stepProgress: 0 }
    })
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
      stepProgress: 0,
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
        
        {/* 当前步骤进度条 */}
        {state.isLoading && state.stepProgress > 0 && (
          <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            <div style={{ marginBottom: '8px', fontSize: '13px', color: '#666' }}>
              步骤 {state.currentStep} 处理中... {state.stepProgress}%
            </div>
            <progress
              value={state.stepProgress}
              max="100"
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: '#e5e7eb',
                appearance: 'none',
              }}
            />
          </div>
        )}

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
            
            {/* 合并单元格提示 */}
            {state.hasMergedFirstRow && (
              <div style={{
                marginTop: '15px',
                padding: '12px',
                backgroundColor: '#dbeafe',
                border: '1px solid #0284c7',
                borderRadius: '6px',
                color: '#0c4a6e',
                fontSize: '13px',
                marginBottom: '15px',
              }}>
                <strong>ℹ️ 提示：</strong> 检测到原始文件第一行存在合并单元格，已自动跳过并使用第二行作为表头行。
                <br />
                <span style={{ fontSize: '12px', marginTop: '4px', display: 'inline-block' }}>
                  实际数据行号：从第 {state.dataStartRow || 1} 行开始
                </span>
              </div>
            )}

            <div style={{ marginTop: '15px' }}>
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>
                <strong>文件名：</strong> {state.fileName}
              </p>
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>
                <strong>行数：</strong> {state.rows.length}{state.hasMergedFirstRow ? ' (已跳过合并行)' : ''}
              </p>
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '15px' }}>
                <strong>列数：</strong> {state.headers.length}
              </p>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      {state.headers.map((header) => {
                        // 显示 Excel 列名以及自动识别的系统字段
                        const systemField = Object.entries(state.mapping).find(
                          ([_, col]) => col === header
                        )?.[0]
                        return (
                          <th key={header}>
                            <div>{header}</div>
                            {systemField && (
                              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 'normal' }}>
                                → {systemField}
                              </div>
                            )}
                          </th>
                        )
                      })}
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
                className="btn btn-secondary"
                onClick={handlePreviousStep}
                style={{ marginRight: '10px' }}
              >
                上一步
              </button>
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
            onPrevious={handlePreviousStep}
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

                <div style={{ marginTop: '20px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handlePreviousStep}
                    style={{ marginRight: '10px' }}
                  >
                    上一步
                  </button>
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
              </div>
            )}

            {state.errors.length > 0 && (
              <div className="card" style={{ marginTop: '20px' }}>
                <h3>📋 校验后的数据预览</h3>
                <p style={{ color: '#666', fontSize: '13px', marginBottom: '15px' }}>
                  下表显示所有数据行。红色背景的单元格表示存在校验错误，请修正后重新上传或返回编辑映射
                </p>

                <div
                  className="table-wrapper"
                  style={{ maxHeight: '500px', overflow: 'auto' }}
                >
                  <table>
                    <thead>
                      <tr>
                        {state.headers.map((header) => (
                          // 表头显示映射后的系统字段名
                          // 新的 mapping 格式：系统字段 -> Excel列
                          // 需要反向查找该 Excel 列对应的系统字段
                          <th key={header}>
                            {Object.entries(state.mapping).find(([_, col]) => col === header)?.[0] || header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* 显示所有行（包括有效和无效），以便用户看到有错误的数据 */}
                      {state.rows.slice(0, 50).map((row, idx) => {
                        // 检查该行是否有错误
                        const rowHasErrors = state.errors.some(e => e.rowIndex === idx + 1)
                        
                        return (
                          <tr key={idx} style={{
                            backgroundColor: rowHasErrors ? '#fee2e2' : undefined,
                          }}>
                            {state.headers.map((header) => {
                              // 该 Excel 列对应的系统字段
                              const systemField = Object.entries(state.mapping).find(
                                ([_, col]) => col === header
                              )?.[0]
                              
                              // 检查该单元格是否有错误
                              const hasError = state.errors.some(
                                (e) =>
                                  e.rowIndex === idx + 1 &&
                                  e.field === systemField
                              )
                              
                              return (
                                <td
                                  key={`${idx}-${header}`}
                                  style={{
                                    backgroundColor: hasError ? '#fca5a5' : undefined,
                                    color: hasError ? '#7f1d1d' : undefined,
                                  }}
                                >
                                  {row[header] || '-'}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '15px', color: '#666', fontSize: '12px' }}>
                  显示前 50 行 (共 {state.rows.length} 行，其中 {state.validRows.length} 行有效，{state.invalidRows.length} 行有错误)
                </div>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleBackToMapping}
                    style={{ marginRight: '10px' }}
                  >
                    返回编辑映射
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
