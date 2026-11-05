export function validateNewPassword(password, confirmation) {
  if (password.length < 8) return 'Use uma senha com pelo menos 8 caracteres.'
  if (password !== confirmation) return 'As senhas não coincidem.'
  return null
}
