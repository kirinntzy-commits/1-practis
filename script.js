/**
 * script.js — Практикалық жұмыс №1
 * Барлық интерактивтілік: ЖИ-чат, тақырып ауысу, анимациялар, санауыш
 *
 * ⚠️ API_KEY өрісіне өзіңіздің Anthropic кілтіңізді енгізіңіз.
 *    console.anthropic.com → API Keys
 */

// ============================================================
// КОНФИГУРАЦИЯ
// ============================================================

/** @type {string} Anthropic API кілті — осы жерге енгізіңіз */
const API_KEY = "YOUR_CLAUDE_API_KEY_HERE";

/** @type {string} Қолданылатын Claude моделі */
const MODEL = "claude-opus-4-5";

/** @type {number} Максималды токен саны */
const MAX_TOKENS = 1024;

// ============================================================
// КҮЙЛЕР (STATE)
// ============================================================

/** @type {number} Жіберілген сұраныстар санауышы */
let requestCount = 0;

/** @type {Array<{role: string, content: string}>} Чат тарихы */
let chatHistory = [];

// ============================================================
// DOM ЭЛЕМЕНТТЕРІ
// ============================================================

const chatMessages  = document.getElementById("chatMessages");
const userInput     = document.getElementById("userInput");
const sendBtn       = document.getElementById("sendBtn");
const requestCountEl= document.getElementById("requestCount");
const themeToggle   = document.getElementById("themeToggle");
const themeIcon     = themeToggle.querySelector(".theme-icon");

// ============================================================
// 1. ЖИ-ЧАТ ФУНКЦИЯЛАРЫ
// ============================================================

/**
 * Чат терезесіне жаңа хабарлама қосады.
 * @param {string} role       - "user" немесе "assistant"
 * @param {string} text       - Хабарлама мәтіні
 * @param {boolean} isTyping  - Жүктелу индикаторы ма?
 * @returns {HTMLElement}     - Жасалған хабарлама элементі
 */
function appendMessage(role, text, isTyping = false) {
  const msgDiv    = document.createElement("div");
  msgDiv.className = `chat-msg ${role}${isTyping ? " typing" : ""}`;

  const bubble    = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;

  msgDiv.appendChild(bubble);
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msgDiv;
}

/**
 * Хабарлама мәтінін жаңартады (typing индикаторын ауыстыру үшін).
 * @param {HTMLElement} msgEl - appendMessage қайтарған элемент
 * @param {string} newText    - Жаңа мәтін
 */
function updateMessage(msgEl, newText) {
  const bubble = msgEl.querySelector(".msg-bubble");
  if (bubble) bubble.textContent = newText;
  msgEl.classList.remove("typing");
}

/**
 * Сұраныстар санауышын арттырады және UI-ді жаңартады.
 */
function incrementCounter() {
  requestCount++;
  requestCountEl.textContent = requestCount;
}

/**
 * Claude API-ге сұраныс жібереді және жауапты чатта көрсетеді.
 * @param {string} userText - Пайдаланушы енгізген мәтін
 */
async function sendToClaudeAPI(userText) {
  // Пайдаланушы хабарламасын тарихқа қосу
  chatHistory.push({ role: "user", content: userText });

  // Typing индикаторын көрсету
  const typingEl = appendMessage("assistant", "Жауап жазылуда...", true);

  sendBtn.disabled = true;
  incrementCounter();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        // CORS proxy арқылы жұмыс жасау үшін:
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: "Сен ЖИ-бағдарламалау бойынша көмекшісің. Қысқа, анық жауаптар бер. Қазақ немесе орыс тілінде сұрақ берілсе, сол тілде жауап бер.",
        messages: chatHistory
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const assistantText = data.content?.[0]?.text || "Жауап алынбады.";

    // Жауапты тарихқа қосу
    chatHistory.push({ role: "assistant", content: assistantText });

    // Typing индикаторын жауаппен ауыстыру
    updateMessage(typingEl, assistantText);

  } catch (err) {
    console.error("Claude API қатесі:", err);

    let errMsg = "⚠️ Қате: " + err.message;

    if (API_KEY === "YOUR_CLAUDE_API_KEY_HERE") {
      errMsg = "⚠️ API кілті орнатылмаған. script.js файлындағы API_KEY өрісіне кілтіңізді енгізіңіз.";
    } else if (err.message.includes("401")) {
      errMsg = "⚠️ API кілті дұрыс емес. Тексеріп қайталаңыз.";
    } else if (err.message.includes("CORS") || err.message.includes("Failed to fetch")) {
      errMsg = "⚠️ CORS қатесі. Кодты Node.js/сервер арқылы іске қосыңыз немесе прокси пайдаланыңыз.";
    }

    updateMessage(typingEl, errMsg);
    // Сәтсіз сұранысты тарихтан алып тастау
    chatHistory.pop();
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
}

/**
 * "Жіберу" батырмасы немесе Enter басылғанда шақырылады.
 * Енгізу өрісін тексеріп, API функциясын шақырады.
 */
function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage("user", text);
  userInput.value = "";

  sendToClaudeAPI(text);
}

// Батырма оқиғасы
sendBtn.addEventListener("click", handleSend);

// Enter пернесін өңдеу
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// ============================================================
// 2. ТАҚЫРЫП АУЫСТЫРУ (DARK / LIGHT MODE)
// ============================================================

/**
 * Жарық / қараңғы тақырыпты ауыстырады.
 * CSS айнымалыларды body класы арқылы басқарады.
 * Таңдауды localStorage-ке сақтайды.
 */
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  themeIcon.textContent = isDark ? "☽" : "☀";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

themeToggle.addEventListener("click", toggleTheme);

/**
 * Бет жүктелгенде сақталған тақырыпты қолданады.
 */
function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.body.classList.add("dark-mode");
    themeIcon.textContent = "☽";
  }
}

initTheme();

// ============================================================
// 3. КАРТОЧКАЛАР АНИМАЦИЯСЫ — IntersectionObserver
// ============================================================

/**
 * Карточкаларды айналдыру кезінде анимациямен пайда болдырады.
 * CSS-тегі opacity: 0 → 1 және translateY жылжуын іске қосады.
 */
function initCardAnimations() {
  const cards = document.querySelectorAll(".card");

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target); // Бір рет анимация
        }
      });
    },
    {
      threshold: 0.12,   // Карточканың 12% көрінгенде іске қосу
      rootMargin: "0px"
    }
  );

  cards.forEach(function (card) {
    observer.observe(card);
  });
}

initCardAnimations();
