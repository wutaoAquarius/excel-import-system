'use client'

import { useState, useRef, useEffect } from 'react'

interface ColumnSelectProps {
  value: string
  options: string[]
  disabledOptions: string[]
  onChange: (value: string) => void
  placeholder?: string
}

export default function ColumnSelect({
  value,
  options,
  disabledOptions,
  onChange,
  placeholder = '搜索列名...',
}: ColumnSelectProps) {
  const [searchText, setSearchText] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // 过滤选项
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchText.toLowerCase())
  )

  // 处理输入框变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
    setHighlightedIndex(-1)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  // 处理输入框焦点
  const handleInputFocus = () => {
    setIsOpen(true)
  }

  // 处理输入框失焦（延迟以支持点击选项）
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false)
      setSearchText('')
      setHighlightedIndex(-1)
    }, 200)
  }

  // 处理选项点击
  const handleOptionClick = (option: string) => {
    if (!disabledOptions.includes(option)) {
      onChange(option)
      setIsOpen(false)
      setSearchText('')
      setHighlightedIndex(-1)
    }
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchText('')
        setHighlightedIndex(-1)
        break
    }
  }

  // 自动滚动到高亮选项
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  // 清除搜索文本
  const handleClear = () => {
    setSearchText('')
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      {/* 搜索输入框 */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          placeholder={value ? `已选: ${value} (点击修改)` : placeholder}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '8px 32px 8px 8px',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        {/* 清除按钮 */}
        {searchText && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              color: '#999',
              fontSize: '16px',
            }}
            title="清除搜索"
          >
            ✕
          </button>
        )}
      </div>

      {/* 下拉列表 */}
      {isOpen && (
        <ul
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid var(--border-color)',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {filteredOptions.length === 0 ? (
            <li
              style={{
                padding: '8px',
                color: '#999',
                textAlign: 'center',
                fontSize: '12px',
              }}
            >
              没有匹配的列
            </li>
          ) : (
            filteredOptions.map((option, index) => {
              const isDisabled = disabledOptions.includes(option)
              const isHighlighted = highlightedIndex === index

              return (
                <li
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  style={{
                    padding: '8px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    backgroundColor: isHighlighted ? '#f0f9ff' : 'white',
                    color: isDisabled ? '#ccc' : '#333',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.1s',
                    fontSize: '13px',
                  }}
                  title={isDisabled ? '该列已被其他字段使用' : ''}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ flex: 1 }}>{option}</span>
                    {isDisabled && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#999',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        (已使用)
                      </span>
                    )}
                  </div>
                </li>
              )
            })
          )}
        </ul>
      )}

      {/* 已选择的列显示 */}
      {value && !searchText && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#ecfdf5',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#047857',
          }}
        >
          ✓ 已选择：<strong>{value}</strong>
        </div>
      )}
    </div>
  )
}
