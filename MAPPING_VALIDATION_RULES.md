# 映射和校验规则文档

## 1. 映射规则

### 1.1 可用的系统字段（按显示顺序）

| 序号 | 中文名称 | 英文字段名 | 说明 |
|------|---------|----------|------|
| 1 | 发件人姓名 | sender_name | 必填 |
| 2 | 发件人电话 | sender_phone | 必填，需验证格式 |
| 3 | 发件人地址 | sender_address | 必填 |
| 4 | 收件人姓名 | receiver_name | 必填 |
| 5 | 收件人电话 | receiver_phone | 必填，需验证格式 |
| 6 | 收件人地址 | receiver_address | 必填 |
| 7 | 重量 | weight | 必填，需验证为正数 |
| 8 | 件数 | quantity | 必填，需验证为正整数 |
| 9 | 温层 | temperature | 必填，需验证枚举值 |
| 10 | 外部编码 | external_code | 可选，支持重复检测 |
| 11 | 备注 | remark | 可选 |
| 12 | 不映射 | 不映射 | 特殊标记，表示此列不映射 |

### 1.2 映射校验规则

#### 强制完整映射（步骤 3 - 映射编辑）

规则：所有 Excel 列都必须映射到某个系统字段或选择「不映射」

实施方式：
- 显示进度条：`已映射 N / 总列数 M (百分比%)`
- 显示未映射列的名称列表
- 禁用「继续验证数据」按钮直到完成所有映射

用户体验：
```
映射进度：7/11 (64%)
[████████░░░░░░] ⚠️ 4 个未映射

⚠️ 必须映射所有列。未映射的列："重量(kg)", "件数", "温层", "备注"
```

---

## 2. 数据校验规则

### 2.1 必填字段检查

以下 9 个字段必须有值，不能为空或仅空格：

1. sender_name - 发件人姓名
2. sender_phone - 发件人电话
3. sender_address - 发件人地址
4. receiver_name - 收件人姓名
5. receiver_phone - 收件人电话
6. receiver_address - 收件人地址
7. weight - 重量
8. quantity - 件数
9. temperature - 温层

校验逻辑：
```typescript
const isMissing =
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '')

if (isMissing) {
  // 报错：{field}：缺失必填字段
}
```

### 2.2 格式校验

#### 电话号码格式
- 字段：sender_phone, receiver_phone
- 规则：11 位数字，以 1 开头，第二位是 3-9
- 正则：`/^1[3-9]\d{9}$/`
- 错误消息：`{field}：电话格式错误`

有效示例：13800138001, 13900139001, 18612345678
无效示例：12800138001, 138001380, 1380013800111

#### 重量格式
- 字段：weight
- 规则：必须是正数（> 0）
- 错误消息：`{field}：重量必须是正数`

有效示例：5.2, 3, 0.5, 10.5
无效示例：0, -5, abc

#### 件数格式
- 字段：quantity
- 规则：必须是正整数（> 0 且为整数）
- 错误消息：`{field}：件数必须是正整数`

有效示例：1, 2, 5, 100
无效示例：0, -5, 2.5, abc

#### 温层枚举值
- 字段：temperature
- 规则：必须是以下三个值之一
- 允许值：['常温', '冷藏', '冷冻']
- 错误消息：`{field}：温层值不在范围内`

有效示例：常温, 冷藏, 冷冻
无效示例：冰冻, 常温冷藏, 其他

### 2.3 重复检测

外部编码重复（同批次内）
- 字段：external_code
- 规则：同一批次导入中，external_code 不能重复
- 错误消息：`external_code：与第{N}行重复`

示例：
- 行 1：external_code = "ORD-2024-001" ✅
- 行 2：external_code = "ORD-2024-002" ✅
- 行 3：external_code = "ORD-2024-001" ❌ 与第 1 行重复

---

## 3. 验证流程

### 3.1 数据流向

```
Excel 文件上传
    ↓
[步骤 2] 原始数据预览
    ↓
[步骤 3] 映射编辑（强制完整映射）
    ├─ 显示进度条
    └─ 禁用按钮直到完成
    ↓
[步骤 4] 数据校验
    ├─ 自动检测数据格式
    ├─ 应用所有校验规则
    └─ 返回结果
```

### 3.2 校验调用

```
POST /api/validate
请求：
{
  rows: [...],          // Excel 行数据
  headers: [...],       // 列名列表
  mapping: {...}        // 映射规则
}

响应：
{
  success: true,
  errors: [...],        // 所有错误
  validRows: [...],     // 通过校验的行
  invalidRows: [...]    // 存在错误的行
}
```

### 3.3 错误结构

```typescript
interface ValidationError {
  rowIndex: number      // 行号（1-based）
  field: string         // 出错字段的英文名称
  message: string       // 错误信息
  value?: any          // 字段的值
}

示例：
{
  rowIndex: 3,
  field: "sender_phone",
  message: "sender_phone：电话格式错误",
  value: "123"
}
```

---

## 4. 支持的两种数据格式

### 原始格式（来自 Excel）

```json
{
  "外部编码": "ORD-2024-001",
  "发件人姓名": "张三",
  "发件人电话": "13800138001",
  "重量(kg)": 5.2,
  "件数": 2,
  "温层": "常温"
}
```

### 已映射格式（内部使用）

```json
{
  "external_code": "ORD-2024-001",
  "sender_name": "张三",
  "sender_phone": "13800138001",
  "weight": 5.2,
  "quantity": 2,
  "temperature": "常温"
}
```

验证系统自动检测格式：
- 如果数据中存在英文字段名（如 sender_name），自动识别为已映射
- 否则识别为原始格式，应用映射规则

---

## 5. 校验严格程度总结

| 阶段 | 校验内容 | 严格程度 |
|------|---------|---------|
| 映射编辑 | 强制完整映射 | ⚠️⚠️⚠️ 必须完成 |
| 必填检查 | 9 个字段不能为空 | ⚠️⚠️⚠️ 最严格 |
| 格式校验 | 电话、重量、件数、温层 | ⚠️⚠️ 很严格 |
| 重复检测 | 同批次内不重复 | ⚠️ 中等 |

---

## 6. 快速参考

### 必填字段（9 个）
sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, weight, quantity, temperature

### 可选字段（2 个）
external_code, remark

### 格式规则
- 电话：11位，1[3-9]xxxxxxxx
- 重量：正数 > 0
- 件数：正整数 > 0
- 温层：常温/冷藏/冷冻

### 特殊规则
- 映射：必须完整（所有列都要映射或选择"不映射"）
- 重复：external_code 在同批次内不能重复
