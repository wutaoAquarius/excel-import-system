'use client'

import Header from '@/app/components/Header'

export default function GuidePage() {
  return (
    <>
      <Header
        title="❓ 使用指南"
        description="了解系统的功能和使用方法"
      />

      <div className="content-inner">
        {/* 快速开始 */}
        <div className="card">
          <h3>📚 快速开始</h3>
          <div style={{ lineHeight: 1.8, color: '#666' }}>
            <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>
              1. 批量导入
            </h4>
            <p>
              选择Excel文件进行导入。系统会自动识别列名，进行数据校验，支持在线编辑和导出。
            </p>

            <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>
              2. 历史记录
            </h4>
            <p>
              查看所有已导入的运单，支持按外部编码、收件人、日期进行筛选和分页显示。
            </p>
          </div>
        </div>

        {/* 核心功能 */}
        <div className="card">
          <h3>🔑 核心功能</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px',
            }}
          >
            <div
              style={{
                padding: '15px',
                background: '#f0f9ff',
                borderRadius: '8px',
                borderLeft: '4px solid #0284c7',
              }}
            >
              <h4 style={{ color: '#0c4a6e', marginBottom: '8px' }}>
                多模板自动识别
              </h4>
              <p style={{ fontSize: '13px', color: '#0c4a6e' }}>
                使用 Levenshtein 距离算法，自动识别不同格式的列名。
              </p>
            </div>

            <div
              style={{
                padding: '15px',
                background: '#f0fdf4',
                borderRadius: '8px',
                borderLeft: '4px solid #15803d',
              }}
            >
              <h4 style={{ color: '#15803d', marginBottom: '8px' }}>
                完整数据校验
              </h4>
              <p style={{ fontSize: '13px', color: '#15803d' }}>
                15 种校验规则，覆盖必填、格式、重复等，一次性全量展示。
              </p>
            </div>

            <div
              style={{
                padding: '15px',
                background: '#fef3c7',
                borderRadius: '8px',
                borderLeft: '4px solid #b45309',
              }}
            >
              <h4 style={{ color: '#78350f', marginBottom: '8px' }}>
                虚拟滚动优化
              </h4>
              <p style={{ fontSize: '13px', color: '#78350f' }}>
                支持 1000+ 行数据的无缝处理，性能优异。
              </p>
            </div>

            <div
              style={{
                padding: '15px',
                background: '#f3e8ff',
                borderRadius: '8px',
                borderLeft: '4px solid #7c3aed',
              }}
            >
              <h4 style={{ color: '#5b21b6', marginBottom: '8px' }}>
                在线编辑
              </h4>
              <p style={{ fontSize: '13px', color: '#5b21b6' }}>
                支持直接编辑表格单元格，Tab/回车快捷键操作。
              </p>
            </div>

            <div
              style={{
                padding: '15px',
                background: '#fee2e2',
                borderRadius: '8px',
                borderLeft: '4px solid #b91c1c',
              }}
            >
              <h4 style={{ color: '#7f1d1d', marginBottom: '8px' }}>
                模板学习机制
              </h4>
              <p style={{ fontSize: '13px', color: '#7f1d1d' }}>
                一次映射，永久记住。系统会保存您的映射规则。
              </p>
            </div>

            <div
              style={{
                padding: '15px',
                background: '#dbeafe',
                borderRadius: '8px',
                borderLeft: '4px solid #0284c7',
              }}
            >
              <h4 style={{ color: '#0c4a6e', marginBottom: '8px' }}>
                历史查询
              </h4>
              <p style={{ fontSize: '13px', color: '#0c4a6e' }}>
                查询已导入的运单，支持多条件筛选和分页显示。
              </p>
            </div>
          </div>
        </div>

        {/* 校验规则 */}
        <div className="card">
          <h3>✓ 校验规则说明</h3>
          <div style={{ lineHeight: 1.8, color: '#666' }}>
            <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>
              必填字段
            </h4>
            <p>
              发件人姓名、发件人电话、发件人地址、收件人姓名、收件人电话、收件人地址、重量、件数、温层
            </p>

            <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>
              格式校验
            </h4>
            <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
              <li>电话：11位数字，以1开头，第二位为3-9</li>
              <li>重量：正数</li>
              <li>件数：正整数</li>
              <li>温层：常温 / 冷藏 / 冷冻</li>
            </ul>

            <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>
              重复检测
            </h4>
            <p>系统会检测外部编码是否在同批次内重复，并提示重复行号。</p>
          </div>
        </div>

        {/* 常见问题 */}
        <div className="card">
          <h3>❓ 常见问题</h3>
          <div style={{ lineHeight: 1.8, color: '#666' }}>
            <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>
              Q: 支持哪些 Excel 格式？
            </h4>
            <p>A: 支持 .xlsx 和 .xls 格式，最大 10MB。</p>

            <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>
              Q: 列名识别不准确怎么办？
            </h4>
            <p>
              A:
              您可以在"映射编辑"步骤手动调整列名映射。调整后系统会自动保存规则，下次上传相同格式的文件时会自动应用。
            </p>

            <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>
              Q: 数据有错误能修改吗？
            </h4>
            <p>
              A:
              可以。在"数据校验"步骤中，您可以点击表格单元格进行编辑。修改后会实时显示是否还有错误。
            </p>

            <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>
              Q: 如何查看已导入的运单？
            </h4>
            <p>
              A: 点击左侧菜单的"历史记录"，可以查看所有已导入的运单。支持按编码、收件人、日期筛选。
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
