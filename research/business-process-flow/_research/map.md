# map: business-process-flow

問い: 業務フローを整理（可視化・分析・改善）するには、どんな手順・記法・粒度で進め、出来上がったフロー図の良し悪しを何で判定すればよいか。その基準の元になった原典・研究はあるか
題: 業務フローの整理と品質基準
読み: ぎょうむ せいり ひんしつ きじゅん てじゅん きほう りゅうど げんてん けんきゅう
最初の検索語: seven process modeling guidelines / 業務フロー 書き方 ガイドライン 品質

## 調査の論点
- [x] この分野の知見はどこに集まっているか（媒体） — `mendling-2010-7pmg.txt` L141-144「mainly four streams of work」
- [x] 業務フローを整理する定番の手順 — `ishikawa-2026-bpr-handbook.txt` L489-507「業務フローの作成ステップ」、`ipa-2019-youken-guide.txt` L19719-19724「As-Is と To-Be の両面から」
- [~] 情報の集め方（文書・観察・インタビュー・ワークショップ）。依頼の条件「整理の方法」そのもの — `arxiv-2410.11915-manual-process-discovery.txt` L579-600, L863-903, L1057-1110（Dumas らの教科書本体は有料で未取得）
- [x] 粒度・階層をどう決めるか — `ishikawa-2026-bpr-handbook.txt` L512-516「作業単位」、`ipa-2019-youken-guide.txt` L19710「三階層…二階層目」、`asist-bpmn-government-granularity.txt` L158-160「レベル１」「レベル２」
- [x] 記法の選び方 — `ipa-2019-youken-guide.txt` L19795-19800、`asist-bpmn-government-granularity.txt` L144-147（WFA と BPMN）、`soumu-ea-documents.txt` L276-280（DMM/DFD/WFA）
- [x] フロー図の品質基準（依頼の条件「品質基準」そのもの）はどの程度実証されているか — `mendling-2010-7pmg.txt` L418-454（G1〜G7）、`becker-2000-guidelines-of-modeling.txt` L111-115（GoM の6原則）、`mendling-2007-what-makes-understandable.txt` L27-30
- [~] どの指針がどれくらい効くか（優先順位） — `mendling-2010-7pmg.txt` L806-807「G4 is considered」、L889-890「21 process modelers only」（根拠が小さいと著者自身が書く）
- [x] 表記・ラベルの基準 — `silver-bpmn-style-rules.md` L51, L53, L73、`kashika-flowchart-10tips.md` L141、`ipa-2019-youken-guide.txt` L19790
- [x] どこで失敗するか — `mendling-2010-7pmg.txt` L219-220「between 10% and 20%」、`ipa-2019-youken-guide.txt` L19763-19765「例外処理を漏れなく」
- [~] コツの元になった原典はあるか（スイムレーン・SIPOC・VSM・業務プロセスそのものの品質） — ISO のプロセスの定義は `dnv-iso9001-2015-guidance.txt` L260-261（転載の解説）、ログからのモデルの品質軸は `aalst-2011-process-mining-manifesto.txt` L1073-1074。スイムレーン（Rummler & Brache）・VSM（Rother & Shook）は有料の書籍、SIPOC は探した範囲で原典が無かった

## 用語
- 7PMG（Seven Process Modeling Guidelines・プロセスモデリングの7つの指針）— sources/mendling-2010-7pmg.txt
- GoM（Guidelines of Modeling・モデリングの指針）— sources/becker-2000-guidelines-of-modeling.txt
- SEQUAL（記号論に基づくモデル品質の枠組み）— sources/mendling-2010-7pmg.txt L146、sources/krogstie-2015-sequal-encyclopedia.txt
- Method and Style / style rules（BPMN の書き方の規則）— sources/silver-bpmn-style-rules.md
- process discovery（プロセスの発見・現状把握）— sources/arxiv-2410.11915-manual-process-discovery.txt
- As-Is / To-Be / Can-Be（現状・あるべき姿・改善後）— sources/ipa-2019-youken-guide.txt、sources/ishikawa-2026-bpr-handbook.txt L1411
- 業務フロー / システム化業務フロー（IPA の区別）— sources/ipa-2019-youken-guide.txt L19699, L19884
- WFA（業務流れ図・Work Flow Architecture）、DMM（機能構成図）、DFD（機能情報関連図）— sources/soumu-ea-documents.txt
- BPMN（ISO/IEC 19510）— sources/asist-bpmn-government-granularity.txt L145
- 内部統制の3点セット（業務フロー・業務記述書・リスクと統制の対応）— sources/asist-bpmn-government-granularity.txt L174-175
- fitness / simplicity / precision / generalization（ログから作ったモデルの品質の4軸）— sources/aalst-2011-process-mining-manifesto.txt
- SIPOC、スイムレーン、バリューストリームマップ（VSM）、関係図（relationship map）— https://goleansixsigma.com/6-process-maps-know-choose-right-one/（未確認・取得は403）

