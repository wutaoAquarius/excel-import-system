'use client'

import { useState } from 'react'

export interface ValidationError {
  rowIndex: number
  field: string
  message: string
  value?: any
}

interface ErrorSummaryProps {
  errors: ValidationError[]
  validCount: number
  errorCount: number
  errorTypes: number
}

export default function ErrorSummary({
  errors,
  validCount,
  errorCount,
  errorTypes,
}: ErrorSummaryProps) {
  const [showAllErrors, setShowAllErrors] = useState(false)

  const displayErrors = showAllErrors ? errors : errors.slice(0, 5)

  return (
    <>
      {/* 统计卡片 */}
      <div className="card">
        <h3>✅ 数据校验结果</h3>
        <div className="stats">
          <div className="stat-card">
            <div className="number">{validCount}</div>
            <div className="label">有效行</div>
          </div>
          <div
            className="stat-card"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #d4580b 100%)',
            }}
          >
            <div className="number">{errorCount}</div>
            <div className="label">错误行</div>
          </div>
          <div
            className="stat-card"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            }}
          >
            <div className="number">{errorTypes}</div>
            <div className="label">错误类型</div>
          </div>
        </div>
      </div>

      {/* 错误详情 */}
      {errors.length > 0 && (
        <div className="card">
          <h3>⚠️ 数据校验错误详情</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <div style={{ marginBottom: '15px', color: '#666', fontSize: '13px' }}>
              共 {errors.length} 个错误，请修正后再提交
            </div>

            {displayErrors.map((error, index) => (
              <div key={index} className="error-item">
                <div>
                  <span className="error-type-badge">行 {error.rowIndex}</span>
                  <span className="error-row">{error.field}</span>
                  <span>：{error.message}</span>
                </div>
              </div>
            ))}

            {!showAllErrors && errors.length > 5 && (
              <div
                style={{
                  marginTop: '15px',
                  textAlign: 'center',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onClick={() => setShowAllErrors(true)}
              >
                显示全部 {errors.length} 个错误 ▼
              </div>
            )}

            {showAllErrors && errors.length > 5 && (
              <div
                style={{
                  marginTop: '15px',
                  textAlign: 'center',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onClick={() => setShowAllErrors(false)}
              >
                收起 ▲
              </div>
            )}
          </div>

          <div style={{ marginTop: '15px', textAlign: 'right' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowAllErrors(!showAllErrors)}
            >
              {showAllErrors ? '收起' : '显示所有错误'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
