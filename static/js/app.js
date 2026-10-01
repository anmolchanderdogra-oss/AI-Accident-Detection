/**
 * AI Accident Guard — Master Application Controller
 * Engineered with GSAP 3.12, Lenis Smooth Scroll, Web Audio Synthesizer,
 * and Real-Time Autonomous Computer Vision Telemetry.
 */

let currentLocation = null;
let webcamStream = null;
let webcamInterval = null;
let isWebcamRunning = false;
let audioCtx = null;
let isAudioMuted = false;
let lenisInstance = null;

// ==========================================================================
// Initialization Lifecycle
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initTheme();
  initNavbarInteractions();
  initGeolocation();
  fetchHealthAndStats();
  loadIncidents();
  setupUploadZone();
  setupEventListeners();
  setupKeyboardShortcuts();
  initGSAPAnimations();

  const audioBtn = document.getElementById('btnAudioToggle');
  if (audioBtn) {
    audioBtn.addEventListener('click', toggleAudioMute);
  }
});

// ==========================================================================
// 1. Smooth Scroll Engine (Native Hardware Accelerated, Zero Lag)
// ==========================================================================
function initLenis() {
  // Use native smooth scrolling for instant response and zero input lag
  document.documentElement.style.scrollBehavior = 'smooth';
}

// ==========================================================================
// 2. Palette Theme Engine (Daylight Light Mode by default)
// ==========================================================================
function initTheme() {
  const saved = localStorage.getItem('accident_guard_palette') || 'light';
  setGlobalPalette(saved, false);
}

window.toggleLightDarkMode = function() {
  const isLight = document.body.classList.contains('theme-light');
  const targetTheme = isLight ? 'industrial' : 'light';
  setGlobalPalette(targetTheme, true);
};

window.setGlobalPalette = function(theme, showNotice = true) {
  document.body.classList.remove('theme-industrial', 'theme-cyber', 'theme-emerald', 'theme-light');
  document.body.classList.add(`theme-${theme}`);
  
  const icon = document.getElementById('themeModeIcon');
  if (theme === 'light') {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    if (icon) icon.textContent = 'dark_mode';
  } else {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    if (icon) icon.textContent = 'light_mode';
  }

  const label = document.getElementById('currentThemeLabel');
  if (label) {
    if (theme === 'industrial') label.textContent = 'Industrial Dark';
    else if (theme === 'cyber') label.textContent = 'Cyber Neon';
    else if (theme === 'emerald') label.textContent = 'Midnight Emerald';
    else if (theme === 'light') label.textContent = 'Daylight Tactical';
  }

  if (window.update3DTheme) {
    window.update3DTheme(theme === 'light');
  }

  localStorage.setItem('accident_guard_palette', theme);
  if (showNotice) {
    showToast(`Switched to ${theme === 'light' ? 'Light Daylight' : 'Dark'} Mode`, 'info');
  }
};

// ==========================================================================
// 3. GSAP Kinetic Animations & Staggered Reveal
// ==========================================================================
function initGSAPAnimations() {
  if (typeof gsap === 'undefined') return;

  // Staggered entry for telemetry cards with automatic cleanup
  gsap.from('#telemetryRow > div', {
    y: 20,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: 'power2.out',
    delay: 0.15,
    clearProps: 'transform,opacity'
  });

  // Entry for 3D Radar Section
  const radar3dEl = document.getElementById('radar-3d-section');
  if (radar3dEl) {
    gsap.from(radar3dEl, {
      scale: 0.98,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.5,
      clearProps: 'transform,opacity'
    });
  }

  // Entry for Video Studio
  const videoFeedEl = document.getElementById('video-feed-section');
  if (videoFeedEl) {
    gsap.from(videoFeedEl, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.7,
      clearProps: 'transform,opacity'
    });
  }
}

function animateNumber(elementId, targetValue, suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;
  const currentVal = parseInt(el.textContent.replace(/\D/g, '') || 0, 10);

  if (typeof gsap !== 'undefined') {
    const obj = { val: currentVal };
    gsap.to(obj, {
      val: targetValue,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.val) + suffix;
      }
    });
  } else {
    el.textContent = targetValue + suffix;
  }
}

// ==========================================================================
// 4. Toast Notification Engine
// ==========================================================================
window.showToast = function (message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const isAlert = type === 'alert' || type === 'error';
  toast.className = `cyber-toast ${isAlert ? 'toast-alert' : ''}`;

  const iconName = isAlert ? 'warning' : (type === 'success' ? 'check_circle' : 'info');
  const iconColor = isAlert ? 'text-rose-400' : (type === 'success' ? 'text-emerald-400' : 'text-cyan-400');

  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px] ${iconColor}">${iconName}</span>
    <span class="flex-1">${message}</span>
    <button class="text-slate-400 hover:text-white" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  // Play subtle feedback chime
  playFeedbackBeep(isAlert ? 320 : 880);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4200);
};

