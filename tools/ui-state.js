/*
 * ui-state — フックと ui-shot が共有する状態（.ui-review/state.json）と、UI ファイルのスナップショット。
 *
 * 「どのツールで書いたか」ではなく「ファイルの中身が変わったか」で判定する。
 * Edit/Write だけを見ていると、Bash の heredoc や sed での書き込みを取りこぼすため。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const lint = require('./design-lint.js');

const OUT = path.join(lint.ROOT, '.ui-review');
const STATE = path.join(OUT, 'state.json');

function read() {
  try {
    return JSON.parse(fs.readFileSync(STATE, 'utf8'));
  } catch {
    return {};
  }
}

function write(state) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
}

/* 全 UI ファイル（トークン定義を除く）の { 相対パス: 内容ハッシュ } */
function snapshot() {
  const map = {};
  for (const file of lint.walk(lint.ROOT)) {
    if (lint.isTokensFile(file)) continue;
    try {
      map[lint.rel(file)] = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
    } catch {
      /* 読めないファイルは無視 */
    }
  }
  return map;
}

/* b にあって a と内容が違う（新規含む）ファイル */
function changed(a, b) {
  return Object.keys(b).filter((f) => (a || {})[f] !== b[f]);
}

module.exports = { read, write, snapshot, changed, OUT, STATE };
