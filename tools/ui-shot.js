#!/usr/bin/env node
/*
 * ui-shot — 画面を実際に描画して (1) スクリーンショットを撮り (2) 描画結果を計測監査する。
 *
 *   node tools/ui-shot.js <file.html | URL> [...]   複数指定可
 *     --name <slug>            出力ファイル名の接頭辞（既定: 対象から生成）
 *     --viewports m,t,d        mobile(390) / tablet(820) / desktop(1440)。既定は全部
 *     --no-dark                ダークモードの撮影・監査を省く
 *     --strict                 error があれば終了コード 1（CI 用）
 *     --json                   監査結果を JSON で出す
 *   node tools/ui-shot.js --ack  "<理由>"   監査 error を「意図的」として承認（最終報告に必ず書く）
 *   node tools/ui-shot.js --skip "<理由>"   描画確認できない事情を記録（同上）
 *
 * 出力: .ui-review/shots/*.png, .ui-review/report.json
 *
 * 静的 lint では分からない「描画後の事実」を測る:
 *   横スクロール / 実コントラスト比 / スケール外の文字サイズ / 小さすぎる文字 / タップ領域 /
 *   行長 / フォーカス表示の有無 / 見出し構造 / 名前の無いボタン / フォント読み込み失敗
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const lint = require('./design-lint.js');

const ui = require('./ui-state.js');

const ROOT = lint.ROOT;
const OUT = ui.OUT;
const SHOTS = path.join(OUT, 'shots');

const VIEWPORTS = {
  mobile: { width: 390, height: 844, isMobile: true },
  tablet: { width: 820, height: 1180, isMobile: true },
  desktop: { width: 1440, height: 900, isMobile: false },
};
const MAX_SHOT_HEIGHT = 3600;

function tokenScalePx() {
  const t = lint.readTokens();
  const px = new Set();
  for (const [name, value] of Object.entries(t.light)) {
    if (!/^--text-/.test(name)) continue;
    const m = value.match(/^([\d.]+)(rem|px)$/);
    if (m) px.add(Math.round(parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1) * 100) / 100);
  }
  return [...px];
}

/* ブラウザ内で実行される監査本体 */
function auditInPage({ scale, isMobile }) {
  const findings = [];
  const add = (rule, severity, message, el) => {
    let where = '';
    if (el && el.nodeType === 1) {
      where = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
    }
    findings.push({ rule, severity, message, where });
  };

  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = (color) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (top, bottom) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1);
  };
  const lum = (c) => {
    const f = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const srOnly = (el) => {
    const r = el.getBoundingClientRect();
    return r.width <= 2 && r.height <= 2;
  };
  const background = (el) => {
    // 祖先をたどって実効背景色を合成する。背景画像/グラデーションがあれば判定不能（null）。
    const layers = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = rgba(cs.backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] === 1) break;
    }
    let base = [255, 255, 255, 1];
    const canvasBg = rgba(getComputedStyle(document.documentElement).backgroundColor);
    if (canvasBg[3] === 0 && matchMedia('(prefers-color-scheme: dark)').matches && getComputedStyle(document.documentElement).colorScheme.includes('dark')) base = [18, 18, 18, 1];
    for (const l of layers.reverse()) base = over(l, base);
    return base;
  };

  // 1. 横スクロール
  const vw = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > vw + 1) {
    const offenders = [...document.querySelectorAll('body *')].filter((e) => visible(e) && e.getBoundingClientRect().right > vw + 1 && !e.closest('[data-scroll-x], .scroll-x'));
    const inner = offenders.filter((e) => !offenders.some((o) => o !== e && e.contains(o)));
    add('overflow-x', 'error', `ページが横スクロールする（幅 ${document.documentElement.scrollWidth}px > ${vw}px）`, inner[0] || offenders[0]);
  }

  // 2. テキスト走査: コントラスト / 文字サイズ / フォント
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const sizes = new Map();
  const families = new Map();
  const seenContrast = new Set();
  let unknownBg = 0;
  let textNodes = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.trim();
    const el = node.parentElement;
    if (!text || !el || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName)) continue;
    if (!visible(el) || srOnly(el)) continue;
    textNodes++;
    const cs = getComputedStyle(el);
    const size = Math.round(parseFloat(cs.fontSize) * 100) / 100;
    if (size < 1) continue; // font-size: 0 による視覚的な非表示
    if (!sizes.has(size)) sizes.set(size, el);
    const fam = cs.fontFamily.split(',')[0].trim().replace(/["']/g, '');
    families.set(fam, (families.get(fam) || 0) + 1);

    const bg = background(el);
    if (!bg) {
      unknownBg++;
      continue;
    }
    let fg = rgba(cs.color);
    // 祖先の opacity を反映
    let op = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
    fg = over([fg[0], fg[1], fg[2], fg[3] * op], bg);
    const r = ratio(fg, bg);
    const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    const disabled = el.closest('[disabled], [aria-disabled="true"]');
    const min = large ? 3 : 4.5;
    if (r < min && !disabled) {
      const key = fg.map(Math.round).join() + '|' + bg.map(Math.round).join() + '|' + size;
      if (!seenContrast.has(key)) {
        seenContrast.add(key);
        add('contrast', 'error', `コントラスト ${r.toFixed(2)}:1（必要 ${min}:1）— 「${text.slice(0, 24)}」 ${size}px`, el);
      }
    }
  }
  for (const [size, el] of sizes) {
    if (size < 12) add('tiny-text', 'error', `文字が小さすぎる（${size}px < 12px）— 「${el.textContent.trim().slice(0, 24)}」`, el);
    if (scale.length && !scale.some((s) => Math.abs(s - size) < 0.26)) add('off-scale-text', 'error', `トークンに無い文字サイズ ${size}px（スケール: ${scale.join(', ')}）`, el);
  }
  if (sizes.size > 7) add('too-many-sizes', 'warn', `文字サイズが ${sizes.size} 種類ある（${[...sizes.keys()].sort((a, b) => a - b).join(', ')}px）。階層が曖昧になっていないか`, null);
  if (families.size > 2) add('too-many-fonts', 'warn', `書体が ${families.size} 種類（${[...families.keys()].join(', ')}）`, null);

  // 3. フォント読み込み失敗
  for (const f of document.fonts) if (f.status === 'error') add('font-load', 'warn', `フォント読み込み失敗: ${f.family} ${f.weight}`, null);

  // 4. タップ領域（モバイル幅のみ）
  if (isMobile) {
    const controls = [...document.querySelectorAll('button, [role="button"], input:not([type="hidden"]), select, textarea, summary, a[href]')].filter(visible);
    let small44 = 0;
    for (const el of controls) {
      const cs = getComputedStyle(el);
      if (el.tagName === 'A' && cs.display === 'inline') continue;
      let r = el.getBoundingClientRect();
      if (['checkbox', 'radio'].includes(el.type) && el.closest('label')) r = el.closest('label').getBoundingClientRect();
      if (r.width < 24 || r.height < 24) add('tap-target', 'error', `タップ領域が小さい（${Math.round(r.width)}×${Math.round(r.height)}px < 24px）`, el);
      else if (r.height < 44 && r.width < 44) small44++;
    }
    if (small44) add('tap-target-44', 'warn', `44px 未満の操作要素が ${small44} 個（指で押す主要操作は 44px 以上に）`, null);
  }

  // 5. 行長
  for (const el of document.querySelectorAll('p, li, dd, blockquote, figcaption')) {
    if (!visible(el)) continue;
    const text = el.innerText.trim();
    if (text.length < 60) continue;
    // 列や行を内包するレイアウト要素は対象外（地の文だけを測る）
    if ([...el.children].some((c) => !/^inline/.test(getComputedStyle(c).display))) continue;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    const lineHeight = parseFloat(cs.lineHeight) || fs * 1.5;
    const r = el.getBoundingClientRect();
    if (r.height < lineHeight * 1.8) continue; // 1 行で収まっている
    const jp = (text.match(/[぀-ヿ一-鿿]/g) || []).length / text.length > 0.3;
    const em = r.width / fs;
    if (jp ? em > 45 : em > 42) add('line-length', 'warn', `1 行が長すぎる（約 ${Math.round(jp ? em : em * 2)} 文字/行）— 「${text.slice(0, 20)}…」`, el);
    if (jp && lineHeight / fs < 1.5) add('line-height', 'warn', `和文の複数行なのに行間が狭い（${(lineHeight / fs).toFixed(2)}）`, el);
  }

  // 6. 構造・名前
  const h1 = [...document.querySelectorAll('h1')].filter(visible);
  if (h1.length !== 1) add('heading-h1', 'warn', `h1 が ${h1.length} 個（画面に 1 つ）`, null);
  let prev = 0;
  for (const h of [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((e) => visible(e) || srOnly(e))) {
    const lv = +h.tagName[1];
    if (prev && lv > prev + 1) add('heading-skip', 'warn', `見出しレベルが飛んでいる（h${prev} → h${lv}）`, h);
    prev = lv;
  }
  if (!document.documentElement.lang) add('lang', 'error', '<html lang> が無い（和文の字形・改行・読み上げに影響）', null);
  for (const el of document.querySelectorAll('button, a[href], [role="button"]')) {
    if (!visible(el)) continue;
    const name = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || '').trim() || [...el.querySelectorAll('img[alt], svg title')].map((n) => n.getAttribute('alt') || n.textContent).join('').trim() || (el.getAttribute('aria-labelledby') ? 'x' : '');
    if (!name) add('no-name', 'error', '名前の無い操作要素（アイコンのみなら aria-label を付ける）', el);
  }
  for (const el of document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea')) {
    if (!visible(el)) continue;
    const labelled = el.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
    if (!labelled) add('no-label', 'error', 'ラベルの無い入力欄（placeholder はラベルの代わりにならない）', el);
  }

  return { findings, stats: { textNodes, fontSizes: [...sizes.keys()].sort((a, b) => a - b), fonts: [...families.keys()], unknownBg, pageHeight: document.documentElement.scrollHeight } };
}

