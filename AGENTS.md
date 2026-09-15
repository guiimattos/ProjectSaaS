# Instruções para agentes (Codex / Claude)

## Objetivo
Seguir boas práticas de desenvolvimento, evitar conflitos de merge e nunca abrir PRs contendo marcadores ou restos de conflito do Git.

## Regras obrigatórias
Antes de finalizar qualquer alteração ou abrir um PR:

1. Atualizar a branch com a `main` mais recente:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Rodar `npm run check:conflicts` e `npm run test:critical-flows`.
3. Rodar `npm run typecheck` (requer `npm install` e `npm run db:generate`).
4. Não commitar `node_modules`, `.next` ou arquivos `.env`.