## 人
- Jan Mendling（Humboldt-Universität zu Berlin）— 7PMG、プロセスモデルの誤りと分かりやすさの研究
- Hajo A. Reijers（Eindhoven / Utrecht）— 7PMG、Fundamentals of BPM 共著
- Wil van der Aalst（Eindhoven → RWTH Aachen）— 7PMG、プロセスマイニング
- Jörg Becker・Michael Rosemann（Münster / QUT）— GoM
- John Krogstie（NTNU）— SEQUAL
- Bruce Silver（methodandstyle.com）— BPMN Method and Style
- Marlon Dumas・Marcello La Rosa（Tartu / Melbourne）— Fundamentals of BPM（未確認・有料で未取得）
- Geary Rummler・Alan Brache — Improving Performance（スイムレーン図の普及。未確認）
- Mike Rother・John Shook — Learning to See（VSM。未確認）
- 夏目哲也（総務省行政評価局）— 政府の BPM/BPMN 展開の資料

## 媒体
- BPM Conference（LNCS）・Information and Software Technology・Data & Knowledge Engineering — 7PMG と参考文献の掲載先
- IEEE Task Force on Process Mining — https://www.tf-pm.org/（未確認）
- Trisotech ブログ（Bruce Silver）— https://www.trisotech.com/bpmn-style-rules/
- IPA（情報処理推進機構）— https://www.ipa.go.jp/archive/digital/iot-en-ci/jyouryuu/youkenteigi20190912.html
- 総務省・ASIST（政府の EA / BPMN 資料）— https://www.soumu.go.jp/ 、https://www.asist.iir.isct.ac.jp/
- 自治体の BPR ハンドブック（石川県ほか）— https://www.pref.ishikawa.lg.jp/digital/documents/bpr_handbook2026.pdf
- 業務可視化の実務ブログ（kashika.biz ほか）— https://kashika.biz/
- ISO/TC 176/SC 2（ISO 9001 の解説パッケージ）— www.iso.org/tc176/sc02/public（未確認）

