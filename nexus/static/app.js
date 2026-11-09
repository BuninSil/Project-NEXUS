(() => {
  const STORAGE_KEY = "nexus.conversation_id";
  const VOICE_STORAGE_KEY = "nexus.voice_enabled";
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
  const voiceModeToggle = document.getElementById("voice-mode-toggle");
  const voiceStatus = document.getElementById("voice-status");
  const memoryOpen = document.getElementById("memory-open");
  const memoryOverlay = document.getElementById("memory-overlay");
  const memoryClose = document.getElementById("memory-close");
  const memoryForm = document.getElementById("memory-create-form");
  const memoryContent = document.getElementById("memory-content");
  const memoryCategory = document.getElementById("memory-category");
  const memorySearch = document.getElementById("memory-search");
  const memoryList = document.getElementById("memory-list");
  const memoryStatus = document.getElementById("memory-status");
  const memoryExport = document.getElementById("memory-export");
  let voiceEnabled = localStorage.getItem(VOICE_STORAGE_KEY) === "true";
  const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionSupported = Boolean(SpeechRecognition);

  let conversationId = localStorage.getItem(STORAGE_KEY) || makeConversationId();
  let recognition = null;
  let voiceModeActive = false;
  let voiceBusy = false;
  let speaking = false;
  let silenceTimer = null;
  let pendingTranscript = "";

  function makeConversationId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "session-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  localStorage.setItem(STORAGE_KEY, conversationId);

  function setMemoryStatus(message, isError = false) {
    memoryStatus.textContent = message;
    memoryStatus.dataset.state = isError ? "error" : "ok";
  }

  function memoryCategoryLabel(category) {
    return ({
      fact: "Факт", preference: "Предпочтение", goal: "Цель",
      project: "Проект", procedure: "Инструкция", other: "Другое"
    })[category] || category;
  }

  function renderMemories(items) {
    memoryList.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "memory-empty";
      empty.textContent = "Пока здесь пусто. Добавь первую подтверждённую запись.";
      memoryList.append(empty);
      return;
    }
    for (const item of items) {
      const card = document.createElement("article");
      card.className = "memory-item";
      const content = document.createElement("p");
      content.className = "memory-item-content";
      content.textContent = item.content;
      const meta = document.createElement("div");
      meta.className = "memory-item-meta";
      meta.textContent = memoryCategoryLabel(item.category) + " · " +
        new Date(item.updated_at).toLocaleString("ru-RU");
      const actions = document.createElement("div");
      actions.className = "memory-item-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Изменить";
      edit.addEventListener("click", async () => {
        const revised = window.prompt("Исправить запись памяти:", item.content);
        if (revised === null || !revised.trim()) return;
        try {
          const response = await fetch("/memory/" + item.id, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({content: revised.trim()})
          });
          if (!response.ok) throw new Error("HTTP " + response.status);
          await loadMemories();
          setMemoryStatus("Запись обновлена.");
        } catch (error) { setMemoryStatus("Не удалось обновить запись: " + error.message, true); }
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "memory-delete";
      remove.textContent = "Удалить";
      remove.addEventListener("click", async () => {
        if (!window.confirm("Удалить эту запись из памяти NEXUS?")) return;
        try {
          const response = await fetch("/memory/" + item.id, {method: "DELETE"});
          if (!response.ok) throw new Error("HTTP " + response.status);
          await loadMemories();
          setMemoryStatus("Запись удалена.");
        } catch (error) { setMemoryStatus("Не удалось удалить запись: " + error.message, true); }
      });
      actions.append(edit, remove);
      card.append(content, meta, actions);
      memoryList.append(card);
    }
  }

  async function loadMemories(query = memorySearch.value.trim()) {
    try {
      const params = new URLSearchParams({limit: "500"});
      if (query) params.set("query", query);
      const response = await fetch("/memory?" + params.toString());
      if (!response.ok) throw new Error("HTTP " + response.status);
      const payload = await response.json();
      renderMemories(payload.items);
      setMemoryStatus("Записей в памяти: " + payload.items.length);
    } catch (error) {
      setMemoryStatus("Не удалось загрузить память: " + error.message, true);
    }
  }

  function openMemoryPanel() {
    memoryOverlay.hidden = false;
    memorySearch.value = "";
    loadMemories("");
    memoryContent.focus();
  }

  function closeMemoryPanel() {
    memoryOverlay.hidden = true;
    memoryOpen.focus();
  }

  function updateConversationLabel() {
    conversationLabel.textContent = conversationId.slice(0, 8) + "…";
  }

  function scrollToLatest() { messages.scrollTop = messages.scrollHeight; }
  function showWelcome(show) { welcomeCard.hidden = !show; }

  function setVoiceStatus(message, state) {
    voiceStatus.textContent = message;
    voiceStatus.dataset.state = state || "idle";
  }

  // Browser voices differ in how they read Latin product names and Russian stress.
  // Normalize only the spoken copy; the visible chat message remains untouched.
  const SPEECH_REPLACEMENTS = [
    ["FastAPI", "Фаст Эй-Пи-Ай"],
    ["NEXUS", "Нексус"],
    ["Uvicorn", "Ювикорн"],
    ["Python", "Пайтон"],
    ["GitHub", "ГитХаб"],
    ["Windows", "Виндоус"],
    ["Chrome", "Хром"],
    ["Chromium", "Хромиум"],
    ["Edge", "Эдж"],
    ["HTTPS", "эйч-ти-ти-пи-эс"],
    ["HTTP", "эйч-ти-ти-пи"],
    ["API", "эй-пи-ай"],
    ["LLM", "эл-эл-эм"],
    ["JSON", "джейсон"],
    ["SQLite", "эс-кью-эл-айт"],
    ["SQL", "эс-кью-эл"],
    ["URL", "ю-ар-эл"],
    ["VPS", "ви-пи-эс"],
    ["VDS", "ви-ди-эс"],
    ["Git", "Гит"]
  ];

  const RUSSIAN_STRESS = [
    ["звонит", "звони\u0301т"],
    ["звонят", "звоня\u0301т"],
    ["договор", "догово\u0301р"],
    ["договоры", "догово\u0301ры"],
    ["каталог", "катало\u0301г"],
    ["квартал", "кварта\u0301л"],
    ["жалюзи", "жалюзи\u0301"],
    ["торты", "то\u0301рты"],
    ["средства", "сре\u0301дства"],
    ["обеспечение", "обеспе\u0301чение"],
    ["начать", "нача\u0301ть"],
    ["понял", "поня\u0301л"],
    ["поняла", "поняла\u0301"],
    ["принять", "приня\u0301ть"],
    ["создал", "созда\u0301л"],
    ["создала", "создала\u0301"],
    ["включит", "включи\u0301т"],
    ["включат", "включа\u0301т"],
    ["положить", "положи\u0301ть"],
    ["положил", "положи\u0301л"],
    ["положила", "положи\u0301ла"],
    ["красивее", "красиве\u0301е"],
    ["баловать", "балова\u0301ть"],
    ["ходатайство", "хода\u0301тайство"],
    ["исчерпать", "исче\u0301рпать"],
    ["щавель", "щаве\u0301ль"],
    ["эксперт", "экспе\u0301рт"],
    ["феномен", "фено\u0301мен"],
    ["диспансер", "диспансе\u0301р"],
    ["оптовый", "опто\u0301вый"]
  ];

  function replaceWholeWord(text, source, replacement) {
    // Every lexicon entry is a plain alphabetic word or acronym.
    const pattern = new RegExp("(^|[^A-Za-zА-Яа-яЁё0-9_])" + source + "(?=$|[^A-Za-zА-Яа-яЁё0-9_])", "giu");
    return text.replace(pattern, (_match, prefix) => prefix + replacement);
  }

  function prepareSpeechText(content) {
    let spoken = String(content || "");
    for (const [source, replacement] of SPEECH_REPLACEMENTS) {
      spoken = replaceWholeWord(spoken, source, replacement);
    }
    for (const [source, replacement] of RUSSIAN_STRESS) {
      spoken = replaceWholeWord(spoken, source, replacement);
    }
    return spoken;
  }

  function speakText(content, onFinished) {
    if (!speechSupported || !content) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(prepareSpeechText(content));
    utterance.lang = "ru-RU";
    utterance.rate = 0.98;
    const russianVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("ru"));
    if (russianVoice) utterance.voice = russianVoice;
    const finish = () => {
      speaking = false;
      voiceStop.hidden = true;
      if (typeof onFinished === "function") onFinished();
    };
    speaking = true;
    utterance.onstart = () => {
      voiceStop.hidden = false;
      if (voiceModeActive) setVoiceStatus("NEXUS отвечает…", "speaking");
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  function updateVoiceControls() {
    voiceToggle.disabled = !speechSupported;
    voiceToggle.setAttribute("aria-pressed", String(voiceEnabled));
    voiceToggle.textContent = speechSupported
      ? (voiceEnabled ? "Озвучка: вкл." : "Озвучка: выкл.")
      : "Озвучка недоступна";
    voiceModeToggle.disabled = !recognitionSupported;
    voiceModeToggle.textContent = voiceModeActive ? "Завершить голосовой режим" : "🎙 Голосовой режим";
    voiceModeToggle.setAttribute("aria-pressed", String(voiceModeActive));
    if (!recognitionSupported) setVoiceStatus("Распознавание речи недоступно в этом браузере", "error");
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

  function resumeVoiceMode() {
    if (!voiceModeActive || voiceBusy || speaking) return;
    setVoiceStatus("Слушаю…", "listening");
    window.setTimeout(() => {
      if (!voiceModeActive || voiceBusy || speaking) return;
      try { recognition.start(); } catch (error) { /* Recognition may still be shutting down. onend retries. */ }
    }, 300);
  }

  async function sendMessage(message, fromVoice = false) {
    voiceBusy = voiceModeActive;
    sendButton.disabled = true;
    input.disabled = true;
    addMessage("user", message);
    const pending = addMessage("assistant", "Передаю сообщение ядру…");
    pending.classList.add("pending");
    let shouldResumeAfterSpeech = false;
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
      if ((voiceModeActive || voiceEnabled) && speechSupported) {
        shouldResumeAfterSpeech = voiceModeActive;
        speakText(payload.reply, () => {
          if (shouldResumeAfterSpeech) {
            voiceBusy = false;
            resumeVoiceMode();
          }
        });
      }
    } catch (error) {
      pending.remove();
      addMessage("assistant", "Не удалось получить ответ: " + error.message, null, true);
    } finally {
      sendButton.disabled = false;
      input.disabled = false;
      if (voiceModeActive && !speaking) {
        voiceBusy = false;
        resumeVoiceMode();
      } else if (!fromVoice) {
        input.focus();
      }
    }
  }

  function stopRecognition() {
    if (!recognition) return;
    try { recognition.stop(); } catch (error) { /* It may already be stopped. */ }
  }

  function finishVoiceTurn() {
    if (voiceBusy) return;
    const message = pendingTranscript.trim();
    pendingTranscript = "";
    if (!message || !voiceModeActive) return;
    window.clearTimeout(silenceTimer);
    voiceBusy = true;
    stopRecognition();
    sendMessage(message, true);
  }

  function startVoiceMode() {
    if (!recognitionSupported) return;
    recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      if (voiceBusy) return;
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) pendingTranscript += event.results[index][0].transcript + " ";
      }
      if (pendingTranscript.trim()) {
        setVoiceStatus("Речь распознана, жду окончания фразы…", "processing");
        window.clearTimeout(silenceTimer);
        silenceTimer = window.setTimeout(finishVoiceTurn, 1000);
      }
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        voiceModeActive = false;
        voiceBusy = false;
        updateVoiceControls();
        setVoiceStatus("Нет доступа к микрофону. Разреши его для этой страницы.", "error");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setVoiceStatus("Ошибка распознавания: " + event.error, "error");
      }
    };
    recognition.onend = () => {
      if (voiceModeActive && !voiceBusy && !speaking) resumeVoiceMode();
    };
    voiceModeActive = true;
    voiceBusy = false;
    updateVoiceControls();
    setVoiceStatus("Запрашиваю доступ к микрофону…", "processing");
    resumeVoiceMode();
  }

  function stopVoiceMode() {
    voiceModeActive = false;
    voiceBusy = false;
    pendingTranscript = "";
    window.clearTimeout(silenceTimer);
    stopRecognition();
    if (speechSupported) window.speechSynthesis.cancel();
    speaking = false;
    voiceStop.hidden = true;
    updateVoiceControls();
    setVoiceStatus("Голосовой режим выключен", "idle");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || sendButton.disabled) return;
    input.value = "";
    input.style.height = "auto";
    if (voiceModeActive) {
      voiceBusy = true;
      pendingTranscript = "";
      window.clearTimeout(silenceTimer);
      stopRecognition();
    }
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
    voiceToggle.setAttribute("aria-pressed", String(voiceEnabled));
    voiceToggle.textContent = voiceEnabled ? "Озвучка: вкл." : "Озвучка: выкл.";
    if (!voiceEnabled && speechSupported) window.speechSynthesis.cancel();
  });
  voiceModeToggle.addEventListener("click", () => {
    if (voiceModeActive) stopVoiceMode();
    else startVoiceMode();
  });
  voiceStop.addEventListener("click", () => {
    if (speechSupported) window.speechSynthesis.cancel();
    speaking = false;
    voiceStop.hidden = true;
    if (voiceModeActive) {
      voiceBusy = false;
      resumeVoiceMode();
    }
  });
  memoryOpen.addEventListener("click", openMemoryPanel);
  memoryClose.addEventListener("click", closeMemoryPanel);
  memoryOverlay.addEventListener("click", (event) => {
    if (event.target === memoryOverlay) closeMemoryPanel();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !memoryOverlay.hidden) closeMemoryPanel();
  });
  memoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = memoryContent.value.trim();
    if (!content) return;
    try {
      const response = await fetch("/memory", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({content, category: memoryCategory.value, source: "owner-confirmed"})
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail || ("HTTP " + response.status));
      }
      memoryContent.value = "";
      await loadMemories();
      setMemoryStatus("Запись сохранена в долговременную память.");
    } catch (error) { setMemoryStatus("Не удалось сохранить запись: " + error.message, true); }
  });
  memorySearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); loadMemories(); }
  });
  memoryExport.addEventListener("click", async () => {
    try {
      const response = await fetch("/memory/export");
      if (!response.ok) throw new Error("HTTP " + response.status);
      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "nexus-memory-export.json";
      link.click();
      URL.revokeObjectURL(url);
      setMemoryStatus("Экспорт памяти подготовлен.");
    } catch (error) { setMemoryStatus("Не удалось экспортировать память: " + error.message, true); }
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
  if (speechSupported) window.speechSynthesis.getVoices();
  Promise.all([checkHealth(), loadHistory()]);
})();