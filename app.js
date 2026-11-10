(() => {
  'use strict';
  const DATA = window.ALPHABET_DATA || [];
  const $ = (id) => document.getElementById(id);
  const views = ['homeView', 'cardsView', 'revealView', 'quizView', 'resultsView'];
  const state = {
    mode: 'both', index: 0, randomBag: [], autoTimer: null, autoSpeed: 3000,
    sound: true, showWords: true, questionCount: 10, theme: 'sky',
    testMode: null, testQueue: [], testIndex: 0, correct: 0, wrong: 0,
    revealShown: false, quizAnswered: false, quizTarget: null, lastTestMode: null
  };

  const modeNames = { both: 'Uppercase + Lowercase', upper: 'Uppercase Only', lower: 'Lowercase Only', picture: 'Picture Mode' };
  const modeKickers = { both: 'UPPERCASE + LOWERCASE', upper: 'UPPERCASE LETTERS', lower: 'LOWERCASE LETTERS', picture: 'PICTURE VOCABULARY' };

  function showView(id) {
    views.forEach(viewId => $(viewId).classList.toggle('active', viewId === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function stopAutoPlay() {
    if (state.autoTimer) window.clearInterval(state.autoTimer);
    state.autoTimer = null;
    const button = $('autoPlay');
    if (button) { button.innerHTML = '▶ <span>Auto Play</span>'; button.classList.remove('is-playing'); }
  }
  function setSoundUI() {
    $('soundIcon').textContent = state.sound ? '🔊' : '🔇';
    $('soundToggle').setAttribute('aria-label', state.sound ? 'ปิดเสียง' : 'เปิดเสียง');
    $('settingSound').checked = state.sound;
  }
  function speak(text, lang = 'en-US', append = false) {
    if (!state.sound) return;
    if (!('speechSynthesis' in window)) {
      showToast('เบราว์เซอร์นี้ไม่รองรับระบบเสียงอ่าน');
      return;
    }
    if (!append) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.lang = lang;
    utterance.rate = 0.82;
    utterance.pitch = 1.02;
    const voices = window.speechSynthesis.getVoices();
    const selected = voices.find(v => v.lang && v.lang.toLowerCase() === 'en-us') || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'));
    if (selected) utterance.voice = selected;
    window.speechSynthesis.speak(utterance);
  }
  function showToast(message) {
    let toast = $('appToast');
    if (!toast) {
      toast = document.createElement('div'); toast.id = 'appToast'; toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message; toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2400);
  }
  function shuffled(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function refillRandomBag() {
    state.randomBag = shuffled(DATA.map((_, i) => i));
    if (state.randomBag.length > 1 && state.randomBag[state.randomBag.length - 1] === state.index) {
      [state.randomBag[0], state.randomBag[state.randomBag.length - 1]] = [state.randomBag[state.randomBag.length - 1], state.randomBag[0]];
    }
  }
  function drawRandomIndex() {
    if (!state.randomBag.length) refillRandomBag();
    return state.randomBag.pop();
  }
  function setMode(mode) {
    state.mode = mode;
    state.index = 0;
    state.randomBag = [];
    stopAutoPlay();
    $('cardsModeTitle').textContent = modeNames[mode];
    $('cardsModeKicker').textContent = modeKickers[mode];
    $('speedRow').hidden = false;
    showView('cardsView');
    renderCard();
  }
  function setThemeClass() {
    document.body.classList.remove('theme-sky', 'theme-lavender', 'theme-cream', 'theme-mint');
    document.body.classList.add(`theme-${state.theme}`);
  }
  function renderCard() {
    const item = DATA[state.index];
    if (!item) return;
    const letterDisplay = $('letterDisplay');
    const picturePanel = $('picturePanel');
    const flashcard = $('flashcard');
    flashcard.classList.toggle('picture-mode', state.mode === 'picture');
    letterDisplay.hidden = false;
    picturePanel.hidden = state.mode !== 'picture';
    if (state.mode === 'both') letterDisplay.innerHTML = `${item.letter}<span class="lowercase">${item.lower}</span>`;
    else if (state.mode === 'upper') letterDisplay.textContent = item.letter;
    else if (state.mode === 'lower') letterDisplay.textContent = item.lower;
    else letterDisplay.textContent = `${item.letter}${item.lower}`;
    $('letterChip').textContent = `LETTER ${item.letter}`;
    $('letterCounter').textContent = `${String(state.index + 1).padStart(2, '0')} / 26`;
    $('cardHint').textContent = state.mode === 'picture' ? 'Look, listen and say the word!' : 'Say the letter aloud!';
    $('pictureImage').src = `assets/images/${item.lower}.svg`;
    $('pictureImage').alt = `${item.word} — ${item.letter} is for ${item.word}`;
    $('pictureWord').textContent = state.showWords ? item.word : '••••••';
    $('pictureWord').hidden = !state.showWords;
    // In random sessions, remove every displayed letter from the remaining bag.
    if (state.randomBag.length) state.randomBag = state.randomBag.filter(i => i !== state.index);
    renderAlphabetStrip();
  }
  function renderAlphabetStrip() {
    const strip = $('alphabetStrip');
    strip.replaceChildren();
    DATA.forEach((item, i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = `alphabet-key${i === state.index ? ' active' : ''}`;
      button.textContent = state.mode === 'lower' ? item.lower : item.letter;
      button.setAttribute('aria-label', `เลือกตัวอักษร ${item.letter}`);
      button.addEventListener('click', () => { stopAutoPlay(); state.index = i; renderCard(); });
      strip.appendChild(button);
    });
  }
  function nextCard() { state.index = (state.index + 1) % DATA.length; renderCard(); }
  function previousCard() { state.index = (state.index - 1 + DATA.length) % DATA.length; renderCard(); }
  function randomCard() { stopAutoPlay(); state.index = drawRandomIndex(); renderCard(); }
  function toggleAutoPlay() {
    if (state.autoTimer) { stopAutoPlay(); return; }
    $('autoPlay').innerHTML = 'Ⅱ <span>Pause</span>';
    $('autoPlay').classList.add('is-playing');
    state.autoTimer = window.setInterval(() => { state.index = (state.index + 1) % DATA.length; renderCard(); }, state.autoSpeed);
  }
  function updateSpeed(speed) {
    state.autoSpeed = Number(speed);
    document.querySelectorAll('.speed-choice').forEach(button => button.classList.toggle('active', Number(button.dataset.speed) === state.autoSpeed));
    if (state.autoTimer) { stopAutoPlay(); toggleAutoPlay(); }
  }
  function makeTestQueue() {
    const count = Math.min(state.questionCount, DATA.length);
    return shuffled(DATA.map((_, i) => i)).slice(0, count);
  }
  function startReveal() {
    stopAutoPlay();
    state.testMode = 'reveal'; state.lastTestMode = 'reveal';
    state.testQueue = makeTestQueue(); state.testIndex = 0; state.correct = 0; state.wrong = 0; state.revealShown = false;
    showView('revealView'); renderReveal();
  }
  function renderReveal() {
    const item = DATA[state.testQueue[state.testIndex]];
    if (!item) return;
    state.revealShown = false;
    $('revealImage').src = `assets/images/${item.lower}.svg`;
    $('revealImage').alt = item.word;
    $('revealWord').textContent = item.word;
    $('revealLetter').textContent = '?';
    $('revealSub').textContent = 'คิดคำตอบก่อนกดเปิดเฉลย';
    $('revealButton').hidden = false;
    $('revealMarks').hidden = true;
    $('revealResult').hidden = true;
    $('revealCounter').textContent = `${String(state.testIndex + 1).padStart(2, '0')} / ${state.testQueue.length}`;
    $('revealProgress').style.width = `${(state.testIndex / state.testQueue.length) * 100}%`;
    $('revealButton').textContent = 'ดูเฉลย';
  }
  function revealAnswer() {
    if (state.revealShown) return;
    const item = DATA[state.testQueue[state.testIndex]];
    state.revealShown = true;
    $('revealLetter').textContent = item.letter;
    $('revealSub').textContent = `${item.letter} is for ${item.word}`;
    $('revealMarks').hidden = false;
    $('revealButton').hidden = true;
    speak(item.letter);
  }
  function markReveal(correct) {
    if (!state.revealShown) return;
    if (correct) state.correct++; else state.wrong++;
    state.testIndex++;
    if (state.testIndex >= state.testQueue.length) showResults();
    else renderReveal();
  }
  function startQuiz() {
    stopAutoPlay();
    state.testMode = 'quiz'; state.lastTestMode = 'quiz';
    state.testQueue = makeTestQueue(); state.testIndex = 0; state.correct = 0; state.wrong = 0; state.quizAnswered = false;
    showView('quizView'); renderQuiz();
  }
  function renderQuiz() {
    const item = DATA[state.testQueue[state.testIndex]];
    if (!item) return;
    state.quizTarget = item;
    state.quizAnswered = false;
    $('quizCounter').textContent = `${String(state.testIndex + 1).padStart(2, '0')} / ${state.testQueue.length}`;
    $('quizProgressText').textContent = `คำถามที่ ${state.testIndex + 1} จาก ${state.testQueue.length}`;
    $('quizScoreText').textContent = `คะแนน ${state.correct}`;
    $('quizProgress').style.width = `${(state.testIndex / state.testQueue.length) * 100}%`;
    $('quizFeedback').hidden = true;
    $('nextQuestion').hidden = true;
    const options = shuffled([item, ...shuffled(DATA.filter(x => x.letter !== item.letter)).slice(0, 3)]);
    const choiceBox = $('quizChoices'); choiceBox.replaceChildren();
    options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'quiz-choice'; button.textContent = option.letter;
      button.setAttribute('aria-label', `เลือกตัวอักษร ${option.letter}`);
      button.addEventListener('click', () => chooseQuizAnswer(button, option));
      choiceBox.appendChild(button);
    });
    window.setTimeout(() => speak(item.letter), 250);
  }
  function chooseQuizAnswer(button, option) {
    if (state.quizAnswered) return;
    state.quizAnswered = true;
    const isCorrect = option.letter === state.quizTarget.letter;
    if (isCorrect) state.correct++; else state.wrong++;
    document.querySelectorAll('.quiz-choice').forEach(choice => {
      choice.disabled = true;
      if (choice.textContent === state.quizTarget.letter) choice.classList.add('correct');
    });
    if (!isCorrect) button.classList.add('incorrect');
    const feedback = $('quizFeedback');
    feedback.hidden = false;
    feedback.className = `quiz-feedback ${isCorrect ? 'good' : 'bad'}`;
    feedback.textContent = isCorrect ? `เก่งมาก! คำตอบคือ ${state.quizTarget.letter}` : `ยังไม่ถูกนะ คำตอบที่ถูกคือ ${state.quizTarget.letter}`;
    $('quizScoreText').textContent = `คะแนน ${state.correct}`;
    $('nextQuestion').hidden = false;
    $('nextQuestion').textContent = state.testIndex + 1 >= state.testQueue.length ? 'ดูผลคะแนน →' : 'ข้อต่อไป →';
  }
  function nextQuizQuestion() {
    state.testIndex++;
    if (state.testIndex >= state.testQueue.length) showResults(); else renderQuiz();
  }
  function showResults() {
    stopAutoPlay();
    const total = state.correct + state.wrong;
    const percent = total ? Math.round(state.correct / total * 100) : 0;
    $('scorePercent').textContent = `${percent}%`;
    $('scoreRing').style.setProperty('--score', `${percent}%`);
    $('totalCount').textContent = total;
    $('correctCount').textContent = state.correct;
    $('wrongCount').textContent = state.wrong;
    $('resultsTitle').textContent = percent >= 80 ? 'ยอดเยี่ยมมาก!' : percent >= 50 ? 'ทำได้ดีมาก!' : 'พยายามอีกนิดนะ!';
    $('resultsSubtitle').textContent = percent >= 80 ? 'คุณจดจำตัวอักษรได้ดีเยี่ยม' : 'ฝึกฝนอีกสักรอบ แล้วจะเก่งขึ้นแน่นอน';
    showView('resultsView');
  }
  function retryTest() { if (state.lastTestMode === 'reveal') startReveal(); else startQuiz(); }
  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (error) { showToast('ไม่สามารถเปิดเต็มจอได้ในเบราว์เซอร์นี้'); }
  }
  function onFullscreenChange() {
    const isPresentation = Boolean(document.fullscreenElement) && $('cardsView').classList.contains('active');
    document.body.classList.toggle('presentation', isPresentation);
    if (!isPresentation) document.body.classList.remove('controls-hidden');
  }
  function openModal(id) { $(id).hidden = false; }
  function closeModals() { $('settingsModal').hidden = true; $('aboutModal').hidden = true; }
  function goHome() {
    stopAutoPlay();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    document.body.classList.remove('presentation', 'controls-hidden');
    showView('homeView');
  }

  // Main menu actions
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  $('startRandom').addEventListener('click', () => { setMode('both'); refillRandomBag(); state.index = state.randomBag.pop(); renderCard(); });
  $('startReveal').addEventListener('click', startReveal);
  $('startQuiz').addEventListener('click', startQuiz);
  document.querySelectorAll('[data-home]').forEach(button => button.addEventListener('click', goHome));
  $('brandHome').addEventListener('click', (event) => { event.preventDefault(); goHome(); });

  // Flashcard controls
  $('previousCard').addEventListener('click', () => { stopAutoPlay(); previousCard(); });
  $('nextCard').addEventListener('click', () => { stopAutoPlay(); nextCard(); });
  $('randomCard').addEventListener('click', randomCard);
  $('autoPlay').addEventListener('click', toggleAutoPlay);
  $('cardsFullscreen').addEventListener('click', toggleFullscreen);
  $('presentControlsToggle').addEventListener('click', () => { document.body.classList.toggle('controls-hidden'); $('presentControlsToggle').setAttribute('aria-pressed', document.body.classList.contains('controls-hidden') ? 'true' : 'false'); });
  $('letterAudio').addEventListener('click', () => { const item = DATA[state.index]; speak(item.letter); if (state.mode === 'picture') window.setTimeout(() => speak(item.word, 'en-US', true), 100); });
  document.querySelectorAll('.speed-choice').forEach(button => button.addEventListener('click', () => updateSpeed(button.dataset.speed)));

  // Test controls
  $('revealButton').addEventListener('click', revealAnswer);
  $('revealSound').addEventListener('click', () => speak(DATA[state.testQueue[state.testIndex]]?.word || ''));
  $('markCorrect').addEventListener('click', () => markReveal(true));
  $('markWrong').addEventListener('click', () => markReveal(false));
  $('newReveal').addEventListener('click', startReveal);
  $('quizListen').addEventListener('click', () => speak(state.quizTarget?.letter || ''));
  $('nextQuestion').addEventListener('click', nextQuizQuestion);
  $('retryTest').addEventListener('click', retryTest);

  // Settings and information
  $('soundToggle').addEventListener('click', () => { state.sound = !state.sound; setSoundUI(); if (!state.sound && 'speechSynthesis' in window) window.speechSynthesis.cancel(); });
  $('settingsOpen').addEventListener('click', () => openModal('settingsModal'));
  $('aboutOpen').addEventListener('click', () => openModal('aboutModal'));
  document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeModals));
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', event => { if (event.target === backdrop) closeModals(); }));
  $('saveSettings').addEventListener('click', () => {
    state.sound = $('settingSound').checked;
    state.showWords = $('settingWords').checked;
    state.questionCount = Number($('settingCount').value);
    state.theme = $('settingTheme').value;
    setSoundUI(); setThemeClass(); closeModals(); renderCard(); showToast('บันทึกการตั้งค่าแล้ว');
    try { localStorage.setItem('abcFlashcardsSettings', JSON.stringify({ sound: state.sound, showWords: state.showWords, questionCount: state.questionCount, theme: state.theme })); } catch (_) {}
  });

  // Keyboard shortcuts: arrows / Space / F are active in flashcard mode.
  document.addEventListener('keydown', event => {
    if (!$('cardsView').classList.contains('active') || !$('settingsModal').hidden || !$('aboutModal').hidden) return;
    if (event.target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); stopAutoPlay(); nextCard(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); stopAutoPlay(); previousCard(); }
    else if (event.code === 'Space') { event.preventDefault(); randomCard(); }
    else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
  });
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAutoPlay(); });

  // Restore preferences (optional) and initialize.
  try {
    const saved = JSON.parse(localStorage.getItem('abcFlashcardsSettings') || 'null');
    if (saved) {
      if (typeof saved.sound === 'boolean') state.sound = saved.sound;
      if (typeof saved.showWords === 'boolean') state.showWords = saved.showWords;
      if ([10, 15, 20, 26].includes(Number(saved.questionCount))) state.questionCount = Number(saved.questionCount);
      if (['sky', 'lavender', 'cream', 'mint'].includes(saved.theme)) state.theme = saved.theme;
    }
  } catch (_) {}
  $('settingSound').checked = state.sound;
  $('settingWords').checked = state.showWords;
  $('settingCount').value = String(state.questionCount);
  $('settingTheme').value = state.theme;
  setSoundUI(); setThemeClass();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
