/* ===========================================================
   Mala — Japa Counter
   Counts chants via the phone's hardware volume buttons
   (best-effort, Android Chrome) or manual tap, and rings a
   flute alarm when the target is reached.
   =========================================================== */

(function () {
  "use strict";

  /* ---------- Tiny silent WAV, used only to make an <audio>
     element that fires 'volumechange' when the OS volume moves. ---------- */
  var SILENT_WAV =
    "data:audio/wav;base64,UklGRoQJAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YWAJAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA=";

  /* ---------- Constants ---------- */
  var ARC_CIRCUMFERENCE = 879.6; // 2 * PI * r140, matches styles.css
  var STORAGE_KEY = "mala-japa-state-v1";
  var MAX_BEAD_DOTS = 216; // above this we fall back to a smooth arc only
  var DEBOUNCE_MS = 180;

  /* ---------- DOM refs ---------- */
  var el = {
    beadsLayer: document.getElementById("beadsLayer"),
    arcFill: document.getElementById("arcFill"),
    countNumber: document.getElementById("countNumber"),
    countTarget: document.getElementById("countTarget"),
    statusLine: document.getElementById("statusLine"),
    startBtn: document.getElementById("startBtn"),
    resetBtn: document.getElementById("resetBtn"),
    tapPlusBtn: document.getElementById("tapPlusBtn"),
    statLifetime: document.getElementById("statLifetime"),
    statSessions: document.getElementById("statSessions"),
    completeOverlay: document.getElementById("completeOverlay"),
    overlaySub: document.getElementById("overlaySub"),
    stopAlarmBtn: document.getElementById("stopAlarmBtn"),
    stopAlarmContinueBtn: document.getElementById("stopAlarmContinueBtn"),
    settingsOverlay: document.getElementById("settingsOverlay"),
    openSettings: document.getElementById("openSettings"),
    closeSettings: document.getElementById("closeSettings"),
    resetStatsBtn: document.getElementById("resetStatsBtn"),
    targetChips: document.getElementById("targetChips"),
    customTarget: document.getElementById("customTarget"),
    modeChips: document.getElementById("modeChips"),
    modeHint: document.getElementById("modeHint"),
    vibrateToggle: document.getElementById("vibrateToggle"),
    soundToggle: document.getElementById("soundToggle"),
    wakeLockToggle: document.getElementById("wakeLockToggle"),
    alarmAudio: document.getElementById("alarmAudio")
  };

  /* ---------- State ---------- */
  var defaultState = {
    target: 108,
    count: 0,
    mode: "volume", // 'volume' | 'tap'
    vibrate: true,
    sound: true,
    wakeLock: true,
    lifetimeCount: 0,
    sessionsCompleted: 0
  };
  var state = loadState();

  var sessionActive = false;
  var wakeLockSentinel = null;
  var volumeAudioEl = null;
  var lastTick = 0;
  var beadEls = [];

  /* ---------- Persistence ---------- */
  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, defaultState);
      var parsed = JSON.parse(raw);
      return Object.assign({}, defaultState, parsed);
    } catch (e) {
      return Object.assign({}, defaultState);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage unavailable, ignore */
    }
  }

  /* ---------- Bead ring ---------- */
  function buildBeadRing() {
    el.beadsLayer.innerHTML = "";
    beadEls = [];

    var useBeads = state.target > 0 && state.target <= MAX_BEAD_DOTS;
    el.arcFill.style.display = useBeads ? "none" : "";

    if (!useBeads) return;

    var n = state.target;
    var radiusPct = 46; // percentage of container, keeps beads inside the ring track
    var containerSize = el.beadsLayer.getBoundingClientRect().width || 320;
    var radiusPx = (radiusPct / 100) * containerSize;

    for (var i = 0; i < n; i++) {
      var angle = (i / n) * Math.PI * 2 - Math.PI / 2; // start at top
      var x = 50 + (radiusPx / containerSize) * 50 * Math.cos(angle) * 2;
      var y = 50 + (radiusPx / containerSize) * 50 * Math.sin(angle) * 2;

      var bead = document.createElement("div");
      bead.className = "bead" + (i === 0 ? " guru" : "");
      bead.style.left = x + "%";
      bead.style.top = y + "%";
      el.beadsLayer.appendChild(bead);
      beadEls.push(bead);
    }
  }

  function renderProgress() {
    var target = state.target;
    var count = Math.min(state.count, target);

    el.countNumber.textContent = state.count;
    el.countTarget.textContent = "of " + target;

    if (beadEls.length) {
      for (var i = 0; i < beadEls.length; i++) {
        if (i < count) beadEls[i].classList.add("lit");
        else beadEls[i].classList.remove("lit");
      }
    } else {
      var frac = target > 0 ? Math.min(count / target, 1) : 0;
      var offset = ARC_CIRCUMFERENCE * (1 - frac);
      el.arcFill.style.strokeDashoffset = offset;
    }

    el.statLifetime.textContent = state.lifetimeCount;
    el.statSessions.textContent = state.sessionsCompleted;
  }

  /* ---------- Counting ---------- */
  function incrementCount() {
    if (state.count >= state.target) return;

    state.count += 1;
    state.lifetimeCount += 1;
    saveState();
    renderProgress();

    if (state.vibrate && "vibrate" in navigator) {
      navigator.vibrate(25);
    }

    if (state.count >= state.target) {
      finishSession();
    }
  }

  function finishSession() {
    sessionActive = false;
    state.sessionsCompleted += 1;
    saveState();
    releaseWakeLock();
    stopVolumeListener();

    el.overlaySub.textContent = "You chanted " + state.target + " times.";
    el.completeOverlay.hidden = false;
    el.startBtn.textContent = "Start";

    if (state.vibrate && "vibrate" in navigator) {
      navigator.vibrate([80, 60, 80, 60, 160]);
    }

    if (state.sound) {
      el.alarmAudio.currentTime = 0;
      el.alarmAudio.loop = true;
      el.alarmAudio.play().catch(function () {
        /* Autoplay may be blocked; the overlay's Stop button still works,
           and the user already interacted with Start, so this is rare. */
      });
    }

    el.statusLine.textContent = "Japa complete. Tap Stop to finish.";
  }

  function stopAlarm() {
    el.alarmAudio.pause();
    el.alarmAudio.currentTime = 0;
    el.completeOverlay.hidden = true;
  }

  /* ---------- Session control ---------- */
  function startSession() {
    if (state.count >= state.target) {
      state.count = 0;
    }
    sessionActive = true;
    saveState();

    el.startBtn.textContent = "Pause";
    el.statusLine.textContent =
      state.mode === "volume"
        ? "Chanting… press either volume button to count."
        : "Chanting… tap +1 or the ring to count.";

    if (state.mode === "volume") {
      startVolumeListener();
    }
    if (state.wakeLock) {
      requestWakeLock();
    }
  }

  function pauseSession() {
    sessionActive = false;
    el.startBtn.textContent = "Resume";
    el.statusLine.textContent = "Paused. Tap Resume to continue.";
    stopVolumeListener();
    releaseWakeLock();
  }

  function resetSession() {
    sessionActive = false;
    state.count = 0;
    saveState();
    renderProgress();
    el.startBtn.textContent = "Start";
    el.statusLine.textContent =
      state.mode === "volume"
        ? "Tap start, then chant — press either volume button to count."
        : "Tap start, then tap +1 or the ring to count.";
    stopVolumeListener();
    releaseWakeLock();
    stopAlarm();
  }

  /* ---------- Volume-button detection (best effort) ----------
     There is no official Web API for hardware volume buttons.
     This uses a known trick: play a silent, looping <audio>
     element and listen for the 'volumechange' event, which
     fires on some mobile browsers (notably Android Chrome) when
     the OS volume changes — including via the hardware buttons.
     Trade-offs, disclosed to the user in Settings:
       - The phone's actual media volume will move a little.
       - Not supported on iOS Safari; tap mode is the fallback.
       - Requires the tab to stay open/foregrounded. ---------- */
  function startVolumeListener() {
    if (volumeAudioEl) return;
    volumeAudioEl = new Audio(SILENT_WAV);
    volumeAudioEl.loop = true;
    volumeAudioEl.volume = 0.5;
    volumeAudioEl.play().catch(function () {
      el.statusLine.textContent =
        "Couldn't start volume detection — tap +1 instead, or switch mode in Settings.";
    });
    volumeAudioEl.addEventListener("volumechange", onVolumeChange);
  }

  function onVolumeChange() {
    if (!sessionActive || state.mode !== "volume") return;
    var now = Date.now();
    if (now - lastTick < DEBOUNCE_MS) return;
    lastTick = now;

    incrementCount();

    // Recentre the volume so there's room to detect the next
    // press in either direction.
    try {
      if (volumeAudioEl) volumeAudioEl.volume = 0.5;
    } catch (e) {
      /* ignore */
    }
  }

  function stopVolumeListener() {
    if (!volumeAudioEl) return;
    volumeAudioEl.removeEventListener("volumechange", onVolumeChange);
    volumeAudioEl.pause();
    volumeAudioEl = null;
  }

  /* ---------- Wake Lock ---------- */
  function requestWakeLock() {
    if (!("wakeLock" in navigator)) return;
    navigator.wakeLock
      .request("screen")
      .then(function (sentinel) {
        wakeLockSentinel = sentinel;
      })
      .catch(function () {
        /* ignore — not fatal */
      });
  }

  function releaseWakeLock() {
    if (wakeLockSentinel) {
      wakeLockSentinel.release().catch(function () {});
      wakeLockSentinel = null;
    }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && sessionActive && state.wakeLock) {
      requestWakeLock();
    }
  });

  /* ---------- Settings UI ---------- */
  function syncSettingsUI() {
    var chips = el.targetChips.querySelectorAll(".chip");
    var matched = false;
    chips.forEach(function (chip) {
      var isMatch = Number(chip.dataset.target) === state.target;
      chip.classList.toggle("active", isMatch);
      if (isMatch) matched = true;
    });
    el.customTarget.value = matched ? "" : state.target;

    el.modeChips.querySelectorAll(".chip").forEach(function (chip) {
      chip.classList.toggle("active", chip.dataset.mode === state.mode);
    });

    el.vibrateToggle.checked = state.vibrate;
    el.soundToggle.checked = state.sound;
    el.wakeLockToggle.checked = state.wakeLock;
  }

  function setTarget(newTarget) {
    newTarget = Math.max(1, Math.min(100000, Math.floor(newTarget) || 1));
    state.target = newTarget;
    state.count = 0;
    saveState();
    buildBeadRing();
    renderProgress();
    syncSettingsUI();
  }

  el.targetChips.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    setTarget(Number(chip.dataset.target));
  });

  el.customTarget.addEventListener("change", function () {
    var val = parseInt(el.customTarget.value, 10);
    if (val > 0) setTarget(val);
  });

  el.modeChips.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    state.mode = chip.dataset.mode;
    saveState();
    syncSettingsUI();
    if (state.mode === "tap") {
      stopVolumeListener();
    } else if (sessionActive) {
      startVolumeListener();
    }
  });

  el.vibrateToggle.addEventListener("change", function () {
    state.vibrate = el.vibrateToggle.checked;
    saveState();
  });

  el.soundToggle.addEventListener("change", function () {
    state.sound = el.soundToggle.checked;
    saveState();
  });

  el.wakeLockToggle.addEventListener("change", function () {
    state.wakeLock = el.wakeLockToggle.checked;
    saveState();
    if (!state.wakeLock) releaseWakeLock();
  });

  el.openSettings.addEventListener("click", function () {
    syncSettingsUI();
    el.settingsOverlay.hidden = false;
  });

  el.closeSettings.addEventListener("click", function () {
    el.settingsOverlay.hidden = true;
  });

  el.resetStatsBtn.addEventListener("click", function () {
    var ok = window.confirm(
      "Reset lifetime beads and malas completed back to 0? This can't be undone."
    );
    if (!ok) return;
    state.lifetimeCount = 0;
    state.sessionsCompleted = 0;
    saveState();
    renderProgress();
  });

  /* ---------- Main controls ---------- */
  el.startBtn.addEventListener("click", function () {
    if (sessionActive) {
      pauseSession();
    } else {
      startSession();
    }
  });

  el.resetBtn.addEventListener("click", resetSession);

  el.tapPlusBtn.addEventListener("click", function () {
    if (!sessionActive) startSession();
    incrementCount();
  });

  // Let tapping the ring itself count too, when in tap mode.
  document.getElementById("ringWrap").addEventListener("click", function () {
    if (state.mode !== "tap") return;
    if (!sessionActive) startSession();
    incrementCount();
  });

  el.stopAlarmBtn.addEventListener("click", function () {
    stopAlarm();
    resetSession();
  });

  el.stopAlarmContinueBtn.addEventListener("click", function () {
    stopAlarm();
    state.count = 0;
    saveState();
    renderProgress();
    el.statusLine.textContent = "Ready for another round.";
  });

  // Desktop convenience: arrow keys act like volume buttons for testing.
  document.addEventListener("keydown", function (e) {
    if (!sessionActive || state.mode !== "volume") return;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      incrementCount();
    }
  });

  window.addEventListener("resize", function () {
    buildBeadRing();
    renderProgress();
  });

  /* ---------- Init ---------- */
  buildBeadRing();
  renderProgress();
  syncSettingsUI();
})();
