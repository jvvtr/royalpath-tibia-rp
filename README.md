# RoyalPath

Guia pessoal, gratuito e não oficial para **iniciantes de Royal Paladin** no
Tibia. O app transforma level, skills e equipamentos em um resumo simples de
vida, mana, capacidade, armadura, proteção física e DPS comparativo em um alvo,
sem esconder as limitações da estimativa.

> Pesquisa, arquitetura, conteúdo, identidade visual, código e testes deste
> projeto foram produzidos **100% com auxílio de inteligência artificial**.
> O projeto não tem fins lucrativos.

## O que já está incluído

- início em três passos: informe o personagem, monte o set e leia o resultado;
- Arsenal pesquisável com 555 itens utilizáveis por Paladin, incluindo 58 escudos e 27 munições;
- sprites locais, filtros por slot e aviso de level sem bloquear simulações futuras;
- bows/crossbows usam quiver + munição compatível; armas de arremesso usam shield;
- vida, mana, capacidade, armor e proteções calculadas separadamente; o valor
  bruto de defesa da arma/escudo não é apresentado como redução direta;
- DPS comparativo em um alvo com um ciclo simplificado adequado ao level informado;
- hunts com foco e margem de segurança para iniciantes;
- aba de Tutoriais com treino, promoção, blessings, quiver, imbuements e sistemas;
- Jornada do level 8 ao 1000+ focada em progressão e marcos;
- persistência local de level, skills, metas, loadout e opções avançadas;
- layout responsivo inspirado na estrutura funcional do Tibia.com, criado apenas com CSS;
- seis destinos claros no menu lateral do desktop e no menu superior móvel.

O catálogo é sincronizado de fontes comunitárias, mas as sugestões automáticas usam
uma seleção curada para evitar que itens cosméticos ou situacionais virem recomendação
por acidente. Itens acima do level continuam selecionáveis e aparecem como simulação hipotética.

O conteúdo foi revisado em **29 de julho de 2026**. As faixas comunitárias de
hunts abaixo do level 80 são referências anteriores ao rebalance de
junho/julho de 2026, não retestes pós-patch. Acima dessa faixa, números sem
reteste claro são omitidos. Todo resultado ainda varia por skills, stamina,
prey, charms, rota, Market e atualizações.

## Rodando localmente

Requisitos: Node.js 22.13 ou superior.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Para atualizar o catálogo e baixar novamente os sprites a partir das fontes
registradas no manifesto:

```bash
npm run sync:items
```

O sincronizador exige acesso à internet; revise o diff e rode os testes antes de publicar.

## Publicação fácil no GitHub Pages

O projeto inclui um workflow que gera a versão totalmente estática e publica
automaticamente todo push na branch `main`. O endereço esperado deste
repositório é:

<https://jvvtr.github.io/royalpath-tibia-rp/>

Antes do primeiro deploy, abra **Settings → Pages** no repositório e escolha
**GitHub Actions** em **Source**. Depois disso, os próximos pushes na `main`
serão publicados sem comandos manuais.

Para validar exatamente o mesmo artefato antes de enviar:

```bash
npm run test:pages
```

O comando cria `out/`, aplica automaticamente o subdiretório correto do
repositório, verifica o HTML e confirma todos os sprites listados no manifesto do
Arsenal. Em forks, o nome do dono e do repositório são inferidos pelo GitHub Actions;
domínio próprio também é respeitado pelos dados fornecidos pelo Pages.

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
entram no ciclo simplificado quando o level informado já permite usá-las. O
modelo usa ataques básicos abaixo do level 50, adiciona Divine Caldera no 50 e
Divine Barrage no 70. Ethereal Barrage é liberada no jogo no level 60, mas fica
fora do ciclo entre 60–69; nessa faixa, a estimativa é conservadora e tende a
ficar abaixo do potencial real.

Para que o atributo **Hit** altere a comparação sem fingir uma fórmula exata, o
app usa uma aproximação conservadora: 90% de precisão-base + Hit impresso na
arma/munição, limitada a 100%. Imbuements só entram até o número de slots
catalogado na arma; Forge só entra em armas com classe de tier, respeitando o
limite da classe. Armor, proteção física e o valor bruto de defesa da
arma/escudo permanecem conceitos separados.

A estimativa deve ser confirmada no Impact Analyzer/Combat Stats do próprio jogo.
A implementação e as ressalvas ficam em [`lib/damage.ts`](./lib/damage.ts).

## Fontes prioritárias

- [Tibia — spells automáticas e exceções](https://www.tibia.com/news/?id=8675&subtopic=newsarchive)
- [Tibia — Paladin Spells e requisitos de level](https://www.tibia.com/library/?vocation=Paladin&subtopic=spells)
- [Tibia — Vocation Adjustments 2026](https://www.tibia.com/news/?id=8833&subtopic=newsarchive)
- [Tibia — ajustes finais de 7 jul 2026](https://www.tibia.com/news/?id=8872&subtopic=newsarchive)
- [Tibia — Weapon Proficiency Update](https://www.tibia.com/news/?id=8850&subtopic=newsarchive)
- [Tibia — regras finais de Major/Minor Charms](https://www.tibia.com/news/?id=8140&subtopic=newsarchive)
- [Tibia — Shared Experience](https://www.tibia.com/support/?entryid=92&subtopic=gethelp)
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
