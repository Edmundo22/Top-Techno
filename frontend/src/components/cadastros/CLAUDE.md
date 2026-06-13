# components/cadastros

Componentes das telas de cadastro (CRUDs). Contém `locais/` e `motoristas/`.

Páginas e rotas (ver [src/app/router.tsx](../../app/router.tsx)):
- `/cadastros/locais` → [src/pages/CadastroLocais.tsx](../../pages/CadastroLocais.tsx).
- `/cadastros/motorista-por-rota` → [src/pages/MotoristaPorRota.tsx](../../pages/MotoristaPorRota.tsx) (CRUD de motoristas + vínculo com rotas; usa o banco CORREIO).

A navegação para cadastros usa o grupo expansível "Cadastros" na sidebar — ver [components/layout/Sidebar.tsx](../layout/Sidebar.tsx).

## Documentação modular
- [locais/CLAUDE.md](locais/CLAUDE.md)
- [motoristas/CLAUDE.md](motoristas/CLAUDE.md)
