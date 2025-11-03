# Projeto Frontend - Agenda SaaS

Este repositório contém o frontend estático (HTML/CSS/JS) do projeto.

## Fluxo Git (convenção de branches)

Use o seguinte fluxo para organizar o desenvolvimento e as entregas:

- Branch principal de desenvolvimento: `develop`
- Branches de feature: `feat/<id_task>`
	- Exemplo: `feat/123` ou `feat/feature-login`
- Branches para entregas solicitadas ao professor: `entrega_#<id>`
	- Exemplo: `entrega_#7`

Regras rápidas:
- Crie sempre a partir de `develop` ao começar uma nova feature ou correção.
- Faça pull request (ou merge request) da sua branch `feat/...` para `develop` quando a feature estiver pronta.
- Para entregar ao professor, crie uma branch `entrega_#<id>` a partir de `develop` contendo apenas os commits necessários para a entrega e abra a PR indicando o número da entrega.

Exemplos de comandos:

```bash
# criar e mudar para a branch de feature
git checkout develop
git pull origin develop
git checkout -b feat/123-minha-feature

# depois de implementar, subir a branch
git add .
git commit -m "feat(123): descrição curta"
git push origin feat/123-minha-feature

# abrir PR da feat/123-minha-feature -> develop
```

```bash
# criar branch de entrega
git checkout develop
git pull origin develop
git checkout -b entrega_#7
git push origin entrega_#7
# abrir PR indicando que é entrega #7
```

## Repositório backend

O backend do projeto está neste repositório:

https://github.com/Sluvizottodev/agenda-saas-JAVA

## Atualização automática a partir de `develop`

Para facilitar atualizar a sua branch corrente com as alterações remotas da branch `develop`, há um script disponível em:

```
scripts/update.sh
```

Uso rápido:

```sh
# merge padrão (origin/develop -> sua branch atual)
./scripts/update.sh

# usar rebase em vez de merge
./scripts/update.sh -r
```

