'use client'

interface HeaderProps {
  title: string
  description: string
}

export default function Header({ title, description }: HeaderProps) {
  return (
    <div className="content-header">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}
