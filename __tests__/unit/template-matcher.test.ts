/**
 * template-matcher.ts 单元测试
 * 测试模板匹配、指纹生成和映射规则合并
 */

import {
  matchTemplate,
  formatMappingForStorage,
  mergeMapping,
} from '@/lib/template-matcher'

describe('template-matcher.ts - 模板匹配', () => {
  // ============ matchTemplate 测试 ============
  describe('matchTemplate - 完整模板匹配', () => {
    test('返回完整的模板匹配结果', () => {
      const headers = ['发件人姓名', '发件人电话', '重量']
      const result = matchTemplate(headers)

      expect(result).toHaveProperty('fingerprint')
      expect(result).toHaveProperty('mapping')
      expect(result).toHaveProperty('confidence')
    })

    test('指纹为有效的十六进制字符串', () => {
      const headers = ['发件人姓名', '发件人电话']
      const result = matchTemplate(headers)

      expect(typeof result.fingerprint).toBe('string')
      expect(/^[0-9a-f]+$/.test(result.fingerprint)).toBe(true)
    })

    test('映射包含正确的字段匹配（英文字段名）', () => {
      const headers = ['发件人姓名', '发件人电话', '重量']
      const result = matchTemplate(headers)

      expect(result.mapping['发件人姓名']).toBe('sender_name')
      expect(result.mapping['发件人电话']).toBe('sender_phone')
      expect(result.mapping['重量']).toBe('weight')
    })

    test('置信度是有效的百分比', () => {
      const headers = ['发件人姓名', '发件人电话', '未知字段']
      const result = matchTemplate(headers)

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(100)
      expect(Number.isInteger(result.confidence)).toBe(true)
    })

    test('部分匹配的列表返回较低的置信度', () => {
      const headers = ['发件人姓名', '未知字段1', '未知字段2', '未知字段3']
      const result = matchTemplate(headers)

      // 只有1个有效匹配 / 4个列 = 25%
      expect(result.confidence).toBeLessThanOrEqual(33)
    })

    test('全部匹配返回100%置信度', () => {
      const headers = ['发件人姓名', '发件人电话', '发件人地址']
      const result = matchTemplate(headers)

      expect(result.confidence).toBe(100)
    })

    test('无法匹配返回0%置信度', () => {
      const headers = ['未知1', '未知2', '未知3']
      const result = matchTemplate(headers)

      expect(result.confidence).toBe(0)
    })

    test('混合中英文别名匹配返回英文字段名', () => {
      const headers = ['sender_name', '寄件人电话', 'receiver_address', '件数']
      const result = matchTemplate(headers)

      expect(result.mapping['sender_name']).toBe('sender_name')
      expect(result.mapping['寄件人电话']).toBe('sender_phone')
      expect(result.mapping['receiver_address']).toBe('receiver_address')
      expect(result.mapping['件数']).toBe('quantity')
      expect(result.confidence).toBe(100)
    })

    test('相同headers生成相同的指纹', () => {
      const headers1 = ['发件人姓名', '发件人电话', '重量']
      const headers2 = ['发件人姓名', '发件人电话', '重量']

      const result1 = matchTemplate(headers1)
      const result2 = matchTemplate(headers2)

      expect(result1.fingerprint).toBe(result2.fingerprint)
    })

    test('空列表返回有效的结果', () => {
      const result = matchTemplate([])

      expect(result).toHaveProperty('fingerprint')
      expect(result).toHaveProperty('mapping')
      // 空列表的置信度是 0/0 = NaN (Math.round(NaN) = NaN)
      expect(isNaN(result.confidence) || result.confidence === 0).toBe(true)
      expect(Object.keys(result.mapping).length).toBe(0)
    })
  })

  // ============ formatMappingForStorage 测试 ============
  describe('formatMappingForStorage - 格式化映射规则存储', () => {
    test('移除"不映射"的字段', () => {
      const mapping = {
        '字段1': '发件人姓名',
        '字段2': '不映射',
        '字段3': '发件人电话',
      }

      const formatted = formatMappingForStorage(mapping)

      expect(formatted['字段1']).toBe('发件人姓名')
      expect(formatted['字段3']).toBe('发件人电话')
      expect(formatted['字段2']).toBeUndefined()
    })

    test('保留所有有效映射', () => {
      const mapping = {
        '姓名': '发件人姓名',
        '电话': '发件人电话',
        '地址': '发件人地址',
        '重量': '重量',
      }

      const formatted = formatMappingForStorage(mapping)

      expect(Object.keys(formatted).length).toBe(4)
      expect(formatted['姓名']).toBe('发件人姓名')
      expect(formatted['电话']).toBe('发件人电话')
    })

    test('移除空字符串值', () => {
      const mapping = {
        '字段1': '发件人姓名',
        '字段2': '',
        '字段3': '不映射',
        '字段4': '发件人电话',
      }

      const formatted = formatMappingForStorage(mapping)

      expect(formatted['字段2']).toBeUndefined()
      expect(formatted['字段3']).toBeUndefined()
      expect(Object.keys(formatted).length).toBe(2)
    })

    test('空映射返回空对象', () => {
      const formatted = formatMappingForStorage({})
      expect(formatted).toEqual({})
    })

    test('全部为"不映射"返回空对象', () => {
      const mapping = {
        '字段1': '不映射',
        '字段2': '不映射',
        '字段3': '不映射',
      }

      const formatted = formatMappingForStorage(mapping)
      expect(Object.keys(formatted).length).toBe(0)
    })

    test('保留原始的字段名和值', () => {
      const mapping = {
        'sender_name': '发件人姓名',
        '收件人电话': 'receiver_phone',
      }

      const formatted = formatMappingForStorage(mapping)

      expect(formatted['sender_name']).toBe('发件人姓名')
      expect(formatted['收件人电话']).toBe('receiver_phone')
    })

    test('大小写敏感', () => {
      const mapping = {
        '字段1': '不映射',
        '字段2': '不MAPPING',
        '字段3': '发件人姓名',
      }

      const formatted = formatMappingForStorage(mapping)

      // "不MAPPING" 不等于 "不映射"，应该被保留
      expect(formatted['字段2']).toBe('不MAPPING')
      expect(formatted['字段3']).toBe('发件人姓名')
    })
  })

  // ============ mergeMapping 测试 ============
  describe('mergeMapping - 合并映射规则', () => {
    test('已保存的规则在当前映射中不存在时被添加', () => {
      const currentMapping = {
        '字段1': '发件人姓名',
        '字段2': '发件人电话',
      }

      const savedMapping = {
        '字段1': '发件人地址', // 已在当前映射中，不会覆盖
        '字段3': '重量', // 新增
      }

      const merged = mergeMapping(currentMapping, savedMapping)

      // 当前映射优先，所以字段1保持不变
      expect(merged['字段1']).toBe('发件人姓名')
      expect(merged['字段2']).toBe('发件人电话')
      expect(merged['字段3']).toBe('重量')
    })

    test('保存的规则用于补充当前映射中缺失的字段', () => {
      const currentMapping = {
        '字段1': '发件人姓名',
        '字段2': '发件人电话',
      }

      const savedMapping = {
        '字段3': '发件人地址',
        '字段4': '重量',
      }

      const merged = mergeMapping(currentMapping, savedMapping)

      expect(merged['字段1']).toBe('发件人姓名')
      expect(merged['字段2']).toBe('发件人电话')
      expect(merged['字段3']).toBe('发件人地址')
      expect(merged['字段4']).toBe('重量')
    })

    test('当前映射中已有的字段不被保存映射覆盖', () => {
      const currentMapping = {
        '字段1': '发件人姓名',
        '字段2': '发件人电话',
        '字段3': '发件人地址',
      }

      const savedMapping = {
        '字段1': '收件人姓名', // 尝试覆盖但不会成功
        '字段2': '收件人电话', // 同上
        '字段4': '重量', // 新增
      }

      const merged = mergeMapping(currentMapping, savedMapping)

      expect(merged['字段1']).toBe('发件人姓名')
      expect(merged['字段2']).toBe('发件人电话')
      expect(merged['字段3']).toBe('发件人地址')
      expect(merged['字段4']).toBe('重量')
    })

    test('空的保存映射返回当前映射副本', () => {
      const currentMapping = {
        '字段1': '发件人姓名',
        '字段2': '发件人电话',
      }

      const merged = mergeMapping(currentMapping, {})

      expect(merged).toEqual(currentMapping)
      expect(merged).not.toBe(currentMapping) // 应该是新对象（副本）
    })

    test('空的当前映射加入保存的所有映射', () => {
      const currentMapping = {}
      const savedMapping = {
        '字段1': '发件人姓名',
        '字段2': '发件人电话',
      }

      const merged = mergeMapping(currentMapping, savedMapping)

      expect(merged['字段1']).toBe('发件人姓名')
      expect(merged['字段2']).toBe('发件人电话')
    })

    test('两个都为空返回空对象', () => {
      const merged = mergeMapping({}, {})
      expect(merged).toEqual({})
    })

    test('保存的字段会被添加到当前映射中', () => {
      const currentMapping = {
        '字段1': '发件人姓名',
      }

      const savedMapping = {
        '字段2': '',
        '字段3': '不映射',
        '字段4': '重量',
      }

      const merged = mergeMapping(currentMapping, savedMapping)

      expect(merged['字段1']).toBe('发件人姓名')
      // mergeMapping 会添加所有不在 currentMapping 中的字段
      expect(merged['字段2']).toBe('') // 空字符串也会被添加
      expect(merged['字段3']).toBe('不映射') // '不映射' 也会被添加
      expect(merged['字段4']).toBe('重量')
    })

    test('实际应用场景：新增列使用保存的规则', () => {
      // 第一次匹配的结果
      const firstMatchResult = {
        '发件人': '发件人姓名',
        '发件人电话': '发件人电话',
        '地址': '发件人地址',
      }

      // 第二次匹配（新文件，新增了一列）
      const secondMatchResult = {
        '发件人': '发件人姓名',
        '发件人电话': '发件人电话',
        '新增列': '不确定',
      }

      // 使用保存的规则补充
      const merged = mergeMapping(secondMatchResult, firstMatchResult)

      expect(merged['发件人']).toBe('发件人姓名')
      expect(merged['发件人电话']).toBe('发件人电话')
      expect(merged['新增列']).toBe('不确定')
      expect(merged['地址']).toBe('发件人地址') // 从保存规则添加
    })

    test('返回的是新对象而不是引用', () => {
      const currentMapping = { 'A': '发件人姓名' }
      const savedMapping = { 'B': '发件人电话' }

      const merged = mergeMapping(currentMapping, savedMapping)

      merged['A'] = '收件人姓名' // 修改合并结果

      expect(currentMapping['A']).toBe('发件人姓名') // 原对象不变
      expect(savedMapping['B']).toBe('发件人电话') // 原对象不变
    })
  })

  // ============ 集成测试 ============
  describe('模板匹配集成流程', () => {
    test('完整的模板识别流程', () => {
      const headers = [
        '发件人',
        'shipper_phone',
        '寄件地址',
        '收件人姓名',
        '收货电话',
        '收件人地址',
        'weight',
        '数量',
        '温度',
      ]

      const result = matchTemplate(headers)

      expect(result.confidence).toBeGreaterThan(80) // 大部分字段应该被识别
      expect(Object.keys(result.mapping).length).toBeGreaterThan(5)
    })

    test('新旧规则合并后的完整流程', () => {
      // 第一次匹配
      const headers1 = ['发件人', '发件人电话', '重量']
      const result1 = matchTemplate(headers1)
      const formatted1 = formatMappingForStorage(result1.mapping)

      // 模拟从数据库加载的旧规则
      const savedRules = formatted1

      // 第二次匹配（新文件，列顺序不同，新增一列）
      const headers2 = ['发件人电话', '重量', '发件人', '温层']
      const result2 = matchTemplate(headers2)
      const formatted2 = formatMappingForStorage(result2.mapping)

      // 合并新旧规则（新匹配结果作为当前，保存的作为补充）
      const finalRules = mergeMapping(formatted2, savedRules)

      expect(finalRules).toHaveProperty('发件人')
      expect(finalRules).toHaveProperty('发件人电话')
      expect(finalRules).toHaveProperty('重量')
      expect(finalRules).toHaveProperty('温层')
    })
  })
})
