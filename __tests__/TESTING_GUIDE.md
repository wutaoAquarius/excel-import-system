# 单元测试编写指南

## 📌 快速开始

### 1. 编写你的第一个测试

```typescript
// __tests__/unit/example.test.ts
import { functionToTest } from '@/lib/example'

describe('example.ts - 模块功能描述', () => {
  test('具体场景描述', () => {
    // Arrange (准备测试数据)
    const input = '测试输入'
    const expected = '预期输出'

    // Act (执行被测函数)
    const result = functionToTest(input)

    // Assert (断言验证)
    expect(result).toBe(expected)
  })
})
```

### 2. 运行测试

```bash
# 运行单个测试文件
npm test -- __tests__/unit/example.test.ts

# 运行包含特定字符串的测试
npm test -- --testNamePattern="具体场景"

# 查看覆盖率
npm run test:coverage

# 监听模式 (文件变化自动重新运行)
npm run test:watch
```

---

## 🎯 常见测试模式

### 模式 1: 值的验证

```typescript
test('函数返回正确的值', () => {
  expect(add(2, 3)).toBe(5)
  expect(isEven(4)).toBe(true)
  expect(getName()).toBe('张三')
})
```

### 模式 2: 数组和对象

```typescript
test('处理数组和对象', () => {
  const arr = [1, 2, 3]
  expect(arr).toContain(2)
  expect(arr).toHaveLength(3)

  const obj = { name: '张三', age: 30 }
  expect(obj).toHaveProperty('name')
  expect(obj).toEqual({ name: '张三', age: 30 })
})
```

### 模式 3: 异常处理

```typescript
test('处理错误情况', () => {
  expect(() => {
    functionThatThrows()
  }).toThrow()

  expect(() => {
    functionThatThrows()
  }).toThrow('特定错误信息')
})
```

### 模式 4: 异步函数

```typescript
test('处理异步操作', async () => {
  const result = await fetchData()
  expect(result).toBeDefined()
})

test('处理 Promise', () => {
  return fetchData().then(result => {
    expect(result).toBeDefined()
  })
})
```

### 模式 5: Mock 和 Spy

```typescript
test('使用 Mock', () => {
  const mockFunction = jest.fn()
  mockFunction('参数1')

  expect(mockFunction).toHaveBeenCalled()
  expect(mockFunction).toHaveBeenCalledWith('参数1')
  expect(mockFunction).toHaveBeenCalledTimes(1)
})
```

---

## 💡 测试数据准备

### 创建 Fixture 文件

```typescript
// __tests__/fixtures/orders.fixture.ts
export const validOrder = {
  sender_name: '张三',
  sender_phone: '13800138000',
  sender_address: '北京市',
  receiver_name: '李四',
  receiver_phone: '13900139000',
  receiver_address: '上海市',
  weight: 5.5,
  quantity: 3,
  temperature: '冷藏'
}

export const invalidOrder = {
  sender_name: '', // 缺失
  sender_phone: 'invalid',
  // ...
}

export const testHeaders = [
  '发件人姓名',
  '发件人电话',
  '重量',
  '件数'
]
```

### 在测试中使用

```typescript
import { validOrder, invalidOrder } from '@/__tests__/fixtures/orders.fixture'

test('验证有效订单', () => {
  const errors = validateOrder(validOrder)
  expect(errors).toHaveLength(0)
})

test('验证无效订单', () => {
  const errors = validateOrder(invalidOrder)
  expect(errors.length).toBeGreaterThan(0)
})
```

---

## 🔍 断言方法速查表

### 基础断言

```typescript
expect(value).toBe(expected)              // 精确相等
expect(value).toEqual(expected)           // 值相等（对象）
expect(value).toStrictEqual(expected)     // 严格相等
expect(value).toBeTruthy()                // 真值
expect(value).toBeFalsy()                 // 假值
expect(value).toBeNull()                  // null
expect(value).toBeUndefined()             // undefined
expect(value).toBeDefined()               // 已定义
```

### 数字断言

