'use client'

import { useState, useCallback } from 'react'
import { ValidationError } from './ErrorSummary'

interface EditableDataTableProps {
  headers: string[]
  rows: any[]
  mapping: Record<string, string>
  errors: ValidationError[]
  onDataChange?: (updatedRows: any[]) => void
}

interface EditingCell {
  rowIndex: number
  header: string
}

export default function EditableDataTable({
  headers,
  rows,
  mapping,
  errors,
  onDataChange,
}: EditableDataTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [editValue, setEditValue] = useState('')
  const [localRows, setLocalRows] = useState(rows)

  // 获取系统字段名称（用于表头显示）
  const getSystemFieldName = (header: string) => {
    return Object.entries(mapping).find(([_, col]) => col === header)?.[0] || header
  }

  // 检查某行是否有错误
  const rowHasErrors = useCallback(
    (rowIndex: number) => {
      return errors.some((e) => e.rowIndex === rowIndex + 1)
    },
    [errors]
  )

  // 检查某单元格是否有错误
  const cellHasError = useCallback(
    (rowIndex: number, header: string) => {
      const systemField = Object.entries(mapping).find(([_, col]) => col === header)?.[0] || header
      return errors.some(
        (e) => e.rowIndex === rowIndex + 1 && e.field === systemField
      )
    },
    [errors, mapping]
  )

  // 开始编辑单元格
  const handleCellClick = (rowIndex: number, header: string) => {
    setEditingCell({ rowIndex, header })
    setEditValue(localRows[rowIndex][header] || '')
  }

  // 保存编辑内容
  const handleCellBlur = () => {
    if (editingCell) {
      const updatedRows = [...localRows]
      updatedRows[editingCell.rowIndex][editingCell.header] = editValue
      setLocalRows(updatedRows)
      onDataChange?.(updatedRows)
    }
    setEditingCell(null)
    setEditValue('')
  }

  // 按 Enter 键保存，Escape 键取消
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCellBlur()
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setEditValue('')
    }
  }

  return (
    <div className="table-wrapper" style={{ maxHeight: '600px', overflow: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th style={{ width: '50px', textAlign: 'center' }}>行号</th>
            {headers.map((header) => (
              <th key={header}>
                {getSystemFieldName(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {localRows.map((_, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                backgroundColor: rowHasErrors(rowIndex) ? '#fee2e2' : undefined,
              }}
            >
              <td
                style={{
                  textAlign: 'center',
                  backgroundColor: rowHasErrors(rowIndex) ? '#fee2e2' : undefined,
                  fontWeight: 500,
                  fontSize: '12px',
                  color: '#666',
                }}
              >
                {rowIndex + 1}
              </td>
              {headers.map((header) => {
                const isEditing =
                  editingCell?.rowIndex === rowIndex &&
                  editingCell?.header === header
                const hasError = cellHasError(rowIndex, header)

                return (
                  <td
                    key={`${rowIndex}-${header}`}
                    style={{
                      backgroundColor: hasError ? '#fca5a5' : undefined,
                      color: hasError ? '#7f1d1d' : undefined,
                      padding: 0,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleCellClick(rowIndex, header)}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: 'none',
                          outline: '2px solid #667eea',
                          outlineOffset: '-2px',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          padding: '8px',
                          minHeight: '32px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {localRows[rowIndex][header] || '-'}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '15px', color: '#666', fontSize: '12px' }}>
        共 {localRows.length} 行，其中 {localRows.length - errors.filter((e, i, arr) => arr.findIndex(er => er.rowIndex === e.rowIndex) === i).length} 行有效，{errors.filter((e, i, arr) => arr.findIndex(er => er.rowIndex === e.rowIndex) === i).length} 行有错误
      </div>
    </div>
  )
}
