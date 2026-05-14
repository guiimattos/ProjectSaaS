# Instruções para o Codex

## Objetivo

Seguir boas práticas de desenvolvimento, evitar conflitos de merge e nunca abrir PRs contendo marcadores de conflito do Git.

## Regras obrigatórias

Antes de finalizar qualquer alteração ou abrir um PR, o Codex deve:

1. Atualizar a branch com a versão mais recente da branch principal.

```bash
git fetch origin
git rebase origin/main
