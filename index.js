<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Автосимптом — что с машиной?</title>
<meta name="description" content="Опиши симптом простыми словами — покажу вероятные причины поломки и что проверить в первую очередь.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Saira+Semi+Condensed:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#111419;
    --bg-2:#161a20;
    --surface:#1c2129;
    --surface-2:#232935;
    --line:#2c333f;
    --text:#e9ebef;
    --muted:#8b93a1;
    --faint:#5c6472;
    --amber:#ffb020;
    --amber-dim:#4a3a17;
    --green:#3dd68c;
    --green-dim:#173a2c;
    --red:#ff5a52;
    --red-dim:#412020;
    --shadow:0 18px 50px rgba(0,0,0,.45);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{
    background:
      radial-gradient(1100px 600px at 80% -10%, rgba(255,176,32,.06), transparent 60%),
      var(--bg);
    color:var(--text);
    font-family:'Inter',system-ui,sans-serif;
    line-height:1.55;
    -webkit-font-smoothing:antialiased;
    min-height:100vh;
  }
  .wrap{max-width:720px;margin:0 auto;padding:0 20px}

  /* eyebrow / labels — приборная типографика */
  .eyebrow{
    font-family:'Saira Semi Condensed',sans-serif;
    text-transform:uppercase;letter-spacing:.22em;
    font-size:.72rem;font-weight:600;color:var(--amber);
    display:flex;align-items:center;gap:9px;
  }
  .eyebrow::before{
    content:"";width:8px;height:8px;border-radius:50%;
    background:var(--amber);box-shadow:0 0 12px var(--amber);
    animation:pulse 2.4s ease-in-out infinite;
  }
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}

  /* ── HERO ── */
  header{padding:56px 0 12px}
  h1{
    font-family:'Saira Semi Condensed',sans-serif;
    font-weight:700;font-size:clamp(2.4rem,9vw,3.6rem);
    line-height:1.02;letter-spacing:-.01em;margin:18px 0 14px;
  }
  h1 span{color:var(--amber)}
  .lede{color:var(--muted);font-size:1.05rem;max-width:34em}

  /* ── FORM CARD ── */
  .panel{
    background:linear-gradient(180deg,var(--surface),var(--bg-2));
    border:1px solid var(--line);border-radius:16px;
    box-shadow:var(--shadow);padding:22px;margin:30px 0;
  }
  label{
    display:block;font-family:'Saira Semi Condensed',sans-serif;
    text-transform:uppercase;letter-spacing:.1em;font-size:.78rem;
    font-weight:600;color:var(--muted);margin:0 0 8px 2px;
  }
  .field{margin-bottom:18px}
  input,textarea{
    width:100%;background:var(--bg);color:var(--text);
    border:1px solid var(--line);border-radius:10px;
    padding:13px 15px;font-family:inherit;font-size:1rem;resize:vertical;
    transition:border-color .15s,box-shadow .15s;
  }
  input::placeholder,textarea::placeholder{color:var(--faint)}
  input:focus,textarea:focus{
    outline:none;border-color:var(--amber);
    box-shadow:0 0 0 3px rgba(255,176,32,.16);
  }
  textarea{min-height:96px}
  .btn{
    width:100%;border:none;cursor:pointer;
    font-family:'Saira Semi Condensed',sans-serif;font-weight:700;
    text-transform:uppercase;letter-spacing:.08em;font-size:1.05rem;
    color:#1a1206;background:var(--amber);
    padding:15px;border-radius:10px;
    transition:transform .1s,filter .15s;
  }
  .btn:hover{filter:brightness(1.07)}
  .btn:active{transform:translateY(1px)}
  .btn:disabled{opacity:.6;cursor:default;filter:none}
  .fineprint{color:var(--faint);font-size:.82rem;margin-top:12px;text-align:center}

  /* ── SCAN / LOADING ── */
  .scan{display:none;padding:30px 22px;text-align:center}
  .scan.on{display:block}
  .scanbar{
    height:5px;border-radius:99px;background:var(--surface-2);
    overflow:hidden;margin:0 auto 18px;max-width:260px;
  }
  .scanbar i{
    display:block;height:100%;width:40%;border-radius:99px;
    background:linear-gradient(90deg,transparent,var(--amber),transparent);
    animation:sweep 1.15s ease-in-out infinite;
  }
  @keyframes sweep{0%{transform:translateX(-120%)}100%{transform:translateX(340%)}}
  .scan-status{font-family:'Saira Semi Condensed',sans-serif;letter-spacing:.06em;
    text-transform:uppercase;font-size:.85rem;color:var(--muted)}

  /* ── RESULTS ── */
  .results{display:none}
  .results.on{display:block;animation:rise .4s ease both}
  @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

  .summary{
    background:var(--surface);border:1px solid var(--line);
    border-left:3px solid var(--amber);border-radius:12px;
    padding:18px 20px;margin-bottom:26px;font-size:1.06rem;
  }
  .section-title{
    font-family:'Saira Semi Condensed',sans-serif;text-transform:uppercase;
    letter-spacing:.14em;font-size:.82rem;color:var(--muted);
    margin:0 0 14px 2px;font-weight:600;
  }

  .cause{
    background:var(--surface);border:1px solid var(--line);
    border-radius:12px;padding:18px;margin-bottom:14px;
  }
  .cause-head{display:flex;align-items:flex-start;gap:12px}
  .lamp{
    flex:0 0 auto;width:13px;height:13px;border-radius:50%;margin-top:5px;
    background:var(--faint);
  }
  .lamp.green{background:var(--green);box-shadow:0 0 12px var(--green)}
  .lamp.amber{background:var(--amber);box-shadow:0 0 12px var(--amber)}
  .lamp.red{background:var(--red);box-shadow:0 0 12px var(--red);
    animation:blink 1s step-end infinite}
  @keyframes blink{50%{opacity:.3}}
  .cause-title{font-family:'Saira Semi Condensed',sans-serif;font-weight:600;
    font-size:1.18rem;flex:1}

  .meter{margin:12px 0 4px;display:flex;align-items:center;gap:10px}
  .meter-label{font-size:.75rem;color:var(--faint);
    font-family:'Saira Semi Condensed',sans-serif;text-transform:uppercase;
    letter-spacing:.08em;min-width:78px}
  .bars{display:flex;gap:4px}
  .bars i{width:22px;height:6px;border-radius:2px;background:var(--surface-2)}
  .bars i.fill{background:var(--amber)}

  .detail{margin-top:12px;font-size:.96rem}
  .detail p{margin-bottom:8px}
  .detail b{color:var(--muted);font-weight:600;
    font-family:'Saira Semi Condensed',sans-serif;text-transform:uppercase;
    letter-spacing:.06em;font-size:.76rem;display:block;margin-bottom:2px}
  .tag{display:inline-block;font-size:.78rem;padding:3px 9px;border-radius:99px;
    font-weight:500;margin-top:4px}
  .tag.green{background:var(--green-dim);color:var(--green)}
  .tag.amber{background:var(--amber-dim);color:var(--amber)}
  .tag.red{background:var(--red-dim);color:var(--red)}

  /* ── PAYWALL ── */
  .locked .detail{filter:blur(5px);opacity:.5;pointer-events:none;user-select:none}
  .paywall{
    background:linear-gradient(180deg,var(--surface-2),var(--surface));
    border:1px solid var(--line);border-radius:14px;
    padding:24px 20px;margin:24px 0;text-align:center;
  }
  .paywall h3{font-family:'Saira Semi Condensed',sans-serif;font-size:1.3rem;
    font-weight:700;margin-bottom:6px}
  .paywall p{color:var(--muted);font-size:.95rem;max-width:32em;margin:0 auto 16px}
  .price{color:var(--amber);font-weight:700}
  .btn.pay{max-width:320px;margin:0 auto}
  .btn .price{color:inherit}   /* цена внутри жёлтой кнопки — тёмным, а не жёлтым по жёлтому */
  .pricebar{
    display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:16px;
    padding:12px 16px;border:1px solid var(--line);border-radius:12px;
    background:var(--surface);font-size:.92rem;color:var(--muted);
  }
  .pricebar b{color:var(--text);font-weight:600}
  .pricebar b.price{color:var(--amber)}

  .disclaimer{color:var(--faint);font-size:.82rem;text-align:center;
    margin:8px 0 40px;font-style:italic}

  .err{background:var(--red-dim);border:1px solid var(--red);
    border-radius:10px;padding:14px 16px;color:#ffd9d6;margin-top:16px;
    display:none;font-size:.95rem}
  .err.on{display:block}

  footer{border-top:1px solid var(--line);padding:24px 0 48px;
    color:var(--faint);font-size:.82rem;text-align:center}

  @media (min-width:600px){
    .panel{padding:28px}
  }
  @media (prefers-reduced-motion:reduce){
    *{animation:none!important;scroll-behavior:auto}
  }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="eyebrow">Онлайн-диагностика</div>
      <h1>Что с <span>машиной</span>?</h1>
      <p class="lede">Опиши, что не так, простыми словами — стук, звук, запах, как ведёт себя машина. За полминуты покажу вероятные причины и что проверить в первую очередь.</p>
      <div class="pricebar">
        <span>Список вероятных причин — <b>бесплатно</b></span>
        <span>Полный разбор — <b class="price">49&nbsp;₽</b></span>
      </div>
    </header>

    <!-- ФОРМА -->
    <div class="panel" id="formPanel">
      <div class="field">
        <label for="car">Машина <span style="text-transform:none;letter-spacing:0;color:var(--faint)">— необязательно, но точнее</span></label>
        <input id="car" type="text" placeholder="Например: Kia Rio 2015, 1.6 бензин, 120 000 км">
      </div>
      <div class="field">
        <label for="symptom">Что происходит?</label>
        <textarea id="symptom" placeholder="Например: на холодную стучит спереди слева на кочках, после прогрева почти пропадает"></textarea>
      </div>
      <button class="btn" id="go">Разобрать</button>
      <div class="err" id="err"></div>
      <p class="fineprint">Предварительная оценка на основе описания. Не заменяет очную диагностику.</p>
    </div>

    <!-- СКАН -->
    <div class="scan" id="scan">
      <div class="scanbar"><i></i></div>
      <div class="scan-status" id="scanStatus">Считываю симптом…</div>
    </div>

    <!-- РЕЗУЛЬТАТ -->
    <div class="results" id="results">
      <div class="summary" id="summary"></div>
      <div class="section-title">Вероятные причины</div>
      <div id="causes"></div>

      <div class="paywall" id="paywall">
        <h3>Открыть полный разбор</h3>
        <p>Сейчас видно только сами причины. Полный разбор — почему это, как проверить, насколько срочно и сколько примерно стоит починка.</p>
        <button class="btn pay" id="pay">Открыть за <span class="price">49&nbsp;₽</span></button>
      </div>

      <div class="disclaimer" id="disclaimer"></div>
    </div>
  </div>

  <footer>
    Автосимптом — предварительная подсказка, а не приговор. Точный диагноз ставит мастер на подъёмнике.
    <div style="margin-top:14px;color:var(--faint);font-size:.8rem;line-height:1.7">
      Самозанятый Агаев Теймур Азизович · ИНН 690707062421<br>
      Приём оплаты через ЮKassa · Чек регистрируется в сервисе «Мой налог»
    </div>
    <div style="margin-top:12px">
      <a href="/oferta.html" style="color:var(--muted);text-decoration:underline">Публичная оферта</a>
    </div>
  </footer>

