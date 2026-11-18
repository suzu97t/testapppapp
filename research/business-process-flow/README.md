# 業務フローの整理方法と品質基準

imozuru（原文まで芋づる式にたどる調査スキル）の手順で、2026-11-18 に調べたまとめ。
論文・公的機関の指針・実務者の記事、計18本の原文に当たり、引用は機械で照合済み（抜き書き47件）。

## 結論（先に読む）

1. **整理は「目的 → 範囲 → 集める → 描く → 確かめる」の順。完璧な図は目的ではない。**
   As-Is（現状）は問題を見つけるため、To-Be（あるべき姿）は改革の内容に合意するために描く。目的が違うので、描き方も変える（IPA、石川県）。
2. **粒度は目的で決め、1枚の中ではそろえる。** 改善（BPR）用なら「誰が・何を・どうする」の作業単位。要件定義用なら3階層のうち2階層目を中心に描く。改善用とシステム化用で、レベルを分けて描く（石川県、IPA、政府の BPMN 資料）。
3. **図の品質には、実証された基準がある。** 7PMG（Mendling ら 2010）は、誤りやすさと分かりやすさの研究から7つの指針を作った。要素は少なく、開始と終了は1つずつ、分岐は対にして閉じる、OR を避ける、作業名は「動詞＋目的語」、50要素を超えたら分割する。どれが一番効くかの順位は21人の評価しかなく、根拠は弱い。
4. **一番の失敗は、例外の漏れと、理想を現状として描いてしまうこと。** 実際の案件でのモデルの誤り率は10〜20%（Mendling ら）。IPA は、例外処理を漏れなく洗い出すことの精度が、その後のシステム開発の品質を大きく左右すると書いている。
5. **図だけで終わらせない。** 政府の資料は、内部統制の3点セット（業務フロー・業務記述書・リスクと統制の対応表）に準じて、記述書と課題の管理表を添えることを勧めている。

## フォルダ構成

| フォルダ | 中身 |
|---|---|
| [01-methods/](01-methods/) | **整理の方法** |
| ├ [01-process-overview.md](01-methods/01-process-overview.md) | 進め方の全体像（ステップと各ステップで作るもの） |
| ├ [02-discovery.md](01-methods/02-discovery.md) | 情報の集め方（文書・観察・インタビュー・ワークショップ） |
| ├ [03-granularity-levels.md](01-methods/03-granularity-levels.md) | 粒度と階層の決め方 |
| └ [04-notations.md](01-methods/04-notations.md) | 記法の選び方（フローチャート・スイムレーン・BPMN・WFA ほか） |
| [02-quality-standards/](02-quality-standards/) | **品質基準** |
| ├ [01-frameworks.md](02-quality-standards/01-frameworks.md) | 品質の枠組み（SEQUAL・GoM・7PMG）と、どこまで実証されているか |
| ├ [02-labeling-style.md](02-quality-standards/02-labeling-style.md) | 表記・ラベルの規則 |
| ├ [03-pitfalls.md](02-quality-standards/03-pitfalls.md) | よくある失敗と、その防ぎ方 |
| ├ [04-process-quality.md](02-quality-standards/04-process-quality.md) | 図ではなく業務プロセスそのものの品質（ISO 9001、プロセスマイニング、3点セット） |
| └ [05-review-checklist.md](02-quality-standards/05-review-checklist.md) | **レビュー用チェックリスト**（上の全部を1枚に集約） |
| [_research/](_research/) | 調査の記録（map.md・log.md・抜き書き・検索/取得ログ）。原文（sources/）は再配布しないため Git には含めない |

## 書き方の約束

- 各項目の末尾の `〔出典〕` は、下の原文一覧の略称と行番号（`_research/sources/` の .txt / .md の行）。
- **（整理者）** と付けたものは、原文に無く、このまとめを書いたときの判断。
- 原文の種類: 〔論文〕査読・会議を通ったもの／〔公式〕公的機関・標準化団体／〔本人〕実践者本人の記述／〔まとめ〕他者の知見をまとめた記事。

## 原文一覧

