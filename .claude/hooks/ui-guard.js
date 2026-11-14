#!/usr/bin/env node
/*
 * ui-guard — UI 品質を「お願い」ではなく「仕組み」で守るフック。
 * .claude/settings.json から 5 つのモードで呼ばれる。
 *
 *   session-start  SessionStart                  セッション開始時点の UI ファイルを基準として記録
 *   protect        PreToolUse(Edit|Write|Bash)   人間が所有するファイル（トークン・検査器など）の変更に確認を挟む
 *   post-tool      PostToolUse(Edit|Write|Bash)  中身が変わった UI ファイルに design-lint を掛けて即フィードバック
 *   post-read      PostToolUse(Read)             スクリーンショットを実際に開いたかを記録
 *   stop           Stop                          「描画して・見て・監査を通す」まで完了させない
 *
 * 変更の検出はファイル内容のハッシュで行う（tools/ui-state.js）。
 * Edit/Write だけを監視すると Bash 経由の書き込みを取りこぼす — 実際の検証で起きた。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const lint = require(path.join(ROOT, 'tools', 'design-lint.js'));
const ui = require(path.join(ROOT, 'tools', 'ui-state.js'));

const PROTECTED = ['design/tokens.css', 'design/DESIGN.md', 'design/PRODUCT.md', 'design/design.config.json', 'tools/design-lint.js', 'tools/ui-shot.js', 'tools/ui-state.js', '.claude/hooks/', '.claude/settings.json'];
const PROTECT_REASON = 'は人間が所有するデザインの基準（または検査器）です。変更内容と理由をユーザーが確認してください。lint や監査を通すためにここを書き換えるのは不可。';

function readInput() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}
function out(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

/* このセッションの状態を返す。別セッションの残骸なら、現状を基準にして作り直す */
function session(input) {
  let state = ui.read();
  if (!input.session_id) return state;
  if (state.session !== input.session_id) {
    const snap = ui.snapshot();
    state = { session: input.session_id, baseline: snap, seen: snap };
    ui.write(state);
  }
  return state;
}

const mode = process.argv[2];
const input = readInput();
const tool = input.tool_input || {};
const relPath = tool.file_path ? lint.rel(tool.file_path) : '';

if (mode === 'session-start') {
  session(input);
  process.exit(0);
}

if (mode === 'protect') {
  session(input); // 最初のツール実行より前に基準を確定させる（SessionStart が無い環境の保険）
  let hit = '';
  if (relPath) hit = PROTECTED.find((p) => (p.endsWith('/') ? relPath.startsWith(p) : relPath === p)) ? relPath : '';
  // Bash での書き換えも拾う: 保護ファイルが「書き込み先」になっているときだけ。
  // heredoc の本文は除いて判定する（HTML 中の <link href="…/design/tokens.css"> などに反応しないため — 実際の検証で誤検知した）。
  // 完全ではない。事故防止が目的で、敵対的な回避までは防がない。
  if (!hit && typeof tool.command === 'string') {
    const cmd = tool.command.replace(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[\s\S]*?\n\s*\2[ \t]*(?=\n|$)/g, ' ');
    const esc = (x) => x.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    hit =
      PROTECTED.find((p) => {
        const P = `["']?(?:\\./)?${esc(p)}`;
        return [
          `>>?\\s*${P}`, // リダイレクト
          `\\btee\\b[^|;&\\n]*\\s${P}`,
          `\\b(?:sed|perl)\\b[^|;&\\n]*\\s-[a-zA-Z]*i[^|;&\\n]*\\s${P}`, // その場編集
          `\\b(?:rm|truncate)\\b[^|;&\\n]*\\s${P}`,
          `\\b(?:mv|cp)\\b[^|;&\\n]*\\s${P}[^\\s|;&]*["']?\\s*(?:$|[|;&\\n])`, // コピー/移動の「先」
        ].some((re) => new RegExp(re).test(cmd));
      }) || '';
  }
  if (hit) out({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: `${hit} ${PROTECT_REASON}` } });
  process.exit(0);
}

