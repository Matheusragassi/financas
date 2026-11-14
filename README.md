# Finanças

App de gestão financeira pessoal: gastos mês a mês, parcelas, assinaturas, métricas e relatórios.
Visual limpo com tema claro/escuro, feito com **React + Vite + TypeScript + [shadcn/ui](https://ui.shadcn.com)**.

- **Funciona offline** (PWA): instale no celular ou no computador pelo navegador ("Adicionar à tela inicial" / ícone de instalar).
- **Sempre no ar** pelo GitHub Pages, sem servidor e sem custo.
- **Privado**: os dados ficam só no navegador de quem usa (localStorage). Nada é enviado para servidor nenhum.
- **Multiusuário por natureza**: cada pessoa que abre o link tem os próprios dados, começando do zero, por um backup ou pela demonstração.

## Funcionalidades

- **Visão geral**: total do mês, saldo, % de comprometimento da renda, pago x pendente, evolução de 12 meses, composição (fixos x variáveis, essenciais x não essenciais), categorias, métodos de pagamento, maiores gastos e parcelas perto do fim.
- **Lançamentos**: adicionar, editar, duplicar e excluir; busca e filtros; seleção em massa (marcar pago/pendente/cancelado, excluir); **clique no valor para atualizar o preço na hora**; exportação CSV.
- **Parcelados**: ao lançar uma compra parcelada, as parcelas restantes são criadas nos meses seguintes automaticamente.
- **Atualizar preço em lote**: ao editar, escolha aplicar "só neste mês", "neste e nos próximos" ou "em todos os meses" (ex.: reajuste da Netflix).
- **Gerar próximo mês**: copia fixos e assinaturas e avança as parcelas, removendo as que terminaram.
- **Parcelas**: progresso de cada compra, quanto falta pagar, quando termina e previsão dos próximos 12 meses.
- **Relatórios**: por ano ou período todo, com média mensal, mês mais caro/leve, saldo mensal, ranking de itens, assinaturas e tabela mensal.
- **Ajustes & backup**: exportar/restaurar backup `.json`, renda por mês, categorias e métodos personalizados.

> ⚠️ Como os dados ficam no navegador, **exporte um backup de vez em quando** (Ajustes & backup). Ele também serve para levar os dados para outro aparelho.

## Rodar localmente

```bash
npm install
npm run dev
```

## Publicação

Todo push na branch `main` publica automaticamente no GitHub Pages pelo workflow em `.github/workflows/deploy.yml`.
Na primeira vez, confira em **Settings → Pages** que a origem está como **GitHub Actions**.
