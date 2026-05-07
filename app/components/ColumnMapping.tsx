'use client'

interface ColumnMappingProps {
  headers: string[]
  mapping: Record<string, string>
  onMappingChange: (mapping: Record<string, string>) => void
  fingerprint?: string
  confidence?: number
  onContinue: () => void
  onReset: () => void
  onPrevious?: () => void
}

// 系统字段的中文显示名称
const SYSTEM_FIELDS_CN = [
  '发件人姓名',
  '发件人电话',
  '发件人地址',
  '收件人姓名',
  '收件人电话',
  '收件人地址',
  '重量',
  '件数',
  '温层',
  '外部编码',
  '备注',
  '不映射',
]

// 中文到英文的映射（用于存储和验证）
const FIELD_NAME_MAP: Record<string, string> = {
  '发件人姓名': 'sender_name',
  '发件人电话': 'sender_phone',
  '发件人地址': 'sender_address',
  '收件人姓名': 'receiver_name',
  '收件人电话': 'receiver_phone',
  '收件人地址': 'receiver_address',
  '重量': 'weight',
  '件数': 'quantity',
  '温层': 'temperature',
  '外部编码': 'external_code',
  '备注': 'remark',
  '不映射': '不映射',
}

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
  const handleMappingChange = (header: string, cnField: string) => {
    const newMapping = { ...mapping }
    // 转换中文字段名到英文进行存储
    const englishField = FIELD_NAME_MAP[cnField] || cnField
    newMapping[header] = englishField
    onMappingChange(newMapping)
  }
  
  // 创建英文到中文的反向映射（用于显示）
  const englishToCN = Object.entries(FIELD_NAME_MAP).reduce(
    (acc, [cn, en]) => ({ ...acc, [en]: cn }),
    {} as Record<string, string>
  )

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

      <p style={{ color: '#666', fontSize: '13px', marginBottom: '15px', marginTop: '15px' }}>
        请确认以下列的映射是否正确，可手动调整：
      </p>

      {/* 映射网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '15px',
        }}
      >
        {headers.map((header) => {
          // 从存储的英文映射值转换为中文显示
          const englishValue = mapping[header] || ''
          const cnValue = englishToCN[englishValue] || ''
          const displayField = cnValue || '未映射'
          
          return (
            <div key={header} className="mapping-item">
              <label>
                <strong>{displayField}</strong>
              </label>
              <div className="original-name">原始列名：{header}</div>
              <select
                value={cnValue}
                onChange={(e) => handleMappingChange(header, e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <option value="">-- 选择映射字段 --</option>
                {SYSTEM_FIELDS_CN.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

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
        >
          继续验证数据
        </button>
      </div>
    </div>
  )
}