if (mode === 'post-tool') {
  const state = session(input);
  const snap = ui.snapshot();
  const touched = ui.changed(state.seen, snap);
  state.seen = snap;
  ui.write(state);
  if (!touched.length) process.exit(0);

  const result = lint.lintFiles(touched.map((f) => path.join(ROOT, f)));
  const errors = result.findings.filter((f) => f.severity === 'error');
  const warns = result.findings.filter((f) => f.severity === 'warn');
  const fmt = (list) => list.slice(0, 15).map((f) => `${f.file}:${f.line}  ${f.rule}  ${f.excerpt}\n    → ${f.help}`).join('\n') + (list.length > 15 ? `\n…他 ${list.length - 15} 件` : '');
  if (errors.length) {
    // exit 2: stderr がそのまま Claude に渡る（ツールは実行済みなので、止めるのではなく直させる）
    process.stderr.write(`design-lint: ${errors.length} errors${warns.length ? `, ${warns.length} warnings` : ''} — 完了扱いにする前に直すこと。\n${fmt(errors)}${warns.length ? '\n-- warnings --\n' + fmt(warns) : ''}\n（正当な例外は直前の行に「design-lint-disable-next-line <rule> -- 理由」）`);
    process.exit(2);
  }
  if (warns.length) out({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: `design-lint: ${warns.length} warnings（意図的でなければ直す）\n${fmt(warns)}` } });
  process.exit(0);
}

if (mode === 'post-read') {
  if (!/^\.ui-review\/shots\/.+\.png$/.test(relPath)) process.exit(0);
  const state = ui.read();
  if (!state.shot) process.exit(0);
  state.shot.viewed = [...new Set([...(state.shot.viewed || []), relPath])];
  ui.write(state);
  process.exit(0);
}

if (mode === 'stop') {
  const state = ui.read();
  if (!state.session || state.session !== input.session_id) process.exit(0); // 別セッションの残骸では止めない
  const block = (reason) => out({ decision: 'block', reason: 'UI 完了ゲート: ' + reason });

  const snap = ui.snapshot();
  const touched = ui.changed(state.baseline, snap); // このセッション中に中身が変わった UI ファイル
  if (!touched.length) process.exit(0);

  // 1. 静的検査
  const errors = lint.lintFiles(touched.map((f) => path.join(ROOT, f))).findings.filter((f) => f.severity === 'error');
  if (errors.length) block(`design-lint の error が ${errors.length} 件残っています。\n` + errors.slice(0, 10).map((f) => `${f.file}:${f.line}  ${f.rule}  → ${f.help}`).join('\n'));

  // 描画できない事情が記録済みで、その後変更が無ければ通す
  if (state.skip && !ui.changed(state.skip.hashes, snap).length) process.exit(0);

  // 2. 最後の変更のあとに描画したか
  const stale = touched.filter((f) => !state.shot || state.shot.hashes[f] !== snap[f]);
  if (stale.length) {
    block(
      `${state.shot ? '最後の描画確認のあとに' : 'このセッションで'} UI ファイルが変更されていますが、その状態をまだ描画して見ていません（${stale.slice(0, 5).join(', ')}）。\n` +
        'コードを読んだだけでは見た目は分かりません。`node tools/ui-shot.js <画面の html か URL>` を実行し、出力された全スクリーンショットを Read で開いて批評してください。\n' +
        '描画できない事情があるなら `node tools/ui-shot.js --skip "<理由>"` で記録し、最終報告に明記すること。',
    );
  }

  // 3. 撮った画像を実際に開いたか
  const unseen = (state.shot.shots || []).filter((s) => !(state.shot.viewed || []).includes(s));
  if (unseen.length) block(`撮ったスクリーンショットをまだ見ていません。Read で開いて確認してください:\n${unseen.join('\n')}\n確認後、.claude/skills/ui-design/references/critique.md の観点で問題があれば直して再撮影。`);

  // 4. 描画監査
  if (state.shot.audit && state.shot.audit.errors > 0 && !state.ack) {
    block(
      `描画監査に error が ${state.shot.audit.errors} 件あります（.ui-review/report.json）。直して \`node tools/ui-shot.js\` を再実行してください。\n` +
        '誤検知・意図的な例外なら `node tools/ui-shot.js --ack "<理由>"` で記録し、最終報告でユーザーに伝えること。',
    );
  }
  process.exit(0);
}

process.exit(0);