```typescript
expect(value).toBeGreaterThan(3)
expect(value).toBeGreaterThanOrEqual(3)
expect(value).toBeLessThan(5)
expect(value).toBeLessThanOrEqual(5)
expect(0.1 + 0.2).toBeCloseTo(0.3)       // 浮点数比较
```

### 字符串断言

```typescript
expect(value).toMatch(/正则/)
expect(value).toMatch('子字符串')
expect(value).toContain('包含')
expect(value).toHaveLength(5)
```

### 数组和对象断言

```typescript
expect(arr).toContain(item)               // 数组包含
expect(arr).toEqual([1, 2, 3])            // 数组相等
expect(obj).toHaveProperty('key')         // 对象有属性
expect(obj).toEqual({key: value})         // 对象相等
```

### 函数和异常

```typescript
expect(fn).toHaveBeenCalled()             // 函数被调用
expect(fn).toHaveBeenCalledWith(arg)      // 调用参数
expect(fn).toHaveBeenCalledTimes(2)       // 调用次数
expect(() => fn()).toThrow()              // 抛出异常
expect(() => fn()).toThrow('message')     // 异常信息
```

---

## 📊 测试结构最佳实践

### 好的测试结构

```typescript
describe('validateOrder - 订单校验', () => {
  // 分组：不同的测试场景
  describe('必填字段检查', () => {
    test('缺少发件人姓名返回错误', () => {
      // 准备
      const order = { ...validOrder, sender_name: '' }
      // 执行
      const errors = validateOrder(order)
      // 验证
      expect(errors.some(e => e.field === 'sender_name')).toBe(true)
    })

    test('缺少收件人电话返回错误', () => {
      const order = { ...validOrder, receiver_phone: '' }
      const errors = validateOrder(order)
      expect(errors.some(e => e.field === 'receiver_phone')).toBe(true)
    })
  })

  describe('格式校验', () => {
    test('无效电话格式返回错误', () => {
      const order = { ...validOrder, sender_phone: 'invalid' }
      const errors = validateOrder(order)
      expect(errors.some(e => e.field === 'sender_phone')).toBe(true)
    })
  })

  describe('边界值测试', () => {
    test('重量为 0 时的处理', () => {
      const order = { ...validOrder, weight: 0 }
      const errors = validateOrder(order)
      // 验证特定行为
    })
  })
})
```

### 优化: 使用 beforeEach

```typescript
describe('validateOrder', () => {
  let validOrder: Order

  beforeEach(() => {
    // 每个测试前都运行，避免重复
    validOrder = {
      sender_name: '张三',
      sender_phone: '13800138000',
      // ...
    }
  })

  test('有效订单通过校验', () => {
    expect(validateOrder(validOrder)).toHaveLength(0)
  })

  test('修改后的订单也可用', () => {
    const invalid = { ...validOrder, sender_name: '' }
    expect(validateOrder(invalid).length).toBeGreaterThan(0)
  })
})
```

---

## ⚠️ 常见问题和陷阱

### 问题 1: 浮点数比较

❌ **错误**
```typescript
expect(0.1 + 0.2).toBe(0.3)  // 失败！浮点数精度问题
```

✅ **正确**
```typescript
expect(0.1 + 0.2).toBeCloseTo(0.3)
```

### 问题 2: 异步测试超时

❌ **错误**
```typescript
test('异步测试', () => {
  setTimeout(() => {
    expect(true).toBe(true)
  }, 5000)
})
```

✅ **正确**
```typescript
test('异步测试', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})

test('异步测试 (回调)', (done) => {
  setTimeout(() => {
    expect(true).toBe(true)
    done()  // 通知 Jest 测试完成
  }, 5000)
})
```

### 问题 3: 对象引用比较

❌ **错误**
```typescript
const obj1 = { name: '张三' }
const obj2 = { name: '张三' }
expect(obj1).toBe(obj2)  // 失败！引用不同
```

✅ **正确**
```typescript
expect(obj1).toEqual(obj2)  // 成功！值相等
```

### 问题 4: 测试之间的依赖

