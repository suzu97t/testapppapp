---
paths:
  - "**/*.{css,scss,html,jsx,tsx,vue,svelte,astro}"
---

# UI ファイルを触るときの規則

- まだなら `ui-design` スキルを読み込む。`design/PRODUCT.md` `design/DESIGN.md` `design/tokens.css` を読まずに書かない
- 色・書体・文字サイズ・余白・角丸・影・時間は `var(--…)` のみ。リテラル値を書かない。トークン名を推測しない
- `design/tokens.css` に無い値が必要なら、足さずにユーザーへ提案する
- 編集後の design-lint の error は必ず直す。検査器やトークンを書き換えて通すのは不可
- 完了前に `node tools/ui-shot.js <対象>` で描画し、スクリーンショットを Read で開いて確認する
- 見た目についてユーザーから指摘を受けたら `design/DECISIONS.md` に 1 行追記する
