// jsPDF library
const { jsPDF } = window.jspdf;

// --- DOM Elements ---
const appTitle = document.getElementById('appTitle');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const clearStorageBtn = document.getElementById('clearStorageBtn');
const refreshRateDisplay = document.getElementById('refreshRateDisplay');

const switchToChronoBtn = document.getElementById('switchToChronoBtn');
const switchToCountdownBtn = document.getElementById('switchToCountdownBtn');
const chronoModeSection = document.getElementById('chronoModeSection');
const countdownModeSection = document.getElementById('countdownModeSection');

// Chrono Mode Elements
const timeDisplay = document.getElementById('time-display');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const lapBtn = document.getElementById('lapBtn'); // Chrono lap
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const saveBtn = document.getElementById('saveBtn'); // Chrono save
const lapsSectionChrono = document.getElementById('laps-section-chrono');
const lapsListChrono = document.getElementById('laps-list-chrono');
const sortAscBtnChrono = document.getElementById('sortAscBtnChrono');
const sortDescBtnChrono = document.getElementById('sortDescBtnChrono');
const exportOptionsDivChrono = document.getElementById('exportOptionsDivChrono');
const exportPdfBtnChrono = document.getElementById('exportPdfBtnChrono');
const exportCsvBtnChrono = document.getElementById('exportCsvBtnChrono');
const exportJsonBtnChrono = document.getElementById('exportJsonBtnChrono');

// Countdown Mode Elements
const countdownDisplay = document.getElementById('countdown-display');
const countdownHoursInput = document.getElementById('countdown-hours');
const countdownMinutesInput = document.getElementById('countdown-minutes');
const countdownSecondsInput = document.getElementById('countdown-seconds');
const startCountdownBtn = document.getElementById('startCountdownBtn');
const pauseCountdownBtn = document.getElementById('pauseCountdownBtn');
const lapCountdownBtn = document.getElementById('lapCountdownBtn'); // Countdown lap
const resetCountdownBtn = document.getElementById('resetCountdownBtn');
const saveCountdownBtn = document.getElementById('saveCountdownBtn'); // Countdown save
const countdownNotificationCheck = document.getElementById('countdownNotificationCheck');
const lapsSectionCountdown = document.getElementById('laps-section-countdown');
const lapsListCountdown = document.getElementById('laps-list-countdown');
const sortAscBtnCountdown = document.getElementById('sortAscBtnCountdown');
const sortDescBtnCountdown = document.getElementById('sortDescBtnCountdown');
const exportOptionsDivCountdown = document.getElementById('exportOptionsDivCountdown');
const exportPdfBtnCountdown = document.getElementById('exportPdfBtnCountdown');
const exportCsvBtnCountdown = document.getElementById('exportCsvBtnCountdown');
const exportJsonBtnCountdown = document.getElementById('exportJsonBtnCountdown');


// --- State Variables ---
const STORAGE_KEY = 'chronoAppV4State'; // Incremented version
let currentMode = 'chrono';
let refreshIntervalMs = 10;
refreshRateDisplay.textContent = refreshIntervalMs;

let appState = {
    chrono: {
        startTime: 0, elapsedTime: 0, timerInterval: null,
        laps: [], isRunning: false, isPaused: false, nextLapId: 1
    },
    countdown: {
        targetTime: 0, remainingTime: 0, timerInterval: null,
        laps: [], isRunning: false, isPaused: false, nextLapId: 1,
        initialDuration: 0, notify: false
    },
    theme: 'dark'
};

