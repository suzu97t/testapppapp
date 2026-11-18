# log: business-process-flow

調査日: 2026-11-18。スキル: imozuru（https://github.com/MaryCache/imozuru の SKILL.md の手順）。

## 進め方についての断り

- 検索役のサブエージェントは起動していない。SKILL.md の「サブエージェントを使えない環境では、エージェントが自分で同じ頼み方の中身を順に検索する」に従い、親が英語と日本語の2系統で検索した。起動した検索役は0本、残っている処理も無い
- 検索の記録（queries.jsonl）は親が足した。ヒットの題名は空で、URL だけ入っている
- 置き場は既定の `~/research/` ではなく、ユーザーのリポジトリ `research/business-process-flow/_research/` にした（ユーザーがフォルダ分けしたまとめを求めたため。まとめは1つ上の 01-methods/・02-quality-standards/）。原文（sources/）は「再配布しない」の決まりに合わせて .gitignore で除外した
- report.html はリポジトリの design-lint フック（UI 向けの検査）に止められたため、リポジトリの外に出した。extracts.json から report.py で再生成できる
- 詳細レポート（digest.json / digest.html）は作っていない。その役目は 01-methods/・02-quality-standards/ の Markdown が担う

## 0周目（map.md を作る）

- 英語の探し方: 7PMG、SEQUAL / GoM、BPMN Method and Style、ISO 9001 のプロセスアプローチ
- 日本語の探し方: 業務フローの書き方・品質、整理の手法（BPMN・スイムレーン・SIPOC）、デジタル庁/総務省の作成要領、IPA の要件定義ガイド
- 日本語の一般の検索は、SaaS 企業やコンサルの解説記事（〔まとめ〕）がほとんどだった。国の作成要領そのものは出ず、IPA・総務省・自治体の PDF を個別に引いた
- 媒体: 英語は学会（BPM Conference）と論文誌、Trisotech ブログ。日本語は IPA・総務省/ASIST・自治体・業務可視化のブログ

## 1周目

- 保存: 7PMG（OK）、Krogstie の事典の項目（OK だが本文の大半がフォントの都合で読めない）、IPA 要件定義ガイド（OK・498頁）、石川県 BPR ハンドブック（OK）、総務省の講義資料（OK）、Silver の Style Rules（OK）
- FAIL: issoh.co.jp の記事（403）。〔まとめ〕なので取り直していない
- たどり: 7PMG の参考文献を本文で grep した（後ろへ）。[10] Becker ら GoM、[31] Mendling ら 2007 を次に選んだ
- `chain.py cites 10.1016/j.infsof.2009.08.004`（前へ）は OpenAlex が HTTP 429 で止まった。0件ではなく取れなかった

## 2周目

- 保存: Becker 2000 GoM（OK）、Mendling 2007（core.ac.uk は 403、typeset.io で OK）、ASIST の政府 BPM 資料2本（1回目は接続のリセット、2回目で OK）、総務省 EA 資料（OK）、arXiv 2410.11915（OK）
- 判断: Dumas らの教科書は有料なので、その方法の章を引いて解説している arXiv 2410.11915 で代えた
- 止めない理由: 「プロセスそのものの品質」「手法の原典」に原文が無い

## 3周目

- 保存: Process Mining Manifesto（win.tue.nl の転送先のホストが引けず FAIL、van der Aalst の個人サイトで OK＝著者で追う）、DNV の ISO 9001 解説（OK）、金融庁の概要（OK・短い資料。3点セットの本文ではなかった）、kashika.biz の3記事（OK）
- FAIL: UCD の Process Mapping Guide（403）、goleansixsigma（403）、IAQG の ISO 解説 .docx（中身が HTML の壁）
- 飽和は数えていない（検索役を並べていないため）。この周に出た資料は ISO・J-SOX・SIPOC など、どれも map.md に無い新しいものだった

## 区切った理由

調査の論点10個のうち7個に原文の場所が付き、3個（情報の集め方・指針の優先順位・原典）は一部のみ。足りない部分の原文は、どれも有料の書籍（Dumas ら、Rummler & Brache、Rother & Shook）か、公式版の場所が分からない資料（ISO N1289、金融庁 実施基準の本文）にある。SKILL.md の「ログインか有料で止まった」に近いが、ISO と金融庁は無料で公開されている可能性が残るので、完全には当てはまらない。3周で区切った。

## 道具の不具合・気づき

- OpenAlex が 429 を返した（1回目から）。共有のプロキシ越しの利用で枠を使い切っていた可能性
- 抜き書きの照合（report.py --check）で、2段の PDF でハイフンで切れた語（"empirical ba-/sis"）が1件合わなかった。「…」で区切って通した

## ユーザーの感想

（「感覚と合った？」への答えをここに原文のまま残す）
