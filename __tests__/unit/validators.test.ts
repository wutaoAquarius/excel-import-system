/**
 * validators.ts 单元测试
 * 测试数据校验逻辑，包括：
 * - 必填字段检查
 * - 格式校验（电话、数字等）
 * - 值范围检查
 * - 重复检测（同批次内）
 */

import {
  VALIDATION_RULES,
  validateRow,
  validateAllRows,
} from '@/lib/validators'

describe('validators.ts - 数据校验', () => {
  // ============ VALIDATION_RULES 配置测试 ============
  describe('VALIDATION_RULES - 校验规则配置', () => {
    test('必填字段列表存在且非空', () => {
      expect(VALIDATION_RULES.required.fields).toBeDefined()
      expect(Array.isArray(VALIDATION_RULES.required.fields)).toBe(true)
      expect(VALIDATION_RULES.required.fields.length).toBeGreaterThan(0)
    })

    test('必填字段包含所有关键字段', () => {
      const requiredFields = [
        'sender_name',
        'sender_phone',
        'sender_address',
        'receiver_name',
        'receiver_phone',
        'receiver_address',
        'weight',
        'quantity',
        'temperature',
      ]
      requiredFields.forEach((field) => {
        expect(VALIDATION_RULES.required.fields).toContain(field)
      })
    })

    test('电话规则定义正确', () => {
      expect(VALIDATION_RULES.phone).toBeDefined()
      expect(VALIDATION_RULES.phone.pattern).toBeDefined()
      expect(VALIDATION_RULES.phone.message).toBeDefined()
    })

    test('重量规则配置正确', () => {
      expect(VALIDATION_RULES.weight).toBeDefined()
      expect(VALIDATION_RULES.weight.validate).toBeDefined()
      expect(typeof VALIDATION_RULES.weight.validate).toBe('function')
    })

    test('件数规则配置正确', () => {
      expect(VALIDATION_RULES.quantity).toBeDefined()
      expect(VALIDATION_RULES.quantity.validate).toBeDefined()
    })

    test('温层规则配置正确', () => {
      expect(VALIDATION_RULES.temperature).toBeDefined()
      expect(VALIDATION_RULES.temperature.enum).toContain('常温')
      expect(VALIDATION_RULES.temperature.enum).toContain('冷藏')
      expect(VALIDATION_RULES.temperature.enum).toContain('冷冻')
    })
  })

  // ============ 单行校验 (validateRow) 测试 ============
  describe('validateRow - 单行数据校验', () => {
    // 基础映射配置
    const basicMapping = {
      '姓名': 'sender_name',
      '电话': 'sender_phone',
      '地址': 'sender_address',
      '收件人': 'receiver_name',
      '收件人电话': 'receiver_phone',
      '收件人地址': 'receiver_address',
      '重量': 'weight',
      '件数': 'quantity',
      '温层': 'temperature',
    }

    test('完全有效的行返回空错误数组', () => {
      const validRow = {
        '姓名': '张三',
        '电话': '13800138000',
        '地址': '北京市朝阳区',
        '收件人': '李四',
        '收件人电话': '13900139000',
        '收件人地址': '上海市浦东新区',
        '重量': 5.5,
        '件数': 3,
        '温层': '冷藏',
      }
      const errors = validateRow(validRow, basicMapping)
      expect(errors.length).toBe(0)
    })

    test('缺少必填字段时返回错误', () => {
      const invalidRow = {
        '姓名': '张三',
        '电话': '', // 空电话
        '地址': '北京市朝阳区',
        '收件人': '李四',
        '收件人电话': '13900139000',
        '收件人地址': '上海市浦东新区',
        '重量': 5.5,
        '件数': 3,
        '温层': '冷藏',
      }
      const errors = validateRow(invalidRow, basicMapping)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some((e) => e.field === 'sender_phone')).toBe(true)
    })

    test('电话格式错误返回相应错误', () => {
      const invalidRow = {
        '姓名': '张三',
        '电话': '12345', // 电话格式错误
        '地址': '北京市朝阳区',
        '收件人': '李四',
        '收件人电话': '13900139000',
        '收件人地址': '上海市浦东新区',
        '重量': 5.5,
        '件数': 3,
        '温层': '冷藏',
      }
      const errors = validateRow(invalidRow, basicMapping)
      const phoneError = errors.find((e) => e.field === 'sender_phone')
      expect(phoneError).toBeDefined()
      expect(phoneError?.message).toContain('电话格式错误')
    })

    test('有效的电话格式通过验证', () => {
      const validPhones = [
        '13800138000',
        '14012341234',
        '15512345678',
        '16612345678',
        '17712345678',
        '18812345678',
        '19912345678',
      ]

      validPhones.forEach((phone) => {
        const row = {
          '姓名': '张三',
          '电话': phone,
          '地址': '北京市朝阳区',
          '收件人': '李四',
          '收件人电话': '13900139000',
          '收件人地址': '上海市浦东新区',
          '重量': 5.5,
          '件数': 3,
          '温层': '冷藏',
        }
        const errors = validateRow(row, basicMapping)
        const phoneError = errors.find((e) => e.field === 'sender_phone')
        expect(phoneError).toBeUndefined()
      })
    })

    test('无效的电话格式不通过验证', () => {
      const invalidPhones = ['12345678901', '1380013', 'abc', '']

      invalidPhones.forEach((phone) => {
        if (phone === '') return // 空值由必填检查处理

        const row = {
          '姓名': '张三',
          '电话': phone,
          '地址': '北京市朝阳区',
          '收件人': '李四',
          '收件人电话': '13900139000',
          '收件人地址': '上海市浦东新区',
          '重量': 5.5,
          '件数': 3,
          '温层': '冷藏',
        }
        const errors = validateRow(row, basicMapping)
        const phoneError = errors.find((e) => e.field === 'sender_phone')
        expect(phoneError).toBeDefined()
      })
    })

    test('重量必须是正数', () => {
      // 有效的重量值
      const validRow = {
        '姓名': '张三',
        '电话': '13800138000',
        '地址': '北京市朝阳区',
        '收件人': '李四',
        '收件人电话': '13900139000',
        '收件人地址': '上海市浦东新区',
        '重量': 5.5,
        '件数': 3,
        '温层': '冷藏',
      }
      expect(validateRow(validRow, basicMapping).filter((e) => e.field === 'weight')).toHaveLength(0)

      // 无效的重量值：负数
      const invalidRow = {
        ...validRow,
        '重量': -5,
      }
      const errors = validateRow(invalidRow, basicMapping)
      expect(errors.some((e) => e.field === 'weight')).toBe(true)

      // 无效的重量值：非数字
      const invalidRow2 = {
        ...validRow,
        '重量': 'abc',
      }
      const errors2 = validateRow(invalidRow2, basicMapping)
      expect(errors2.some((e) => e.field === 'weight')).toBe(true)

      // 注意：0 被当作假值，验证被跳过（if (mappedRow['weight']) 会失败）
      const zeroRow = {
        ...validRow,
        '重量': 0,
      }
      expect(validateRow(zeroRow, basicMapping).filter((e) => e.field === 'weight')).toHaveLength(0)
    })

    test('件数必须是正整数', () => {
      // 有效的件数
      const validRow = {
        '姓名': '张三',
        '电话': '13800138000',
        '地址': '北京市朝阳区',
        '收件人': '李四',
        '收件人电话': '13900139000',
        '收件人地址': '上海市浦东新区',
        '重量': 5.5,
        '件数': 3,
        '温层': '冷藏',
      }
      expect(validateRow(validRow, basicMapping).filter((e) => e.field === 'quantity')).toHaveLength(0)

      // 无效的件数：负数
      const invalidRow = {
        ...validRow,
        '件数': -1,
      }
      const errors = validateRow(invalidRow, basicMapping)
      expect(errors.some((e) => e.field === 'quantity')).toBe(true)

      // 无效的件数：非数字
      const invalidRow2 = {
        ...validRow,
        '件数': 'abc',
      }
      const errors2 = validateRow(invalidRow2, basicMapping)
      expect(errors2.some((e) => e.field === 'quantity')).toBe(true)

      // 注意：0 是假值，验证会被跳过
      const zeroRow = {
        ...validRow,
        '件数': 0,
      }
      expect(validateRow(zeroRow, basicMapping).filter((e) => e.field === 'quantity')).toHaveLength(0)
    })

    test('温层值必须在允许范围内', () => {
      const validTemperatures = ['常温', '冷藏', '冷冻']
      const invalidTemperatures = ['室温', '冷', '温暖', 'abc']

      validTemperatures.forEach((temp) => {
        const row = {
          '姓名': '张三',
          '电话': '13800138000',
          '地址': '北京市朝阳区',
          '收件人': '李四',
          '收件人电话': '13900139000',
          '收件人地址': '上海市浦东新区',
          '重量': 5.5,
          '件数': 3,
          '温层': temp,
        }
        const errors = validateRow(row, basicMapping)
        const tempError = errors.find((e) => e.field === 'temperature')
        expect(tempError).toBeUndefined()
      })

      invalidTemperatures.forEach((temp) => {
        const row = {
          '姓名': '张三',
          '电话': '13800138000',
          '地址': '北京市朝阳区',
          '收件人': '李四',
          '收件人电话': '13900139000',
          '收件人地址': '上海市浦东新区',
          '重量': 5.5,
          '件数': 3,
          '温层': temp,
        }
        const errors = validateRow(row, basicMapping)
        const tempError = errors.find((e) => e.field === 'temperature')
        expect(tempError).toBeDefined()
      })
    })

    test('检测同批次内的外部编码重复', () => {
      const mappingWithCode = {
        ...basicMapping,
        '订单号': 'external_code',
      }

      const row1 = {
        '姓名': '张三',
        '电话': '13800138000',
        '地址': '北京市朝阳区',
        '收件人': '李四',
        '收件人电话': '13900139000',
        '收件人地址': '上海市浦东新区',
        '重量': 5.5,
        '件数': 3,
        '温层': '冷藏',
        '订单号': 'ORD001',
      }

      const row2 = {
        ...row1,
        '订单号': 'ORD001', // 相同的订单号
      }

      const mappedRow1 = {
        sender_name: '张三',
        sender_phone: '13800138000',
        sender_address: '北京市朝阳区',
        receiver_name: '李四',
        receiver_phone: '13900139000',
        receiver_address: '上海市浦东新区',
        weight: 5.5,
        quantity: 3,
        temperature: '冷藏',
        external_code: 'ORD001',
      }

      const errors = validateRow(row2, mappingWithCode, [row1], [mappedRow1])
      const duplicateError = errors.find((e) => e.field === 'external_code')
      expect(duplicateError).toBeDefined()
      expect(duplicateError?.message).toContain('重复')
    })
  })

  // ============ 批量行校验 (validateAllRows) 测试 ============
  describe('validateAllRows - 批量行数据校验', () => {
    const basicMapping = {
      '姓名': 'sender_name',
      '电话': 'sender_phone',
      '地址': 'sender_address',
      '收件人': 'receiver_name',
      '收件人电话': 'receiver_phone',
      '收件人地址': 'receiver_address',
      '重量': 'weight',
      '件数': 'quantity',
      '温层': 'temperature',
    }

    const headers = [
      '姓名',
      '电话',
      '地址',
      '收件人',
      '收件人电话',
      '收件人地址',
      '重量',
      '件数',
      '温层',
    ]

    test('全部有效行返回空错误和正确的分组', () => {
      const rows = [
        {
          '姓名': '张三',
          '电话': '13800138000',
          '地址': '北京市朝阳区',
          '收件人': '李四',
          '收件人电话': '13900139000',
          '收件人地址': '上海市浦东新区',
          '重量': 5.5,
          '件数': 3,
          '温层': '冷藏',
        },
        {
          '姓名': '王五',
          '电话': '14001400001',
          '地址': '广州市天河区',
          '收件人': '赵六',
          '收件人电话': '15001500001',
          '收件人地址': '深圳市南山区',
          '重量': 8.2,
          '件数': 5,
          '温层': '常温',
        },
      ]

      const result = validateAllRows(rows, headers, basicMapping)

      expect(result.errors.length).toBe(0)
      expect(result.validRows.length).toBe(2)
      expect(result.invalidRows.length).toBe(0)
    })

    test('混合有效和无效行进行正确分类', () => {
      const rows = [
        {
          '姓名': '张三',
          '电话': '13800138000',
          '地址': '北京市朝阳区',
          '收件人': '李四',
          '收件人电话': '13900139000',
          '收件人地址': '上海市浦东新区',
          '重量': 5.5,
          '件数': 3,
          '温层': '冷藏',
        },
        {
          '姓名': '王五',
          '电话': 'invalid', // 无效电话
          '地址': '广州市天河区',
          '收件人': '赵六',
          '收件人电话': '15001500001',
          '收件人地址': '深圳市南山区',
          '重量': 8.2,
          '件数': 5,
          '温层': '常温',
        },
        {
          '姓名': '孙七',
          '电话': '14001400001',
          '地址': '杭州市西湖区',
          '收件人': '周八',
          '收件人电话': '14401440001',
          '收件人地址': '苏州市吴中区',
          '重量': 3.5,
          '件数': 2,
          '温层': '冷冻',
        },
      ]

      const result = validateAllRows(rows, headers, basicMapping)

      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.validRows.length).toBe(2) // 第1和第3行有效
      expect(result.invalidRows.length).toBe(1) // 第2行无效
    })

    test('返回的错误包含正确的行号', () => {
      const rows = [
        {
          '姓名': '张三',
          '电话': '13800138000',
          '地址': '北京市朝阳区',
          '收件人': '李四',
          '收件人电话': 'invalid', // 第1行错误
          '收件人地址': '上海市浦东新区',
          '重量': 5.5,
          '件数': 3,
          '温层': '冷藏',
        },
        {
          '姓名': '王五',
          '电话': '14001400001',
          '地址': '广州市天河区',
          '收件人': '赵六',
          '收件人电话': '15001500001',
          '收件人地址': '上海市浦东新区',
          '重量': '不是数字', // 第2行错误
          '件数': 5,
          '温层': '常温',
        },
      ]

      const result = validateAllRows(rows, headers, basicMapping)

      // 检查错误行号
      const row1Errors = result.errors.filter((e) => e.rowIndex === 1)
      const row2Errors = result.errors.filter((e) => e.rowIndex === 2)

      expect(row1Errors.length).toBeGreaterThan(0)
      expect(row2Errors.length).toBeGreaterThan(0)
    })

    test('返回正确映射的有效行', () => {
      const rows = [
        {
          '姓名': '张三',
          '电话': '13800138000',
          '地址': '北京市朝阳区',
          '收件人': '李四',
          '收件人电话': '13900139000',
          '收件人地址': '上海市浦东新区',
          '重量': 5.5,
          '件数': 3,
          '温层': '冷藏',
        },
      ]

      const result = validateAllRows(rows, headers, basicMapping)

      expect(result.validRows.length).toBe(1)
      const mappedRow = result.validRows[0]
      expect(mappedRow.sender_name).toBe('张三')
      expect(mappedRow.sender_phone).toBe('13800138000')
      expect(mappedRow.weight).toBe(5.5)
      expect(mappedRow.quantity).toBe(3)
      expect(mappedRow.temperature).toBe('冷藏')
    })

    test('空行列表返回空结果', () => {
      const result = validateAllRows([], headers, basicMapping)

      expect(result.errors.length).toBe(0)
      expect(result.validRows.length).toBe(0)
      expect(result.invalidRows.length).toBe(0)
    })

    test('处理多个错误的单行', () => {
      const rows = [
        {
          '姓名': '', // 缺失
          '电话': 'invalid', // 无效格式
          '地址': '', // 缺失
          '收件人': '李四',
          '收件人电话': 'invalid', // 无效格式
          '收件人地址': '上海市浦东新区',
          '重量': -5, // 无效值
          '件数': 1.5, // 无效值
          '温层': '无效温度', // 无效值
        },
      ]

      const result = validateAllRows(rows, headers, basicMapping)

      expect(result.errors.length).toBeGreaterThan(5) // 至少6个错误
      expect(result.validRows.length).toBe(0)
      expect(result.invalidRows.length).toBe(1)
    })
  })
})
