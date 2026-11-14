/* 今日の焙煎計画 — 状態を進める / バッチを追加 / 合計の再計算（ダミーデータは HTML 側） */
(() => {
  const STATUS = {
    todo: { label: '未着手', act: '焙煎を開始', to: 'roasting' },
    roasting: { label: '焙煎中', act: '完了にする', to: 'done' },
    done: { label: '完了' },
  };
  const ROAST = { 1: '浅煎り', 2: '中浅煎り', 3: '中煎り', 4: '中深煎り', 5: '深煎り' };
  const $ = (id) => document.getElementById(id);
  const table = $('batches');
  const tbody = table.tBodies[0];
  const dialog = $('add-dialog');
  const form = $('add-form');

  // 0 件の姿を確認するための切り替え: index.html?empty=1
  if (new URLSearchParams(location.search).has('empty')) {
    tbody.replaceChildren();
    $('orders').tBodies[0].replaceChildren();
  }

  const timeOf = (tr) => tr.querySelector('time').textContent;
  const beanOf = (tr) => tr.querySelector('.c-bean').textContent;

  function refresh() {
    const rows = [...tbody.rows];
    const count = { todo: 0, roasting: 0, done: 0 };
    let totalKg = 0;
    let remainKg = 0;
    let next = null;

    for (const tr of rows) {
      const st = tr.dataset.status;
      const kg = Number(tr.dataset.kg);
      count[st] += 1;
      totalKg += kg;
      if (st !== 'done') remainKg += kg;

      const isNext = st === 'todo' && !next;
      if (isNext) next = tr;
      tr.classList.toggle('is-next', isNext);
      tr.querySelector('.next-mark').hidden = !isNext;
      tr.querySelector('.status').textContent = STATUS[st].label;

      const cell = tr.querySelector('.c-act');
      const act = STATUS[st].act;
      if (!act) {
        cell.replaceChildren();
      } else {
        const btn = cell.querySelector('button') || cell.appendChild(document.createElement('button'));
        btn.type = 'button';
        btn.className = 'btn btn-step';
        btn.textContent = act;
        btn.setAttribute('aria-label', `${act}: ${timeOf(tr)} ${beanOf(tr)}`);
      }
    }

    $('remain-n').textContent = count.todo + count.roasting;
    $('remain-kg').textContent = remainKg.toFixed(1);
    $('total-n').textContent = rows.length;
    $('total-kg').textContent = totalKg.toFixed(1);
    $('todo-n').textContent = count.todo;
    $('roasting-n').textContent = count.roasting;
    $('done-n').textContent = count.done;

    const body = $('next-body');
    if (next) {
      const span = (className, textContent) => Object.assign(document.createElement('span'), { className, textContent });
      body.replaceChildren(
        span('num', timeOf(next)),
        ` ${beanOf(next)} `,
        span('num', Number(next.dataset.kg).toFixed(1)),
        span('unit', 'kg'),
      );
    } else {
      body.textContent = rows.length ? '未着手のバッチなし' : '予定なし';
    }

    table.hidden = rows.length === 0;
    $('batches-empty').hidden = rows.length > 0;
    const orders = $('orders');
    const noOrders = orders.tBodies[0].rows.length === 0;
    orders.hidden = noOrders;
    $('orders-empty').hidden = !noOrders;
  }

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-step');
    if (!btn) return;
    const tr = btn.closest('tr');
    tr.dataset.status = STATUS[tr.dataset.status].to;
    refresh();
    // 完了でボタンが消えたら、フォーカスを次の操作へ渡す
    if (!btn.isConnected) (tbody.querySelector('.btn-step') || document.querySelector('[data-open-add]')).focus();
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-add]')) dialog.showModal();
    if (e.target.closest('[data-close-add]')) dialog.close();
  });

  form.addEventListener('submit', () => {
    const data = new FormData(form);
    const tr = $('row-tpl').content.firstElementChild.cloneNode(true);
    const kg = Number(data.get('kg')).toFixed(1);
    const roast = data.get('roast');
    tr.dataset.kg = kg;
    tr.querySelector('time').textContent = data.get('time');
    tr.querySelector('.c-bean').textContent = data.get('bean').trim();
    tr.querySelector('.roast').dataset.roast = roast;
    tr.querySelector('.c-roast').append(ROAST[roast]);
    tr.querySelector('.c-kg').prepend(kg);
    const after = [...tbody.rows].find((r) => timeOf(r) > data.get('time'));
    tbody.insertBefore(tr, after || null);
    form.reset();
    refresh();
  });

  refresh();
})();
