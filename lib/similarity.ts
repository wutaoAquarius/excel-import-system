/**
 * 字段别名库
 */
export const ALIAS_MAP: Record<string, string[]> = {
  发件人姓名: [
    '发件人姓名',
    '寄件人',
    '寄件人姓名',
    '发送人',
    '发送人姓名',
    'shipper',
    'sender',
    'sender_name',
    'senderName',
    '发件人',
  ],
  发件人电话: [
    '发件人电话',
    '发件电话',
    '寄件人电话',
    '寄件电话',
    '发送人电话',
    '发件人联系电话',
    'shipper_phone',
    'sender_phone',
    'senderPhone',
    '联系电话',
  ],
  发件人地址: [
    '发件人地址',
    '寄件地址',
    '发送地址',
    '发件地址',
    '发件人完整地址',
    'shipper_address',
    'sender_address',
    'senderAddress',
    '地址',
  ],
  收件人姓名: [
    '收件人姓名',
    '收货人',
    '收货人姓名',
    '收方',
    '收方姓名',
    '接收人',
    'receiver',
    'receiver_name',
    'receiverName',
    '收件人',
    '收货人名字',
  ],
  收件人电话: [
    '收件人电话',
    '收货电话',
    '收件电话',
    '收货人电话',
    '收方电话',
    '接收人电话',
    '收件人联系电话',
    'receiver_phone',
    'receiverPhone',
    '联系方式',
  ],
  收件人地址: [
    '收件人地址',
    '收货地址',
    '收件地址',
    '接收地址',
    '收件人完整地址',
    'receiver_address',
    'receiverAddress',
    '收货地址',
  ],
  重量: ['重量', 'weight', '货物重量', '包裹重量', '重量(kg)', 'kg'],
  件数: [
    '件数',
    '数量',
    'quantity',
    '包裹数',
    '包裹数量',
    '件数量',
    '物品数量',
  ],
  温层: [
    '温层',
    '温度',
    '温度层',
    '温度控制',
    'temperature',
    '存储温度',
  ],
  外部编码: [
    '外部编码',
    '订单编码',
    '订单号',
    '编码',
    'code',
    'order_id',
    '外部订单号',
  ],
  备注: ['备注', '说明', '描述', 'remark', 'memo', '备注说明'],
}

/**
 * Levenshtein 距离算法
 * 计算两个字符串的编辑距离
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()
  const aLen = aLower.length
  const bLen = bLower.length

  // 创建 DP 表
  const dp: number[][] = Array(aLen + 1)
    .fill(null)
    .map(() => Array(bLen + 1).fill(0))

  // 初始化
  for (let i = 0; i <= aLen; i++) dp[i][0] = i
  for (let j = 0; j <= bLen; j++) dp[0][j] = j

  // 填充 DP 表
  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      if (aLower[i - 1] === bLower[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[aLen][bLen]
}

/**
 * 计算相似度（0-100）
 */
export function calculateSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 100

  const distance = levenshteinDistance(a, b)
  return Math.round(((maxLen - distance) / maxLen) * 100)
}

/**
 * 匹配单个字段名
 */
export function matchFieldName(
  inputName: string,
  threshold: number = 60
): string | null {
  const inputLower = inputName.toLowerCase().trim()

  // 1. 先检查别名库是否有精确匹配
  for (const [systemField, aliases] of Object.entries(ALIAS_MAP)) {
    for (const alias of aliases) {
      if (alias.toLowerCase() === inputLower) {
        return systemField
      }
    }
  }

  // 2. 如果没有精确匹配，则使用相似度匹配
  let bestMatch: { field: string; similarity: number } | null = null

  for (const [systemField, aliases] of Object.entries(ALIAS_MAP)) {
    for (const alias of aliases) {
      const similarity = calculateSimilarity(inputLower, alias.toLowerCase())
      if (
        similarity >= threshold &&
        (!bestMatch || similarity > bestMatch.similarity)
      ) {
        bestMatch = { field: systemField, similarity }
      }
    }
  }

  return bestMatch ? bestMatch.field : null
}

/**
 * 匹配所有列名
 */
export function matchAllHeaders(
  headers: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {}

  for (const header of headers) {
    const matchedField = matchFieldName(header)
    if (matchedField) {
      mapping[header] = matchedField
    }
  }

  return mapping
}

/**
 * 生成模板指纹 (简单 hash)
 */
export function generateFingerprint(headers: string[]): string {
  const sorted = [...headers].sort().join('|')
  let hash = 0

  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // 转换为32位整数
  }

  return Math.abs(hash).toString(16)
}

/**
 * 计算识别准确度
 */
export function calculateConfidence(
  headers: string[],
  mapping: Record<string, string>
): number {
  const matched = Object.values(mapping).filter((v) => v && v !== '不映射').length
  return Math.round((matched / headers.length) * 100)
}
