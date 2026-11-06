# Otimização mobile

Os estilos estão isolados em `src/styles/mobile.css`. O layout de desktop a partir de 1024 px mantém a apresentação anterior.

- Até 1023 px: barra inferior com Início, Agenda, Clientes, Financeiro e Mais; menu com rolagem independente, foco contido e fechamento por Escape.
- Até 639 px: clientes, pets, atendimentos e lançamentos financeiros passam a cartões usando os mesmos registros e ações das tabelas. Horário, status, pagamento e valor ficam visíveis.
- Formulários em tela cheia em celulares, rolagem interna, botões de ação acessíveis, campos de 16 px para evitar zoom automático e suporte às áreas seguras do aparelho.
- Relatórios e tabelas de resumo mantêm rolagem horizontal dentro da própria seção.
- Nenhuma alteração no banco, autenticação ou cálculos financeiros.

Validação: lint sem erros/avisos, 15 testes aprovados e build de produção aprovado. A conferência visual usa a sessão existente e abre/cancela formulários sem gravar registros.
