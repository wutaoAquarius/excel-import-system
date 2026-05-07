'use client'

interface ColumnMappingProps {
  headers: string[]
  mapping: Record<string, string> // 现在是：系统字段英文 -> Excel列名
  onMappingChange: (mapping: Record<string, string>) => void
  fingerprint?: string
  confidence?: number
  onContinue: () => void
  onReset: () => void
  onPrevious?: () => void
}

// 系统字段定义（英文 -> 中文）
const SYSTEM_FIELDS: Record<string, { cnName: string; required: boolean }> = {
  sender_name: { cnName: '发件人姓名', required: true },
  sender_phone: { cnName: '发件人电话', required: true },
  sender_address: { cnName: '发件人地址', required: true },
  receiver_name: { cnName: '收件人姓名', required: true },
  receiver_phone: { cnName: '收件人电话', required: true },
  receiver_address: { cnName: '收件人地址', required: true },
  weight: { cnName: '重量', required: true },
  quantity: { cnName: '件数', required: true },
  temperature: { cnName: '温层', required: true },
  external_code: { cnName: '外部编码', required: false },
  remark: { cnName: '备注', required: false },
}

const SYSTEM_FIELDS_ORDER = [
  'sender_name',
  'sender_phone',
  'sender_address',
  'receiver_name',
  'receiver_phone',
  'receiver_address',
  'weight',
  'quantity',
  'temperature',
  'external_code',
  'remark',
]

export default function ColumnMapping({
  headers,
  mapping,
  onMappingChange,
  fingerprint,
  confidence,
  onContinue,
  onReset,
  onPrevious,
}: ColumnMappingProps) {
  // 处理系统字段的映射变化
  const handleFieldMappingChange = (systemField: string, excelColumn: string) => {
    const newMapping = { ...mapping }
    
    if (excelColumn === '') {
      // 取消映射
      delete newMapping[systemField]
    } else {
      // 移除该 Excel 列从其他系统字段的映射
      Object.keys(newMapping).forEach((field) => {
        if (newMapping[field] === excelColumn && field !== systemField) {
          delete newMapping[field]
        }
      })
      // 设置新映射
      newMapping[systemField] = excelColumn
    }
    
    onMappingChange(newMapping)
  }
  
  // 获取已被映射的 Excel 列
  const mappedColumns = new Set(Object.values(mapping).filter(v => v))
  
  // 获取未被映射的 Excel 列
  const unmappedColumns = headers.filter(h => !mappedColumns.has(h))
  
  // 计算必填字段映射情况
  const requiredFields = Object.keys(SYSTEM_FIELDS).filter(
    (field) => SYSTEM_FIELDS[field].required
  )
  const mappedRequiredFields = requiredFields.filter((field) => mapping[field])
  const allRequiredFieldsMapped = mappedRequiredFields.length === requiredFields.length

  return (
    <div className="card">
      <h3>🔄 列名映射编辑</h3>

      {/* 模板信息卡片 */}
      {fingerprint && (
        <div
          style={{
            marginTop: '15px',
            padding: '15px',
            background: '#f0f9ff',
            borderRadius: '8px',
            borderLeft: '4px solid #0284c7',
          }}
        >
          <p style={{ margin: '8px 0', color: '#0c4a6e' }}>
            <strong>模板指纹：</strong>{' '}
            <code
              style={{
                background: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              {fingerprint}
            </code>
          </p>
          {confidence !== undefined && (
            <p style={{ margin: '8px 0', color: '#0c4a6e' }}>
              <strong>识别准确度：</strong>{' '}
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#0284c7' }}>
                {confidence.toFixed(1)}%
              </span>
            </p>
          )}
        </div>
      )}

      <div style={{ marginBottom: '15px', marginTop: '15px' }}>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>
          请将 Excel 列映射到系统字段。必填字段标有 <span style={{ color: '#dc2626', fontWeight: 'bold' }}>*</span>：
        </p>
        
        {/* 映射统计显示 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '6px',
            }}>
              必填字段映射：{mappedRequiredFields.length}/{requiredFields.length}
            </div>
            <progress
              value={mappedRequiredFields.length}
              max={requiredFields.length}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: '#e5e7eb',
                appearance: 'none',
              }}
            />
          </div>
          {unmappedColumns.length > 0 && (
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#f0fdf4',
              color: '#059669',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              fontWeight: '500',
            }}>
              ✓ 未映射列：{unmappedColumns.length}
            </div>
          )}
        </div>
      </div>

      {/* 系统字段卡片网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '15px',
          marginTop: '15px',
        }}
      >
        {SYSTEM_FIELDS_ORDER.map((systemField) => {
          const fieldInfo = SYSTEM_FIELDS[systemField]
          const selectedColumn = mapping[systemField] || ''
          
          return (
            <div
              key={systemField}
              style={{
                padding: '15px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: selectedColumn ? '#f0fdf4' : '#ffffff',
                borderLeft: fieldInfo.required ? '4px solid #dc2626' : '4px solid #e5e7eb',
              }}
            >
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1f2937',
              }}>
                {fieldInfo.cnName}
                {fieldInfo.required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
              </label>
              
              <select
                value={selectedColumn}
                onChange={(e) => handleFieldMappingChange(systemField, e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="">-- 不映射 --</option>
                {headers.map((header) => {
                  // 检查该列是否已被其他字段映射
                  const isUsedByOther = Object.entries(mapping).some(
                    ([field, col]) => col === header && field !== systemField
                  )
                  
                  return (
                    <option
                      key={header}
                      value={header}
                      disabled={isUsedByOther}
                      title={isUsedByOther ? '该列已被其他字段使用' : ''}
                    >
                      {header}
                      {isUsedByOther ? ' (已使用)' : ''}
                    </option>
                  )
                })}
              </select>

              {selectedColumn && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: '#ecfdf5',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#047857',
                }}>
                  ✓ 已映射到：<strong>{selectedColumn}</strong>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 警告提示 */}
      {!allRequiredFieldsMapped && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '6px',
          color: '#92400e',
          fontSize: '13px',
        }}>
          ⚠️ 还有 <strong>{requiredFields.length - mappedRequiredFields.length}</strong> 个必填字段未映射
        </div>
      )}

      {/* 按钮组 */}
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        {onPrevious && (
          <button
            className="btn btn-secondary"
            onClick={onPrevious}
            style={{ marginRight: '10px' }}
          >
            上一步
          </button>
        )}
        <button className="btn btn-secondary" onClick={onReset}>
          重置映射
        </button>
        <button
          className="btn btn-primary"
          onClick={onContinue}
          style={{ marginLeft: '10px' }}
          disabled={!allRequiredFieldsMapped}
          title={!allRequiredFieldsMapped ? '请先映射所有必填字段' : '继续验证数据'}
        >
          继续验证数据
        </button>
      </div>
    </div>
  )
}
