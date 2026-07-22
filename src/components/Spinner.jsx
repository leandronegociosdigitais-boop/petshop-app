export default function Spinner({ size = 'md' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${sizes[size] || sizes.md} animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600`} />
    </div>
  )
}
