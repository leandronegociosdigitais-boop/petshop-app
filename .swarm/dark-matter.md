## Dark Matter: Hidden Couplings

Found 12 file pairs that frequently co-change but have no import relationship:

| File A | File B | NPMI | Co-Changes | Lift |
|--------|--------|------|------------|------|
| src/pages/Clientes.jsx | src/pages/Pets.jsx | 0.907 | 3 | 16.75 |
| src/pages/Clientes.jsx | src/pages/Servicos.jsx | 0.907 | 3 | 16.75 |
| index.html | vite.config.js | 0.907 | 3 | 16.75 |
| src/pages/Pets.jsx | src/pages/Servicos.jsx | 0.815 | 3 | 12.56 |
| src/pages/Comissoes.jsx | src/pages/Pets.jsx | 0.754 | 4 | 8.38 |
| src/components/Layout.jsx | src/index.css | 0.727 | 3 | 9.57 |
| src/pages/Clientes.jsx | src/pages/Comissoes.jsx | 0.684 | 3 | 8.38 |
| src/pages/Comissoes.jsx | src/pages/Servicos.jsx | 0.592 | 3 | 6.28 |
| src/pages/Financeiro.jsx | src/pages/Pets.jsx | 0.556 | 4 | 4.79 |
| src/pages/Atendimentos.jsx | src/pages/Servicos.jsx | 0.531 | 4 | 4.47 |
| src/pages/Pets.jsx | src/pages/Relatorios.jsx | 0.531 | 4 | 4.47 |
| src/pages/Clientes.jsx | src/pages/Financeiro.jsx | 0.504 | 3 | 4.79 |

These pairs likely share an architectural concern invisible to static analysis.
Consider adding explicit documentation or extracting the shared concern.