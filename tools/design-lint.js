#!/usr/bin/env node
/*
 * design-lint — UI ソースの「機械的に判定できる」デザイン違反を検出する。
 *
 *   node tools/design-lint.js [paths...]     指定ファイル/ディレクトリ（省略時はリポジトリ全体）
 *   node tools/design-lint.js --tokens       トークン定義そのもののコントラスト検査
 *   --json                                   機械可読出力
 *
 * 終了コード: 0 = error なし / 1 = error あり
 *
 * 抑制:  design-lint-disable-next-line <rule> -- <理由>   （理由は必須）
 *        design-lint-disable-line <rule> -- <理由>
 *
 * 依存ゼロ。フック（.claude/hooks/ui-guard.js）と CI から同じものを呼ぶ。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG = loadConfig();

function loadConfig() {
  const defaults = {
    tokensFile: 'design/tokens.css',
    uiExtensions: ['.css', '.scss', '.html', '.jsx', '.tsx', '.vue', '.svelte', '.astro'],
    ignore: ['node_modules', '.git', 'dist', 'build', 'out', '.next', 'coverage', 'experiments', '.ui-review', 'design/references', 'tools/test/fixtures'],
  };
  try {
    return Object.assign(defaults, JSON.parse(fs.readFileSync(path.join(ROOT, 'design/design.config.json'), 'utf8')));
  } catch {
    return defaults;
  }
}

function rel(p) {
  return path.relative(ROOT, path.resolve(p)).split(path.sep).join('/');
}

let includeIgnored = false; // --include-ignored: experiments/ など除外対象も検査する（比較実験用）

function isIgnored(file) {
  const r = rel(file);
  if (includeIgnored) return /(^|\/)(node_modules|\.git)(\/|$)/.test(r);
  if (r.startsWith('..')) return true;
  return CONFIG.ignore.some((ig) => r === ig || r.startsWith(ig + '/') || r.includes('/' + ig + '/'));
}

function isUiFile(file) {
  return CONFIG.uiExtensions.includes(path.extname(file).toLowerCase()) && !isIgnored(file);
}

function isTokensFile(file) {
  return rel(file) === CONFIG.tokensFile;
}

function walk(target, out = []) {
  let st;
  try {
    st = fs.statSync(target);
  } catch {
    return out;
  }
  if (isIgnored(target) && rel(target) !== '') return out;
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(target)) walk(path.join(target, e), out);
  } else if (isUiFile(target)) {
    out.push(target);
  }
  return out;
}

/* ---------- tokens ---------- */

