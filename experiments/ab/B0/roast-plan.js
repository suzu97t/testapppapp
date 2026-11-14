// 今日の焙煎計画 — 状態を進める / バッチを追加 / 合計の再計算（ダミーデータは HTML 側）
(() => {
  const body = document.getElementById('batch-body');
  const table = document.getElementById('batch-table');
  const empty = document.getElementById('batch-empty');
  const dialog = document.getElementById('add-dialog');
  const form = document.getElementById('add-form');
  const $ = (id) => document.getElementById(id);

  const STATE = {
    todo: { label: '未着手', action: '焙煎を開始', next: 'roasting' },
    roasting: { label: '焙煎中', action: '完了にする', next: 'done' },
    done: { label: '完了' },
  };
  const ROAST = ['', '浅煎り', '中浅煎り', '中煎り', '中深煎り', '深煎り'];
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // ?empty=1 で 0 件の状態を確認できる
  if (new URLSearchParams(location.search).has('empty')) body.replaceChildren();

  function render() {
    const rows = [...body.rows];
    let total = 0, remCount = 0, remKg = 0, todo = 0, next = null;

    for (const tr of rows) {
      const s = STATE[tr.dataset.state];
      const kg = Number(tr.dataset.kg);
      total += kg;
      if (tr.dataset.state !== 'done') { remCount++; remKg += kg; }
      if (tr.dataset.state === 'todo') { todo++; next ??= tr; }

      const inner = el('div', 'state__inner');
      inner.append(el('span', 'pill', s.label));
      if (s.action) {
        const b = el('button', 'btn', s.action);
        b.type = 'button';
        b.dataset.advance = '';
        inner.append(b);
      }
      tr.querySelector('.state').replaceChildren(inner);
      tr.querySelector('.next-tag')?.remove();
    }

    if (next) next.querySelector('.time').append(el('span', 'next-tag', '次'));

    $('rem-count').textContent = remCount;
    $('rem-kg').textContent = remKg.toFixed(1);
    $('tot-count').textContent = rows.length;
    $('tot-kg').textContent = total.toFixed(1);
    $('tot-todo').textContent = todo;

    const line = $('next-line');
    line.hidden = rows.length === 0;
    line.querySelector('.next__label').hidden = !next;
    $('next-text').textContent = next
      ? `${next.dataset.time} ${next.querySelector('.bean__name').textContent} ${Number(next.dataset.kg).toFixed(1)} kg`
      : remCount ? '未着手のバッチなし（焙煎中のみ）' : '今日の焙煎は全て完了';

    table.hidden = rows.length === 0;
    empty.hidden = rows.length !== 0;
  }

  body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-advance]');
    if (!btn) return;
    const tr = btn.closest('tr');
    tr.dataset.state = STATE[tr.dataset.state].next;
    render();
    (tr.querySelector('[data-advance]') ?? body.querySelector('[data-advance]') ?? $('open-add')).focus();
  });

  const open = () => { form.reset(); dialog.showModal(); };
  $('open-add').addEventListener('click', open);
  $('open-add-empty').addEventListener('click', open);
  $('cancel-add').addEventListener('click', () => dialog.close());

  form.addEventListener('submit', () => {
    const d = new FormData(form);
    const kg = Number(d.get('kg')).toFixed(1);
    const time = d.get('time');
    const tr = el('tr');
    Object.assign(tr.dataset, { state: 'todo', kg, time });

    const tdTime = el('td', 'time');
    tdTime.append(el('time', '', time));
    const th = el('th', 'bean');
    th.scope = 'row';
    const roast = el('span', 'roast');
    const mark = el('span', 'roast__mark');
    mark.dataset.roast = d.get('roast');
    roast.append(mark, ROAST[d.get('roast')]);
    th.append(el('span', 'bean__name', d.get('bean').trim()), roast);
    const tdKg = el('td', 'num kg', kg);
    tdKg.append(el('span', 'unit', 'kg'));
    tr.append(tdTime, th, tdKg, el('td', 'state'));

    const after = [...body.rows].find((r) => r.dataset.time > time);
    body.insertBefore(tr, after ?? null);
    render();
  });

  render();
})();
