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
  const voiceInterrupt = document.getElementById("voice-interrupt");
  const voiceModeToggle = document.getElementById("voice-mode-toggle");
  const voiceStatus = document.getElementById("voice-status");
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
  let currentSpeechText = "";
  let interruptedSeed = "";

  function makeConversationId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "session-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  localStorage.setItem(STORAGE_KEY, conversationId);

  function updateConversationLabel() {
    conversationLabel.textContent = conversationId.slice(0, 8) + "…";
  }

  function scrollToLatest() { messages.scrollTop = messages.scrollHeight; }
  function showWelcome(show) { welcomeCard.hidden = !show; }

  function setVoiceStatus(message, state) {
    voiceStatus.textContent = message;
    voiceStatus.dataset.state = state || "idle";
  }

  function speakText(content, onFinished) {
    if (!speechSupported || !content) return false;
    window.speechSynthesis.cancel();
    currentSpeechText = content;
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = "ru-RU";
    utterance.rate = 0.98;
    const russianVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("ru"));
    if (russianVoice) utterance.voice = russianVoice;
    const finish = () => {
      speaking = false;
      currentSpeechText = "";
      voiceStop.hidden = true;
      voiceInterrupt.hidden = true;
      if (typeof onFinished === "function") onFinished();
    };
    speaking = true;
    utterance.onstart = () => {
      voiceStop.hidden = false;
      voiceInterrupt.hidden = !voiceModeActive;
      if (voiceModeActive) {
        setVoiceStatus("NEXUS отвечает… Можно перебить голосом или кнопкой", "speaking");
        startRecognitionDuringSpeech();
      }
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
    voiceInterrupt.hidden = !speaking || !voiceModeActive;
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

  function startRecognitionDuringSpeech() {
    if (!voiceModeActive || !recognition) return;
    try { recognition.start(); } catch (error) { /* It may already be listening. */ }
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

  function normalizeSpeech(value) {
    return value.toLocaleLowerCase("ru-RU").replace(/[^\\p{L}\\p{N}\\s]/gu, " ").replace(/\\s+/g, " ").trim();
  }

  function likelyAssistantEcho(transcript) {
    const heard = normalizeSpeech(transcript).split(" ").filter((word) => word.length > 2);
    const spoken = new Set(normalizeSpeech(currentSpeechText).split(" ").filter((word) => word.length > 2));
    if (!heard.length || !spoken.size) return false;
    if (heard.length === 1) return spoken.has(heard[0]);
    const overlap = heard.filter((word) => spoken.has(word)).length / heard.length;
    return overlap >= 0.65;
  }

  function interruptSpeech(transcript = "") {
    if (!speaking || !voiceModeActive) return;
    window.speechSynthesis.cancel();
    speaking = false;
    voiceBusy = false;
    currentSpeechText = "";
    voiceStop.hidden = true;
    voiceInterrupt.hidden = true;
    if (transcript.trim()) {
      interruptedSeed = normalizeSpeech(transcript);
      pendingTranscript = transcript.trim() + " ";
      setVoiceStatus("Перебивание распознано, слушаю дальше…", "listening");
      window.clearTimeout(silenceTimer);
      silenceTimer = window.setTimeout(finishVoiceTurn, 1000);
    } else {
      setVoiceStatus("Озвучка остановлена. Слушаю…", "listening");
      startRecognitionDuringSpeech();
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
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      if (voiceBusy && !speaking) return;
      let interruptedTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0].transcript.trim();
        if (speaking && transcript.length >= 3 && !likelyAssistantEcho(transcript)) {
          interruptedTranscript = transcript;
          break;
        }
        if (result.isFinal && !speaking) {
          const normalized = normalizeSpeech(transcript);
          if (interruptedSeed && (normalized.startsWith(interruptedSeed) || interruptedSeed.startsWith(normalized))) {
            pendingTranscript = transcript + " ";
            interruptedSeed = "";
          } else {
            pendingTranscript += transcript + " ";
            interruptedSeed = "";
          }
        }
      }
      if (speaking && interruptedTranscript) {
        interruptSpeech(interruptedTranscript);
        return;
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
      if (!voiceModeActive) return;
      if (speaking) window.setTimeout(startRecognitionDuringSpeech, 250);
      else if (!voiceBusy) resumeVoiceMode();
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
    currentSpeechText = "";
    voiceStop.hidden = true;
    voiceInterrupt.hidden = true;
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
  voiceInterrupt.addEventListener("click", () => interruptSpeech());
  voiceStop.addEventListener("click", () => {
    if (speechSupported) window.speechSynthesis.cancel();
    speaking = false;
    currentSpeechText = "";
    voiceStop.hidden = true;
    voiceInterrupt.hidden = true;
    if (voiceModeActive) {
      voiceBusy = false;
      resumeVoiceMode();
    }
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