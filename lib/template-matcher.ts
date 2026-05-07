import {
  generateFingerprint,
  matchAllHeaders,
  calculateConfidence,
} from './similarity'

/**
 * 模板匹配结果
 */
export interface TemplateMatchResult {
  fingerprint: string
  mapping: Record<string, string>
  confidence: number
}

/**
 * 匹配模板
 */
export function matchTemplate(headers: string[]): TemplateMatchResult {
  const mapping = matchAllHeaders(headers)
  const fingerprint = generateFingerprint(headers)
  const confidence = calculateConfidence(headers, mapping)

  return {
    fingerprint,
    mapping,
    confidence,
  }
}

/**
 * 格式化映射规则（用于数据库存储）
 */
export function formatMappingForStorage(
  mapping: Record<string, string>
): Record<string, string> {
  const formatted: Record<string, string> = {}

  for (const [excelCol, systemField] of Object.entries(mapping)) {
    if (systemField && systemField !== '不映射') {
      formatted[excelCol] = systemField
    }
  }

  return formatted
}

/**
 * 合并映射规则（用于应用已保存的规则）
 */
export function mergeMapping(
  currentMapping: Record<string, string>,
  savedMapping: Record<string, string>
): Record<string, string> {
  const merged = { ...currentMapping }

  for (const [excelCol, systemField] of Object.entries(savedMapping)) {
    if (!merged[excelCol]) {
      merged[excelCol] = systemField
    }
  }

  return merged
}