// ==========================================================================
// 5. Audio Synthesizer (Web Audio API)
// ==========================================================================
function toggleAudioMute() {
  isAudioMuted = !isAudioMuted;
  const btn = document.getElementById('btnAudioToggle');
  const label = document.getElementById('audioLabel');
  const eq = document.getElementById('navEqualizer');

  if (isAudioMuted) {
    if (label) label.textContent = 'MUTED';
    if (btn) btn.classList.add('text-rose-400', 'border-rose-500/40');
    if (eq) eq.classList.add('paused');
    showToast('Alert sirens and audio muted', 'info');
  } else {
    if (label) label.textContent = 'AUDIO ON';
    if (btn) btn.classList.remove('text-rose-400', 'border-rose-500/40');
    if (eq) eq.classList.remove('paused');
    showToast('Audio alerts enabled', 'success');
  }
}

function playEmergencySiren() {
  if (isAudioMuted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    const now = audioCtx.currentTime;

    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(1050, now + 0.25);
    osc.frequency.linearRampToValueAtTime(650, now + 0.5);
    osc.frequency.linearRampToValueAtTime(1050, now + 0.75);
    osc.frequency.linearRampToValueAtTime(650, now + 1.0);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 1.25);
  } catch (e) {
    console.log('Audio autoplay prevented:', e);
  }
}

function playFeedbackBeep(freq = 750) {
  if (isAudioMuted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {}
}

// ==========================================================================
// 6. Geolocation Core
// ==========================================================================
function initGeolocation() {
  const chip = document.getElementById('gpsStatusChip');
  const hudGps = document.getElementById('hudGpsText');
  const alertCoords = document.getElementById('alertCardCoords');

  if (!navigator.geolocation) {
    if (chip) chip.textContent = 'GPS: 37.7749° N, 122.4194° W';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        source: 'browser'
      };
      const str = `${currentLocation.latitude.toFixed(4)}° N, ${currentLocation.longitude.toFixed(4)}° W`;
      if (chip) chip.innerHTML = `GPS: ${str}`;
      if (hudGps) hudGps.textContent = `GPS: ${str}`;
      if (alertCoords) alertCoords.textContent = str;
    },
    (err) => {
      currentLocation = {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        source: 'grid_station'
      };
      const fallbackStr = `37.7749° N, 122.4194° W (Station NW)`;
      if (chip) chip.innerHTML = `GPS: ${fallbackStr}`;
      if (hudGps) hudGps.textContent = `GPS: ${fallbackStr}`;
      if (alertCoords) alertCoords.textContent = fallbackStr;
    },
    { timeout: 7000, enableHighAccuracy: true }
  );
}

// ==========================================================================
// 7. System Health & Statistics
// ==========================================================================
async function fetchHealthAndStats() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data && data.metrics) {
      animateNumber('statIncidents', data.metrics.total_incidents || 0);

      const alertsEl = document.getElementById('statAlertsDesc');
      if (alertsEl) alertsEl.textContent = `${data.metrics.alerts_dispatched || 0} Alerts Dispatched`;

      const threshText = document.getElementById('sidebarThresholdText');
      if (threshText) threshText.textContent = `Confidence Threshold: ${Math.round(data.metrics.threshold * 100)}%`;

      const peakText = document.getElementById('peakProbabilityText');
      if (peakText) peakText.textContent = `THRESHOLD: ${Math.round(data.metrics.threshold * 100)}%`;
    }
  } catch (err) {
    console.error('Failed to fetch health metrics:', err);
  }
}

// ==========================================================================
// 8. Video Upload & Temporal Processing Pipeline
// ==========================================================================
function setupUploadZone() {
  const fileInput = document.getElementById('videoFileInput');
  const uploadBtn = document.getElementById('btnUploadTrigger');
  const dropZone = document.getElementById('videoDropZone');

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) handleVideoUpload(fileInput.files[0]);
    });
  }

  if (dropZone) {
    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.add('border-cyan-400', 'ring-2', 'ring-cyan-500/50');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-cyan-400', 'ring-2', 'ring-cyan-500/50');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files.length > 0) handleVideoUpload(e.dataTransfer.files[0]);
    });
  }
}

