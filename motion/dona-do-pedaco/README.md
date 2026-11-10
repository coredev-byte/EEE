# Dona do Pedaço — motion de divulgação

Vídeo vertical 1080×1920, 30 fps, 23 s, sem áudio: **`dona-do-pedaco.mp4`**.

Segue a estrutura do vídeo de referência, cena por cena:

| Tempo | Cena |
| --- | --- |
| 0–1,5 s | "Tá com fome?" escrito à mão em fundo creme |
| 1,5–3,5 s | Wipe vermelho, estrela girando e o logo "Dona do Pedaço" entrando com estouro |
| 3,5–5,7 s | Tela de app: busca digitando e cardápio deslizando |
| 5,7–8 s | Mão segurando o celular: "Na palma da sua mão!" |
| 8–13 s | Vitrine dos lanches (Triplo Egg Bacon, Duplo Cheddar, Duplo Salada, Clássico) com botão "Peça já" |
| 13–14,8 s | "RAPIDINHO" com motoboy |
| 14,8–17 s | Mapa: pin da loja, rota e chegada em casa |
| 17–18,6 s | "Seu pedido foi entregue" com check e estrelas |
| 18,6–20 s | "FOI TRANQUILO!" |
| 20–23 s | Logo final com lanche e "Peça já o seu!" |

## Editar

Tudo fica em `index.html`: textos, cores (variáveis em `:root`) e tempos (timeline GSAP no final do arquivo).
Os nomes dos lanches são sugestões baseadas nas fotos; troque-os na lista `P` e nas linhas `.row`.
Para ver ao vivo, abra `index.html` no navegador.

Recortes das fotos (fundo removido) ficam em `assets/`.

## Renderizar de novo

```sh
npm i playwright   # se ainda não tiver
node render.mjs    # gera dona-do-pedaco.mp4 (requer ffmpeg)
```
