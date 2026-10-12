# Reforge — contrato do pipeline de arte

O manifesto canônico está em `public/assets/animations/manifest.json`.
O jogo carrega seus registros com `runtime: true`; dimensões incorretas falham
antes de entrar no renderer. Os recortes legados de Kharn e das ruínas também
estão no manifesto, preservando o comportamento existente. Eles **não** passam
a ser pixel art nativa por estarem registrados.

Cada registro contém caminho, SHA256, dimensões reais da fonte, material,
célula, pivô, margem, direções disponíveis, animações registradas,
proveniência e estado de revisão. Animações novas não podem referenciar células
ausentes, vazias ou repetir exatamente a mesma imagem em todos os frames.
Nem todos os atlas legados têm contratos completos de animação: campos vazios
indicam esse trabalho pendente, não estados já implementados.

## Ambiente e validação

```sh
python3 -m venv /workspace/.venvs/eee-assets
/workspace/.venvs/eee-assets/bin/python -m pip install --cache-dir /workspace/.pip -r scripts/requirements-assets.txt
/workspace/.venvs/eee-assets/bin/python scripts/asset_registry.py validate
/workspace/.venvs/eee-assets/bin/python scripts/test_asset_registry.py
/workspace/.venvs/eee-assets/bin/python scripts/test_sprite_frames.py
```

O runtime não usa Python, rede de geração de imagem ou chave de API.
Pillow 12.3.0 é usado apenas nas ferramentas offline. A validação de
desenvolvimento tolera arte legada registrada e informa sua reconstrução
pendente. `validate --release` exige revisão artística aprovada para **cada**
registro e deve continuar falhando enquanto essa revisão estiver pendente.
Essa falha é um gate artístico esperado, não um teste desativado.

O compilador antigo foi preservado como **importador de fontes legadas**:

```sh
/workspace/.venvs/eee-assets/bin/python scripts/compile_assets.py --characters-only
```

Ele escreve em staging, valida todas as saídas, atualiza hashes sem apagar
registros alheios e só então publica. Uma falha na publicação restaura os
arquivos substituídos. Mudança nos pixels volta a revisão para `pending`.
Compilação e importação são operações CLI serializadas; não execute dois
publicadores simultaneamente. Não há transação resistente a queda de energia.
As fontes originais permanecem intactas.

Esse compilador recorta/redimensiona fontes antigas; **não** resolve a exigência
de reconstrução artística nativa. Novos desenhos devem ser feitos na resolução
lógica e importados pelo contrato abaixo, sem anti-aliasing ou alpha parcial.

## Importar arte nova

Exemplo de contrato para um ícone nativo 48×48, em JSON:

```json
{
  "path": "icons/novo-icone.png",
  "runtime": false,
  "sourceSize": [48, 48],
  "material": "native",
  "frame": {"size": [48, 48], "pivot": [24, 24], "gutter": 2},
  "directions": [],
  "animations": {},
  "provenance": {"kind": "native-drawing", "source": "arquivo de trabalho preservado", "author": "autor real"}
}
```

```sh
/workspace/.venvs/eee-assets/bin/python scripts/asset_registry.py import novo-icone /tmp/novo-icone.png /tmp/contrato.json
```

Hash e revisão inicial são calculados pelo importador. Caminhos fora da pasta,
registros existentes, arquivos existentes, paleta divergente, alpha parcial,
margens inválidas e frames vazios são rejeitados sem alterar produção.
Uma falha de escrita no manifesto remove a nova cópia do asset.

Para personagens, a referência continua sendo célula 96×112 e pés em (48,108),
quatro direções reais, nomes de estados e eventos auditados. Chefes precisam
de contratos proporcionais próprios. A validação técnica geral não consegue
provar anatomia, sentido das poses ou qualidade artística: revise no jogo.
Não marque como disponível uma animação que ainda não foi desenhada.
Registrar um atlas não cria IA nem um spawn; a integração declarativa de
inimigos pertence à fase 4.

## Inspecionar sem alterar a fonte

```sh
/workspace/.venvs/eee-assets/bin/python scripts/asset_registry.py inspect hero artifacts/reforge-hero-inspecao.png --scale 2
/workspace/.venvs/eee-assets/bin/python scripts/asset_registry.py inspect kharn artifacts/reforge-kharn-inspecao.png --scale 1
```

As folhas mostram quadriculado, índice, pivô magenta, hash e estado de revisão.
Usam nearest-neighbor apenas para diagnóstico. Não alteram arquivos de
produção, não são assets novos e não concedem aprovação automaticamente.
Inspecione também caminhada/ataque em movimento, oclusão e escala lado a lado
com o jogador. Registre capturas renderizadas e os defeitos restantes antes
de aprovar qualquer reconstrução.