❌ **错误**
```typescript
let counter = 0

test('测试1', () => {
  counter++
  expect(counter).toBe(1)
})

test('测试2', () => {
  counter++
  expect(counter).toBe(2)  // 依赖于前一个测试！
})
```

✅ **正确**
```typescript
test('测试1', () => {
  let counter = 0
  counter++
  expect(counter).toBe(1)
})

test('测试2', () => {
  let counter = 0  // 独立状态
  counter++
  expect(counter).toBe(1)
})
```

---

## 🎬 实战示例：添加新的测试

### 场景：为 db.ts 添加插入测试

```typescript
// __tests__/unit/db.test.ts
import { insertOrder, queryOrder } from '@/lib/db'
import { Order } from '@/lib/types'

describe('db.ts - 数据库操作', () => {
  describe('insertOrder - 插入订单', () => {
    // 1. 准备测试数据
    const testOrder: Order = {
      sender_name: '张三',
      sender_phone: '13800138000',
      sender_address: '北京市',
      receiver_name: '李四',
      receiver_phone: '13900139000',
      receiver_address: '上海市',
      weight: 5.5,
      quantity: 3,
      temperature: '冷藏'
    }

    // 2. 编写测试用例
    test('成功插入有效订单', async () => {
      const result = await insertOrder(testOrder)
      expect(result.id).toBeDefined()
      expect(result.sender_name).toBe('张三')
    })

    test('插入订单时生成时间戳', async () => {
      const result = await insertOrder(testOrder)
      expect(result.created_at).toBeDefined()
      expect(result.created_at).toBeInstanceOf(Date)
    })

    test('缺少必填字段时抛出错误', async () => {
      const invalidOrder = { ...testOrder, sender_name: '' }
      await expect(insertOrder(invalidOrder))
        .rejects
        .toThrow('sender_name 是必填字段')
    })

    test('external_code 重复时抛出错误', async () => {
      const orderWithCode = {
        ...testOrder,
        external_code: 'ORD001'
      }
      await insertOrder(orderWithCode)
      // 再次插入相同的 code
      await expect(insertOrder(orderWithCode))
        .rejects
        .toThrow('external_code 已存在')
    })

    // 3. 边界情况测试
    test('特殊字符处理', async () => {
      const order = {
        ...testOrder,
        sender_name: "O'Brien",
        remark: '包含\n换行符'
      }
      const result = await insertOrder(order)
      expect(result.sender_name).toBe("O'Brien")
      expect(result.remark).toContain('换行符')
    })
  })

  describe('queryOrder - 查询订单', () => {
    test('按 ID 查询返回正确订单', async () => {
      const order = await queryOrder(1)
      expect(order).toBeDefined()
      expect(order.id).toBe(1)
    })

    test('查询不存在的 ID 返回 null', async () => {
      const order = await queryOrder(99999)
      expect(order).toBeNull()
    })
  })
})
```

---

## 📈 提高测试质量的清单

- [ ] 每个函数至少有 3 个测试用例
- [ ] 覆盖正常情况、边界情况、错误情况
- [ ] 测试名称清晰有意义
- [ ] 使用 beforeEach/afterEach 避免重复
- [ ] 避免测试之间的依赖
- [ ] 模拟外部依赖 (数据库、API 等)
- [ ] 验证函数副作用
- [ ] 添加注释说明复杂的测试逻辑
- [ ] 定期检查覆盖率报告
- [ ] 运行 CI/CD 前必须通过所有测试

---

## 🔗 相关命令

```bash
# 完整的测试命令列表
npm test                    # 运行所有测试 (交互模式)
npm run test:unit          # 只运行单元测试
npm run test:watch         # 监听模式
npm run test:coverage      # 生成覆盖率报告
npm run test -- --update   # 更新快照

# 快速命令
npm test -- --bail         # 遇到第一个失败就停止
npm test -- --verbose      # 详细输出
npm test -- --testTimeout=30000  # 自定义超时
```

---

## 📚 更多资源

- [Jest 官方文档](https://jestjs.io/)
- [Jest API 参考](https://jestjs.io/docs/api)
- [测试驱动开发最佳实践](https://martinfowler.com/articles/is-tdd-dead/)