// --- Utility Functions ---
function formatTime(milliseconds, showMilliseconds = true, forCountdown = false) {
    if (milliseconds < 0) milliseconds = 0; // Ensure non-negative for display
    const totalSeconds = Math.floor(milliseconds / 1000);
    const ms = showMilliseconds ? `.${String(milliseconds % 1000).padStart(3, '0')}` : '';
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    const minutes = String(Math.floor(totalSeconds / 60) % 60).padStart(2, '0');
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}${ms}`;
}

// --- Mode Switching ---
function switchMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;
    appState.currentMode = mode; // Save to overall app state for persistence

    // Stop the other mode if it's running
    if (mode === 'chrono') {
        if (appState.countdown.isRunning || appState.countdown.isPaused) resetCountdown();
        appTitle.textContent = "Chronomètre";
        chronoModeSection.classList.add('active-mode');
        countdownModeSection.classList.remove('active-mode');
        switchToChronoBtn.classList.add('active');
        switchToCountdownBtn.classList.remove('active');
    } else if (mode === 'countdown') {
        if (appState.chrono.isRunning || appState.chrono.isPaused) stopChrono(); // Stop, don't reset laps
        appTitle.textContent = "Compte à Rebours";
        countdownModeSection.classList.add('active-mode');
        chronoModeSection.classList.remove('active-mode');
        switchToCountdownBtn.classList.add('active');
        switchToChronoBtn.classList.remove('active');
        updateCountdownDisplayFromInputs(); // Initialize display
    }
    updateButtonStates(); // Centralized button state update
    saveAppState();
}

// --- Button State Management ---
function updateButtonStates() {
    const { chrono, countdown } = appState;
    // Chrono buttons
    playBtn.classList.toggle('hidden', chrono.isRunning || chrono.isPaused);
    pauseBtn.classList.toggle('hidden', !chrono.isRunning && !chrono.isPaused);
    lapBtn.classList.toggle('hidden', !chrono.isRunning || chrono.isPaused); // Lap only when running (not paused)
    stopBtn.classList.toggle('hidden', !chrono.isRunning && !chrono.isPaused);
    resetBtn.classList.toggle('hidden', chrono.isRunning || chrono.isPaused || chrono.elapsedTime === 0 && chrono.laps.length === 0);
    saveBtn.classList.toggle('hidden', chrono.isRunning || chrono.isPaused || chrono.laps.length === 0);
    pauseBtn.innerHTML = chrono.isPaused ? '<img src="assets/play.svg" alt="Reprendre">' : '<img src="assets/pause.svg" alt="Pause">';
    pauseBtn.setAttribute('aria-label', chrono.isPaused ? 'Reprendre' : 'Mettre en pause');


    // Countdown buttons
    const cdInputsDisabled = countdown.isRunning || countdown.isPaused;
    [countdownHoursInput, countdownMinutesInput, countdownSecondsInput].forEach(input => input.disabled = cdInputsDisabled);

    startCountdownBtn.classList.toggle('hidden', countdown.isRunning || countdown.isPaused);
    pauseCountdownBtn.classList.toggle('hidden', !countdown.isRunning && !countdown.isPaused);
    lapCountdownBtn.classList.toggle('hidden', !countdown.isRunning || countdown.isPaused); // Lap only when running
    resetCountdownBtn.classList.toggle('hidden', countdown.isRunning || countdown.isPaused || (countdown.remainingTime === 0 && countdown.initialDuration === getCountdownDurationFromInputs()));
    saveCountdownBtn.classList.toggle('hidden', countdown.isRunning || countdown.isPaused || countdown.laps.length === 0);

    pauseCountdownBtn.innerHTML = countdown.isPaused ? '<img src="assets/play.svg" alt="Reprendre CàR">' : '<img src="assets/pause.svg" alt="Pause CàR">';
    pauseCountdownBtn.setAttribute('aria-label', countdown.isPaused ? 'Reprendre Compte à Rebours' : 'Mettre en Pause Compte à Rebours');
    
    if (!countdown.isRunning && !countdown.isPaused && countdown.remainingTime === 0 && countdown.initialDuration > 0) { // Finished
        startCountdownBtn.innerHTML = '<img src="assets/play.svg" alt="Redémarrer CàR">';
        startCountdownBtn.setAttribute('aria-label', 'Redémarrer Compte à Rebours');
    } else {
        startCountdownBtn.innerHTML = '<img src="assets/play.svg" alt="Démarrer CàR">';
        startCountdownBtn.setAttribute('aria-label', 'Démarrer Compte à Rebours');
    }
}


// --- Chronometer Logic ---
function updateChronoDisplay() {
    appState.chrono.elapsedTime = Date.now() - appState.chrono.startTime;
    timeDisplay.textContent = formatTime(appState.chrono.elapsedTime);
}
function playChrono() {
    const { chrono } = appState;
    if (!chrono.isRunning || chrono.isPaused) {
        chrono.startTime = Date.now() - chrono.elapsedTime;
        if(chrono.timerInterval) clearInterval(chrono.timerInterval);
        chrono.timerInterval = setInterval(updateChronoDisplay, refreshIntervalMs);
        chrono.isRunning = true; chrono.isPaused = false;
        timeDisplay.classList.remove('paused-display');
    }
    updateButtonStates(); saveAppState();
}
function pauseChrono() {
    const { chrono } = appState;
    if (!chrono.isRunning || chrono.isPaused) return;
    clearInterval(chrono.timerInterval); chrono.isPaused = true;
    timeDisplay.classList.add('paused-display');
    updateButtonStates(); saveAppState();
}
function stopChrono() {
    const { chrono } = appState;
    if (!chrono.isRunning && !chrono.isPaused) return;
    clearInterval(chrono.timerInterval); chrono.isRunning = false;
    // chrono.isPaused remains to know if stopped from pause
    timeDisplay.classList.remove('paused-display');
    exportOptionsDivChrono.classList.add('hidden');
    updateButtonStates(); saveAppState();
}
function resetChrono() {
    const { chrono } = appState;
    clearInterval(chrono.timerInterval);
    Object.assign(chrono, { startTime: 0, elapsedTime: 0, laps: [], isRunning: false, isPaused: false, nextLapId: 1 });
    timeDisplay.textContent = formatTime(0);
    timeDisplay.classList.remove('paused-display');
    renderLaps('chrono');
    exportOptionsDivChrono.classList.add('hidden');
    lapsSectionChrono.classList.add('hidden');
    updateButtonStates(); saveAppState();
}
function recordChronoLap() {
    const { chrono } = appState;
    if (!chrono.isRunning || chrono.isPaused) return;
    const lapTime = chrono.elapsedTime;
    chrono.laps.push({ id: chrono.nextLapId++, number: chrono.laps.length + 1, name: `Temps ${chrono.laps.length + 1}`, time: formatTime(lapTime), rawTime: lapTime });
    renderLaps('chrono');
    updateButtonStates(); saveAppState();
}

// --- Countdown Logic ---
function getCountdownDurationFromInputs() {
    const h = parseInt(countdownHoursInput.value) || 0;
    const m = parseInt(countdownMinutesInput.value) || 0;
    const s = parseInt(countdownSecondsInput.value) || 0;
    return (h * 3600 + m * 60 + s) * 1000;
}
function updateCountdownDisplayFromInputs() {
    countdownDisplay.textContent = formatTime(getCountdownDurationFromInputs(), false, true);
}
function updateCountdownRunnerDisplay() {
    const { countdown } = appState;
    countdown.remainingTime = countdown.targetTime - Date.now();
    if (countdown.remainingTime <= 0) {
        countdown.remainingTime = 0;
        clearInterval(countdown.timerInterval);
        countdown.isRunning = false; countdown.isPaused = false; // Finished
        countdownDisplay.textContent = formatTime(0, false, true);
        if (countdown.notify) showNotification("Compte à rebours terminé !");
        countdownDisplay.classList.add('finished-blink');
        setTimeout(() => countdownDisplay.classList.remove('finished-blink'), 3000);
    } else {
        countdownDisplay.textContent = formatTime(countdown.remainingTime, false, true);
    }
    updateButtonStates(); // Update buttons based on new state
}
function startOrResumeCountdown() {
    const { countdown } = appState;
    if (countdown.isRunning && !countdown.isPaused) return; // Already running

    if (countdown.isPaused) { // Resume
        countdown.targetTime = Date.now() + countdown.remainingTime;
    } else { // Start new or restart finished
        countdown.initialDuration = getCountdownDurationFromInputs();
        if (countdown.initialDuration <= 0) {
            alert("Veuillez entrer une durée valide."); return;
        }
        countdown.targetTime = Date.now() + countdown.initialDuration;
        countdown.remainingTime = countdown.initialDuration; // For immediate display
    }
    if(countdown.timerInterval) clearInterval(countdown.timerInterval);
    countdown.timerInterval = setInterval(updateCountdownRunnerDisplay, refreshIntervalMs);
    countdown.isRunning = true; countdown.isPaused = false;
    countdownDisplay.classList.remove('finished-blink', 'paused-display');
    updateButtonStates(); saveAppState();
}
function pauseCountdown() {
    const { countdown } = appState;
    if (!countdown.isRunning || countdown.isPaused) return;
    clearInterval(countdown.timerInterval); countdown.isPaused = true;
    // remainingTime is updated by the interval before clearing.
    countdownDisplay.classList.add('paused-display');
    updateButtonStates(); saveAppState();
}
function resetCountdown() {
    const { countdown } = appState;
    clearInterval(countdown.timerInterval);
    Object.assign(countdown, { targetTime: 0, remainingTime: 0, laps: [], isRunning: false, isPaused: false, nextLapId: 1 });
    countdown.initialDuration = getCountdownDurationFromInputs(); // Update initialDuration based on current inputs
    countdownDisplay.textContent = formatTime(countdown.initialDuration, false, true);
    countdownDisplay.classList.remove('finished-blink', 'paused-display');
    renderLaps('countdown');
    exportOptionsDivCountdown.classList.add('hidden');
    lapsSectionCountdown.classList.add('hidden');
    updateButtonStates(); saveAppState();
}
function recordCountdownLap() {
    const { countdown } = appState;
    if (!countdown.isRunning || countdown.isPaused) return;
    const lapTimeRemaining = countdown.remainingTime;
    // Store the time *remaining* when lap was taken
    countdown.laps.push({ id: countdown.nextLapId++, number: countdown.laps.length + 1, name: `Temps Restant ${countdown.laps.length + 1}`, time: formatTime(lapTimeRemaining, false, true), rawTime: lapTimeRemaining });
    renderLaps('countdown');
    updateButtonStates(); saveAppState();
}

// --- Generic Lap/Time Management (for both modes) ---
function renderLaps(mode) {
    const { laps, nextLapId: currentNextLapId } = appState[mode];
    const listElement = mode === 'chrono' ? lapsListChrono : lapsListCountdown;
    const sectionElement = mode === 'chrono' ? lapsSectionChrono : lapsSectionCountdown;

    listElement.innerHTML = '';
    if (laps.length === 0) { sectionElement.classList.add('hidden'); return; }
    sectionElement.classList.remove('hidden');

    const existingLastLaps = listElement.querySelectorAll('.last-lap');
    existingLastLaps.forEach(el => el.classList.remove('last-lap'));

    laps.forEach((lap, index) => {
        const li = document.createElement('li'); li.draggable = true; li.dataset.lapId = lap.id;
        const lapDetailsDiv = document.createElement('div'); lapDetailsDiv.className = 'lap-details';
        const nameSpan = document.createElement('span'); nameSpan.className = 'lap-name'; nameSpan.textContent = lap.name; nameSpan.title = "Cliquez pour modifier"; nameSpan.addEventListener('click', () => editLapName(mode, lap.id, nameSpan, li));
        const timeSpan = document.createElement('span'); timeSpan.className = 'lap-time'; timeSpan.textContent = lap.time;
        lapDetailsDiv.appendChild(nameSpan); lapDetailsDiv.appendChild(timeSpan);
        const actionsDiv = document.createElement('div'); actionsDiv.className = 'lap-actions';
        const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-lap-btn'; deleteBtn.innerHTML = `<img src="assets/delete.svg" alt="Supprimer">`; deleteBtn.title = "Supprimer"; deleteBtn.setAttribute('aria-label', `Supprimer ${lap.name}`); deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteLap(mode, lap.id); });
        actionsDiv.appendChild(deleteBtn);
        li.appendChild(lapDetailsDiv); li.appendChild(actionsDiv);
        li.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', `${lap.name}: ${lap.time}`); e.target.classList.add('dragging'); });
        li.addEventListener('dragend', (e) => e.target.classList.remove('dragging'));
        listElement.appendChild(li);
        if (index === laps.length - 1) li.classList.add('last-lap');
    });
    updateButtonStates(); // After rendering, buttons might need to update (e.g. save button)
}
function editLapName(mode, lapId, nameSpan, listItem) {
    const { laps } = appState[mode];
    const lap = laps.find(l => l.id === lapId); if (!lap) return;
    if (listItem.querySelector('.lap-name-input')) return; // Already editing
    const input = document.createElement('input'); input.type = 'text'; input.className = 'lap-name-input'; input.value = lap.name;
    nameSpan.replaceWith(input); input.focus(); input.select();
    const saveName = () => {
        const newName = input.value.trim(); if (newName) lap.name = newName;
        const deleteButton = listItem.querySelector('.delete-lap-btn'); if (deleteButton) deleteButton.setAttribute('aria-label', `Supprimer ${lap.name}`);
        input.replaceWith(nameSpan); nameSpan.textContent = lap.name; saveAppState();
    };
    input.addEventListener('blur', saveName);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); else if (e.key === 'Escape') { input.value = lap.name; input.blur(); } });
}
function deleteLap(mode, lapId) {
    let { laps, nextLapId } = appState[mode];
    appState[mode].laps = laps.filter(lap => lap.id !== lapId);
    appState[mode].laps.forEach((lap, index) => lap.number = index + 1); // Re-number
    // if (appState[mode].laps.length === 0) appState[mode].nextLapId = 1; // Optional: reset ID counter
    renderLaps(mode); saveAppState();
}
function sortLaps(mode, ascending = true) {
    const { laps } = appState[mode];
    // For countdown, "rawTime" is remaining time. Ascending sort means shortest remaining time first (closer to end).
    // If you want longest remaining time first (further from end), invert for countdown.
    // Or, if "rawTime" was time *from start* of countdown, then it's consistent.
    // Current "rawTime" for countdown is remaining time, so ascending sort means smaller remaining value first.
    laps.sort((a, b) => ascending ? a.rawTime - b.rawTime : b.rawTime - a.rawTime);
    renderLaps(mode); saveAppState();
}
function showSaveOptions(mode) {
    const { laps } = appState[mode];
    const exportDiv = mode === 'chrono' ? exportOptionsDivChrono : exportOptionsDivCountdown;
    if (laps.length === 0) { alert("Aucun temps à sauvegarder."); return; }
    exportDiv.classList.toggle('hidden');
}
function exportToFormat(mode, format) {
    const { laps } = appState[mode];
    const exportDiv = mode === 'chrono' ? exportOptionsDivChrono : exportOptionsDivCountdown;
    if (laps.length === 0) { alert("Aucun temps à sauvegarder."); return; }

    const filenameBase = mode === 'chrono' ? 'temps_chronometre' : 'temps_compte_a_rebours';
    let title = mode === 'chrono' ? "Temps Chronométrés" : "Temps Enregistrés (Compte à Rebours)";

    if (format === 'pdf') {
        const doc = new jsPDF(); doc.setFontSize(18); doc.text(title, 14, 22); doc.setFontSize(11); let y = 30;
        laps.forEach(lap => { doc.text(`Nom: ${lap.name}, Valeur: ${lap.time}`, 14, y); y += 7; if (y > 280) { doc.addPage(); y = 20; } });
        doc.save(`${filenameBase}.pdf`);
    } else if (format === 'csv') {
        let csvContent = "data:text/csv;charset=utf-8,Numéro,Nom,Valeur\n";
        laps.forEach(lap => csvContent += `${lap.number},${escapeCsvField(lap.name)},${escapeCsvField(lap.time)}\n`);
        const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `${filenameBase}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } else if (format === 'json') {
        const exportableLaps = laps.map(lap => ({ id: lap.id, number: lap.number, name: lap.name, time: lap.time, rawTime: lap.rawTime }));
        const jsonData = JSON.stringify(exportableLaps, null, 2); const blob = new Blob([jsonData], { type: "application/json" }); const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = `${filenameBase}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    }
    exportDiv.classList.add('hidden');
}
function escapeCsvField(field) { return `"${String(field).replace(/"/g, '""')}"`; }