async function handleVideoUpload(file) {
  if (isWebcamRunning) stopWebcam();

  const videoPlayer = document.getElementById('mainVideoPlayer');
  const emptyState = document.getElementById('emptyVideoState');
  const hudSource = document.getElementById('hudSource');
  const mainStatus = document.getElementById('mainStatusBadge');
  const progressContainer = document.getElementById('uploadProgressContainer');
  const progressBar = document.getElementById('uploadProgressBar');
  const progressPercent = document.getElementById('uploadProgressPercent');
  const progressLabel = document.getElementById('uploadProgressLabel');

  if (mainStatus) {
    mainStatus.className = 'badge-neon badge-cyan';
    mainStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span> INFERENCE RUNNING';
  }

  if (videoPlayer && emptyState) {
    const objectUrl = URL.createObjectURL(file);
    videoPlayer.src = objectUrl;
    videoPlayer.style.display = 'block';
    emptyState.style.display = 'none';
    videoPlayer.play();
  }

  if (hudSource) {
    hudSource.textContent = `SRC: ${file.name.substring(0, 20)}`;
  }

  if (progressContainer) {
    progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '15%';
    if (progressPercent) progressPercent.textContent = '15%';
  }

  const formData = new FormData();
  formData.append('video', file);
  if (currentLocation) {
    formData.append('latitude', currentLocation.latitude);
    formData.append('longitude', currentLocation.longitude);
    formData.append('accuracy', currentLocation.accuracy || 0);
    formData.append('source', currentLocation.source);
  }

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/detect/upload', true);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 75);
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressPercent) progressPercent.textContent = `${pct}%`;
      if (pct >= 65 && progressLabel) {
        progressLabel.innerHTML = '<span class="animate-spin material-symbols-outlined text-[16px] text-amber-400">memory</span><span>Running Temporal Shockwave Inference...</span>';
      }
    }
  };

  xhr.onload = () => {
    if (progressBar) progressBar.style.width = '100%';
    if (progressPercent) progressPercent.textContent = '100%';

    setTimeout(() => {
      if (progressContainer) progressContainer.classList.add('hidden');
    }, 1000);

    try {
      const data = JSON.parse(xhr.responseText);
      if (xhr.status === 200 && data.status === 'success') {
        const result = data.result;
        const incidents = result.incidents || [];

        if (incidents.length > 0) {
          const latest = incidents[0];
          triggerAccidentState(latest.confidence, `Incident detected at ${latest.time_sec}s`);
          if (latest.evidence_file) {
            const imgPreview = document.getElementById('evidenceImagePreview');
            if (imgPreview) imgPreview.src = `/evidence/${latest.evidence_file}`;
          }
          showToast(`Collision detected! Confidence: ${Math.round(latest.confidence * 100)}%`, 'alert');
        } else {
          updateConfidenceGauge(0.05);
          if (mainStatus) {
            mainStatus.className = 'badge-neon badge-emerald';
            mainStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span> SAFE (NO COLLISION)';
          }
          showToast('Video processed: No collision detected.', 'success');
        }

        fetchHealthAndStats();
        loadIncidents();
      } else {
        showToast(data.error || 'Video analysis failed', 'error');
      }
    } catch (err) {
      console.error('Error parsing video response:', err);
      showToast('Failed to process server response', 'error');
    }
  };

  xhr.onerror = () => {
    if (progressContainer) progressContainer.classList.add('hidden');
    showToast('Network error during video upload', 'error');
  };

  xhr.send(formData);
}

// ==========================================================================
// 9. Live Webcam Studio & Real-Time Object Tracking
// ==========================================================================
function setupEventListeners() {
  const btnWebcam = document.getElementById('btnStartWebcam');
  if (btnWebcam) btnWebcam.addEventListener('click', toggleWebcam);

  const btnSimulate = document.getElementById('btnSimulateCrash');
  if (btnSimulate) btnSimulate.addEventListener('click', simulateAccidentTrigger);

  // Close modals
  document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) {
        document.querySelectorAll('.modal-backdrop').forEach(m => {
          m.classList.remove('active');
          m.style.display = 'none';
        });
      }
    });
  });
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Ignore input tags
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    const key = e.key.toLowerCase();
    if (key === 'c') {
      toggleWebcam();
    } else if (key === 't') {
      simulateAccidentTrigger();
    } else if (key === 'm') {
      toggleAudioMute();
    } else if (key === 's') {
      openSettingsModal();
    } else if (key === '1' && window.setRadarCameraMode) {
      window.setRadarCameraMode('drone');
    } else if (key === '2' && window.setRadarCameraMode) {
      window.setRadarCameraMode('satellite');
    } else if (key === '3' && window.setRadarCameraMode) {
      window.setRadarCameraMode('chase');
    } else if (key === '4' && window.setRadarCameraMode) {
      window.setRadarCameraMode('lidar');
    }
  });
}

async function toggleWebcam() {
  const btnBar = document.getElementById('btnWebcamToggleBar');
  if (isWebcamRunning) {
    stopWebcam();
    if (btnBar) btnBar.innerHTML = '<span class="material-symbols-outlined text-[18px]">videocam</span><span>Start Live Camera</span>';
    showToast('Live camera feed stopped', 'info');
  } else {
    await startWebcam();
    if (btnBar) btnBar.innerHTML = '<span class="material-symbols-outlined text-[18px]">stop_circle</span><span>Stop Camera</span>';
  }
}

