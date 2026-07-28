# RoyalPath

Guia pessoal, gratuito e não oficial para **iniciantes de Royal Paladin** no
Tibia. O app transforma level, skills e equipamentos em um resumo simples de
vida, mana, capacidade, defesa e DPS esperado, sem esconder as limitações da
estimativa.

> Pesquisa, arquitetura, conteúdo, identidade visual, código e testes deste
> projeto foram produzidos **100% com auxílio de inteligência artificial**.
> O projeto não tem fins lucrativos.

## O que já está incluído

- início em três passos: informe o personagem, monte o set e leia o resultado;
- Arsenal visual por slot, com a imagem do item selecionado;
- vida, mana, capacidade, armor e proteções calculadas a partir do perfil;
- DPS comparativo com uma rotação adequada ao level informado;
- hunts com foco e margem de segurança para iniciantes;
- jornada do level 8 ao 1000+ e guias de sistemas em uma única seção;
- persistência local de level, skills, metas, loadout e opções avançadas;
- navegação responsiva com cinco destinos claros em desktop e celular.

O conteúdo foi revisado em **28 de julho de 2026**, para o Tibia 15.30. Métricas
de hunts são observações comunitárias e podem variar por skills, stamina, prey,
charms, rota, Market e atualizações.

## Rodando localmente

Requisitos: Node.js 22.13 ou superior.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Validação

```bash
npm run lint
npm run test
```

O comando de teste gera a build de produção, valida os motores de personagem e
dano, verifica a integridade do conteúdo e faz um smoke test do HTML renderizado.

## Como o simulador deve ser lido

O simulador é uma ferramenta de **comparação**, não um preditor exato. A CipSoft
não publica a fórmula completa de dano. O RoyalPath usa uma fórmula comunitária
reversa, ajustada às mudanças oficiais de 2026, e mantém mitigação do monstro,
Wheel, charms, prey e outros modificadores fora do número principal. Spells só
entram no ciclo simplificado quando o level informado já permite usá-las.

A estimativa deve ser confirmada no Impact Analyzer/Combat Stats do próprio jogo.
A implementação e as ressalvas ficam em [`lib/damage.ts`](./lib/damage.ts).

## Fontes prioritárias

- [Tibia — Vocation Adjustments 2026](https://www.tibia.com/news/?id=8833&subtopic=newsarchive)
- [Tibia — ajustes finais de 7 jul 2026](https://www.tibia.com/news/?id=8872&subtopic=newsarchive)
- [Tibia — Summer Update 2026](https://www.tibia.com/news/?id=8845&subtopic=newsarchive)
- [Tibia — imbuements e crítico](https://www.tibia.com/news/?id=8421&subtopic=newsarchive)
- [Tibia — Exaltation Forge](https://www.tibia.com/news/?id=7599&subtopic=newsarchive)
- [TibiaPal — hunting](https://tibiapal.com/hunting)
- [TibiaWiki BR — Summer Update 2026](https://www.tibiawiki.com.br/wiki/Summer_Update_2026)

Cada seção sensível a patches também mostra fonte, confiança e data de revisão
dentro do app.

## Aviso legal

RoyalPath não é afiliado, endossado ou mantido pela CipSoft GmbH. Tibia e seus
elementos, incluindo os sprites dos itens, são propriedade de seus respectivos
titulares. Os PNGs em `public/items/` são usados para identificação visual no
guia não comercial; sua origem e atribuição ficam em
[`public/items/NOTICE.md`](./public/items/NOTICE.md).

## Licença

O código original do RoyalPath é disponibilizado sob a
[licença MIT](./LICENSE). Os sprites de terceiros em `public/items/` ficam
expressamente fora dessa licença. Conteúdo informativo fornecido “como está”,
sem garantia de precisão ou segurança de qualquer hunt.
