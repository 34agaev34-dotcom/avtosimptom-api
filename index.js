// ═══════════════════════════════════════════════════════════════════
//  Автосимптом — бэкенд на Node.js/Express (для Timeweb App Platform)
//
//  Логика оплаты «сначала деньги — потом полный разбор»:
//    1) POST /diagnose        — бесплатный тизер: только НАЗВАНИЯ причин.
//                               Полный разбор считается и прячется на сервере.
//    2) POST /create-payment  — создаёт платёж в ЮKassa (49 ₽) + чек в Мой налог.
//    3) GET  /result          — отдаёт полный разбор ТОЛЬКО если платёж оплачен.
//
//  Полные детали НИКОГДА не уходят в браузер до подтверждённой оплаты —
//  в этом вся суть. Проверку оплаты делает сервер, а не сайт.
// ═══════════════════════════════════════════════════════════════════

const express = require("express");
const crypto = require("crypto");
const app = express();
app.use(express.json());

// ── CORS: разрешаем сайту обращаться к бэкенду ──
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// ── Настройки продукта ──
const PRICE = "49.00";                 // цена одной диагностики, рубли
const PRODUCT_NAME = "Разбор симптома авто — Автосимптом";
const RETURN_URL = "https://avtosimptom.ru/?paid=1"; // куда ЮKassa вернёт после оплаты

// ── YandexGPT ──
const FOLDER_ID = "b1ghisevrbmml9ajua1f";
const MODEL_URI = `gpt://${FOLDER_ID}/yandexgpt/latest`;
const YANDEX_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

// ── ЮKassa ──
const YOOKASSA_URL = "https://api.yookassa.ru/v3/payments";
const SHOP_ID = process.env.YOOKASSA_SHOP_ID;      // 1421124 — задаётся в переменных Timeweb
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY; // live_... — задаётся в переменных Timeweb

// Basic-авторизация для ЮKassa: base64("shopId:secretKey")
function yookassaAuthHeader() {
  return "Basic " + Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString("base64");
}

// «Характер» модели — главный актив продукта
const SYSTEM_PROMPT = `Ты — опытный автодиагност и мастер-приёмщик СТО с большим стажем.
Ты хорошо знаешь автомобили, распространённые в России: Lada (ВАЗ), Kia, Hyundai,
Renault, Volkswagen, Skoda, Toyota, Nissan, Chevrolet, а также подержанные иномарки.

Пользователь описывает симптом простыми, часто неточными словами.
Твоя задача — выдать вероятные причины поломки, ранжированные по вероятности,
понятным языком, без лишнего технического жаргона.

Правила:
- Если марка/модель/год не указаны — рассуждай в общем, но точность выше при уточнении.
- Всегда указывай, что реально проверить, чтобы подтвердить или исключить причину.
- Честно отмечай срочность: если дело касается тормозов, рулевого или ходовой —
  безопасность важнее, так и говори.
- Не выдумывай точные цены — давай порядок затрат словами.
- Это предварительная подсказка, а не замена очной диагностике.

Отвечай СТРОГО валидным JSON, без markdown и без текста вокруг. Схема:
{
  "summary": "1-2 предложения: что, скорее всего, происходит",
  "causes": [
    {
      "title": "краткое название причины",
      "likelihood": "высокая | средняя | низкая",
      "explanation": "почему это подходит под симптом, простым языком",
      "check": "как проверить или подтвердить",
      "urgency": "можно ездить | не тянуть, скоро в сервис | срочно, ехать опасно",
      "cost_hint": "недорого | средне | дорого"
    }
  ],
  "first_step": "что сделать в первую очередь",
  "disclaimer": "Предварительная оценка, не заменяет очную диагностику"
}
Дай от 2 до 5 причин, самые вероятные — первыми.`;

// ═══════════════════════════════════════════════════════════════════
//  Хранилище черновиков в памяти (чтобы не считать разбор дважды).
//  draftId  → { full, symptom, car, ts }
//  paymentId→ { draftId, ts }
//  Живёт 60 минут. Если сервер перезапустится и черновик пропадёт —
//  не страшно: симптом продублирован в metadata платежа, разбор пересоберётся.
// ═══════════════════════════════════════════════════════════════════
const drafts = new Map();
const payments = new Map();
const TTL_MS = 60 * 60 * 1000;