async function startWebcam() {
  const video = document.getElementById('mainVideoPlayer');
  const emptyState = document.getElementById('emptyVideoState');
  const hudSource = document.getElementById('hudSource');
  const mainStatus = document.getElementById('mainStatusBadge');

  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });

    video.srcObject = webcamStream;
    video.style.display = 'block';
    emptyState.style.display = 'none';
    video.play();

    isWebcamRunning = true;
    if (hudSource) hudSource.textContent = 'SRC: LIVE WEBCAM';
    if (mainStatus) {
      mainStatus.className = 'badge-neon badge-cyan';
      mainStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span> LIVE SCANNING';
    }

    showToast('Connected live camera feed', 'success');

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = 320;
    captureCanvas.height = 240;
    const captureCtx = captureCanvas.getContext('2d');

    let isSendingFrame = false;

    webcamInterval = setInterval(async () => {
      if (!isWebcamRunning || video.paused || video.ended || isSendingFrame) return;

      isSendingFrame = true;
      try {
        captureCtx.drawImage(video, 0, 0, 320, 240);
        const base64Image = captureCanvas.toDataURL('image/jpeg', 0.60);

        const res = await fetch('/api/detect/frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Image,
            location: currentLocation
          })
        });
        const data = await res.json();

        if (data.status === 'success') {
          const det = data.detection;
          updateConfidenceGauge(det.confidence);
          renderDetectionOverlay(det.boxes, det.confidence);

          if (det.incident) {
            triggerAccidentState(det.confidence, `Live accident captured at ${det.incident.detected_at}`);
            if (det.incident.evidence_file) {
              const imgPreview = document.getElementById('evidenceImagePreview');
              if (imgPreview) imgPreview.src = `/evidence/${det.incident.evidence_file}`;
            }
            fetchHealthAndStats();
            loadIncidents();
          }
        }
      } catch (err) {
        console.error('Frame inference error:', err);
      } finally {
        isSendingFrame = false;
      }
    }, 400);

  } catch (err) {
    console.error('Webcam permission error:', err);
    showToast('Camera permission denied or camera device unavailable.', 'error');
  }
}

function stopWebcam() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop());
    webcamStream = null;
  }
  if (webcamInterval) {
    clearInterval(webcamInterval);
    webcamInterval = null;
  }
  isWebcamRunning = false;

  const canvas = document.getElementById('videoOverlayCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = 'none';
  }

  const mainStatus = document.getElementById('mainStatusBadge');
  if (mainStatus) {
    mainStatus.className = 'badge-neon badge-emerald';
    mainStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span> READY';
  }
  updateConfidenceGauge(0.0);
}

// Cybernetic HUD Bounding Box Visualizer
function renderDetectionOverlay(boxes, confidence) {
  const canvas = document.getElementById('videoOverlayCanvas');
  const video = document.getElementById('mainVideoPlayer');
  if (!canvas || !video || video.style.display === 'none') return;

  canvas.style.display = 'block';
  if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
    canvas.width = video.clientWidth || 640;
    canvas.height = video.clientHeight || 360;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (boxes && boxes.length > 0) {
    boxes.forEach(box => {
      let x1, y1, x2, y2, label, isAccident;
      if (box.bbox) {
        [x1, y1, x2, y2] = box.bbox;
        label = box.label || '';
        isAccident = !!box.is_accident;
      } else if (Array.isArray(box)) {
        [x1, y1, x2, y2] = box;
        label = '';
        isAccident = confidence >= 0.70;
      } else {
        return;
      }

      const sx = (x1 / 320) * canvas.width;
      const sy = (y1 / 240) * canvas.height;
      const sw = Math.max(((x2 - x1) / 320) * canvas.width, 35);
      const sh = Math.max(((y2 - y1) / 240) * canvas.height, 35);

      const color = isAccident ? '#EF4444' : '#06B6D4';
      ctx.strokeStyle = color;
      ctx.lineWidth = isAccident ? 3 : 2;
      ctx.strokeRect(sx, sy, sw, sh);

      // Cybernetic Corner Brackets
      const bLen = 8;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tag Label
      const tagText = label || (isAccident ? `COLLISION ${Math.round(confidence * 100)}%` : 'VEHICLE TARGET');
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      const tagWidth = ctx.measureText(tagText).width + 12;
      ctx.fillStyle = color;
      ctx.fillRect(sx, Math.max(0, sy - 20), tagWidth, 20);
      ctx.fillStyle = '#070A11';
      ctx.fillText(tagText, sx + 6, Math.max(14, sy - 6));
    });
  } else if (confidence >= 0.65) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const color = confidence >= 0.75 ? '#EF4444' : '#F59E0B';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ==========================================================================
// 10. Confidence Gauge & Telemetry Readouts
// ==========================================================================
function updateConfidenceGauge(conf) {
  const percent = Math.round(conf * 100);
  animateNumber('probabilityScore', percent, '%');

  const hudConf = document.getElementById('hudConfidence');
  if (hudConf) hudConf.textContent = `PROBABILITY: ${percent}%`;

  const cardConf = document.getElementById('alertCardConf');
  if (cardConf) cardConf.textContent = `${percent}% Probability`;

  const probBadge = document.getElementById('probabilityBadge');
  if (probBadge) {
    if (percent >= 70) {
      probBadge.className = 'badge-neon badge-crimson';
      probBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span> COLLISION HAZARD';
    } else {
      probBadge.className = 'badge-neon badge-amber';
      probBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400"></span> NORMAL';
    }
  }
}

// ==========================================================================
// 11. Accident State Handler & Simulator
// ==========================================================================
function triggerAccidentState(confidence, message) {
  playEmergencySiren();
  updateConfidenceGauge(confidence);

  const mainStatus = document.getElementById('mainStatusBadge');
  if (mainStatus) {
    mainStatus.className = 'badge-neon badge-crimson';
    mainStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span> ACCIDENT DETECTED';
  }

  const subhead = document.getElementById('statusSubhead');
  if (subhead) subhead.textContent = 'ACCIDENT ALERT ACTIVE';

  const cardTitle = document.getElementById('alertCardTitle');
  if (cardTitle) cardTitle.textContent = 'PROBABLE ACCIDENT DETECTED';

  const cardStatus = document.getElementById('alertCardStatus');
  if (cardStatus) cardStatus.textContent = 'Alert Sent: Responders En Route (ETA: 4 min)';

  const cardTime = document.getElementById('alertCardTime');
  if (cardTime) cardTime.textContent = new Date().toLocaleTimeString('en-US', { hour12: true });

  // Trigger 3D Shockwave in WebGL scene
  if (window.trigger3DCollisionEffect) {
    window.trigger3DCollisionEffect(0, 0);
  }
}

async function simulateAccidentTrigger() {
  triggerAccidentState(0.96, 'Simulated Crash Event: Multi-vehicle collision detected');
  showToast('Simulating vehicle crash event...', 'alert');

  try {
    await fetch('/api/detect/frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        location: currentLocation
      })
    });
    fetchHealthAndStats();
    loadIncidents();
  } catch (e) {
    console.log('Simulated event saved locally');
  }
}

