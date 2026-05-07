export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          万能导入系统
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          支持多模板的自动识别与导入下单系统
        </p>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            功能特性
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <span>支持多种 Excel 模板格式的自动识别</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <span>模板记忆学习功能，一次调整永久生效</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <span>支持 1000+ 条数据的无缝导入</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <span>完整的数据校验与错误提示</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <span>在线数据编辑和导出</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 提示：项目初始化已完成，请配置数据库连接后开始使用。
          </p>
        </div>
      </div>
    </div>
  )
}