function gc() {
  const now = Date.now();
  for (const [k, v] of drafts) if (now - v.ts > TTL_MS) drafts.delete(k);
  for (const [k, v] of payments) if (now - v.ts > TTL_MS) payments.delete(k);
}

// ── Обращение к YandexGPT: симптом → полный разбор (объект) ──
async function generate(symptom, car) {
  const userMsg = car ? `Автомобиль: ${car}\nПроблема: ${symptom}` : `Проблема: ${symptom}`;
  const yaBody = {
    modelUri: MODEL_URI,
    completionOptions: { stream: false, temperature: 0.3, maxTokens: "2000" },
    messages: [
      { role: "system", text: SYSTEM_PROMPT },
      { role: "user", text: userMsg },
    ],
  };

  const resp = await fetch(YANDEX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${process.env.YANDEX_API_KEY}`,
    },
    body: JSON.stringify(yaBody),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Yandex ${resp.status}: ${detail.slice(0, 300)}`);
  }

  const data = await resp.json();
  const raw = data?.result?.alternatives?.[0]?.message?.text || "";
  const parsed = safeParse(raw);
  if (!parsed) throw new Error("Не удалось разобрать ответ модели");
  return parsed;
}

// YandexGPT иногда оборачивает JSON в ```json ... ``` — аккуратно достаём
function safeParse(s) {
  let t = s.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a !== -1 && b !== -1) t = t.slice(a, b + 1);
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