| 略称 | 種類 | 資料 | URL |
|---|---|---|---|
| 7PMG | 〔論文〕 | Mendling, Reijers, van der Aalst (2010) Seven Process Modeling Guidelines (7PMG). *Information and Software Technology* 52(2) | https://www.vdaalst.com/publications/p574.pdf |
| Mendling2007 | 〔論文〕 | Mendling, Reijers, Cardoso (2007) What Makes Process Models Understandable? BPM 2007 | https://typeset.io/pdf/what-makes-process-models-understandable-3wrypaqocc.pdf |
| GoM | 〔論文〕 | Becker, Rosemann, von Uthmann (2000) Guidelines of Business Process Modeling. LNCS 1806 | https://typeset.io/pdf/guidelines-of-business-process-modeling-1qhnb2mp7t.pdf |
| SEQUAL | 〔論文〕 | Krogstie (2015) SEQUAL as a Framework for Understanding and Assessing Quality of Models（事典の項目・本文は一部しか読めない） | https://folk.idi.ntnu.no/krogstie/publications/2015/IGI-ENCYC-R/start-ref.pdf |
| Manifesto | 〔論文〕 | van der Aalst ほか (2011) Process Mining Manifesto | https://www.vdaalst.com/publications/p658.pdf |
| Discovery | 〔論文〕 | arXiv 2410.11915 Guideline for Manual Process Discovery in Industrial IoT（Dumas らの教科書の方法を整理して引用） | https://arxiv.org/pdf/2410.11915 |
| Silver | 〔本人〕 | Bruce Silver, BPMN Style Rules（Trisotech ブログ・宣伝あり） | https://www.trisotech.com/bpmn-style-rules/ |
| IPA | 〔公式〕 | IPA (2019) ユーザのための要件定義ガイド 第2版 7.5.3〜7.5.4 | https://www.ipa.go.jp/archive/publish/qv6pgp0000000wrt-att/000079352.pdf |
| 石川県 | 〔公式〕 | 石川県 (2026) BPR 推進ハンドブック | https://www.pref.ishikawa.lg.jp/digital/documents/bpr_handbook2026.pdf |
| 政府BPMN | 〔公式〕 | 夏目（総務省）中央政府及び自治体における BPM/BPMN の展開動向 | https://www.asist.iir.isct.ac.jp/wp-content/uploads/2025/04/330c85f8e12bd9fa3c053a10a5626889.pdf |
| 政府WFA比較 | 〔公式〕 | 政府における BPM の導入・活用に向けて | https://www.asist.iir.isct.ac.jp/wp-content/uploads/2025/04/d11ecc0c1cf4595212b1f8ad1cdfd563.pdf |
| 総務省EA | 〔公式〕 | 総務省 講義資料 科目4-1（EA の DMM・DFD・WFA） | https://www.soumu.go.jp/main_content/000221270.pdf |
| 総務省BPMN | 〔公式〕 | 総務省 講義資料（住民視点の業務分析手法） | https://www.soumu.go.jp/main_content/000567417.pdf |
| ISO解説 | 〔まとめ〕 | DNV, ISO 9001:2015 Guidance Document | https://www.dnv.it/siteassets/images/pdf-documents/iso-9001-2015-guidance-document-eng.pdf |
| 金融庁 | 〔公式〕 | 金融庁 (2007) 財務報告に係る内部統制の整備（概要） | https://www.fsa.go.jp/singi/singi_kigyou/siryou/soukai/20070215/01-2.pdf |
| kashika粒度 / kashika10 / kashika作り方 | 〔まとめ〕 | kashika.biz の業務可視化の記事3本（宣伝あり） | https://kashika.biz/particle-size/ ・ https://kashika.biz/flowchart-2.html ・ https://kashika.biz/gyomu-flow-tsukurikata/ |

## 届かなかったもの（有料・未確認）

- Dumas, La Rosa, Mendling, Reijers『Fundamentals of Business Process Management』— 情報の集め方の章の本体（有料）
- Rummler & Brache『Improving Performance』— スイムレーン図の普及元とされる本（有料）
- Rother & Shook『Learning to See』— バリューストリームマップの原典（有料）
- SIPOC の由来 — 探した範囲では、出典の付いた原典が無かった
- ISO/TC 176/SC 2 N1289（ISO 9001:2015 のプロセスアプローチの公式解説）の公式版、金融庁「実施基準」の本文（業務の流れ図の例）
- OMG BPMN 2.0.2 仕様書（ISO/IEC 19510）— 大部のため今回は取得していない

調べた経過と判断は [_research/log.md](_research/log.md)、用語・人・媒体の一覧は [_research/map.md](_research/map.md)。

## 原文と抜き書きのページを手元で再現する

原文の写し（約29MB）は再配布しない決まりなので Git に入れていない。取り直すには [imozuru](https://github.com/MaryCache/imozuru) を clone し、`_research/fetch-log.jsonl` の URL を `scripts/fetch.py _research/sources <name> <url>` で取得する。そのあと次のコマンドで、論点ごとの抜き書き（原文と機械照合済み・47件）のページ `_research/report.html` ができる。

```
python3 <imozuru>/skills/imozuru/scripts/report.py research/business-process-flow/_research
```

PDF からの文字起こしは pdftotext のバージョンで行番号がずれることがある。そのときは各出典の引用文で検索する。
