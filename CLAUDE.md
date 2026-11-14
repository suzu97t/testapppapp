# testapppapp

洗練された UI を AI に作らせるための仕組み（基準・スキル・フック・検査器）と、その検証。
全体像と検証結果は `docs/ui-system.md`。

## UI を作る・直すとき

- `ui-design` スキルの手順に従う（基準を読む → 計画 → 実装 → 描画して見る → 批評 → 修正）
- デザインの基準は `design/` にある。**値は `design/tokens.css` のみ**、理由は `design/DESIGN.md`
- `design/`（tokens / DESIGN / PRODUCT）と `tools/`・`.claude/hooks/` は人間の所有物。変更は提案して承認を得る
- UI ソースは `src/<画面名>/` に置く。スタイルは `design/tokens.css` を読み込んで使う

## コマンド

- `node tools/design-lint.js [path]` — 静的検査（トークン外の値、生成 UI の癖、a11y の基本）
- `node tools/design-lint.js --tokens` — トークン同士のコントラスト検査
- `node tools/ui-shot.js <html|URL>` — 描画してスクリーンショット + 描画監査（`.ui-review/`）

## スキル

- `/design-init` — 基準をインタビューで作る/作り直す（人間が起動）
- `/ui-review <対象>` — 別コンテキストでの第三者レビュー
