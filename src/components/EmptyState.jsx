import { Inbox } from 'lucide-react'

export default function EmptyState({ message = 'Nenhum registro encontrado', icon: Icon, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon ? <Icon size={48} className="text-gray-300 mb-3" /> : <Inbox size={48} className="text-gray-300 mb-3" />}
      <p className="text-sm text-gray-500">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