// --- Notification Logic --- (same as before)
function requestNotificationPermission() {
    if (!("Notification" in window)) { countdownNotificationCheck.disabled = true; countdownNotificationCheck.parentElement.title = "Notifications non supportées."; return; }
    if (Notification.permission === "granted") return true;
    else if (Notification.permission !== "denied") Notification.requestPermission().then(p => { if(p === "denied") countdownNotificationCheck.checked = false; });
}
function showNotification(message) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification(appTitle.textContent, { body: message, icon: 'assets/lap.svg' }); // Use current app title
}

// --- Fullscreen Logic --- (same as before)
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            document.body.classList.add('fullscreen-active');
            fullscreenBtn.innerHTML = `<img src="assets/exit-fullscreen.svg" alt="Quitter plein écran">`;
            fullscreenBtn.setAttribute('aria-label', 'Quitter le mode plein écran');
        }).catch(err => console.error(`Fullscreen error: ${err.message}`));
    } else if (document.exitFullscreen) {
        document.exitFullscreen().then(() => { /* State updated by event listener */ });
    }
}
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.classList.contains('fullscreen-active')) {
        document.body.classList.remove('fullscreen-active');
        fullscreenBtn.innerHTML = `<img src="assets/fullscreen.svg" alt="Plein écran">`;
        fullscreenBtn.setAttribute('aria-label', 'Mode plein écran');
    } else if (document.fullscreenElement && !document.body.classList.contains('fullscreen-active')) {
        // This case can happen if fullscreen was entered by F11 then button clicked
        document.body.classList.add('fullscreen-active');
        fullscreenBtn.innerHTML = `<img src="assets/exit-fullscreen.svg" alt="Quitter plein écran">`;
        fullscreenBtn.setAttribute('aria-label', 'Quitter le mode plein écran');
    }
});


