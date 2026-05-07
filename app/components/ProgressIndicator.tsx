'use client'

interface ProgressIndicatorProps {
  currentStep: number
  completedSteps?: number[]
}

export default function ProgressIndicator({
  currentStep,
  completedSteps = [],
}: ProgressIndicatorProps) {
  const steps = [
    { number: 1, label: '上传文件' },
    { number: 2, label: '自动识别' },
    { number: 3, label: '映射编辑' },
    { number: 4, label: '数据校验' },
    { number: 5, label: '完成导入' },
  ]

  return (
    <div className="steps">
      {steps.map((step) => {
        let stepClass = ''
        if (step.number === currentStep) {
          stepClass = 'active'
        } else if (completedSteps.includes(step.number)) {
          stepClass = 'completed'
        }

        return (
          <div key={step.number} className={`step ${stepClass}`}>
            <div className="step-circle">
              {completedSteps.includes(step.number) ? '✓' : step.number}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
        )
      })}
    </div>
  )
}