## 原文（sources/）
| 論文・資料 | ファイル | 元の URL | どこから来たか（周・動き） |
|---|---|---|---|
| 〔論文〕Mendling, Reijers, van der Aalst 2010「Seven Process Modeling Guidelines (7PMG)」 | mendling-2010-7pmg.pdf / .txt | https://www.vdaalst.com/publications/p574.pdf | 1周・言葉で引く |
| 〔論文〕Krogstie 2015「SEQUAL as a Framework…」（事典の項目。本文の大半がフォントの都合で読めない・短い資料） | krogstie-2015-sequal-encyclopedia.pdf / .txt | https://folk.idi.ntnu.no/krogstie/publications/2015/IGI-ENCYC-R/start-ref.pdf | 1周・言葉で引く |
| 〔公式〕IPA 2019「ユーザのための要件定義ガイド 第2版」7.5.3〜7.5.4 | ipa-2019-youken-guide.pdf / .txt | https://www.ipa.go.jp/archive/publish/qv6pgp0000000wrt-att/000079352.pdf | 1周・言葉で引く |
| 〔公式〕石川県 2026「BPR 推進ハンドブック」 | ishikawa-2026-bpr-handbook.pdf / .txt | https://www.pref.ishikawa.lg.jp/digital/documents/bpr_handbook2026.pdf | 1周・言葉で引く |
| 〔公式〕総務省 講義資料「住民視点の行政サービス提供に向けた業務分析手法」（EA の DMM/DFD/WFA） | soumu-natsume-bpmn-government.pdf / .txt | https://www.soumu.go.jp/main_content/000567417.pdf | 1周・言葉で引く |
| 〔本人〕Silver「BPMN Style Rules」宣伝あり | silver-bpmn-style-rules.md | https://www.trisotech.com/bpmn-style-rules/ | 1周・言葉で引く |
| 〔論文〕Becker, Rosemann, von Uthmann 2000「Guidelines of Business Process Modeling」 | becker-2000-guidelines-of-modeling.pdf / .txt | https://typeset.io/pdf/guidelines-of-business-process-modeling-1qhnb2mp7t.pdf | 2周・後ろへ（7PMG の文献 [10]） |
| 〔論文〕Mendling, Reijers, Cardoso 2007「What Makes Process Models Understandable?」測定あり | mendling-2007-what-makes-understandable.pdf / .txt | https://typeset.io/pdf/what-makes-process-models-understandable-3wrypaqocc.pdf | 2周・後ろへ（7PMG の文献 [31]） |
| 〔公式〕夏目（総務省）「中央政府及び自治体における BPM/BPMN の展開動向」 | asist-bpmn-government-granularity.pdf / .txt | https://www.asist.iir.isct.ac.jp/wp-content/uploads/2025/04/330c85f8e12bd9fa3c053a10a5626889.pdf | 2周・言葉で引き直す（WFA） |
| 〔公式〕「政府における BPM の導入・活用に向けて」（WFA と BPMN の記号の比較） | asist-wfa-bpmn-comparison.pdf / .txt | https://www.asist.iir.isct.ac.jp/wp-content/uploads/2025/04/d11ecc0c1cf4595212b1f8ad1cdfd563.pdf | 2周・言葉で引き直す（WFA） |
| 〔公式〕総務省 講義資料 科目 4-1（EA ドキュメントの作成方法） | soumu-ea-documents.pdf / .txt | https://www.soumu.go.jp/main_content/000221270.pdf | 2周・言葉で引き直す（WFA） |
| 〔論文〕arXiv 2410.11915「Guideline for Manual Process Discovery in Industrial IoT」 | arxiv-2410.11915-manual-process-discovery.pdf / .txt | https://arxiv.org/pdf/2410.11915 | 2周・言葉で引く（Dumas の教科書の代わりに、それを引く論文） |
| 〔論文〕van der Aalst ほか 2011「Process Mining Manifesto」 | aalst-2011-process-mining-manifesto.pdf / .txt | https://www.vdaalst.com/publications/p658.pdf | 3周・著者で追う（van der Aalst） |
| 〔まとめ〕DNV「ISO 9001:2015 Guidance Document」 | dnv-iso9001-2015-guidance.pdf / .txt | https://www.dnv.it/siteassets/images/pdf-documents/iso-9001-2015-guidance-document-eng.pdf | 3周・言葉で引く |
| 〔公式〕金融庁 2007「財務報告に係る内部統制の整備」（概要・短い資料） | fsa-2007-jsox-implementation-standard.pdf / .txt | https://www.fsa.go.jp/singi/singi_kigyou/siryou/soukai/20070215/01-2.pdf | 3周・言葉で引く |
| 〔まとめ〕kashika.biz「作業図形の粒度を揃える2つの軸」宣伝あり | kashika-particle-size.md | https://kashika.biz/particle-size/ | 3周・言葉で引く |
| 〔まとめ〕kashika.biz「わかりやすい図にする10のコツ」宣伝あり | kashika-flowchart-10tips.md | https://kashika.biz/flowchart-2.html | 3周・言葉で引く |
| 〔まとめ〕kashika.biz「業務フローの作り方」宣伝あり | kashika-gyomu-flow-tsukurikata.md | https://kashika.biz/gyomu-flow-tsukurikata/ | 3周・言葉で引く |

## 次の手がかり
- Mendling, Neumann, van der Aalst 2007「Understanding the occurrence of errors in process models based on metrics」— 7PMG の誤り率（50要素で50%）の元の研究
- Mendling, Reijers, Recker 2010「Activity labeling in process modeling」— G6（動詞＋目的語）の元の研究
- 7PMG を前へ（被引用）— OpenAlex が 429 で止まった。後で `chain.py cites 10.1016/j.infsof.2009.08.004`
- Moody 2009「The Physics of Notations」— 図の記法そのものの見やすさの理論（Krogstie の参考文献から）
- Dumas ら『Fundamentals of BPM』第2版 5章（有料）
- Rummler & Brache『Improving Performance』、Rother & Shook『Learning to See』（有料）
- 金融庁 実施基準の本文（業務の流れ図（例）等）— 企業会計審議会の総会資料のページを直接当たる
- ISO/TC 176/SC 2 N1289 の公式版
- Bundesverwaltungsamt 2013「Leitfaden zur Erhebung von Geschäftsprozessen」（ドイツ連邦行政庁の業務プロセス聞き取りの指針。arXiv 2410.11915 が引用）