<script>
  // ── Адрес твоего воркера ──
  const WORKER_URL = "https://avtosimptom.34agaev34.workers.dev/";

  const $ = id => document.getElementById(id);
  const go = $("go"), scan = $("scan"), results = $("results"), err = $("err");
  let lastData = null;   // сюда кладём ответ, чтобы «разблокировать» после оплаты
  let paid = false;

  const statuses = ["Считываю симптом…","Сверяю с базой неисправностей…","Готовлю разбор…"];

  go.addEventListener("click", diagnose);
  $("symptom").addEventListener("keydown", e => {
    if ((e.ctrlKey||e.metaKey) && e.key === "Enter") diagnose();
  });

  async function diagnose(){
    const symptom = $("symptom").value.trim();
    const car = $("car").value.trim();
    err.classList.remove("on");
    if (symptom.length < 3){
      showError("Опиши проблему чуть подробнее — пары слов мало, чтобы понять машину.");
      return;
    }

    go.disabled = true; go.textContent = "Разбираю…";
    results.classList.remove("on");
    scan.classList.add("on");
    let si = 0; $("scanStatus").textContent = statuses[0];
    const rot = setInterval(()=>{ si=(si+1)%statuses.length; $("scanStatus").textContent = statuses[si]; }, 1100);

    try{
      const r = await fetch(WORKER_URL, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ symptom, car })
      });
      const data = await r.json();
      clearInterval(rot); scan.classList.remove("on");

      if (!r.ok || data.error){
        showError(data.error || "Не получилось получить разбор. Попробуй ещё раз через минуту.");
        return;
      }
      lastData = data; paid = false;
      render(data);
    }catch(e){
      clearInterval(rot); scan.classList.remove("on");
      showError("Нет связи с сервисом. Проверь интернет и попробуй снова.");
    }finally{
      go.disabled = false; go.textContent = "Разобрать";
    }
  }

  function showError(msg){
    err.textContent = msg; err.classList.add("on");
  }

  // ургентность → класс индикатора
  function urgencyClass(u=""){
    u = u.toLowerCase();
    if (u.includes("опас")||u.includes("срочно")) return "red";
    if (u.includes("сервис")||u.includes("тянуть")) return "amber";
    return "green";
  }
  function likelihoodFill(l=""){
    l = l.toLowerCase();
    if (l.includes("высок")) return 3;
    if (l.includes("средн")) return 2;
    return 1;
  }

  function render(d){
    $("summary").textContent = d.summary || "";
    $("disclaimer").textContent = d.disclaimer || "";

    const box = $("causes"); box.innerHTML = "";
    (d.causes || []).forEach(c => {
      const uc = urgencyClass(c.urgency);
      const fill = likelihoodFill(c.likelihood);
      const el = document.createElement("div");
      el.className = "cause" + (paid ? "" : " locked");
      el.innerHTML = `
        <div class="cause-head">
          <span class="lamp ${uc}"></span>
          <span class="cause-title">${esc(c.title||"")}</span>
        </div>
        <div class="meter">
          <span class="meter-label">Вероятность</span>
          <span class="bars">
            <i class="${fill>=1?'fill':''}"></i>
            <i class="${fill>=2?'fill':''}"></i>
            <i class="${fill>=3?'fill':''}"></i>
          </span>
        </div>
        <div class="detail">
          ${c.explanation?`<p><b>Почему</b>${esc(c.explanation)}</p>`:""}
          ${c.check?`<p><b>Как проверить</b>${esc(c.check)}</p>`:""}
          ${c.urgency?`<span class="tag ${uc}">${esc(c.urgency)}</span>`:""}
          ${c.cost_hint?`<span class="tag amber" style="margin-left:6px">Затраты: ${esc(c.cost_hint)}</span>`:""}
        </div>`;
      box.appendChild(el);
    });

    // блок «первый шаг» — часть полного разбора
    if (d.first_step){
      const fs = document.createElement("div");
      fs.className = "cause" + (paid ? "" : " locked");
      fs.innerHTML = `<div class="cause-head"><span class="lamp amber"></span>
        <span class="cause-title">С чего начать</span></div>
        <div class="detail"><p>${esc(d.first_step)}</p></div>`;
      box.appendChild(fs);
    }

    $("paywall").style.display = paid ? "none" : "block";
    results.classList.add("on");
    results.scrollIntoView({behavior:"smooth", block:"start"});
  }

  // ── ЗАГЛУШКА ОПЛАТЫ ──
  // Пока просто открывает разбор. Сюда встанет ЮKassa (следующий шаг).
  $("pay").addEventListener("click", ()=>{
    paid = true;
    render(lastData);
  });

  function esc(s){ return String(s).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }
</script>
</body>
</html>
