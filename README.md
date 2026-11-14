# testapppapp

AI（Claude Code）に、ありきたりで見にくい UI ではなく**洗練された UI** を作らせるための仕組み。

- **調査・設計・検証のまとめ → [docs/ui-system.md](docs/ui-system.md)**
- サンプル画面 → `src/roast-plan/`（この仕組みの上で AI が作ったもの）
- 比較実験の生データ → `experiments/ab/`

## 30 秒で

| 層 | 中身 | 誰のもの |
|---|---|---|
| 基準 | `design/` — プロダクトの文脈、見た目の決めごと、トークン、画面ブリーフ、参考画像 | **人間** |
| 手順 | `.claude/skills/` — `ui-design`（計画→実装→描画→批評）、`ui-review`（第三者レビュー）、`design-init`（基準づくり） | AI が従う |
| 強制 | `.claude/hooks/ui-guard.js` — 編集のたびに lint、描画して画像を見るまで完了させない、基準ファイルの保護 | 仕組み |
| 検査 | `tools/design-lint.js`（静的）、`tools/ui-shot.js`（描画して計測） | 仕組み（CI でも実行） |

## 自分のプロダクトで使う

1. Claude Code で `/design-init` を実行し、質問に答える（`design/` のサンプルが置き換わる）
2. `design/references/` に手本・反面教師のスクリーンショットを数枚置く
3. 画面ごとに `design/briefs/_template.md` を 5 分で埋める
4. 「◯◯画面を作って」と頼む。出てきた画面への指摘は `design/DECISIONS.md` に蓄積される

## コマンド

```bash
node tools/design-lint.js            # 静的検査
node tools/design-lint.js --tokens   # トークンのコントラスト検査
node tools/ui-shot.js src/roast-plan/index.html   # 描画 + スクリーンショット + 監査
npm test                             # lint の回帰テスト
```

`ui-shot` は Playwright を使います（`npm i && npx playwright install chromium`）。
