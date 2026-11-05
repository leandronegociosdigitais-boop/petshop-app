import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuthContext'
import { validateNewPassword } from '../lib/passwords'
import AuthCard from '../components/AuthCard'

export default function ResetPassword() {
  const { user, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving || !user) return
    const validationError = validateNewPassword(password, confirmation)
    if (validationError) { setError(validationError); return }
    setSaving(true)
    setError('')
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setPassword('')
      setConfirmation('')
      setUpdated(true)
      await supabase.auth.signOut()
    } catch (updateError) {
      setError(updateError.message || 'Não foi possível atualizar a senha. Solicite um novo link e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  let content
  if (updated) {
    content = <div role="status" className="space-y-4 text-sm text-emerald-300"><p>Senha atualizada com sucesso.</p><Link to="/login" className="block text-violet-400">Entrar com a nova senha</Link></div>
  } else if (loading) {
    content = <p role="status" className="text-center text-sm text-slate-300">Validando seu acesso...</p>
  } else if (!user) {
    content = <div className="space-y-4 text-sm text-slate-300"><p>Abra o link recebido por e-mail para definir sua senha. Se o link expirou ou já foi usado, solicite outro.</p><Link to="/recuperar-senha" className="block text-violet-400">Solicitar novo link</Link></div>
  } else {
    content = (
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-slate-300">Nova senha</label>
          <input id="new-password" type="password" autoComplete="new-password" minLength={8} required disabled={saving} value={password} onChange={event => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <p className="mt-2 text-xs text-slate-400">Use pelo menos 8 caracteres.</p>
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-slate-300">Confirmar nova senha</label>
          <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required disabled={saving} value={confirmation} onChange={event => setConfirmation(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={saving} className="w-full rounded-lg bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar nova senha'}</button>
      </form>
    )
  }

  return <AuthCard title="Definir nova senha" description="Crie uma nova senha para acessar o PetShop.">{content}</AuthCard>
}