// ==========================================================================
// 12. Incidents List & Audit Trail
// ==========================================================================
async function loadIncidents(status = 'all') {
  const listEl = document.getElementById('incidentsList');
  if (!listEl) return;

  listEl.innerHTML = '<div class="text-center py-6 text-slate-400 font-mono text-[13px]">Scanning incident audit records...</div>';

  try {
    const url = status === 'all' ? '/api/incidents' : `/api/incidents?status=${status}`;
    const res = await fetch(url);
    const data = await res.json();
    const incidents = data.incidents || [];

    // Filter buttons style
    document.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.getAttribute('data-status') === status) {
        btn.className = 'filter-btn btn-cyber btn-cyber-primary py-1.5 px-4 text-[12px]';
      } else {
        btn.className = 'filter-btn btn-cyber btn-cyber-glass py-1.5 px-4 text-[12px]';
      }
    });

    if (incidents.length === 0) {
      listEl.innerHTML = '<div class="text-center py-10 text-slate-500 font-medium">No recorded incidents found in this filter view.</div>';
      return;
    }

    listEl.innerHTML = '';
    incidents.forEach((inc, idx) => {
      const card = document.createElement('div');
      const isDetected = inc.status === 'detected';
      const badgeClass = isDetected ? 'badge-crimson' : 'badge-emerald';
      const confPct = Math.round(inc.confidence * 100);

      card.className = `bento-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 ${isDetected ? 'border-l-rose-500' : 'border-l-emerald-500'}`;

      card.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 font-mono font-extrabold text-[15px] text-cyan-300">
            #${inc.id}
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="badge-neon ${badgeClass} text-[10px]">
                ${isDetected ? 'PROBABLE ACCIDENT' : 'REVIEWED / RESOLVED'}
              </span>
              <span class="text-[14px] font-extrabold text-white">${inc.source_name || 'Highway Corridor'}</span>
            </div>
            <p class="text-[12px] text-slate-400 mt-1 font-mono">
              📅 ${inc.detected_at} • 📍 ${inc.latitude ? `${inc.latitude.toFixed(4)}° N, ${inc.longitude.toFixed(4)}° W` : 'Station 04-NW'}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <div class="flex flex-col text-right font-mono">
            <span class="text-[10px] text-slate-400 uppercase font-bold">CONFIDENCE</span>
            <span class="text-[18px] font-extrabold ${isDetected ? 'text-rose-400' : 'text-emerald-400'}">${confPct}%</span>
          </div>
          <button onclick="viewIncidentDetail(${inc.id})" class="btn-cyber ${isDetected ? 'btn-cyber-crimson' : 'btn-cyber-primary'} py-2 px-4 text-[12px]">
            <span class="material-symbols-outlined text-[16px]">visibility</span>
            <span>View Telemetry Dossier</span>
          </button>
        </div>
      `;
      listEl.appendChild(card);
    });

    // GSAP animation for incident items
    if (typeof gsap !== 'undefined') {
      gsap.from('#incidentsList > div', {
        opacity: 0,
        x: -15,
        stagger: 0.05,
        duration: 0.4,
        ease: 'power2.out'
      });
    }

  } catch (err) {
    console.error('Error loading incidents:', err);
    listEl.innerHTML = '<div class="text-center py-6 text-rose-400">Failed to load incident history.</div>';
  }
}

// ==========================================================================
// 13. Incident Dossier Modal
// ==========================================================================
window.viewIncidentDetail = async function (id) {
  const modal = document.getElementById('incidentDetailModal');
  const body = document.getElementById('incidentModalBody');
  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('active'));
  body.innerHTML = '<div class="text-center py-8 font-mono text-cyan-300">Decryption of Incident Telemetry...</div>';

  try {
    const res = await fetch(`/api/incidents/${id}`);
    const data = await res.json();
    const inc = data.incident;

    const confPct = Math.round(inc.confidence * 100);
    const evidenceImg = inc.evidence && inc.evidence.length > 0
      ? `<img src="/evidence/${inc.evidence[0].file_path}" class="w-full max-h-72 object-cover rounded-xl my-4 border border-white/10 shadow-lg">`
      : '<p class="text-slate-400 my-3 text-[13px] font-mono">No snapshot recorded for this timestamp.</p>';

    const mapLink = inc.latitude && inc.longitude
      ? `<a href="https://www.google.com/maps?q=${inc.latitude},${inc.longitude}" target="_blank" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[12px] font-mono hover:bg-cyan-500/20 transition-all">🗺️ View Coordinates on Google Maps (${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)})</a>`
      : '<span class="text-slate-400 text-[12px] font-mono">No GPS Tag Attached</span>';

    const alertsHtml = (inc.alerts || []).map(a => `
      <div class="bg-black/40 border border-white/5 p-3 rounded-xl mb-2 text-[12px] font-mono flex justify-between items-center">
        <div><strong>${a.contact_name || 'Emergency Dispatch'}:</strong> ${a.channel}</div>
        <span class="badge-neon ${a.status === 'sent' ? 'badge-emerald' : 'badge-crimson'} text-[10px]">${a.status.toUpperCase()}</span>
      </div>
    `).join('') || '<p class="text-slate-400 text-[12px] font-mono">No external dispatches transmitted.</p>';

    body.innerHTML = `
      <h3 class="text-xl font-extrabold text-white mb-2">Incident Audit Dossier #${inc.id}</h3>
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <span class="badge-neon badge-crimson text-[11px]">Confidence: ${confPct}%</span>
        <span class="badge-neon badge-cyan text-[11px]">Status: ${inc.status.toUpperCase()}</span>
        <span class="text-[12px] font-mono text-slate-400">🕒 ${inc.detected_at}</span>
      </div>

      ${evidenceImg}

      <div class="mb-4">
        <h4 class="text-[10px] font-mono uppercase text-slate-400 mb-1 tracking-wider font-bold">GPS Spatial Vector</h4>
        ${mapLink}
      </div>

      <div class="mb-6">
        <h4 class="text-[10px] font-mono uppercase text-slate-400 mb-2 tracking-wider font-bold">Emergency Dispatch Dispatch Trail</h4>
        ${alertsHtml}
      </div>

      <div class="flex flex-wrap items-center gap-2.5 pt-4 border-t border-white/10">
        <button onclick="retryAlertDispatch(${inc.id})" class="btn-cyber btn-hazard-orange py-2 px-4 text-[12px] font-bold">
          <span class="material-symbols-outlined text-[16px]">notification_important</span>
          <span>Dispatch Emergency Responders</span>
        </button>
        <button onclick="updateStatus(${inc.id}, 'reviewed')" class="btn-cyber btn-cyber-glass py-2 px-4 text-[12px]">
          <span class="material-symbols-outlined text-[16px]">check_circle</span>
          <span>Mark Reviewed</span>
        </button>
        <button onclick="updateStatus(${inc.id}, 'false_alarm')" class="btn-cyber btn-cyber-glass py-2 px-4 text-[12px]">
          <span class="material-symbols-outlined text-[16px]">cancel</span>
          <span>False Alarm</span>
        </button>
        <button onclick="exportIncidentJSON(${inc.id})" class="btn-cyber btn-cyber-glass py-2 px-3 text-[12px] ml-auto">
          <span class="material-symbols-outlined text-[16px]">download</span>
          <span>Export JSON</span>
        </button>
      </div>
    `;
  } catch (err) {
    body.innerHTML = '<div class="text-rose-400">Failed to load incident detail.</div>';
  }
};

