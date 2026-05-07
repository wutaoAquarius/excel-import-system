'use client'

import { useEffect, useState } from 'react'
import Header from '@/app/components/Header'

interface Order {
  id: number
  external_code: string | null
  sender_name: string
  sender_phone: string
  sender_address: string
  receiver_name: string
  receiver_phone: string
  receiver_address: string
  weight: number
  quantity: number
  temperature: string
  remark: string | null
  batch_number: string
  created_at: string
}

interface PaginationState {
  currentPage: number
  pageSize: number
  total: number
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 20,
    total: 0,
  })

  // 筛选条件
  const [filters, setFilters] = useState({
    code: '',
    name: '',
    startDate: '',
    endDate: '',
  })

  // 加载订单数据
  const fetchOrders = async (page: number = 1) => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pagination.pageSize),
        code: filters.code,
        name: filters.name,
        startDate: filters.startDate,
        endDate: filters.endDate,
      })

      const response = await fetch(`/api/orders?${params}`)
      if (!response.ok) throw new Error('获取订单数据失败')

      const data = await response.json()

      setOrders(data.data || [])
      setPagination({
        ...pagination,
        currentPage: page,
        total: data.total || 0,
      })
    } catch (error) {
      alert('加载数据失败：' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(1)
  }, [])

  // 处理筛选
  const handleFilter = () => {
    fetchOrders(1)
  }

  // 处理重置
  const handleReset = () => {
    setFilters({
      code: '',
      name: '',
      startDate: '',
      endDate: '',
    })
    setPagination({ ...pagination, currentPage: 1 })
    fetchOrders(1)
  }

  // 处理分页
  const handlePageChange = (page: number) => {
    fetchOrders(page)
  }

  // 处理分页大小变化
  const handlePageSizeChange = (newSize: number) => {
    setPagination({ ...pagination, pageSize: newSize, currentPage: 1 })
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <>
      <Header
        title="📑 历史记录"
        description="查看所有已导入的运单记录"
      />

      <div className="content-inner">
        {/* 筛选表单 */}
        <div className="card">
          <h3>高级筛选</h3>
          <div className="search-bar">
            <div className="search-item">
              <label>外部编码</label>
              <input
                type="text"
                placeholder="按外部编码搜索"
                value={filters.code}
                onChange={(e) =>
                  setFilters({ ...filters, code: e.target.value })
                }
              />
            </div>
            <div className="search-item">
              <label>收件人姓名</label>
              <input
                type="text"
                placeholder="按收件人姓名搜索"
                value={filters.name}
                onChange={(e) =>
                  setFilters({ ...filters, name: e.target.value })
                }
              />
            </div>
            <div className="search-item">
              <label>开始日期</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div className="search-item">
              <label>结束日期</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
            <div className="search-item" style={{ alignSelf: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleFilter}>
                筛选
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleReset}
                style={{ marginLeft: '5px' }}
              >
                重置
              </button>
            </div>
          </div>
        </div>

        {/* 运单列表 */}
        <div className="card">
          <h3>已导入运单列表</h3>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ color: '#666' }}>每页显示</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              style={{
                width: '70px',
                padding: '6px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                marginLeft: '5px',
                marginRight: '5px',
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span style={{ color: '#666' }}>
              条，共 <strong>{pagination.total}</strong> 条
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div className="loading"></div>
              <p style={{ color: '#999', marginTop: '10px' }}>加载中...</p>
            </div>
          ) : orders.length > 0 ? (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>外部编码</th>
                      <th>发件人</th>
                      <th>发件电话</th>
                      <th>收件人</th>
                      <th>收件电话</th>
                      <th>重量(kg)</th>
                      <th>件数</th>
                      <th>温层</th>
                      <th>提交时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.external_code || '-'}</td>
                        <td>{order.sender_name}</td>
                        <td>{order.sender_phone}</td>
                        <td>{order.receiver_name}</td>
                        <td>{order.receiver_phone}</td>
                        <td>{order.weight}</td>
                        <td>{order.quantity}</td>
                        <td>{order.temperature}</td>
                        <td>
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                  >
                    首页
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    上一页
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNum =
                      Math.max(1, pagination.currentPage - 2) + i
                    if (pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={
                            pageNum === pagination.currentPage ? 'active' : ''
                          }
                        >
                          {pageNum}
                        </button>
                      )
                    }
                    return null
                  })}

                  <button
                    onClick={() =>
                      handlePageChange(pagination.currentPage + 1)
                    }
                    disabled={pagination.currentPage === totalPages}
                  >
                    下一页
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={pagination.currentPage === totalPages}
                  >
                    末页
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: '48px', marginBottom: '15px' }}>📭</p>
              <p style={{ color: '#999' }}>暂无导入记录</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
