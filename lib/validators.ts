/**
 * 校验错误类型
 */
export interface ValidationError {
  rowIndex: number
  field: string
  message: string
  value?: any
}

/**
 * 校验规则配置
 */
export const VALIDATION_RULES = {
  required: {
    fields: [
      'sender_name',
      'sender_phone',
      'sender_address',
      'receiver_name',
      'receiver_phone',
      'receiver_address',
      'weight',
      'quantity',
      'temperature',
    ],
  },
  phone: {
    pattern: /^1[3-9]\d{9}$/,
    message: '电话格式错误',
  },
  weight: {
    validate: (v: any) => {
      const num = parseFloat(v)
      return !isNaN(num) && num > 0
    },
    message: '重量必须是正数',
  },
  quantity: {
    validate: (v: any) => {
      const num = parseInt(v)
      return !isNaN(num) && num > 0 && Number.isInteger(num)
    },
    message: '件数必须是正整数',
  },
  temperature: {
    enum: ['常温', '冷藏', '冷冻'],
    message: '温层值不在范围内',
  },
}

/**
 * 验证单行数据
 * mapping 格式：系统字段 (英文) -> Excel 列名
 */
export function validateRow(
  row: Record<string, any>,
  mapping: Record<string, string>,
  _allRows?: Record<string, any>[],
  mappedRows?: Record<string, any>[],
  _isAlreadyMapped?: boolean
): ValidationError[] {
  const errors: ValidationError[] = []
  const mappedRow: Record<string, any> = {}

  // 根据新的映射格式（系统字段 -> Excel列名）映射数据
  // mapping 的 key 是系统字段英文名，value 是对应的 Excel 列名
  for (const [systemField, excelColumn] of Object.entries(mapping)) {
    if (excelColumn) {
      // excelColumn 是 Excel 中的列名，从 row 中取出对应的值
      mappedRow[systemField] = row[excelColumn]
    }
  }

  // 必填字段检查
  for (const field of VALIDATION_RULES.required.fields) {
    const value = mappedRow[field]
    // 检查是否缺失：null、undefined、空字符串、仅空格
    const isMissing =
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '')
    
    if (isMissing) {
      errors.push({
        rowIndex: 0, // 会在调用处设置
        field,
        message: `${field}：缺失必填字段`,
        value,
      })
    }
  }

  // 电话格式检查
  const phoneFields = ['sender_phone', 'receiver_phone']
  for (const field of phoneFields) {
    const value = mappedRow[field]
    if (value && !VALIDATION_RULES.phone.pattern.test(String(value))) {
      errors.push({
        rowIndex: 0,
        field,
        message: `${field}：${VALIDATION_RULES.phone.message}`,
        value,
      })
    }
  }

  // 重量检查
  if (mappedRow['weight']) {
    if (!VALIDATION_RULES.weight.validate(mappedRow['weight'])) {
      errors.push({
        rowIndex: 0,
        field: 'weight',
        message: `weight：${VALIDATION_RULES.weight.message}`,
        value: mappedRow['weight'],
      })
    }
  }

  // 件数检查
  if (mappedRow['quantity']) {
    if (!VALIDATION_RULES.quantity.validate(mappedRow['quantity'])) {
      errors.push({
        rowIndex: 0,
        field: 'quantity',
        message: `quantity：${VALIDATION_RULES.quantity.message}`,
        value: mappedRow['quantity'],
      })
    }
  }

  // 温层检查
  if (mappedRow['temperature']) {
    const temp = String(mappedRow['temperature']).trim()
    if (!VALIDATION_RULES.temperature.enum.includes(temp)) {
      errors.push({
        rowIndex: 0,
        field: 'temperature',
        message: `temperature：${VALIDATION_RULES.temperature.message}`,
        value: mappedRow['temperature'],
      })
    }
  }

  // 外部编码重复检测（同批次内）
  if (mappedRow['external_code']) {
    const externalCode = String(mappedRow['external_code']).trim()
    if (mappedRows) {
      const duplicateIndex = mappedRows.findIndex(
        (r) => String(r.external_code || '').trim() === externalCode
      )
      if (duplicateIndex >= 0) {
        errors.push({
          rowIndex: 0,
          field: 'external_code',
          message: `external_code：与第${duplicateIndex + 1}行重复`,
          value: mappedRow['external_code'],
        })
      }
    }
  }

  return errors
}

/**
 * 验证所有行数据
 * mapping 格式：系统字段 (英文) -> Excel 列名
 */
export function validateAllRows(
  rows: Record<string, any>[],
  _headers: string[],
  mapping: Record<string, string>
): {
  errors: ValidationError[]
  validRows: Record<string, any>[]
  invalidRows: Record<string, any>[]
} {
  const errors: ValidationError[] = []
  const validRows: Record<string, any>[] = []
  const invalidRows: Record<string, any>[] = []

  rows.forEach((row, index) => {
    const rowErrors = validateRow(row, mapping, rows, validRows)
    rowErrors.forEach((error) => {
      errors.push({
        ...error,
        rowIndex: index + 1,
      })
    })

    if (rowErrors.length === 0) {
      // 映射数据：根据 mapping（系统字段 -> Excel列名）转换
      const mappedRow: Record<string, any> = {}
      for (const [systemField, excelColumn] of Object.entries(mapping)) {
        if (excelColumn) {
          mappedRow[systemField] = row[excelColumn]
        }
      }
      validRows.push(mappedRow)
    } else {
      invalidRows.push(row)
    }
  })

  return {
    errors,
    validRows,
    invalidRows,
  }
}