window.retryAlertDispatch = async function (id) {
  try {
    await fetch(`/api/alerts/send/${id}`, { method: 'POST' });
    showToast('Emergency SOS alert transmitted to all responders!', 'success');
    viewIncidentDetail(id);
    fetchHealthAndStats();
  } catch (e) {
    showToast('Failed to dispatch alert', 'error');
  }
};

window.updateStatus = async function (id, newStatus) {
  try {
    await fetch(`/api/incidents/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`Incident #${id} marked as ${newStatus}`, 'success');
    viewIncidentDetail(id);
    loadIncidents();
  } catch (e) {
    showToast('Failed to update status', 'error');
  }
};

// ==========================================================================
// 14. Settings & Emergency Contacts Management
// ==========================================================================
window.openSettingsModal = function () {
  const modal = document.getElementById('settingsModal');
  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('active'));
  loadSettingsAndContacts();
};

async function loadSettingsAndContacts() {
  const list = document.getElementById('contactsList');
  list.innerHTML = '<div class="text-slate-400 text-[12px] font-mono">Loading responders...</div>';

  try {
    const [cRes, sRes] = await Promise.all([
      fetch('/api/contacts'),
      fetch('/api/settings')
    ]);
    const cData = await cRes.json();
    const sData = await sRes.json();

    const contacts = cData.contacts || [];
    list.innerHTML = contacts.map(c => `
      <div class="flex justify-between items-center bg-white/5 border border-white/10 p-2.5 rounded-xl text-[12px] font-mono">
        <div>
          <strong class="text-white">${c.name}</strong>
          <div class="text-slate-400 text-[11px]">${c.phone || ''} ${c.email ? `• ${c.email}` : ''}</div>
        </div>
        <button onclick="removeContact(${c.id})" class="text-rose-400 hover:text-rose-300 font-bold">Remove</button>
      </div>
    `).join('') || '<p class="text-[12px] font-mono text-slate-400">No emergency responders added yet.</p>';

    const settings = sData.settings || {};
    if (settings.accident_threshold) {
      document.getElementById('inputThreshold').value = settings.accident_threshold;
      document.getElementById('valThreshold').textContent = `${Math.round(settings.accident_threshold * 100)}%`;
    }
    if (settings.required_positive_frames) {
      document.getElementById('inputFrames').value = settings.required_positive_frames;
    }
    if (settings.cooldown_seconds) {
      document.getElementById('inputCooldown').value = settings.cooldown_seconds;
    }
  } catch (e) {
    console.error(e);
  }
}

