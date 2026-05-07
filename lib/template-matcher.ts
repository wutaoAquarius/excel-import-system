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
 * mapping 格式：系统字段英文名 -> Excel列名
 */
export function formatMappingForStorage(
  mapping: Record<string, string>
): Record<string, string> {
  const formatted: Record<string, string> = {}

  for (const [systemField, excelCol] of Object.entries(mapping)) {
    if (excelCol) {
      formatted[systemField] = excelCol
    }
  }

  return formatted
}

/**
 * 合并映射规则（用于应用已保存的规则）
 * 两个mapping的格式都是：系统字段英文名 -> Excel列名
 */
export function mergeMapping(
  currentMapping: Record<string, string>,
  savedMapping: Record<string, string>
): Record<string, string> {
  const merged = { ...currentMapping }

  for (const [systemField, excelCol] of Object.entries(savedMapping)) {
    if (excelCol && !merged[systemField]) {
      merged[systemField] = excelCol
    }
  }

  return merged
}