// Тизер: из полного разбора оставляем только то, что видно бесплатно
function toTeaser(full) {
  return {
    summary: full.summary || "",
    causes: (full.causes || []).map((c) => ({
      title: c.title || "",
      likelihood: c.likelihood || "",
      urgency: c.urgency || "",
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════
//  Healthcheck
// ═══════════════════════════════════════════════════════════════════
app.get("/health", (req, res) => res.status(200).send("ok"));
app.get("/", (req, res) => res.status(200).send("ok"));

// ═══════════════════════════════════════════════════════════════════
//  1) БЕСПЛАТНЫЙ ТИЗЕР
//  POST /diagnose  { symptom, car }
//  → { draftId, summary, causes:[{title,likelihood,urgency}] }
// ═══════════════════════════════════════════════════════════════════
app.post("/diagnose", async (req, res) => {
  gc();
  const body = req.body || {};
  const symptom = (body.symptom || "").toString().trim();
  const car = (body.car || "").toString().trim();

  if (symptom.length < 3) {
    return res.status(400).json({ error: "Опишите проблему подробнее" });
  }

  let full;
  try {
    full = await generate(symptom, car);
  } catch (e) {
    console.error("generate failed:", e.message);
    return res.status(502).json({ error: "Не удалось получить разбор. Попробуйте ещё раз." });
  }

  const draftId = crypto.randomUUID();
  drafts.set(draftId, { full, symptom, car, ts: Date.now() });

  return res.json({ draftId, ...toTeaser(full) });
});

// ═══════════════════════════════════════════════════════════════════
//  2) СОЗДАНИЕ ПЛАТЕЖА
//  POST /create-payment  { draftId, symptom, car, email }
//  → { confirmationUrl, paymentId }
// ═══════════════════════════════════════════════════════════════════
app.post("/create-payment", async (req, res) => {
  gc();
  if (!SHOP_ID || !SECRET_KEY) {
    console.error("YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY не заданы в переменных");
    return res.status(500).json({ error: "Оплата временно недоступна. Настройки не заданы." });
  }

  const body = req.body || {};
  const draftId = (body.draftId || "").toString();
  const email = (body.email || "").toString().trim();
  // симптом/машину дублируем в metadata — страховка на случай перезапуска сервера
  const symptom = (body.symptom || drafts.get(draftId)?.symptom || "").toString().slice(0, 480);
  const car = (body.car || drafts.get(draftId)?.car || "").toString().slice(0, 120);

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Укажите email — на него придёт чек" });
  }
  if (symptom.length < 3) {
    return res.status(400).json({ error: "Симптом не найден, начните заново" });
  }

  const paymentBody = {
    amount: { value: PRICE, currency: "RUB" },
    capture: true,
    confirmation: { type: "redirect", return_url: RETURN_URL },
    description: PRODUCT_NAME,
    metadata: { draftId, symptom, car },
    // Чек для самозанятого → ЮKassa зарегистрирует его в «Мой налог»
    receipt: {
      customer: { email },
      items: [
        {
          description: PRODUCT_NAME,
          quantity: "1.00",
          amount: { value: PRICE, currency: "RUB" },
          vat_code: 1,               // 1 = без НДС (для НПД самозанятого)
          payment_subject: "service", // услуга
          payment_mode: "full_payment",
        },
      ],
    },
  };

  let resp;
  try {
    resp = await fetch(YOOKASSA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": crypto.randomUUID(), // защита от дублей
        Authorization: yookassaAuthHeader(),
      },
      body: JSON.stringify(paymentBody),
    });
  } catch (e) {
    console.error("YooKassa fetch failed:", e.message);
    return res.status(502).json({ error: "Не удалось связаться с ЮKassa" });
  }

  const pay = await resp.json();
  if (!resp.ok) {
    console.error("YooKassa error:", resp.status, JSON.stringify(pay).slice(0, 400));
    return res.status(502).json({ error: "ЮKassa отклонила платёж", detail: pay });
  }

  const confirmationUrl = pay?.confirmation?.confirmation_url;
  const paymentId = pay?.id;
  if (!confirmationUrl || !paymentId) {
    return res.status(502).json({ error: "ЮKassa не вернула ссылку на оплату" });
  }

  payments.set(paymentId, { draftId, ts: Date.now() });
  return res.json({ confirmationUrl, paymentId });
});

// ═══════════════════════════════════════════════════════════════════
//  3) ВЫДАЧА ПОЛНОГО РАЗБОРА ПОСЛЕ ОПЛАТЫ
//  GET /result?paymentId=xxx
//  → { paid:true, ...full }   или   { paid:false, status }
// ═══════════════════════════════════════════════════════════════════
app.get("/result", async (req, res) => {
  gc();
  if (!SHOP_ID || !SECRET_KEY) {
    return res.status(500).json({ error: "Настройки оплаты не заданы" });
  }

  const paymentId = (req.query.paymentId || "").toString();
  if (!paymentId) return res.status(400).json({ error: "Нет paymentId" });

  // Спрашиваем ЮKassa: платёж действительно оплачен?
  let resp;
  try {
    resp = await fetch(`${YOOKASSA_URL}/${paymentId}`, {
      headers: { Authorization: yookassaAuthHeader() },
    });
  } catch (e) {
    console.error("YooKassa status fetch failed:", e.message);
    return res.status(502).json({ error: "Не удалось проверить оплату" });
  }

  const pay = await resp.json();
  if (!resp.ok) {
    return res.status(502).json({ error: "ЮKassa не нашла платёж" });
  }

  if (pay.status !== "succeeded") {
    // pending / canceled / waiting_for_capture
    return res.json({ paid: false, status: pay.status });
  }

  // Оплачено. Достаём полный разбор: сначала из кэша, иначе пересобираем.
  const link = payments.get(paymentId);
  const draftId = link?.draftId || pay?.metadata?.draftId;
  let full = draftId ? drafts.get(draftId)?.full : null;

  if (!full) {
    // Кэш пропал (перезапуск сервера) — берём симптом из metadata и считаем заново
    const symptom = pay?.metadata?.symptom || "";
    const car = pay?.metadata?.car || "";
    if (symptom.length < 3) {
      return res.status(500).json({ error: "Оплата прошла, но данные симптома потеряны. Напишите в поддержку." });
    }
    try {
      full = await generate(symptom, car);
    } catch (e) {
      console.error("regenerate failed:", e.message);
      return res.status(502).json({ error: "Оплата прошла, готовим разбор — обновите страницу через минуту." });
    }
  }

  return res.json({ paid: true, ...full });
});

// ── Порт от Timeweb ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Автосимптом-бэкенд слушает порт " + PORT));