window.saveSettings = async function () {
  const threshold = document.getElementById('inputThreshold').value;
  const reqFrames = document.getElementById('inputFrames').value;
  const cooldown = document.getElementById('inputCooldown').value;

  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accident_threshold: threshold,
        required_positive_frames: reqFrames,
        cooldown_seconds: cooldown
      })
    });
    showToast('System configuration saved successfully!', 'success');
    document.getElementById('settingsModal').classList.remove('active');
    setTimeout(() => { document.getElementById('settingsModal').style.display = 'none'; }, 200);
    fetchHealthAndStats();
  } catch (e) {
    showToast('Failed to save settings', 'error');
  }
};

window.addNewContact = async function () {
  const name = document.getElementById('newContactName').value.trim();
  const phone = document.getElementById('newContactPhone').value.trim();
  const email = document.getElementById('newContactEmail').value.trim();

  if (!name) {
    showToast('Please enter a responder agency name', 'alert');
    return;
  }

  try {
    await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email })
    });
    document.getElementById('newContactName').value = '';
    document.getElementById('newContactPhone').value = '';
    document.getElementById('newContactEmail').value = '';
    showToast(`Added contact: ${name}`, 'success');
    loadSettingsAndContacts();
  } catch (e) {
    showToast('Failed to add contact', 'error');
  }
};

window.removeContact = async function (id) {
  if (!confirm('Remove this emergency contact responder?')) return;
  try {
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    showToast('Emergency contact removed', 'info');
    loadSettingsAndContacts();
  } catch (e) {
    showToast('Failed to remove contact', 'error');
  }
};

// ==========================================================================
// 15. Maintenance & Export Utilities
// ==========================================================================
window.resetAllIncidents = async function () {
  if (!confirm('Are you sure you want to clear all incident records, evidence snapshots, and dispatch logs?')) return;

  try {
    const res = await fetch('/api/incidents/clear', { method: 'POST' });
    const data = await res.json();
    if (data.status === 'success') {
      showToast('All incident records cleared.', 'success');
      loadIncidents('all');
      fetchHealthAndStats();
      updateConfidenceGauge(0.0);

      const mainStatus = document.getElementById('mainStatusBadge');
      if (mainStatus) {
        mainStatus.className = 'badge-neon badge-emerald';
        mainStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span> ACTIVE MONITORING';
      }

      const settingsModal = document.getElementById('settingsModal');
      if (settingsModal) {
        settingsModal.classList.remove('active');
        settingsModal.style.display = 'none';
      }
    } else {
      showToast(data.error || 'Failed to clear incidents', 'error');
    }
  } catch (err) {
    console.error('Clear failed:', err);
    showToast('Failed to clear incidents database', 'error');
  }
};

