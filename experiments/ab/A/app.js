(function () {
  const ROAST_LABELS = { 1: "浅煎り", 2: "中浅煎り", 3: "中煎り", 4: "中深煎り", 5: "深煎り" };

  const rows = document.getElementById("batch-rows");
  const dialog = document.getElementById("add-dialog");
  const form = document.getElementById("add-form");

  function updateSummary() {
    const all = Array.from(rows.rows);
    const weight = all.reduce((sum, tr) => sum + Number(tr.dataset.weight), 0);
    document.getElementById("sum-count").textContent = all.length;
    document.getElementById("sum-weight").textContent = weight.toFixed(1);
    document.getElementById("sum-todo").textContent =
      all.filter((tr) => tr.dataset.status === "todo").length;
  }

  function cell(className, child) {
    const td = document.createElement("td");
    td.className = className;
    td.append(child);
    return td;
  }

  function badge(className, text) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    return span;
  }

  function addBatch({ name, roast, weight, time }) {
    const tr = document.createElement("tr");
    tr.dataset.status = "todo";
    tr.dataset.weight = weight;
    tr.append(
      cell("c-time", time),
      cell("c-name", name),
      cell("c-roast", badge("roast roast--" + roast, ROAST_LABELS[roast])),
      cell("c-weight num", weight.toFixed(1)),
      cell("c-status", badge("status status--todo", "未着手"))
    );

    // 開始予定時刻の順に挿入する
    const next = Array.from(rows.rows).find(
      (r) => r.querySelector(".c-time").textContent > time
    );
    rows.insertBefore(tr, next || null);
    updateSummary();
  }

  document.getElementById("open-add").addEventListener("click", () => {
    form.reset();
    dialog.showModal();
  });

  document.getElementById("cancel-add").addEventListener("click", () => dialog.close());

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    addBatch({
      name: String(data.get("name")).trim(),
      roast: Number(data.get("roast")),
      weight: Number(data.get("weight")),
      time: String(data.get("time")),
    });
    dialog.close();
  });

  updateSummary();
})();
