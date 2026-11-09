(() => {
  const STORAGE_KEY = "nexus.conversation_id";
  const form = document.getElementById("chat-form");
  const input = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const messages = document.getElementById("messages");
  const welcomeCard = document.getElementById("welcome-card");
  const connection = document.getElementById("connection-state");
  const connectionLabel = document.getElementById("connection-label");
  const modePill = document.getElementById("mode-pill");
  const conversationLabel = document.getElementById("conversation-label");
  const newChatButton = document.getElementById("new-chat");
  const voiceToggle = document.getElementById("voice-toggle");
  const voiceStop = document.getElementById("voice-stop");
  const VOICE_STORAGE_KEY = "nexus.voice_enabled";
  let voiceEnabled = localStorage.getItem(VOICE_STORAGE_KEY) === "true";
  const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  function makeConversationId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "session-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  let conversationId = localStorage.getItem(STORAGE_KEY) || makeConversationId();
  localStorage.setItem(STORAGE_KEY, conversationId);

  function updateConversationLabel() {
    conversationLabel.textContent = conversationId.slice(0, 8) + "…";
  }

  function scrollToLatest() {
    messages.scrollTop = messages.scrollHeight;
  }

  function showWelcome(show) {
    welcomeCard.hidden = !show;
  }

  function speakText(content) {
    if (!speechSupported || !content) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = "ru-RU";
    utterance.rate = 0.98;
    const voices = window.speechSynthesis.getVoices();
    const russianVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("ru"));
    if (russianVoice) utterance.voice = russianVoice;
    utterance.onstart = () => { voiceStop.hidden = false; };
    utterance.onend = () => { voiceStop.hidden = true; };
    utterance.onerror = () => { voiceStop.hidden = true; };
    window.speechSynthesis.speak(utterance);
  }

  function updateVoiceControls() {
    voiceToggle.disabled = !speechSupported;
    voiceToggle.setAttribute("aria-pressed", String(voiceEnabled));
    voiceToggle.textContent = speechSupported
      ? (voiceEnabled ? "Озвучка: вкл." : "Озвучка: выкл.")
      : "Озвучка недоступна";
    voiceToggle.title = speechSupported
      ? "Автоматически озвучивать новые ответы"
      : "Браузер не поддерживает синтез речи";
  }

  function addMessage(role, content, timestamp, isError = false) {
    showWelcome(false);
    const article = document.createElement("article");
    article.className = "message " + role + (isError ? " error" : "");

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = role === "user" ? "В" : "N";

    const body = document.createElement("div");
    body.className = "message-body";

    const heading = document.createElement("div");
    heading.className = "message-heading";
    const label = role === "user" ? "ВЫ" : "NEXUS";
    const time = timestamp ? new Date(timestamp).toLocaleTimeString("ru-RU", {hour: "2-digit", minute: "2-digit"}) : "";
    heading.textContent = time ? label + " · " + time : label;

    const text = document.createElement("div");
    text.className = "message-content";
    text.textContent = content;

    body.append(heading, text);
    if (role === "assistant" && !isError && speechSupported) {
      const speakButton = document.createElement("button");
      speakButton.className = "speak-button";
      speakButton.type = "button";
      speakButton.textContent = "🔊 Слушать";
      speakButton.addEventListener("click", () => speakText(content));
      body.append(speakButton);
    }
    article.append(avatar, body);
    messages.append(article);
    scrollToLatest();
    return article;
  }

  function setConnection(state, label) {
    connection.dataset.state = state;
    connectionLabel.textContent = label;
  }

  async function checkHealth() {
    try {
      const response = await fetch("/health");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const health = await response.json();
      setConnection("online", "Ядро на связи");
      modePill.textContent = health.mode === "llm" ? "Модель подключена" : "Встроенный режим";
    } catch (error) {
      setConnection("offline", "Нет связи с ядром");
      modePill.textContent = "Недоступно";
    }
  }

  async function loadHistory() {
    updateConversationLabel();
    try {
      const response = await fetch("/memory/recent/" + encodeURIComponent(conversationId) + "?limit=100");
      if (!response.ok) throw new Error("Не удалось загрузить историю");
      const data = await response.json();
      messages.querySelectorAll(".message").forEach((node) => node.remove());
      if (!data.messages.length) {
        showWelcome(true);
        return;
      }
      data.messages.forEach((item) => addMessage(item.role, item.content, item.created_at));
    } catch (error) {
      addMessage("assistant", "Не удалось загрузить историю диалога: " + error.message, null, true);
    }
  }

  async function sendMessage(message) {
    sendButton.disabled = true;
    input.disabled = true;
    addMessage("user", message);
    const pending = addMessage("assistant", "Передаю сообщение ядру…");
    pending.classList.add("pending");

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({conversation_id: conversationId, message})
      });
      const payload = await response.json();
      if (!response.ok) {
        const detail = payload.detail || ("HTTP " + response.status);
        throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
      }
      pending.remove();
      addMessage("assistant", payload.reply);
      await checkHealth();
    } catch (error) {
      pending.remove();
      addMessage("assistant", "Не удалось получить ответ: " + error.message, null, true);
    } finally {
      sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || sendButton.disabled) return;
    input.value = "";
    input.style.height = "auto";
    sendMessage(message);
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 180) + "px";
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  voiceToggle.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;
    localStorage.setItem(VOICE_STORAGE_KEY, String(voiceEnabled));
    updateVoiceControls();
    if (!voiceEnabled && speechSupported) window.speechSynthesis.cancel();
  });

  voiceStop.addEventListener("click", () => {
    if (speechSupported) window.speechSynthesis.cancel();
    voiceStop.hidden = true;
  });

  newChatButton.addEventListener("click", () => {
    conversationId = makeConversationId();
    localStorage.setItem(STORAGE_KEY, conversationId);
    messages.querySelectorAll(".message").forEach((node) => node.remove());
    showWelcome(true);
    updateConversationLabel();
    input.focus();
  });

  updateVoiceControls();
  if (speechSupported) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", () => window.speechSynthesis.getVoices());
  }
  Promise.all([checkHealth(), loadHistory()]);
})();