// --- Theme Management ---
function applyTheme(theme) { document.body.dataset.theme = theme; appState.theme = theme; }
function toggleTheme() { const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(newTheme); saveAppState(); }

// --- Local Storage ---
function saveAppState() {
    appState.countdown.notify = countdownNotificationCheck.checked; // Ensure this is up-to-date
    appState.countdown.inputs = { // Persist current input values
        h: countdownHoursInput.value, m: countdownMinutesInput.value, s: countdownSecondsInput.value
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        clearStorageBtn.classList.remove('hidden');
    } catch (e) { console.error("LocalStorage save error:", e); }
}
function loadAppState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const loadedState = JSON.parse(saved);
            // Merge carefully, especially for nested objects, to avoid losing structure if saved state is partial/old
            appState.theme = loadedState.theme || 'dark';
            currentMode = loadedState.currentMode || 'chrono'; // Load mode preference

            // Chrono state
            Object.assign(appState.chrono, loadedState.chrono);
            timeDisplay.textContent = formatTime(appState.chrono.elapsedTime);
            renderLaps('chrono');

            // Countdown state
            Object.assign(appState.countdown, loadedState.countdown);
            if (loadedState.countdown && loadedState.countdown.inputs) {
                 countdownHoursInput.value = loadedState.countdown.inputs.h || '0';
                 countdownMinutesInput.value = loadedState.countdown.inputs.m || '0';
                 countdownSecondsInput.value = loadedState.countdown.inputs.s || '5';
            }
            countdownNotificationCheck.checked = appState.countdown.notify || false;
            // If not running or paused, display initial or remaining from inputs
            if (!appState.countdown.isRunning && !appState.countdown.isPaused) {
                appState.countdown.initialDuration = getCountdownDurationFromInputs();
                 // If remainingTime was 0 from a finished countdown, keep it 0, else use initialDuration
                appState.countdown.remainingTime = (appState.countdown.remainingTime === 0 && loadedState.countdown && loadedState.countdown.initialDuration > 0) ? 0 : appState.countdown.initialDuration;
            }
            countdownDisplay.textContent = formatTime(appState.countdown.remainingTime, false, true);
            renderLaps('countdown');

            applyTheme(appState.theme);
            switchMode(currentMode); // This will also call updateButtonStates

            // Resume running states if applicable
            if (currentMode === 'chrono') {
                if (appState.chrono.isRunning && !appState.chrono.isPaused) playChrono();
                else if (appState.chrono.isPaused) { // Re-establish paused state visually
                    timeDisplay.classList.add('paused-display'); updateButtonStates();
                }
            } else if (currentMode === 'countdown') {
                if (appState.countdown.isRunning && !appState.countdown.isPaused) startOrResumeCountdown(); // Will resume based on remaining time
                else if (appState.countdown.isPaused) {
                    countdownDisplay.classList.add('paused-display'); updateButtonStates();
                }
            }
            clearStorageBtn.classList.remove('hidden');
        } else {
            initializeAppDefaults();
        }
    } catch (e) {
        console.error("LocalStorage load error:", e);
        initializeAppDefaults();
    }
}
function initializeAppDefaults() {
    applyTheme('dark');
    switchMode('chrono'); // Default to chrono
    resetChrono();
    resetCountdown(); // Initialize countdown display based on inputs
    updateCountdownDisplayFromInputs(); // Explicitly set countdown display from inputs
    clearStorageBtn.classList.add('hidden');
    updateButtonStates();
}
function clearSavedData() {
    if (confirm("Effacer toutes les données sauvegardées ?")) {
        localStorage.removeItem(STORAGE_KEY);
        // Reset appState to a clean default before re-initializing
        appState = {
            chrono: { startTime: 0, elapsedTime: 0, timerInterval: null, laps: [], isRunning: false, isPaused: false, nextLapId: 1 },
            countdown: { targetTime: 0, remainingTime: 0, timerInterval: null, laps: [], isRunning: false, isPaused: false, nextLapId: 1, initialDuration: 0, notify: false, inputs: {h:'0',m:'0',s:'5'} },
            theme: 'dark', currentMode: 'chrono'
        };
        countdownHoursInput.value = '0'; countdownMinutesInput.value = '0'; countdownSecondsInput.value = '5';
        countdownNotificationCheck.checked = false;
        initializeAppDefaults();
        alert("Données sauvegardées effacées.");
    }
}

