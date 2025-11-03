#!/usr/bin/env sh
set -euo pipefail

print_usage() {
  cat <<-EOF
Usage: $(basename "$0") [options]

Automação para atualizar a branch atual com as alterações remotas da branch 'develop'.

Options:
  -r, --rebase       Rebase current branch onto origin/develop instead of merging
  -R, --remote <name>  Remote name (default: origin)
  -n, --no-stash      Do not auto-stash local uncommitted changes
  -h, --help          Show this help and exit

Examples:
  # merge origin/develop into current branch
  ./scripts/update-from-develop.sh

  # rebase current branch onto origin/develop
  ./scripts/update-from-develop.sh -r
EOF
}

# defaults
REBASE=0
REMOTE=origin
NO_STASH=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    -r|--rebase)
      REBASE=1; shift ;;
    -R|--remote)
      if [ $# -lt 2 ]; then echo 'Missing remote name'; exit 2; fi
      REMOTE="$2"; shift 2 ;;
    -n|--no-stash)
      NO_STASH=1; shift ;;
    -h|--help)
      print_usage; exit 0 ;;
    *)
      echo "Unknown option: $1"; print_usage; exit 2 ;;
  esac
done

# ensure we're in a git repo
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Erro: este script precisa ser executado dentro de um repositório Git." >&2
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "HEAD" ]; then
  echo "Erro: HEAD detachado. Mude para uma branch antes de executar." >&2
  exit 1
fi

echo "Branch atual: $CURRENT_BRANCH"

STASHED=0
if [ "$NO_STASH" -ne 1 ]; then
  if ! git diff-index --quiet HEAD --; then
    echo "Alterações não comitadas detectadas — realizando stash automático..."
    git stash push -u -m "autostash: update-from-develop at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    STASHED=1
  fi
fi

echo "Buscando ${REMOTE}/develop..."
git fetch "$REMOTE" develop || { echo "Falha no git fetch" >&2; exit 1; }

if [ "$REBASE" -eq 1 ]; then
  echo "Rebasing $CURRENT_BRANCH onto ${REMOTE}/develop..."
  if git rebase "${REMOTE}/develop"; then
    echo "Rebase concluído com sucesso."
  else
    echo "Rebase falhou — resolva conflitos manualmente." >&2
    exit 1
  fi
else
  echo "Merging ${REMOTE}/develop into $CURRENT_BRANCH..."
  # tenta um merge automático; aborta se houver conflitos
  if git merge --no-ff --no-edit "${REMOTE}/develop"; then
    echo "Merge concluído com sucesso."
  else
    echo "Merge falhou — resolva conflitos manualmente." >&2
    exit 1
  fi
fi

if [ "$STASHED" -eq 1 ]; then
  echo "Aplicando stash salvo..."
  # tenta aplicar o stash (pop). Se houver conflitos, o usuário precisa resolver.
  if git stash pop; then
    echo "Stash aplicado com sucesso."
  else
    echo "Ao aplicar o stash ocorreram conflitos. Resolva-os manualmente e finalize." >&2
    exit 1
  fi
fi

echo "Atualização finalizada."
git --no-pager status --short --branch

exit 0
