#!/usr/bin/env node
/* design-lint の回帰テスト: 既知の悪い例から、期待したルールが期待した回数だけ出ることを確かめる */
'use strict';
const path = require('path');
const fs = require('fs');
const lint = require('../design-lint.js');

const file = path.join(__dirname, 'fixtures', 'bad.html');
const { findings, suppressed } = lint.lintText(file, fs.readFileSync(file, 'utf8'), lint.readTokens());
const count = {};
for (const f of findings) count[f.rule] = (count[f.rule] || 0) + 1;

const expected = {
  'raw-color': 5, // #667eea, #764ba2, white, rgba(), style="color: red"（href="#fee" と bg-[#fff] は別扱い）
  'raw-font-family': 1,
  'raw-size': 3, // 24px, 13px, 16px（抑制済み 1 件と -1px / 1px / 0 は除く）
  'raw-shadow': 1,
  'unknown-token': 1, // --color-primary
  'gradient-text': 1,
  'outline-none': 1,
  'side-stripe': 1,
  'transition-all': 1,
  'raw-duration': 1,
  glass: 1,
  important: 1,
  'click-on-div': 1,
  'inline-style': 1, // style="--progress: 40%" は許可
  'emoji-icon': 1,
  'placeholder-copy': 1,
  'tw-arbitrary': 3,
  'img-alt': 1,
  'suppression-without-reason': 1,
};
let failed = 0;
for (const rule of new Set([...Object.keys(expected), ...Object.keys(count)])) {
  const ok = (count[rule] || 0) === (expected[rule] || 0);
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${rule}: ${count[rule] || 0} (expected ${expected[rule] || 0})`);
}
if (suppressed !== 1) {
  failed++;
  console.log(`FAIL suppressed: ${suppressed} (expected 1)`);
}
if (failed) {
  console.log('\n' + findings.map((f) => `${f.line}: ${f.rule}  ${f.excerpt}`).join('\n'));
  process.exit(1);
}
console.log('\nall rules behave as expected');
