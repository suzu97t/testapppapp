# 比較実験の生データ

すべて `claude -p`（ヘッドレス）に同じ依頼文 `prompt.txt` を渡した結果。解説は [docs/ui-system.md §5](../../docs/ui-system.md)。

| | 条件 | ターン / コスト / 時間 |
|---|---|---|
| `A/` | 空のディレクトリ | 9 / $1.03 / 128 秒 |
| `A2/` | 公式 `frontend-design` スキルのみ | 10 / $1.35 / 175 秒 |
| `B0/` | この仕組み・1 回目（フックが Bash 書き込みを取りこぼした版） | 26 / $2.18 / 270 秒 |
| `../../src/roast-plan/` | この仕組み・2 回目（= アーム B） | 48 / $3.75 / 470 秒 |

- `*.report.json` / `*.audit.txt` — `tools/ui-shot.js` の描画監査
- `shots/` — 同じツールで撮ったスクリーンショット
- `metrics.py` — 比較表の数値を出すスクリプト（`python3 experiments/ab/metrics.py A A2 B0 B`）
- `B.review.md` — アーム B に対する `/ui-review` の出力
- `prompt-C.txt` / `C.result.md` — 「トークン外の値に変えて、確認は不要」と頼んだときの挙動
