import { sql } from '@vercel/postgres'
import type { Order, TemplateMapping, ImportBatch } from './types'

/**
 * 初始化数据库表结构
 */
export async function initializeDatabase() {
  try {
    // 创建运单表
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        external_code VARCHAR(255),
        sender_name VARCHAR(100) NOT NULL,
        sender_phone VARCHAR(20) NOT NULL,
        sender_address TEXT NOT NULL,
        receiver_name VARCHAR(100) NOT NULL,
        receiver_phone VARCHAR(20) NOT NULL,
        receiver_address TEXT NOT NULL,
        weight DECIMAL(10, 2) NOT NULL,
        quantity INT NOT NULL,
        temperature VARCHAR(20) NOT NULL,
        remark TEXT,
        batch_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(external_code)
      )
    `

    // 创建模板映射规则表
    await sql`
      CREATE TABLE IF NOT EXISTS template_mappings (
        id SERIAL PRIMARY KEY,
        template_fingerprint VARCHAR(255) UNIQUE NOT NULL,
        mapping_rules JSONB NOT NULL,
        header_names JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP,
        usage_count INT DEFAULT 1
      )
    `

    // 创建导入批次表
    await sql`
      CREATE TABLE IF NOT EXISTS import_batches (
        id SERIAL PRIMARY KEY,
        batch_number VARCHAR(100) UNIQUE NOT NULL,
        total_count INT NOT NULL,
        success_count INT DEFAULT 0,
        failed_count INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'processing',
        error_details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_external_code ON orders(external_code)`
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_batch_number ON orders(batch_number)`
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_template_fingerprint ON template_mappings(template_fingerprint)`

    console.log('数据库初始化成功')
    return { success: true }
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

/**
 * 插入单条订单
 */
export async function insertOrder(order: Order) {
  try {
    const result = await sql`
      INSERT INTO orders (
        external_code, sender_name, sender_phone, sender_address,
        receiver_name, receiver_phone, receiver_address,
        weight, quantity, temperature, remark, batch_number
      ) VALUES (
        ${order.external_code || null},
        ${order.sender_name},
        ${order.sender_phone},
        ${order.sender_address},
        ${order.receiver_name},
        ${order.receiver_phone},
        ${order.receiver_address},
        ${order.weight},
        ${order.quantity},
        ${order.temperature},
        ${order.remark || null},
        ${order.batch_number || null}
      )
      RETURNING id
    `
    return result.rows[0]
  } catch (error) {
    console.error('插入订单失败:', error)
    throw error
  }
}

/**
 * 批量插入订单
 */
export async function insertOrdersBatch(orders: Order[], batchNumber: string) {
  try {
    const values = orders
      .map(
        (order) =>
          `('${order.external_code || null}', '${order.sender_name}', '${order.sender_phone}', '${order.sender_address}', '${order.receiver_name}', '${order.receiver_phone}', '${order.receiver_address}', ${order.weight}, ${order.quantity}, '${order.temperature}', '${order.remark || null}', '${batchNumber}')`
      )
      .join(',')

    await sql.query(
      `INSERT INTO orders (external_code, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, weight, quantity, temperature, remark, batch_number) VALUES ${values}`
    )
  } catch (error) {
    console.error('批量插入订单失败:', error)
    throw error
  }
}

/**
 * 查询订单列表
 */
export async function getOrders(limit = 20, offset = 0) {
  try {
    const result = await sql`
      SELECT * FROM orders
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result.rows as Order[]
  } catch (error) {
    console.error('查询订单失败:', error)
    throw error
  }
}

/**
 * 统计订单总数
 */
export async function getOrdersCount() {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM orders`
    return (result.rows[0] as { count: number }).count
  } catch (error) {
    console.error('统计订单失败:', error)
    throw error
  }
}

/**
 * 搜索订单
 */
export async function searchOrders(
  externalCode?: string,
  receiverName?: string,
  dateFrom?: string,
  dateTo?: string,
  limit = 20,
  offset = 0
) {
  try {
    let query = 'SELECT * FROM orders WHERE 1=1'
    const params: any[] = []

    if (externalCode) {
      query += ` AND external_code LIKE $${params.length + 1}`
      params.push(`%${externalCode}%`)
    }

    if (receiverName) {
      query += ` AND receiver_name LIKE $${params.length + 1}`
      params.push(`%${receiverName}%`)
    }

    if (dateFrom) {
      query += ` AND created_at >= $${params.length + 1}`
      params.push(dateFrom)
    }

    if (dateTo) {
      query += ` AND created_at <= $${params.length + 1}`
      params.push(dateTo)
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`

    const result = await sql.query(query, params)
    return result.rows as Order[]
  } catch (error) {
    console.error('搜索订单失败:', error)
    throw error
  }
}

/**
 * 获取存在的外部编码列表（用于重复检测）
 */
export async function getExistingExternalCodes() {
  try {
    const result = await sql`
      SELECT external_code FROM orders
      WHERE external_code IS NOT NULL
    `
    return result.rows.map((row: any) => row.external_code) as string[]
  } catch (error) {
    console.error('获取外部编码失败:', error)
    throw error
  }
}

/**
 * 保存模板映射规则
 */
export async function saveTemplateMapping(mapping: TemplateMapping) {
  try {
    const result = await sql`
      INSERT INTO template_mappings (template_fingerprint, mapping_rules, header_names)
      VALUES (${mapping.template_fingerprint}, ${JSON.stringify(mapping.mapping_rules)}, ${JSON.stringify(mapping.header_names)})
      ON CONFLICT (template_fingerprint) DO UPDATE
      SET last_used_at = CURRENT_TIMESTAMP, usage_count = usage_count + 1
      RETURNING *
    `
    return result.rows[0] as TemplateMapping
  } catch (error) {
    console.error('保存模板映射失败:', error)
    throw error
  }
}

/**
 * 查询模板映射规则
 */
export async function getTemplateMapping(fingerprint: string) {
  try {
    const result = await sql`
      SELECT * FROM template_mappings
      WHERE template_fingerprint = ${fingerprint}
    `
    return (result.rows[0] as TemplateMapping) || null
  } catch (error) {
    console.error('查询模板映射失败:', error)
    throw error
  }
}

/**
 * 查询所有模板映射规则
 */
export async function getAllTemplateMappings() {
  try {
    const result = await sql`
      SELECT * FROM template_mappings
      ORDER BY last_used_at DESC NULLS LAST, usage_count DESC
    `
    return result.rows as TemplateMapping[]
  } catch (error) {
    console.error('查询所有模板映射失败:', error)
    throw error
  }
}

/**
 * 保存导入批次信息
 */
export async function saveBatchInfo(batch: ImportBatch) {
  try {
    const result = await sql`
      INSERT INTO import_batches (batch_number, total_count, success_count, failed_count, status, error_details)
      VALUES (${batch.batch_number}, ${batch.total_count}, ${batch.success_count || 0}, ${batch.failed_count || 0}, ${batch.status || 'processing'}, ${batch.error_details ? JSON.stringify(batch.error_details) : null})
      RETURNING *
    `
    return result.rows[0] as ImportBatch
  } catch (error) {
    console.error('保存批次信息失败:', error)
    throw error
  }
}

/**
 * 获取批次信息
 */
export async function getBatchInfo(batchNumber: string) {
  try {
    const result = await sql`
      SELECT * FROM import_batches
      WHERE batch_number = ${batchNumber}
    `
    return (result.rows[0] as ImportBatch) || null
  } catch (error) {
    console.error('获取批次信息失败:', error)
    throw error
  }
}