function readTokens() {
  let text = '';
  try {
    text = fs.readFileSync(path.join(ROOT, CONFIG.tokensFile), 'utf8');
  } catch {
    return { names: new Set(), light: {}, dark: {}, exists: false };
  }
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const names = new Set();
  const light = {};
  const dark = {};
  // ダーク用ブロック（prefers-color-scheme: dark / [data-theme="dark"]）を切り出す
  const darkBlocks = [];
  const darkRe = /(@media[^{]*prefers-color-scheme:\s*dark[^{]*\{)|(\[data-theme=["']?dark["']?\][^{]*\{)/g;
  let m;
  while ((m = darkRe.exec(clean))) {
    let depth = 1;
    let i = darkRe.lastIndex;
    while (i < clean.length && depth > 0) {
      if (clean[i] === '{') depth++;
      else if (clean[i] === '}') depth--;
      i++;
    }
    darkBlocks.push([m.index, i]);
  }
  const declRe = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  while ((m = declRe.exec(clean))) {
    names.add(m[1]);
    const inDark = darkBlocks.some(([s, e]) => m.index >= s && m.index < e);
    (inDark ? dark : light)[m[1]] = m[2].trim();
  }
  return { names, light, dark, exists: true };
}

/* ---------- rules ---------- */

const SIZED_PROPS =
  /^(font-size|margin(-(top|right|bottom|left|block|inline)(-(start|end))?)?|padding(-(top|right|bottom|left|block|inline)(-(start|end))?)?|gap|row-gap|column-gap|border-radius|border-(top|bottom)-(left|right)-radius)$/;
const NAMED_COLORS =
  /^(white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|silver|navy|teal|aqua|lime|maroon|olive|fuchsia|indigo|violet|crimson|gold|beige|ivory|tomato|coral|salmon|orchid|plum|tan|khaki|lavender|magenta|cyan|brown|whitesmoke|gainsboro|lightgray|lightgrey|darkgray|darkgrey|dimgray|slategray|royalblue|dodgerblue|skyblue|steelblue|rebeccapurple)$/i;
const COLOR_PROPS = /^(color|background|background-color|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|fill|stroke|box-shadow|text-decoration(-color)?|caret-color|accent-color)$/;

const RULES = {
  'raw-color': 'error',
  'raw-font-family': 'error',
  'raw-size': 'error',
  'raw-shadow': 'error',
  'unknown-token': 'error',
  'tw-arbitrary': 'error',
  'gradient-text': 'error',
  'outline-none': 'error',
  'img-alt': 'error',
  'click-on-div': 'error',
  'raw-duration': 'warn',
  'transition-all': 'warn',
  important: 'warn',
  'inline-style': 'warn',
  'emoji-icon': 'warn',
  'side-stripe': 'warn',
  glass: 'warn',
  'placeholder-copy': 'warn',
  'suppression-without-reason': 'error',
};

const HELP = {
  'raw-color': '色は design/tokens.css の var(--color-*) を使う。必要な色が無いなら勝手に足さず、ユーザーにトークン追加を提案する。',
  'raw-font-family': 'font-family は var(--font-*) のみ。',
  'raw-size': '文字サイズ・余白・角丸は var(--text-*) / var(--space-*) / var(--radius-*) のスケールから選ぶ。',
  'raw-shadow': '影は var(--shadow-*) のみ（無ければ影を使わない設計にする）。',
  'unknown-token': 'tokens.css に存在しないトークン。名前を推測せず design/tokens.css を読む。',
  'tw-arbitrary': 'Tailwind の任意値 [..] は禁止。テーマに載っているスケールを使う。',
  'gradient-text': 'グラデーション文字は使わない（可読性が落ち、典型的な生成 UI の癖）。',
  'outline-none': 'outline を消すなら同じファイルで :focus-visible の代替表示を必ず定義する。',
  'img-alt': '<img> には alt を付ける（装飾なら alt=""）。',
  'click-on-div': 'クリックできる要素は <button> / <a> を使う。',
  'raw-duration': 'アニメーション時間は var(--duration-*) を使う。',
  'transition-all': 'transition: all は使わず、変化させるプロパティを明示する。',
  important: '!important は詳細度の設計ミスの兆候。セレクタ側を直す。',
  'inline-style': 'インライン style は避ける（データ由来の CSS 変数代入 style="--x: …" のみ可）。',
  'emoji-icon': '絵文字をアイコン代わりに使わない。SVG アイコンかテキストにする。',
  'side-stripe': '左端だけ太い色帯のカードは生成 UI の定番の癖。状態は文字・アイコン・配置で伝える。',
  glass: 'backdrop-filter のすりガラスは意図がある場合のみ（DESIGN.md に根拠があるか確認）。',
  'placeholder-copy': 'ダミー文言を残さない。実際の内容に即した文言を書く。',
  'suppression-without-reason': '抑制コメントには「-- 理由」が必須。',
};

function lintText(file, text, tokens) {
  const findings = [];
  const ext = path.extname(file).toLowerCase();
  const isCss = ext === '.css' || ext === '.scss';
  const isMarkup = !isCss;
  const lines = text.split(/\r?\n/);
  const localVars = new Set();
  for (const m of text.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) localVars.add(m[1]);
  const hasFocusVisible = /:focus-visible|focus-visible:/.test(text);
  let suppressed = 0;

  const add = (rule, line, col, excerpt, extra) => {
    // 抑制コメント
    const cur = lines[line - 1] || '';
    const prev = lines[line - 2] || '';
    const sup = (cur.match(/design-lint-disable-line\s+([\w-]+)(\s*--\s*\S.*)?/) || prev.match(/design-lint-disable-next-line\s+([\w-]+)(\s*--\s*\S.*)?/));
    if (sup && sup[1] === rule) {
      if (!sup[2]) {
        findings.push({ rule: 'suppression-without-reason', severity: 'error', file: rel(file), line, col, excerpt: cur.trim().slice(0, 120), help: HELP['suppression-without-reason'] });
      } else {
        suppressed++;
      }
      return;
    }
    findings.push({ rule, severity: RULES[rule], file: rel(file), line, col: col + 1, excerpt: (excerpt || cur).trim().slice(0, 120), help: HELP[rule] + (extra ? ' ' + extra : '') });
  };

  let inBlockComment = false;
  lines.forEach((raw, idx) => {
    const ln = idx + 1;
    // コメントを除去（行内 /* */ と // は CSS 以外のみ）
    let line = raw;
    if (inBlockComment) {
      const end = line.indexOf('*/');
      if (end === -1) return;
      line = ' '.repeat(end + 2) + line.slice(end + 2);
      inBlockComment = false;
    }
    line = line.replace(/\/\*.*?\*\//g, (s) => ' '.repeat(s.length));
    const open = line.indexOf('/*');
    if (open !== -1) {
      line = line.slice(0, open);
      inBlockComment = true;
    }
    line = line.replace(/<!--.*?-->/g, (s) => ' '.repeat(s.length));
    // style="…" の中身を宣言として読めるよう、末尾に ; を補う
    if (isMarkup) line = line.replace(/(\sstyle=)(["'])(.*?)\2/g, (_, a, q, body) => `${a}${q}${body};${q}`);
    if (!line.trim()) return;
    if (/^\s*@(media|container|supports|import|charset)/.test(line)) return;

    // --- raw-color
    for (const m of line.matchAll(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g)) {
      const before = line.slice(0, m.index);
      if (/(href=["']?|url\(\s*["']?|xlink:href=["']?|&|id=["']?|for=["']?|aria-[a-z]+=["']?|data-[a-z-]+=["']?)$/i.test(before)) continue;
      if (isMarkup && /[\w]$/.test(before)) continue;
      // マークアップ中の地の文（"#3 のバッチ" など）を避ける: 属性/スタイル/JS文字列の文脈のみ
      if (isMarkup && !/[:=,(\s'"`]$/.test(before)) continue;
      add('raw-color', ln, m.index, null);
    }
    for (const m of line.matchAll(/\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/g)) {
      // color-mix(in oklch, ...) の色空間指定は対象外
      if (/\bin\s+$/.test(line.slice(0, m.index))) continue;
      add('raw-color', ln, m.index, null);
    }

    // --- CSS 宣言ベースのルール
    for (const m of line.matchAll(/(?:^|[;{\s"'])([a-z-]+)\s*:\s*([^;{}]+?)\s*(?:;|$|\})/g)) {
      const prop = m[1];
      const value = m[2];
      const col = m.index;
      if (prop.startsWith('--')) continue;
      const bare = value.replace(/var\([^()]*(\([^()]*\))?[^()]*\)/g, 'VAR');

      if (COLOR_PROPS.test(prop)) {
        for (const w of bare.split(/[\s,/()]+/)) if (NAMED_COLORS.test(w)) add('raw-color', ln, col, null, `（色名 "${w}"）`);
      }
      if (prop === 'font-family' && !/^(VAR|inherit|initial|unset)$/.test(bare.trim())) add('raw-font-family', ln, col, null);
      if (SIZED_PROPS.test(prop)) {
        const lits = bare.match(/-?\d*\.?\d+(px|rem|em|pt)\b/g) || [];
        const bad = lits.filter((v) => !/^-?0(px|rem|em|pt)$/.test(v) && !(prop !== 'font-size' && /^-?1px$/.test(v)) && !(prop === 'font-size' && v === '1em'));
        if (bad.length) add('raw-size', ln, col, null, `（${prop}: ${bad.join(', ')}）`);
      }
      if (prop === 'box-shadow' && !/^(VAR(\s*,\s*VAR)*|none|inherit|initial|unset)$/.test(bare.trim())) add('raw-shadow', ln, col, null);
      if (/^(transition|animation)(-duration)?$/.test(prop) && /\b\d*\.?\d+m?s\b/.test(bare)) add('raw-duration', ln, col, null);
      if (/^transition(-property)?$/.test(prop) && /(^|\s|,)all(\s|,|$)/.test(bare)) add('transition-all', ln, col, null);
      if (/^(-webkit-)?background-clip$/.test(prop) && /\btext\b/.test(value)) add('gradient-text', ln, col, null);
      if (prop === 'outline' && /^(none|0)$/.test(value.trim()) && !hasFocusVisible) add('outline-none', ln, col, null);
      if (/^border-(left|inline-start)$/.test(prop) && /\b([3-9]|\d\d)px\b/.test(value)) add('side-stripe', ln, col, null);
      if (/^(-webkit-)?backdrop-filter$/.test(prop) && /blur/.test(value)) add('glass', ln, col, null);
    }
    // reduced-motion で動きを止めるための !important は正当な用法
    if (/!important/.test(line) && !/(transition|animation)[a-z-]*\s*:\s*(none|0s)/.test(line) && !/scroll-behavior\s*:\s*auto/.test(line)) add('important', ln, line.indexOf('!important'), null);

    // --- unknown-token
    if (tokens.exists) {
      for (const m of line.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
        if (!tokens.names.has(m[1]) && !localVars.has(m[1])) add('unknown-token', ln, m.index, null, `（${m[1]}）`);
      }
    }

    // --- マークアップ専用
    if (isMarkup) {
      for (const m of line.matchAll(/(?:^|[\s"'`])((?:[a-z0-9-]+:)*-?[a-z][a-z0-9-]*-\[[^\]\s]+\])/g)) add('tw-arbitrary', ln, m.index, null, `（${m[1]}）`);
      if (/\b(bg-clip-text)\b/.test(line)) add('gradient-text', ln, line.indexOf('bg-clip-text'), null);
      if (/\btransition-all\b/.test(line) && !/transition-all\s*:/.test(line)) add('transition-all', ln, line.indexOf('transition-all'), null);
      const st = line.match(/\sstyle=(["'])(.*?)\1/);
      if (st && !/^\s*(--[a-zA-Z0-9-]+\s*:[^;]*;*\s*)+$/.test(st[2])) add('inline-style', ln, st.index, null);
      if (/\sstyle=\{\{/.test(line) && !/style=\{\{\s*(['"]--[\w-]+['"]\s*:[^,}]*,?\s*)+\}\}/.test(line)) add('inline-style', ln, line.indexOf('style={{'), null);
      // JSX の style オブジェクト内リテラル
      if (ext === '.jsx' || ext === '.tsx')
        for (const m of line.matchAll(/\b(fontSize|padding[A-Z]?\w*|margin[A-Z]?\w*|gap|borderRadius)\s*:\s*(['"]?-?\d*\.?\d+(?:px|rem|em)?['"]?)/g)) {
          if (!/^['"]?0/.test(m[2])) add('raw-size', ln, m.index, null, `（${m[1]}: ${m[2]}）`);
        }
      if (/<(div|span|li|td|tr|p|section)\b[^>]*\s(onClick|onclick|@click|on:click)=/.test(line) && !/role=/.test(line)) add('click-on-div', ln, 0, null);
    }

    // --- 共通
    for (const m of line.matchAll(/\p{Extended_Pictographic}/gu)) {
      const cp = m[0].codePointAt(0);
      if (cp >= 0x1f000 || (cp >= 0x2600 && cp <= 0x27bf && cp !== 0x2713 && cp !== 0x2715)) {
        add('emoji-icon', ln, m.index, null, `（${m[0]}）`);
        break;
      }
    }
    if (/lorem ipsum|dolor sit amet|ここにテキスト|テキストテキスト|ダミーテキスト/i.test(line)) add('placeholder-copy', ln, 0, null);
  });

  // 複数行にまたがるタグ
  if (isMarkup) {
    for (const m of text.matchAll(/<img\b[^>]*>/gi)) {
      if (!/\salt(=|\s|>)/i.test(m[0])) {
        const ln = text.slice(0, m.index).split('\n').length;
        add('img-alt', ln, 0, m[0]);
      }
    }
  }
  return { findings, suppressed };
}

function lintFiles(files) {
  const tokens = readTokens();
  const findings = [];
  let suppressed = 0;
  let count = 0;
  for (const f of files) {
    if (!isUiFile(f) || isTokensFile(f)) continue;
    let text;
    try {
      text = fs.readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    count++;
    const r = lintText(f, text, tokens);
    findings.push(...r.findings);
    suppressed += r.suppressed;
  }
  return { findings, suppressed, files: count, tokensFound: tokens.exists };
}

/* ---------- token contrast (--tokens) ---------- */

function parseColor(v) {
  v = v.trim();
  let m = v.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  }
  m = v.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*(?:\/[^)]+)?\)$/i);
  if (m) {
    const L = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
    const C = m[2].endsWith('%') ? (parseFloat(m[2]) / 100) * 0.4 : parseFloat(m[2]);
    const h = (parseFloat(m[3]) * Math.PI) / 180;
    const a = C * Math.cos(h);
    const b = C * Math.sin(h);
    const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const lin = [
      4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
      -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
      -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
    ];
    return lin.map((c) => {
      c = Math.min(1, Math.max(0, c));
      return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    });
  }
  return null;
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function checkTokens() {
  const tokens = readTokens();
  const out = [];
  if (!tokens.exists) return { findings: [{ severity: 'error', message: `${CONFIG.tokensFile} が無い` }], pairs: 0 };
  let pairs = 0;
  for (const [theme, overrides] of [['light', {}], ['dark', tokens.dark]]) {
    if (theme === 'dark' && !Object.keys(tokens.dark).length) continue;
    const map = Object.assign({}, tokens.light, overrides);
    const resolve = (v, depth = 0) => {
      const m = v && v.match(/^var\(\s*(--[\w-]+)\s*\)$/);
      return m && depth < 5 ? resolve(map[m[1]], depth + 1) : v;
    };
    const names = Object.keys(map);
    const texts = names.filter((n) => /^--color-text/.test(n));
    const grounds = names.filter((n) => /^--color-(bg|surface)/.test(n));
    const check = (fgName, bgName, min) => {
      const fg = parseColor(resolve(map[fgName]) || '');
      const bg = parseColor(resolve(map[bgName]) || '');
      if (!fg || !bg) return;
      pairs++;
      const ratio = contrast(fg, bg);
      if (ratio < min) out.push({ severity: 'error', message: `[${theme}] ${fgName} on ${bgName}: ${ratio.toFixed(2)}:1（${min}:1 以上が必要）` });
    };
    // 規約: --color-text* は全ての --color-bg*/--color-surface* 上で読めること（disabled は除外）
    for (const t of texts) for (const g of grounds) check(t, g, /disabled|placeholder/.test(t) ? 3 : 4.5);
    // 規約: --color-on-X は --color-X 上で読めること
    for (const n of names) {
      const m = n.match(/^--color-on-(.+)$/);
      if (m && map[`--color-${m[1]}`]) check(n, `--color-${m[1]}`, 4.5);
    }
  }
  return { findings: out, pairs };
}

/* ---------- CLI ---------- */

function format(result) {
  const lines = [];
  const bySeverity = { error: 0, warn: 0 };
  for (const f of result.findings) {
    bySeverity[f.severity]++;
    lines.push(`${f.file}:${f.line}:${f.col}  ${f.severity.toUpperCase()}  ${f.rule}\n    ${f.excerpt}\n    → ${f.help}`);
  }
  lines.push(`design-lint: ${result.files} files, ${bySeverity.error} errors, ${bySeverity.warn} warnings` + (result.suppressed ? `, ${result.suppressed} suppressed` : ''));
  return lines.join('\n');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  includeIgnored = args.includes('--include-ignored');
  if (args.includes('--tokens')) {
    const r = checkTokens();
    if (json) console.log(JSON.stringify(r, null, 2));
    else {
      r.findings.forEach((f) => console.log(`${f.severity.toUpperCase()}  ${f.message}`));
      console.log(`design-lint --tokens: ${r.pairs} pairs checked, ${r.findings.length} problems`);
    }
    process.exit(r.findings.length ? 1 : 0);
  }
  const targets = args.filter((a) => !a.startsWith('--'));
  const files = (targets.length ? targets : [ROOT]).flatMap((t) => walk(path.resolve(t)));
  const result = lintFiles(files);
  console.log(json ? JSON.stringify(result, null, 2) : format(result));
  process.exit(result.findings.some((f) => f.severity === 'error') ? 1 : 0);
}

module.exports = { lintFiles, lintText, readTokens, checkTokens, isUiFile, isTokensFile, walk, rel, format, ROOT, CONFIG };