/* フォーカス表示の検査: Tab で順に移動し、フォーカス前後で見た目が変わるか */
async function auditFocus(page) {
  const snap = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const tag = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
      if (!window.__uiShotSeen) window.__uiShotSeen = new WeakSet();
      const seen = window.__uiShotSeen.has(el);
      window.__uiShotSeen.add(el);
      const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1;
      const sig = [cs.boxShadow, cs.borderColor, cs.backgroundColor, cs.textDecorationLine].join('|');
      el.blur();
      const cs2 = getComputedStyle(el);
      const sig2 = [cs2.boxShadow, cs2.borderColor, cs2.backgroundColor, cs2.textDecorationLine].join('|');
      el.focus({ focusVisible: true });
      return { tag, seen, indicated: ring || sig !== sig2 };
    });
  const findings = [];
  let count = 0;
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const s = await snap();
    if (!s || s.seen) break;
    count++;
    if (!s.indicated) findings.push({ rule: 'focus-visible', severity: 'error', message: 'キーボードフォーカスが見えない', where: s.tag });
  }
  return { findings, count };
}

async function run(argv) {
  const opt = { targets: [], viewports: Object.keys(VIEWPORTS), dark: true, strict: false, json: false, name: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ack' || a === '--skip') {
      const reason = (argv[i + 1] || '').trim();
      if (reason.length < 8) {
        console.error(`${a} には具体的な理由が必要です（例: ${a} "ロゴ上の文字は背景画像で判定不能、目視で確認済み"）`);
        process.exit(2);
      }
      const s = ui.read();
      if (a === '--ack') s.ack = { reason, at: new Date().toISOString() };
      else s.skip = { reason, at: new Date().toISOString(), hashes: ui.snapshot() };
      ui.write(s);
      console.log(`${a.slice(2)} を記録しました。最終報告でユーザーに必ずこの理由を伝えてください: ${reason}`);
      return 0;
    } else if (a === '--name') opt.name = argv[++i];
    else if (a === '--viewports') opt.viewports = argv[++i].split(',').map((v) => ({ m: 'mobile', t: 'tablet', d: 'desktop' })[v] || v);
    else if (a === '--no-dark') opt.dark = false;
    else if (a === '--strict') opt.strict = true;
    else if (a === '--json') opt.json = true;
    else if (a === '--help' || a === '-h') continue;
    else opt.targets.push(a);
  }
  if (argv.includes('--help') || argv.includes('-h')) opt.targets = [];
  if (!opt.targets.length) {
    console.error(
      [
        '使い方: node tools/ui-shot.js <file.html | URL> [...] [--name slug] [--viewports m,t,d] [--no-dark] [--strict] [--json]',
        '  複数指定可。状態違いも一緒に撮る: node tools/ui-shot.js src/x/index.html "src/x/index.html?empty=1"',
        '  --ack "<理由>"   描画監査の error を意図的な例外として承認',
        '  --skip "<理由>"  描画確認できない事情を記録',
      ].join('\n'),
    );
    return 2;
  }

  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    console.error('playwright が見つかりません。`npm i -D playwright && npx playwright install chromium` を実行してください。');
    return 2;
  }
  const hasDarkTokens = Object.keys(lint.readTokens().dark).length > 0;
  const scale = tokenScalePx();
  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });

  const browser = await chromium.launch();
  const report = { at: new Date().toISOString(), targets: [], errors: 0, warnings: 0 };
  const shots = [];

  for (const target of opt.targets) {
    // ファイル指定にも ?query / #hash を付けられる（例: index.html?empty=1 で空状態を撮る）
    const [, filePart, suffix] = target.match(/^([^?#]*)(.*)$/);
    const url = /^https?:\/\//.test(target) ? target : pathToFileURL(path.resolve(filePart)).href + suffix;
    const slug = (opt.targets.length === 1 && opt.name) || (/^https?:/.test(target) ? target.replace(/^https?:\/\//, '') : rel(filePart).replace(/\.html?$/, '') + suffix).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page';
    const entry = { target, runs: [] };
    report.targets.push(entry);
    const combos = [];
    for (const vp of opt.viewports) combos.push([vp, 'light']);
    if (opt.dark && hasDarkTokens) combos.push([opt.viewports.includes('desktop') ? 'desktop' : opt.viewports[0], 'dark']);

    for (const [vpName, theme] of combos) {
      const vp = VIEWPORTS[vpName];
      if (!vp) throw new Error(`unknown viewport: ${vpName}`);
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: theme, deviceScaleFactor: 1, hasTouch: vp.isMobile, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 200)));
      page.on('requestfailed', (r) => consoleErrors.push(`request failed: ${r.url().slice(0, 120)}`));
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const result = await page.evaluate(auditInPage, { scale, isMobile: vp.isMobile });
      const height = Math.min(result.stats.pageHeight, MAX_SHOT_HEIGHT);
      const file = path.join(SHOTS, `${slug}-${vpName}-${theme}.png`);
      await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, width: vp.width, height: Math.max(height, vp.height) } });
      shots.push(file);
      if (vpName === 'desktop' && theme === 'light') {
        const focus = await auditFocus(page);
        result.findings.push(...focus.findings);
        result.stats.focusables = focus.count;
      }
      for (const e of consoleErrors) result.findings.push({ rule: 'page-error', severity: 'warn', message: e, where: '' });
      entry.runs.push({ viewport: vpName, theme, shot: rel(file), truncated: result.stats.pageHeight > MAX_SHOT_HEIGHT, ...result });
      await context.close();
    }
  }
  await browser.close();

  // 集計（同じ指摘が複数ビューポートで出たらまとめる）
  const merged = new Map();
  for (const t of report.targets)
    for (const r of t.runs)
      for (const f of r.findings) {
        const key = [t.target, f.rule, f.message, f.where].join('|');
        if (!merged.has(key)) merged.set(key, { ...f, target: t.target, at: [] });
        merged.get(key).at.push(`${r.viewport}/${r.theme}`);
      }
  report.findings = [...merged.values()];
  report.errors = report.findings.filter((f) => f.severity === 'error').length;
  report.warnings = report.findings.filter((f) => f.severity === 'warn').length;
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  // 「この内容の UI を描画した」という事実を記録する（Stop フックが、最後の変更後に描画したかを照合する）
  const state = ui.read();
  state.shot = { at: report.at, hashes: ui.snapshot(), shots: shots.map(rel), viewed: [], audit: { errors: report.errors, warnings: report.warnings } };
  state.ack = null;
  state.skip = null;
  ui.write(state);

  if (opt.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`ui-shot: 描画監査  ${report.errors} errors, ${report.warnings} warnings`);
    for (const f of report.findings) console.log(`  ${f.severity.toUpperCase()}  ${f.rule}  ${f.message}${f.where ? `  <${f.where}>` : ''}  [${f.at.join(', ')}]`);
    for (const t of report.targets) {
      const r0 = t.runs[0];
      console.log(`\n${t.target}: 文字サイズ ${r0.stats.fontSizes.join('/')}px, 書体 ${r0.stats.fonts.join(' / ')}` + (r0.stats.unknownBg ? `, 背景画像上の文字 ${r0.stats.unknownBg} 箇所はコントラスト未判定（目視で確認）` : ''));
    }
    console.log('\nスクリーンショット（Read ツールで実際に開いて確認すること。開かないと完了できません）:');
    for (const s of shots) console.log('  ' + s);
    if (report.targets.some((t) => t.runs.some((r) => r.truncated))) console.log(`  ※ ${MAX_SHOT_HEIGHT}px を超える部分は切り捨てています`);
    console.log('\n次: 各画像を Read で開き、.claude/skills/ui-design/references/critique.md の観点で批評 → 直す → 再実行。');
  }
  return opt.strict && report.errors ? 1 : 0;
}

function rel(p) {
  return lint.rel(p);
}

if (require.main === module) {
  run(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error('ui-shot failed:', err.message);
      process.exit(2);
    },
  );
}

module.exports = { run };