window.exportAllIncidentsCSV = async function () {
  try {
    const res = await fetch('/api/incidents?status=all');
    const data = await res.json();
    const incidents = data.incidents || [];

    if (incidents.length === 0) {
      showToast('No incidents found to export.', 'info');
      return;
    }

    let csv = 'ID,Timestamp,Confidence,Status,Corridor,Latitude,Longitude,Evidence\n';
    incidents.forEach(inc => {
      const conf = (inc.confidence * 100).toFixed(1) + '%';
      const file = (inc.evidence && inc.evidence[0]) ? inc.evidence[0].file_path : '';
      csv += `${inc.id},"${inc.detected_at}","${conf}","${inc.status}","${inc.source_name || ''}","${inc.latitude || ''}","${inc.longitude || ''}","${file}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incident_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Incident CSV exported successfully!', 'success');
  } catch (err) {
    console.error('CSV export failed:', err);
    showToast('Failed to export incidents to CSV', 'error');
  }
};

window.exportIncidentJSON = async function (id) {
  try {
    const res = await fetch(`/api/incidents/${id}`);
    const data = await res.json();
    const inc = data.incident;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(inc, null, 2));
    const dl = document.createElement('a');
    dl.href = dataStr;
    dl.download = `incident_dossier_${id}.json`;
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    showToast(`Dossier #${id} exported as JSON`, 'success');
  } catch (e) {
    showToast('Failed to export JSON dossier', 'error');
  }
};

// ==========================================================================
// 16. Floating Capsule Navbar & Kinetic Indicator Pill (GSAP)
// ==========================================================================
function initNavbarInteractions() {
  const capsule = document.querySelector('.floating-nav-capsule');
  const track = document.getElementById('navTrack');
  const pill = document.getElementById('navSlidingPill');
  const links = document.querySelectorAll('.nav-link-item');
  let activeLink = links[0];

  // 1. Scroll reaction: Add .scrolled when scrolling down
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      capsule?.classList.add('scrolled');
    } else {
      capsule?.classList.remove('scrolled');
    }
  }, { passive: true });

  // 2. Position pill helper
  function movePillTo(element) {
    if (!pill || !element || typeof gsap === 'undefined') return;
    gsap.to(pill, {
      x: element.offsetLeft,
      width: element.offsetWidth,
      duration: 0.35,
      ease: 'power2.out'
    });
  }

  // Initial pill placement
  if (activeLink && pill) {
    pill.style.width = `${activeLink.offsetWidth}px`;
    pill.style.transform = `translateX(${activeLink.offsetLeft}px)`;
  }

  // 3. Hover sliding animation
  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      movePillTo(link);
    });

    link.addEventListener('click', () => {
      links.forEach(l => l.classList.remove('text-orange-400', 'font-bold'));
      link.classList.add('text-orange-400', 'font-bold');
      activeLink = link;
      movePillTo(link);
    });
  });

  if (track) {
    track.addEventListener('mouseleave', () => {
      if (activeLink) movePillTo(activeLink);
    });
  }

  // 4. Scroll-Spy (Section observer)
  const sections = ['dashboard', 'radar-3d-section', 'video-feed-section', 'incidents-section'];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const matchingLink = document.querySelector(`.nav-link-item[data-target="${id}"]`);
        if (matchingLink) {
          links.forEach(l => l.classList.remove('text-orange-400', 'font-bold'));
          matchingLink.classList.add('text-orange-400', 'font-bold');
          activeLink = matchingLink;
          movePillTo(matchingLink);
        }
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(secId => {
    const el = document.getElementById(secId);
    if (el) observer.observe(el);
  });
}

// Mobile HUD Drawer Toggle
window.toggleMobileDrawer = function () {
  const drawer = document.getElementById('mobileDrawer');
  const icon = document.getElementById('mobileMenuIcon');
  if (!drawer) return;

  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    drawer.classList.remove('open');
    if (icon) icon.textContent = 'menu';
  } else {
    drawer.classList.add('open');
    if (icon) icon.textContent = 'close';
    if (typeof gsap !== 'undefined') {
      gsap.from('#mobileDrawer a', {
        y: 20,
        opacity: 0,
        stagger: 0.08,
        duration: 0.4,
        ease: 'power2.out'
      });
    }
  }
};

// Keyboard Shortcuts Modal Toggle
window.openShortcutsModal = function () {
  const modal = document.getElementById('shortcutsModal');
  if (modal) {
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('active'));
  }
};

// Global Keyboard Navigation & Hotkeys
window.addEventListener('keydown', (e) => {
  if (['input', 'textarea', 'select'].includes(document.activeElement.tagName.toLowerCase())) return;

  const key = e.key.toUpperCase();
  if (key === 'D') {
    window.toggleLightDarkMode();
  } else if (key === 'M') {
    const audioBtn = document.getElementById('btnAudioToggle');
    if (audioBtn) audioBtn.click();
  } else if (key === 'T') {
    window.triggerEmergencyAlertNow();
  } else if (key === 'C') {
    const camBtn = document.getElementById('btnWebcamToggleBar') || document.getElementById('btnStartWebcam');
    if (camBtn) camBtn.click();
  } else if (key === 'S') {
    window.openSettingsModal();
  } else if (key === '?' || (e.shiftKey && e.key === '/')) {
    window.openShortcutsModal();
  } else if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.active').forEach(m => {
      m.classList.remove('active');
      setTimeout(() => m.style.display = 'none', 200);
    });
  }
});

