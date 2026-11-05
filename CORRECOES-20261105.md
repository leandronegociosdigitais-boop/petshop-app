# Correções do PetShop — 05/11/2026

## Mudanças no aplicativo

- Financeiro: removidas chamadas ao estado inexistente de lembretes. O banco escolhido é preservado na edição e enviado ao salvar.
- Relatórios: lançamentos diferentes com descrição, valor e data iguais continuam sendo somados.
- Atendimentos: concluir o serviço preserva o status de pagamento. A gravação e a exclusão passam a usar a sincronização transacional do banco, sem uma segunda gravação independente no navegador.
- Comissões e faturamento de serviços: consideram serviços concluídos. O gráfico por forma de pagamento inclui a segunda forma.
- Consultas de listas e totais: paginação para não perder registros quando o limite da API é atingido.
- Datas de consultas: limites enviados com o deslocamento local explícito. A sincronização financeira no banco utiliza America/Manaus.
- Backup: exportação consistente das cinco tabelas em uma única operação; cópia semanal no armazenamento do navegador, com tentativa na próxima abertura quando sábado foi perdido. O download manual e o botão para baixar a última cópia continuam disponíveis. Restauração não é registrada como um novo backup.
- Organização: hooks e contextos separados dos componentes; arquivos de rascunho da raiz fora da análise do aplicativo.

## Ordem de ativação

1. Aplicar no Supabase a migração `supabase/migrations/202611050001_atomic_atendimento_financeiro.sql`.
2. Executar o teste transacional em `tests/database/atendimento-financeiro.sql` como arquivo completo. Ele usa rollback e não deixa registros de teste.
3. Publicar a versão atualizada do aplicativo.

O aplicativo verifica a presença dos gatilhos antes de alterar atendimentos. Sem a migração, mostra uma mensagem e não tenta gravar parcialmente. Os novos backups também exigem a função de exportação da migração.

A migração define funções e gatilhos e mantém os registros existentes. A função de restauração somente substitui dados quando um usuário autenticado solicita uma restauração. As funções usam as permissões do usuário e respeitam as regras de acesso existentes.

## Verificações realizadas

- Análise do aplicativo: sem erros nem avisos.
- Nove testes automatizados: aprovados, incluindo limites de paginação, falha após uma página, registros iguais com IDs diferentes e recuperação da rotina semanal.
- Compilação e geração do PWA: aprovadas. Permanece um aviso sobre o tamanho do pacote inicial.
- Protótipo da sincronização no banco: aprovado com o papel authenticated, incluindo uma falha financeira injetada para confirmar o desfazimento da alteração do atendimento. Toda a transação de teste foi desfeita.
- Acesso confirmado no navegador ao Supabase e ao GitHub da conta leandronegociosdigitais-boop.

## Migração aplicada no Supabase

A aplicação permanente foi autorizada pelo usuário e concluída em 05/11/2026 no projeto `ockwtcyohqfdhcfgclhh`.

Uma conferência dentro da transação confirmou que as quantidades de clientes, pets, serviços, atendimentos e lançamentos financeiros, além da soma dos valores financeiros, permaneceram iguais antes e depois da migração.

Após a instalação, os testes passaram com o papel `authenticated`: serviço pendente sem receita, pagamento dividido, edição sem duplicação, falha financeira com rollback do atendimento, cancelamento e exclusão. Também foram confirmadas a exportação completa das cinco tabelas, a rejeição de um backup inválido antes de qualquer exclusão e as permissões de exportação/restauração (permitidas a `authenticated`, negadas a `anon`). Todos os dados e objetos dos testes foram desfeitos por rollback.

A publicação da interface utiliza a integração automática entre a branch master do GitHub e a Vercel. O endereço de produção é https://petshop-app-beige.vercel.app. As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas no ambiente Production da Vercel.

O proprietário redefiniu a senha e entrou no aplicativo. Foram conferidos dashboard, clientes, pets, serviços, atendimentos, financeiro, relatórios, comissões e backup, sem alterar registros reais. Os totais mensais conferiram entre as telas, e o download da cópia local incluiu os 2.603 registros exibidos no backup. Não foi feita restauração sobre dados reais.

## Cuidados de operação

A cópia automática fica neste navegador e pode ser removida se seus dados forem limpos. Exporte um arquivo e mantenha outra cópia em local seguro. A rotina funciona com o aplicativo aberto e conectado; não é um agendamento executado em servidor.

Não há conciliação automática retroativa: lançamentos antigos foram preservados. A nova sincronização é executada quando um atendimento é criado, editado ou excluído.

O gráfico anual do dashboard identifica a receita de serviços e o valor após comissão; esse indicador usa a taxa de comissão configurada no projeto.
