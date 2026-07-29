// ═══════════════════════════════════════════════════════════════════
//  Автосимптом — бэкенд на Node.js/Express (для Timeweb App Platform)
//  Принимает симптом → спрашивает YandexGPT → возвращает разбор причин
//  Перенос воркера с Cloudflare, чтобы работало из РФ без ВПН.
// ═══════════════════════════════════════════════════════════════════

const express = require("express");
const app = express();
app.use(express.json());

// CORS — чтобы сайт мог обращаться к этому бэкенду
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// Твой каталог из Yandex AI Studio (НЕ секретный, можно хранить в коде)
const FOLDER_ID = "b1ghisevrbmml9ajua1f";
const MODEL_URI = `gpt://${FOLDER_ID}/yandexgpt/latest`;
const YANDEX_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

// «Характер» модели — главный актив продукта, тут вся ценность
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

// Healthcheck — чтобы Timeweb видел, что приложение живо
app.get("/", (req, res) => res.status(200).send("ok"));
app.get("/health", (req, res) => res.status(200).send("ok"));

// Основной эндпоинт — сюда стучится кнопка «Разобрать»
app.post("/", async (req, res) => {
  const body = req.body || {};
  const symptom = (body.symptom || "").toString().trim();
  if (symptom.length < 3) {
    return res.status(400).json({ error: "Опишите проблему подробнее" });
  }

  const car = (body.car || "").toString().trim();
  const userMsg = car ? `Автомобиль: ${car}\nПроблема: ${symptom}` : `Проблема: ${symptom}`;

  const yaBody = {
    modelUri: MODEL_URI,
    completionOptions: { stream: false, temperature: 0.3, maxTokens: "2000" },
    messages: [
      { role: "system", text: SYSTEM_PROMPT },
      { role: "user", text: userMsg },
    ],
  };

  let resp;
  try {
    resp = await fetch(YANDEX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Api-Key ${process.env.YANDEX_API_KEY}`,
      },
      body: JSON.stringify(yaBody),
    });
  } catch (e) {
    console.error("Yandex fetch failed:", e);
    return res.status(502).json({ error: "Не удалось связаться с YandexGPT" });
  }

  if (!resp.ok) {
    const detail = await resp.text();
    console.error("Yandex error:", resp.status, detail.slice(0, 400));
    return res.status(502).json({
      error: "YandexGPT вернул ошибку",
      status: resp.status,
      detail: detail.slice(0, 400),
    });
  }

  const data = await resp.json();
  const raw = data?.result?.alternatives?.[0]?.message?.text || "";
  const parsed = safeParse(raw);
  if (!parsed) {
    return res.status(502).json({ error: "Не удалось разобрать ответ модели", raw: raw.slice(0, 600) });
  }

  return res.json(parsed);
});

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

// ВАЖНО: слушаем порт, который выдаёт Timeweb (не хардкодим!)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Автосимптом-бэкенд слушает порт " + PORT));
