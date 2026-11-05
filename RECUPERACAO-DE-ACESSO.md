# Recuperação de acesso ao PetShop

O login oferece o link **Esqueci minha senha**. O proprietário informa o e-mail já cadastrado e recebe um link para `/redefinir-senha`, onde digita e confirma a nova senha. O aplicativo não disponibiliza cadastro público.

Configuração necessária no Supabase:

- Site URL: `https://petshop-app-beige.vercel.app`.
- Redirect URL permitida: `https://petshop-app-beige.vercel.app/redefinir-senha`.
- Allow new users to sign up: desligado.
- Email provider: ligado para permitir login e recuperação das contas existentes.

A senha é escolhida pelo proprietário na página. Não se deve salvar senha em arquivos do projeto, commits ou mensagens. A interface exige pelo menos oito caracteres e confirmação igual; o Supabase também aplica suas próprias regras.

Sem uma sessão válida obtida pelo link, a página orienta a solicitar outro link e não exibe o formulário de alteração. Após salvar, o aplicativo encerra a sessão e apresenta o retorno ao login.

A resposta à solicitação de recuperação não revela se um endereço possui conta. Novos cadastros devem permanecer bloqueados no servidor, pois a recuperação atende contas existentes.

Referências: [recuperação de senha](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [URLs de redirecionamento](https://supabase.com/docs/guides/auth/redirect-urls).
