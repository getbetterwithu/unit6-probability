// ===== 사운드 시스템 (6단원 경우의 수와 확률) =====
// BGM: assets/audio/*.mp3
// SFX: Web Audio API 기반 합성 (외부 파일 의존 없음, 딜레이 0ms)

const BGM_FILES = {
  main:     'assets/audio/bgm_main.mp3',
  merchant: 'assets/audio/bgm_merchant.mp3',
  storm:    'assets/audio/bgm_storm.mp3',
  boss:     'assets/audio/bgm_boss.mp3',
  ending:   'assets/audio/bgm_ending.mp3',
  sacred:   'assets/audio/bgm_sacred.mp3',
};

const BGM_VOL = {
  main:     0.14,
  merchant: 0.14,
  storm:    0.16,
  boss:     0.18,
  sacred:   0.14,
  ending:   0.15,
};

let _muted = localStorage.getItem('u6_muted') === '1';
let _currentBgmKey = null;
let _bgmAudio = null;

function getAudioEl() {
  if (!_bgmAudio) {
    _bgmAudio = document.getElementById('bgm-player');
    if (!_bgmAudio) {
      _bgmAudio = new Audio();
      _bgmAudio.id = 'bgm-player';
      _bgmAudio.loop = true;
      document.body.appendChild(_bgmAudio);
    }
  }
  return _bgmAudio;
}

export function playBgm(key) {
  if (!key || !BGM_FILES[key]) return;
  if (_currentBgmKey === key && _bgmAudio && !_bgmAudio.paused) return;

  _currentBgmKey = key;
  const audio = getAudioEl();
  audio.src = BGM_FILES[key];
  audio.volume = _muted ? 0 : (BGM_VOL[key] || 0.15);
  audio.play().catch(() => {
    // 브라우저 첫 인터랙션 전 자동재생 차단 대비
    const unlock = () => {
      if (_currentBgmKey === key) audio.play().catch(() => {});
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  });
}

export function setBgmVolume(vol) {
  const audio = getAudioEl();
  audio.volume = _muted ? 0 : vol;
}

export function toggleMute() {
  _muted = !_muted;
  localStorage.setItem('u6_muted', _muted ? '1' : '0');
  const audio = getAudioEl();
  if (audio) {
    audio.volume = _muted ? 0 : (BGM_VOL[_currentBgmKey] || 0.15);
  }
  return _muted;
}

export function isMuted() {
  return _muted;
}

// ===== Web Audio API 효과음 (SFX) =====
let _actx = null;

function getAudioContext() {
  if (!_actx) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      _actx = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (_actx.state === 'suspended') {
    _actx.resume().catch(() => {});
  }
  return _actx;
}

function tone(ac, freq, dur, when, type, gain) {
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

export function playSfx(name) {
  if (_muted) return;
  const ac = getAudioContext();
  if (!ac) return;

  switch (name) {
    case 'correct':
      // 밝고 맑은 상행 차임 (도5 - 미5 - 솔5)
      tone(ac, 523.25, 0.12, 0.00, 'triangle', 0.22);
      tone(ac, 659.25, 0.12, 0.09, 'triangle', 0.22);
      tone(ac, 783.99, 0.28, 0.18, 'triangle', 0.24);
      break;

    case 'wrong':
      // 부드러운 하행 2음 (거칠지 않은 사인파)
      tone(ac, 392.00, 0.16, 0.00, 'sine', 0.18);
      tone(ac, 311.13, 0.28, 0.12, 'sine', 0.18);
      break;

    case 'click':
      // 가벼운 UI 탭음
      tone(ac, 740.00, 0.04, 0.00, 'triangle', 0.10);
      break;

    case 'evidence':
      // 증거 획득 / 반박 성공 (신비로운 아르페지오)
      tone(ac, 659.25, 0.10, 0.00, 'triangle', 0.18);
      tone(ac, 830.61, 0.10, 0.08, 'triangle', 0.18);
      tone(ac, 987.77, 0.10, 0.16, 'triangle', 0.20);
      tone(ac, 1318.51, 0.40, 0.25, 'triangle', 0.22);
      break;
  }
}
