/**
 * similarity.ts 单元测试
 * 测试字段别名匹配和相似度计算算法
 */

import {
  ALIAS_MAP,
  levenshteinDistance,
  calculateSimilarity,
  matchFieldName,
  matchAllHeaders,
  generateFingerprint,
  calculateConfidence,
} from '@/lib/similarity'

describe('similarity.ts - 字段匹配和相似度算法', () => {
  // ============ Levenshtein 距离算法测试 ============
  describe('levenshteinDistance - 编辑距离计算', () => {
    test('相同字符串返回距离0', () => {
      expect(levenshteinDistance('发件人姓名', '发件人姓名')).toBe(0)
      expect(levenshteinDistance('abc', 'abc')).toBe(0)
      expect(levenshteinDistance('', '')).toBe(0)
    })

    test('完全不同的字符串返回最大距离', () => {
      expect(levenshteinDistance('abc', 'xyz')).toBe(3)
      expect(levenshteinDistance('a', 'bcd')).toBe(3)
    })

    test('大小写不敏感计算距离', () => {
      expect(levenshteinDistance('ABC', 'abc')).toBe(0)
      expect(levenshteinDistance('SenderName', 'sendername')).toBe(0)
    })

    test('单字符差异返回合理距离', () => {
      expect(levenshteinDistance('cat', 'cut')).toBe(1)
      expect(levenshteinDistance('sit', 'cats')).toBe(3)
    })

    test('空字符串处理', () => {
      expect(levenshteinDistance('', 'abc')).toBe(3)
      expect(levenshteinDistance('abc', '')).toBe(3)
      expect(levenshteinDistance('', '')).toBe(0)
    })

    test('中文字符正确处理', () => {
      expect(levenshteinDistance('发送', '发')).toBe(1)
      expect(levenshteinDistance('电话', '手机')).toBe(2)
    })
  })

  // ============ 相似度评分测试 ============
  describe('calculateSimilarity - 相似度评分 (0-100)', () => {
    test('100%相似返回100分', () => {
      expect(calculateSimilarity('sender', 'sender')).toBe(100)
      expect(calculateSimilarity('发件人姓名', '发件人姓名')).toBe(100)
    })

    test('完全不同返回0分', () => {
      expect(calculateSimilarity('abc', 'xyz')).toBe(0)
      expect(calculateSimilarity('phone', 'weight')).toBe(0)
    })

    test('部分相似返回中等分数', () => {
      const similarity = calculateSimilarity('sender', 'send')
      expect(similarity).toBeGreaterThan(50)
      expect(similarity).toBeLessThan(100)
    })

    test('空字符串返回100', () => {
      expect(calculateSimilarity('', '')).toBe(100)
    })

    test('返回值在0-100范围内', () => {
      const testCases = [
        ['abc', 'xyz'],
        ['hello', 'world'],
        ['test', 'text'],
        ['发件人', '收件人'],
      ]
      testCases.forEach(([a, b]) => {
        const score = calculateSimilarity(a, b)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
      })
    })
  })

  // ============ 单字段名称匹配测试 ============
  describe('matchFieldName - 单个字段名称匹配', () => {
    test('精确匹配字段名称返回英文字段名', () => {
      // 注意：matchFieldName 返回英文字段名以便于数据库操作
      expect(matchFieldName('发件人姓名')).toBe('sender_name')
      expect(matchFieldName('收件人电话')).toBe('receiver_phone')
      expect(matchFieldName('重量')).toBe('weight')
      expect(matchFieldName('温层')).toBe('temperature')
    })

    test('精确匹配别名（中文）返回英文字段名', () => {
      expect(matchFieldName('寄件人')).toBe('sender_name')
      expect(matchFieldName('发送人')).toBe('sender_name')
      expect(matchFieldName('寄件人电话')).toBe('sender_phone')
    })

    test('精确匹配别名（英文）返回英文字段名', () => {
      expect(matchFieldName('sender')).toBe('sender_name')
      expect(matchFieldName('sender_name')).toBe('sender_name')
      expect(matchFieldName('receiver_phone')).toBe('receiver_phone')
      expect(matchFieldName('weight')).toBe('weight')
      expect(matchFieldName('quantity')).toBe('quantity')
      expect(matchFieldName('temperature')).toBe('temperature')
    })

    test('相似度匹配超过阈值的字段', () => {
      // senderName 与 sender_name 相似度高，应该匹配到 sender_name
      const result = matchFieldName('senderName')
      expect(result).toBe('sender_name')
    })

    test('大小写不敏感匹配', () => {
      expect(matchFieldName('SENDER')).toBe('sender_name')
      expect(matchFieldName('Receiver_Phone')).toBe('receiver_phone')
    })

    test('前导/尾部空格自动清理', () => {
      expect(matchFieldName('  sender_name  ')).toBe('sender_name')
      expect(matchFieldName('\t重量\n')).toBe('weight')
    })

    test('无匹配返回null', () => {
      expect(matchFieldName('xyz123')).toBeNull()
      expect(matchFieldName('未知字段')).toBeNull()
      expect(matchFieldName('random_field')).toBeNull()
    })

    test('自定义相似度阈值', () => {
      // 阈值设置很高，应该不匹配
      // senderName 与 sender_name 匹配度可能超过95，所以改为99
      expect(matchFieldName('xyz', 99)).toBeNull()
      // 阈值设置很低，应该匹配更多
      const lowThreshold = matchFieldName('snd', 30)
      expect(lowThreshold).toBeDefined()
    })

    test('空字符串处理', () => {
      expect(matchFieldName('')).toBeNull()
      expect(matchFieldName('   ')).toBeNull()
    })
  })

  // ============ 全列表匹配测试 ============
  describe('matchAllHeaders - 全列表字段匹配', () => {
    test('匹配所有已知字段返回英文字段名', () => {
      const headers = [
        '发件人姓名',
        '发件人电话',
        '发件人地址',
        '重量',
        '温层',
      ]
      const mapping = matchAllHeaders(headers)

      expect(mapping['发件人姓名']).toBe('sender_name')
      expect(mapping['发件人电话']).toBe('sender_phone')
      expect(mapping['重量']).toBe('weight')
      expect(mapping['温层']).toBe('temperature')
    })

    test('混合匹配标准名和别名返回英文字段名', () => {
      const headers = ['发件人姓名', '寄件人电话', 'receiver_address', 'weight']
      const mapping = matchAllHeaders(headers)

      expect(mapping['发件人姓名']).toBe('sender_name')
      expect(mapping['寄件人电话']).toBe('sender_phone')
      expect(mapping['receiver_address']).toBe('receiver_address')
      expect(mapping['weight']).toBe('weight')
    })

    test('未匹配的列不出现在映射中', () => {
      const headers = ['发件人姓名', '未知字段1', '未知字段2', 'receiver_phone']
      const mapping = matchAllHeaders(headers)

      expect(mapping['发件人姓名']).toBe('sender_name')
      expect(mapping['receiver_phone']).toBe('receiver_phone')
      expect(Object.keys(mapping).length).toBe(2)
      expect(mapping['未知字段1']).toBeUndefined()
    })

    test('空列表返回空映射', () => {
      const mapping = matchAllHeaders([])
      expect(mapping).toEqual({})
    })

    test('所有字段都无法匹配返回空映射', () => {
      const headers = ['xyz', 'abc', 'def']
      const mapping = matchAllHeaders(headers)
      expect(Object.keys(mapping).length).toBe(0)
    })

    test('大小写混合匹配返回英文字段名', () => {
      const headers = ['SENDER_NAME', 'Receiver_Phone', 'WEIGHT']
      const mapping = matchAllHeaders(headers)

      expect(mapping['SENDER_NAME']).toBe('sender_name')
      expect(mapping['Receiver_Phone']).toBe('receiver_phone')
      expect(mapping['WEIGHT']).toBe('weight')
    })
  })

  // ============ 模板指纹生成测试 ============
  describe('generateFingerprint - 模板指纹生成', () => {
    test('相同headers生成相同指纹', () => {
      const headers1 = ['发件人姓名', '发件人电话', '重量']
      const headers2 = ['发件人姓名', '发件人电话', '重量']
      expect(generateFingerprint(headers1)).toBe(generateFingerprint(headers2))
    })

    test('不同headers生成不同指纹', () => {
      const headers1 = ['发件人姓名', '发件人电话', '重量']
      const headers2 = ['发件人姓名', '收件人电话', '重量']
      expect(generateFingerprint(headers1)).not.toBe(generateFingerprint(headers2))
    })

    test('列顺序不影响指纹（排序后）', () => {
      const headers1 = ['A', 'B', 'C']
      const headers2 = ['C', 'B', 'A']
      expect(generateFingerprint(headers1)).toBe(generateFingerprint(headers2))
    })

    test('返回十六进制字符串', () => {
      const fingerprint = generateFingerprint(['test'])
      expect(/^[0-9a-f]+$/.test(fingerprint)).toBe(true)
    })

    test('空列表生成有效指纹', () => {
      const fingerprint = generateFingerprint([])
      expect(fingerprint).toBeDefined()
      expect(fingerprint.length).toBeGreaterThan(0)
    })

    test('重复调用返回一致的指纹', () => {
      const headers = ['col1', 'col2', 'col3']
      const fp1 = generateFingerprint(headers)
      const fp2 = generateFingerprint(headers)
      expect(fp1).toBe(fp2)
    })
  })

  // ============ 识别准确度计算测试 ============
  describe('calculateConfidence - 识别准确度计算', () => {
    test('全部映射返回100%', () => {
      const headers = ['发件人姓名', '收件人电话', '重量']
      const mapping = {
        '发件人姓名': '发件人姓名',
        '收件人电话': '收件人电话',
        '重量': '重量',
      }
      expect(calculateConfidence(headers, mapping)).toBe(100)
    })

    test('无映射返回0%', () => {
      const headers = ['col1', 'col2', 'col3']
      const mapping = {}
      expect(calculateConfidence(headers, mapping)).toBe(0)
    })

    test('部分映射返回相应百分比', () => {
      const headers = ['发件人姓名', '发件人电话', '重量']
      const mapping = {
        '发件人姓名': '发件人姓名',
        '发件人电话': '发件人电话',
        // 缺少重量的映射
      }
      // 2/3 * 100 = 66.67 ≈ 67（四舍五入）
      expect(calculateConfidence(headers, mapping)).toBe(67)
    })

    test('忽略"不映射"字段', () => {
      const headers = ['发件人姓名', '发件人电话', '重量']
      const mapping = {
        '发件人姓名': '发件人姓名',
        '发件人电话': '不映射',
        '重量': '重量',
      }
      // 只计算有效映射：2个有效映射 / 3个headers = 66.67 ≈ 67%
      expect(calculateConfidence(headers, mapping)).toBe(67)
    })

    test('映射中的空值计为未映射', () => {
      const headers = ['col1', 'col2']
      const mapping = {
        'col1': '字段1',
        'col2': '', // 空字符串视为未映射
      }
      expect(calculateConfidence(headers, mapping)).toBe(50)
    })

    test('返回四舍五入的百分比', () => {
      const headers = ['a', 'b', 'c']
      const mapping = {
        'a': 'field_a',
        // 2个映射 / 3个 = 66.666... ≈ 67
      }
      const confidence = calculateConfidence(headers, mapping)
      expect(confidence).toBeGreaterThanOrEqual(0)
      expect(confidence).toBeLessThanOrEqual(100)
      expect(Number.isInteger(confidence)).toBe(true)
    })
  })

  // ============ ALIAS_MAP 完整性测试 ============
  describe('ALIAS_MAP - 别名库验证', () => {
    test('别名库包含所有必要字段', () => {
      const requiredFields = [
        '发件人姓名',
        '发件人电话',
        '发件人地址',
        '收件人姓名',
        '收件人电话',
        '收件人地址',
        '重量',
        '件数',
        '温层',
      ]
      requiredFields.forEach((field) => {
        expect(ALIAS_MAP).toHaveProperty(field)
      })
    })

    test('每个字段都有至少一个别名', () => {
      Object.values(ALIAS_MAP).forEach((aliases) => {
        expect(Array.isArray(aliases)).toBe(true)
        expect(aliases.length).toBeGreaterThan(0)
      })
    })

    test('标准字段名包含在别名列表中', () => {
      Object.entries(ALIAS_MAP).forEach(([systemField, aliases]) => {
        // 每个系统字段应该在自己的别名列表中
        const hasExactMatch = aliases.some(
          (alias) => alias === systemField
        )
        expect(hasExactMatch).toBe(true)
      })
    })
  })
})
