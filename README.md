# RoyalPath

Guia pessoal, gratuito e não oficial de progressão para **Royal Paladin** no
Tibia. O app reúne roadmap do level 8 ao endgame, hunts de leveling e farm,
progressão de equipamentos, guias de sistemas e um simulador comparativo de
dano com loadout em formato de inventário.

> Pesquisa, arquitetura, conteúdo, identidade visual, código e testes deste
> projeto foram produzidos **100% com auxílio de inteligência artificial**.
> O projeto não tem fins lucrativos.

## O que já está incluído

- painel “Agora” que adapta as próximas metas ao level do personagem;
- roadmap completo do level 8 ao 1000+;
- hunts com filtros de XP, farm e margem de segurança para iniciantes;
- arsenal por slot e contexto, sem tratar “BIS” como uma resposta universal;
- academia com imbuements, Exaltation Forge, Weapon Proficiency, stances e
  rotação;
- simulador comparativo de autoattack e ciclo teórico de quatro segundos;
- persistência local de level, metas concluídas e loadout;
- navegação responsiva e acessível em desktop e celular.

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

O comando de teste gera a build de produção, valida o motor de dano e a
integridade do conteúdo, e faz um smoke test do HTML renderizado.

## Como o simulador deve ser lido

O simulador é uma ferramenta de **comparação**, não um preditor exato. A CipSoft
não publica a fórmula completa de dano. O RoyalPath usa uma fórmula comunitária
reversa, ajustada às mudanças oficiais de 2026, e mantém armadura, mitigação,
Wheel, charms, prey e outros modificadores fora do número principal.

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
elementos são marcas/propriedade de seus respectivos titulares. A interface usa
uma identidade original inspirada em fantasia medieval, sem copiar logo, sprites
ou telas do cliente.

## Licença

Código disponibilizado sob a [licença MIT](./LICENSE). Conteúdo informativo
fornecido “como está”, sem garantia de precisão ou segurança de qualquer hunt.