// --- Event Listeners ---
// Mode Switch
switchToChronoBtn.addEventListener('click', () => switchMode('chrono'));
switchToCountdownBtn.addEventListener('click', () => switchMode('countdown'));

// Chrono
playBtn.addEventListener('click', playChrono);
pauseBtn.addEventListener('click', () => appState.chrono.isPaused ? playChrono() : pauseChrono());
lapBtn.addEventListener('click', recordChronoLap);
stopBtn.addEventListener('click', stopChrono);
resetBtn.addEventListener('click', resetChrono);
saveBtn.addEventListener('click', () => showSaveOptions('chrono'));
exportPdfBtnChrono.addEventListener('click', () => exportToFormat('chrono', 'pdf'));
exportCsvBtnChrono.addEventListener('click', () => exportToFormat('chrono', 'csv'));
exportJsonBtnChrono.addEventListener('click', () => exportToFormat('chrono', 'json'));
sortAscBtnChrono.addEventListener('click', () => sortLaps('chrono', true));
sortDescBtnChrono.addEventListener('click', () => sortLaps('chrono', false));

// Countdown
startCountdownBtn.addEventListener('click', startOrResumeCountdown);
pauseCountdownBtn.addEventListener('click', () => appState.countdown.isPaused ? startOrResumeCountdown() : pauseCountdown());
lapCountdownBtn.addEventListener('click', recordCountdownLap);
resetCountdownBtn.addEventListener('click', resetCountdown);
saveCountdownBtn.addEventListener('click', () => showSaveOptions('countdown'));
exportPdfBtnCountdown.addEventListener('click', () => exportToFormat('countdown', 'pdf'));
exportCsvBtnCountdown.addEventListener('click', () => exportToFormat('countdown', 'csv'));
exportJsonBtnCountdown.addEventListener('click', () => exportToFormat('countdown', 'json'));
sortAscBtnCountdown.addEventListener('click', () => sortLaps('countdown', true));
sortDescBtnCountdown.addEventListener('click', () => sortLaps('countdown', false));

[countdownHoursInput, countdownMinutesInput, countdownSecondsInput].forEach(input => {
    input.addEventListener('input', () => { // Live update if not running
        if (!appState.countdown.isRunning && !appState.countdown.isPaused) updateCountdownDisplayFromInputs();
    });
    input.addEventListener('change', saveAppState);
});
countdownNotificationCheck.addEventListener('change', () => {
    appState.countdown.notify = countdownNotificationCheck.checked;
    if (appState.countdown.notify) requestNotificationPermission();
    saveAppState();
});

// General
themeToggleBtn.addEventListener('click', toggleTheme);
fullscreenBtn.addEventListener('click', toggleFullscreen);
clearStorageBtn.addEventListener('click', clearSavedData);

// --- Initial Setup ---
window.addEventListener('load', () => {
    loadAppState();
    requestNotificationPermission();
});