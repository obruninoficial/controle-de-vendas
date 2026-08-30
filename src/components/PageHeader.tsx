import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  onBack?: () => void
  action?: ReactNode
}

export function PageHeader({ title, onBack, action }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 pt-safe-top backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-3">
        <div className="flex w-10 items-center">
          {onBack && (
            <button
              onClick={onBack ?? (() => navigate(-1))}
              aria-label="Voltar"
              className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-slate-600 active:bg-slate-100"
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
        <h1 className="flex-1 truncate text-center text-base font-semibold text-slate-900">{title}</h1>
        <div className="flex w-10 items-center justify-end">{action}</div>
      </div>
    </header>
  )
}
