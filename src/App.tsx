import { useEffect, useState, useRef, useCallback } from "react";
import { TrainVisual } from "./components/TrainVisual.js";
import { MasconController } from "./components/MasconController.js";
import { MasconState, PlayerStats, GameRoom, TrackFeature, LeaderboardEntry } from "./types.js";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Compass, ShieldAlert, Zap, Award, Train, Users, ShieldAlert as AlertIcon, RotateCcw, Volume2, VolumeX, Landmark } from "lucide-react";
import titleLogoUrl from "./assets/images/title_logo_new_1782885604057.jpg";
import lobbyBgUrl from "./assets/images/clean_train_lobby_new_1782885411123.jpg";

// Support multiple lines configurations with 5 stations per stage
export const getLineConfig = (lineName: 'yamanote' | 'chuo' | 'shonan', stationIdx: number = 0) => {
  if (lineName === 'yamanote') {
    const stations = [
      { label: "恵比寿駅", englishLabel: "EBISU STATION (Ebisu)", start: 2460, stop: 2500, end: 2540 },
      { label: "渋谷駅", englishLabel: "SHIBUYA STATION (Shibuya)", start: 4960, stop: 5000, end: 5040 },
      { label: "原宿駅", englishLabel: "HARAJUKU STATION (Harajuku)", start: 7460, stop: 7500, end: 7540 },
      { label: "代々木駅", englishLabel: "YOYOGI STATION (Yoyogi)", start: 9960, stop: 10000, end: 10040 },
      { label: "新宿駅", englishLabel: "SHINJUKU STATION (Shinjuku)", start: 12460, stop: 12500, end: 12540, isTerminal: true },
    ];
    const st = stations[stationIdx] || stations[stations.length - 1];
    return {
      trackLength: 13000,
      stationStart: st.start,
      stationStop: st.stop,
      stationEnd: st.end,
      stationLabel: st.label,
      stationEnglishLabel: st.englishLabel,
      stations,
      signal1: 1800 + stationIdx * 2500,
      signal2: 1800 + stationIdx * 2500 + 400,
      quotaTime: 650, // Stage quota Time
    };
  } else if (lineName === 'chuo') {
    const stations = [
      { label: "三鷹駅", englishLabel: "MITAKA STATION (Mitaka)", start: 2960, stop: 3000, end: 3040 },
      { label: "吉祥寺駅", englishLabel: "KICHIJOJI STATION (Kichijoji)", start: 6460, stop: 6500, end: 6540 },
      { label: "西荻窪駅", englishLabel: "NISHI-OGIKUBO STATION (Nishi-Ogikubo)", start: 9960, stop: 10000, end: 10040 },
      { label: "荻窪駅", englishLabel: "OGIKUBO STATION (Ogikubo)", start: 13460, stop: 13500, end: 13540 },
      { label: "高円寺駅", englishLabel: "KOENJI STATION (Koenji)", start: 16960, stop: 17000, end: 17040, isTerminal: true },
    ];
    const st = stations[stationIdx] || stations[stations.length - 1];
    return {
      trackLength: 18000,
      stationStart: st.start,
      stationStop: st.stop,
      stationEnd: st.end,
      stationLabel: st.label,
      stationEnglishLabel: st.englishLabel,
      stations,
      signal1: 2200 + stationIdx * 3500,
      signal2: 2200 + stationIdx * 3500 + 500,
      quotaTime: 850, // Stage quota Time
    };
  } else {
    // shonan
    const stations = [
      { label: "湘南大磯駅", englishLabel: "SHONAN-OISO STATION (Shonan-Oiso)", start: 3460, stop: 3500, end: 3540 },
      { label: "戸塚駅", englishLabel: "TOTSUKA STATION (Totsuka)", start: 7460, stop: 7500, end: 7540 },
      { label: "大船駅", englishLabel: "OFUNA STATION (Ofuna)", start: 11460, stop: 11500, end: 11540 },
      { label: "藤沢駅", englishLabel: "FUJISAWA STATION (Fujisawa)", start: 15460, stop: 15500, end: 15540 },
      { label: "茅ヶ崎駅", englishLabel: "CHIGASAKI STATION (Chigasaki)", start: 19460, stop: 19500, end: 19540, isTerminal: true },
    ];
    const st = stations[stationIdx] || stations[stations.length - 1];
    return {
      trackLength: 21000,
      stationStart: st.start,
      stationStop: st.stop,
      stationEnd: st.end,
      stationLabel: st.label,
      stationEnglishLabel: st.englishLabel,
      stations,
      signal1: 2700 + stationIdx * 4000,
      signal2: 2700 + stationIdx * 4000 + 600,
      quotaTime: 950, // Stage quota Time
    };
  }
};

// Hook to dynamically remove white background from a JPG logo using border-seeded BFS flood-fill and edge anti-aliasing
const useTransparentImage = (src: string) => {
  const [transparentSrc, setTransparentSrc] = useState<string>(src);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const width = canvas.width;
      const height = canvas.height;
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Detect if a pixel is near white
      const isNearWhite = (idx: number) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        return a > 0 && r > 230 && g > 230 && b > 230;
      };

      const visited = new Uint8Array(width * height);
      const queue: number[] = [];

      // Add all boundary pixels that are near-white to the queue
      for (let x = 0; x < width; x++) {
        const idxTop = x * 4;
        if (isNearWhite(idxTop)) {
          queue.push(x, 0);
          visited[x] = 1;
        }
        const yBot = height - 1;
        const idxBot = (yBot * width + x) * 4;
        if (isNearWhite(idxBot)) {
          queue.push(x, yBot);
          visited[yBot * width + x] = 1;
        }
      }
      for (let y = 1; y < height - 1; y++) {
        const idxLeft = (y * width) * 4;
        if (isNearWhite(idxLeft)) {
          queue.push(0, y);
          visited[y * width] = 1;
        }
        const xRight = width - 1;
        const idxRight = (y * width + xRight) * 4;
        if (isNearWhite(idxRight)) {
          queue.push(xRight, y);
          visited[y * width + xRight] = 1;
        }
      }

      // BFS to flood fill external white background (making it fully transparent)
      let head = 0;
      const neighbors = [
        [0, 1], [0, -1], [1, 0], [-1, 0]
      ];

      while (head < queue.length) {
        const cx = queue[head++];
        const cy = queue[head++];
        
        const idx = (cy * width + cx) * 4;
        data[idx + 3] = 0; // Make transparent

        for (let j = 0; j < neighbors.length; j++) {
          const nx = cx + neighbors[j][0];
          const ny = cy + neighbors[j][1];

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nPos = ny * width + nx;
            if (visited[nPos] === 0) {
              const nIdx = nPos * 4;
              if (isNearWhite(nIdx)) {
                visited[nPos] = 1;
                queue.push(nx, ny);
              }
            }
          }
        }
      }

      // Smooth anti-aliasing / feathering edge pass for borders
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const pos = y * width + x;
          if (visited[pos] === 0) {
            const idx = pos * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const avg = (r + g + b) / 3;
            if (avg > 180) {
              const n1 = visited[pos + 1];
              const n2 = visited[pos - 1];
              const n3 = visited[pos + width];
              const n4 = visited[pos - width];
              if (n1 || n2 || n3 || n4) {
                // Map brightness 180-255 smoothly to alpha fade
                const alpha = Math.max(0, Math.min(255, (255 - avg) * (255 / (255 - 180))));
                data[idx + 3] = Math.min(data[idx + 3], alpha);
              }
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setTransparentSrc(canvas.toDataURL("image/png"));
    };
  }, [src]);

  return transparentSrc;
};

// Retro Web Audio Interactive Synth for Train Sound Effects & Stage BGM
class TrainAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmInterval: any = null;
  private currentBgmStep: number = 0;
  
  // Motor inverter simulation oscillators
  private motorOsc1: OscillatorNode | null = null;
  private motorOsc2: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;

  constructor() {}

  init(ctx: AudioContext) {
    this.ctx = ctx;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.motorGain) {
      this.motorGain.gain.setValueAtTime(muted ? 0 : 0.04, this.ctx?.currentTime || 0);
    }
  }

  // Acceleration & Motor inverter frequency modulation sound
  startMotor() {
    if (!this.ctx) return;
    this.stopMotor();

    try {
      this.motorOsc1 = this.ctx.createOscillator();
      this.motorOsc2 = this.ctx.createOscillator();
      this.motorGain = this.ctx.createGain();

      this.motorOsc1.type = "triangle";
      this.motorOsc2.type = "sawtooth";

      this.motorOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);
      this.motorOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

      this.motorGain.gain.setValueAtTime(this.isMuted ? 0 : 0.02, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(250, this.ctx.currentTime);

      this.motorOsc1.connect(filter);
      this.motorOsc2.connect(filter);
      filter.connect(this.motorGain);
      this.motorGain.connect(this.ctx.destination);

      this.motorOsc1.start();
      this.motorOsc2.start();
    } catch (e) {
      console.warn("Failed to start motor sound", e);
    }
  }

  updateMotor(speed: number) {
    if (!this.ctx || !this.motorOsc1 || !this.motorOsc2 || !this.motorGain) return;

    const targetGain = speed > 0 ? (this.isMuted ? 0 : Math.min(0.06, 0.015 + speed * 0.0004)) : 0;
    this.motorGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);

    // Motor VVVF frequency shift simulation based on current train speed
    let f1 = 45;
    let f2 = 90;
    if (speed > 0) {
      if (speed < 20) {
        // VVVF Stage 1 Modulation
        f1 = 45 + speed * 6;
        f2 = 90 + speed * 12;
      } else if (speed < 55) {
        // VVVF Stage 2 Modulation
        f1 = 165 + (speed - 20) * 8;
        f2 = 330 + (speed - 20) * 3;
      } else {
        // High speed cruising pitch
        f1 = 445 + (speed - 55) * 1.5;
        f2 = 435 + (speed - 55) * 1.0;
      }
    }
    
    this.motorOsc1.frequency.setTargetAtTime(f1, this.ctx.currentTime, 0.12);
    this.motorOsc2.frequency.setTargetAtTime(f2, this.ctx.currentTime, 0.12);
  }

  stopMotor() {
    try {
      if (this.motorOsc1) { this.motorOsc1.stop(); this.motorOsc1.disconnect(); this.motorOsc1 = null; }
      if (this.motorOsc2) { this.motorOsc2.stop(); this.motorOsc2.disconnect(); this.motorOsc2 = null; }
      if (this.motorGain) { this.motorGain.disconnect(); this.motorGain = null; }
    } catch (_) {}
  }

  // High quality retro physical wheel joint sound (ga-tan go-ton)
  playJointSound() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      
      // Front wheel hit (ga-tan)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(60, now);
      osc1.frequency.exponentialRampToValueAtTime(25, now + 0.12);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start();
      osc1.stop(now + 0.13);

      // Rear wheel hit (go-ton)
      const delay = 0.08;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(55, now + delay);
      osc2.frequency.exponentialRampToValueAtTime(25, now + delay + 0.12);
      gain2.gain.setValueAtTime(0.14, now + delay);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.12);
      
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + delay);
      osc2.stop(now + delay + 0.13);
    } catch (_) {}
  }

  // Retro 8-bit dynamic background melody loop generator
  startBgm() {
    if (!this.ctx) return;
    this.stopBgm();

    this.currentBgmStep = 0;
    const tempo = 145; // 145 BPM - high speed racing tempo!
    const stepTime = 60 / tempo / 4; // 16th note step duration (about 103ms)

    // Chords progression for high-tension racing: Am -> F -> G -> E7
    const chordNotes = [
      [220, 261.63, 329.63, 440], // Am
      [174.61, 220, 261.63, 349.23], // F
      [196.00, 246.94, 293.66, 392.00], // G
      [164.81, 207.65, 246.94, 329.63], // E7 (Tense resolution)
    ];

    const melodies = [
      // Am heroic theme
      [440, 440, 493.88, 523.25, 0, 587.33, 659.25, 659.25, 587.33, 587.33, 523.25, 493.88, 440, 493.88, 523.25, 0],
      // F drive theme
      [523.25, 523.25, 587.33, 659.25, 0, 698.46, 783.99, 783.99, 698.46, 698.46, 659.25, 587.33, 523.25, 587.33, 659.25, 0],
      // G epic build-up
      [587.33, 587.33, 659.25, 698.46, 0, 783.99, 880, 880, 783.99, 783.99, 698.46, 659.25, 587.33, 659.25, 783.99, 0],
      // E7 dramatic turn back to Am (using G# 830.61 Hz)
      [659.25, 659.25, 698.46, 783.99, 0, 830.61, 987.77, 987.77, 830.61, 830.61, 783.99, 698.46, 659.25, 587.33, 493.88, 440]
    ];

    const nextStep = () => {
      if (!this.ctx || this.isMuted) return;

      const now = this.ctx.currentTime;
      const measure = Math.floor(this.currentBgmStep / 16) % 4;
      const stepInMeasure = this.currentBgmStep % 16;
      const chordIndex = measure;

      // --- 1. GALLOPING HIGH-SPEED SYNTH BASS ---
      // Beat start (step 0, 4, 8, 12): play low root note
      if (stepInMeasure % 4 === 0) {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          
          const rootNote = chordNotes[chordIndex][0] / 2; // Bass (1 octave down)
          osc.frequency.setValueAtTime(rootNote, now);
          
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.002, now + stepTime * 1.8);
          
          const lpf = this.ctx.createBiquadFilter();
          lpf.type = "lowpass";
          lpf.frequency.setValueAtTime(350, now);
          
          osc.connect(lpf);
          lpf.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + stepTime * 1.9);
        } catch (_) {}
      }
      // Upbeat (step 2, 6, 10, 14): play octave upbeat note
      else if (stepInMeasure % 4 === 2) {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          
          const rootNote = chordNotes[chordIndex][0]; // Upbeat (octave higher than root bass)
          osc.frequency.setValueAtTime(rootNote, now);
          
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.002, now + stepTime * 1.5);
          
          const lpf = this.ctx.createBiquadFilter();
          lpf.type = "lowpass";
          lpf.frequency.setValueAtTime(450, now);
          
          osc.connect(lpf);
          lpf.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + stepTime * 1.6);
        } catch (_) {}
      }

      // --- 2. FAST 16th NOTE ARCADE ARPEGGIATOR (RISING-FALLING) ---
      if (this.currentBgmStep % 2 === 0) {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          
          const chord = chordNotes[chordIndex];
          // Cycle through notes: 1, 2, 3, 4 of the chord
          const noteIdx = (this.currentBgmStep / 2) % chord.length;
          const arpFreq = chord[noteIdx] * 2; // High arp pitch
          
          osc.frequency.setValueAtTime(arpFreq, now);
          
          gain.gain.setValueAtTime(0.015, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 0.95);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + stepTime);
        } catch (_) {}
      }

      // --- 3. HEROIC LEAD MELODY ---
      const melodyFreq = melodies[chordIndex][stepInMeasure];
      if (melodyFreq > 0) {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          
          osc.frequency.setValueAtTime(melodyFreq, now);
          
          // Add a very slight retro vibrato using an LFO representation
          osc.frequency.linearRampToValueAtTime(melodyFreq + 4, now + stepTime * 0.4);
          osc.frequency.linearRampToValueAtTime(melodyFreq - 4, now + stepTime * 0.8);
          
          gain.gain.setValueAtTime(0.02, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 1.9);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + stepTime * 1.95);
        } catch (_) {}
      }

      // --- 4. RETRO CHIP DRUMS ---
      // Kick drum on beats 1 and 3 (step 0, 8)
      if (stepInMeasure % 8 === 0) {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
          
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.09);
        } catch (_) {}
      }
      // Snare on backbeats (step 4, 12)
      else if (stepInMeasure % 8 === 4) {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          // Square wave with high frequency and fast pitch drop to simulate chip noise
          osc.type = "square";
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.06);
          
          gain.gain.setValueAtTime(0.035, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.07);
        } catch (_) {}
      }
      // Hi-Hat on offbeats (step 2, 6, 10, 14)
      else if (stepInMeasure % 4 === 2) {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(8000, now);
          
          gain.gain.setValueAtTime(0.015, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.03);
        } catch (_) {}
      }

      this.currentBgmStep++;
    };

    this.bgmInterval = setInterval(nextStep, stepTime * 1000);
  }

  stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export default function App() {
  // Navigation / App State
  const [activeScreen, setActiveScreen] = useState<"lobby" | "matchmaking" | "racing" | "completed">("lobby");
  const [activeModal, setActiveModal] = useState<"none" | "game_start" | "stage_select" | "train_select" | "ranking" | "options" | "news" | "how_to_play" | "train_encyclopedia">("none");
  const [selectedEncyTrain, setSelectedEncyTrain] = useState<"yamanote" | "chuo" | "shonan">("yamanote");
  const [nickname, setNickname] = useState("新米運転士");
  const [selectedLine, setSelectedLine] = useState<'yamanote' | 'chuo' | 'shonan'>('shonan');
  const [acquiredTrains, setAcquiredTrains] = useState<('yamanote' | 'chuo' | 'shonan')[]>(['shonan']);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLobbyStarted, setIsLobbyStarted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("路線データ読込中...");
  const transparentLogo = useTransparentImage(titleLogoUrl);

  const [currentStationIdx, setCurrentStationIdx] = useState(0);
  const currentStationIdxRef = useRef(0);
  const cpuStationIdxRef = useRef(0);

  // Global space key listener to start the lobby
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (activeScreen === "lobby" && !isLobbyStarted) {
        if (e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          setIsLobbyStarted(true);
          playSynthSound("chime");
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [activeScreen, isLobbyStarted]);

  // Global keyboard listener for active train racing gameplay (W/S & Arrow keys & Space)
  useEffect(() => {
    if (activeScreen !== "racing") return;

    const handleRacingKey = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        return;
      }

      const NOTCH_LIST: MasconState[] = ["P4", "P3", "P2", "P1", "N", "B1", "B2", "B3", "EB"];
      const currentNotch = myMasconRef.current;
      const currentIndex = NOTCH_LIST.indexOf(currentNotch);

      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
        e.preventDefault();
        if (currentIndex > 0) {
          const nextNotch = NOTCH_LIST[currentIndex - 1];
          myMasconRef.current = nextNotch;
          playSynthSound("beep");
        }
      } else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
        e.preventDefault();
        if (currentIndex < NOTCH_LIST.length - 1) {
          const nextNotch = NOTCH_LIST[currentIndex + 1];
          myMasconRef.current = nextNotch;
          playSynthSound("beep");
        }
      } else if (e.key === " ") {
        e.preventDefault();
        myMasconRef.current = "EB";
        playSynthSound("beep");
      }
    };

    window.addEventListener("keydown", handleRacingKey);
    return () => window.removeEventListener("keydown", handleRacingKey);
  }, [activeScreen]);

  // Network Multi-player states
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isCpuMatch, setIsCpuMatch] = useState(false);

  // Audio elements (retro chimes via synthesizers to bypass external asset limits)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioEngineRef = useRef<TrainAudioEngine | null>(null);
  const lastJointPositionRef = useRef<number>(0);

  // Sync mute state changes to synthesizer engine
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setMuted(isMuted);
    }
  }, [isMuted]);

  // Sound Synth Helper
  const playSynthSound = (type: "beep" | "chime" | "derail" | "buzzer" | "boost") => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === "beep") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "chime") {
        // Tokaido Line door chime simulator
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === "derail") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.6);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
      } else if (type === "buzzer") {
        osc.type = "square";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "boost") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (e) {
      console.warn("Synth failed", e);
    }
  };

  // State values for active live UI rendering
  const [renderStats, setRenderStats] = useState({
    myPosition: 0,
    mySpeed: 0,
    myOverheat: 0,
    myDerailed: false,
    myDerailTimeLeft: 0,
    myFinished: false,
    myFinishTime: undefined as number | undefined,
    myMascon: "N" as MasconState,
    opponentPosition: 0,
    opponentSpeed: 0,
    opponentFinished: false,
    opponentDerailed: false,
    opponentName: "対戦相手 (Driver 2)",
    opponentMascon: "N" as MasconState,
    atcLimit: 110,
  });

  // Station stop challenges specific state
  const [stationStopped, setStationStopped] = useState(false);
  const [stationGrade, setStationGrade] = useState("");
  const [stationMsg, setStationMsg] = useState("");
  const [boardingTimeLeft, setBoardingTimeLeft] = useState(0);
  const [speedBoostActive, setSpeedBoostActive] = useState(false);
  const [boostTimer, setBoostTimer] = useState(0);

  // Warnings displayed in HUD
  const [atcWarning, setAtcWarning] = useState("");
  const [derailRisk, setDerailRisk] = useState(0); // 0 to 100

  // Solo time attack & speed limit penalty states
  const [speedPenaltyTimeLeft, setSpeedPenaltyTimeLeft] = useState(0);
  const [mySpeedViolationsCount, setMySpeedViolationsCount] = useState(0);

  // Pausable intermediate station stops tracking
  const pausedTimeMsRef = useRef<number>(0);
  const [stationPausedAccumMs, setStationPausedAccumMs] = useState(0);

  // Speed penalty tracking refs
  const speedPenaltyTimeLeftRef = useRef<number>(0);
  const mySpeedViolationsCountRef = useRef<number>(0);
  const boardingTimeLeftRef = useRef<number>(0);
  const speedBoostActiveRef = useRef<boolean>(false);
  const myStationCompletedRef = useRef<boolean>(false);
  const activeLineRef = useRef<"yamanote" | "chuo" | "shonan">("shonan");
  const currentFeaturesRef = useRef<TrackFeature[]>([]);
  const cpuPersonalityRef = useRef<"aggressive" | "steady" | "speedster">("steady");
  const stationStoppedRef = useRef<boolean>(false);

  // Standard Local Refs for ultra-precise, high-frequency physical 60fps simulation loops
  const myPositionRef = useRef(0);
  const mySpeedRef = useRef(0);
  const myMasconRef = useRef<MasconState>("N");
  const myOverheatRef = useRef(0);
  const myDerailedRef = useRef(false);
  const myDerailTimeLeftRef = useRef(0);
  const myFinishedRef = useRef(false);
  const myFinishTimeRef = useRef<number | undefined>(undefined);

  const opponentPositionRef = useRef(0);
  const opponentSpeedRef = useRef(0);
  const opponentFinishedRef = useRef(false);
  const opponentDerailedRef = useRef(false);
  const opponentMasconRef = useRef<MasconState>("N");

  // Timer trackers
  const raceStartTimeRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const syncIntervalIdRef = useRef<any | null>(null);
  const countdownIntervalIdRef = useRef<any | null>(null);
  const lobbyPollIdRef = useRef<any | null>(null);

  // CPU intelligence simulation states (run inside player's client)
  const cpuPositionRef = useRef(0);
  const cpuSpeedRef = useRef(0);
  const cpuMasconRef = useRef<MasconState>("N");
  const cpuOverheatRef = useRef(0);
  const cpuDerailedRef = useRef(false);
  const cpuDerailTimeLeftRef = useRef(0);
  const cpuFinishedRef = useRef(false);
  const cpuStationTimerRef = useRef(0); // boarding at station stop
  const cpuStationCompletedRef = useRef<boolean>(false);

  // Load Leaderboards on mount
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const list = await res.json();
      setLeaderboard(list);
    } catch (e) {
      console.error("Failed to fetch leaderboards:", e);
    }
  };

  // Reset local train values before starting a new race
  const resetLocalPhysics = () => {
    myPositionRef.current = 0;
    mySpeedRef.current = 0;
    myMasconRef.current = "N";
    myOverheatRef.current = 0;
    myDerailedRef.current = false;
    myDerailTimeLeftRef.current = 0;
    myFinishedRef.current = false;
    myFinishTimeRef.current = undefined;

    opponentPositionRef.current = 0;
    opponentSpeedRef.current = 0;
    opponentFinishedRef.current = false;
    opponentDerailedRef.current = false;
    opponentMasconRef.current = "N";

    cpuPositionRef.current = 0;
    cpuSpeedRef.current = 0;
    cpuMasconRef.current = "N";
    cpuOverheatRef.current = 0;
    cpuDerailedRef.current = false;
    cpuDerailTimeLeftRef.current = 0;
    cpuFinishedRef.current = false;
    cpuStationTimerRef.current = 0;
    cpuStationCompletedRef.current = false;

    pausedTimeMsRef.current = 0;
    setStationPausedAccumMs(0);
    myStationCompletedRef.current = false;
    currentStationIdxRef.current = 0;
    setCurrentStationIdx(0);
    cpuStationIdxRef.current = 0;
    speedPenaltyTimeLeftRef.current = 0;
    setSpeedPenaltyTimeLeft(0);
    mySpeedViolationsCountRef.current = 0;
    setMySpeedViolationsCount(0);
    boardingTimeLeftRef.current = 0;
    speedBoostActiveRef.current = false;
    stationStoppedRef.current = false;

    // Pick random CPU driving personality
    const personalities: ("aggressive" | "steady" | "speedster")[] = ["aggressive", "steady", "speedster"];
    cpuPersonalityRef.current = personalities[Math.floor(Math.random() * personalities.length)];

    setStationStopped(false);
    setStationGrade("");
    setStationMsg("");
    setBoardingTimeLeft(0);
    setSpeedBoostActive(false);
    setBoostTimer(0);
    setAtcWarning("");
    setDerailRisk(0);
  };

  // Solo Time Attack Initiation with retro route loading sequence
  const handleJoinQueue = async () => {
    if (!nickname.trim()) {
      alert("運転士のニックネームを入力してください。");
      return;
    }
    resetLocalPhysics();
    setIsCpuMatch(false); // Make sure there is NO CPU opponent
    activeLineRef.current = selectedLine;

    // Initial audio context initiation to prevent browser blocking
    try {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (_) {}

    // Reset loading states
    setLoadingProgress(0);
    setLoadingMessage("路線データを読込中...");

    try {
      const res = await fetch("/api/matchmaking/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nickname, line: selectedLine }),
      });
      const data = await res.json();

      const configLength = getLineConfig(selectedLine).trackLength;

      setPlayerId(data.playerId);
      setRoomId(data.roomId);
      
      const newRoom = {
        id: data.roomId,
        status: data.status,
        players: data.players,
        trackFeatures: data.trackFeatures || [],
        trackLength: configLength,
        line: selectedLine,
      };
      setRoom(newRoom);
      setActiveScreen("matchmaking"); // Uses the matchmaking slot as our immersive Loading Screen

      // Simulated Loading Progression
      let progress = 0;
      const loadingInterval = setInterval(() => {
        progress += 4;
        if (progress >= 100) {
          progress = 100;
          clearInterval(loadingInterval);

          // Clear polling
          if (lobbyPollIdRef.current) clearInterval(lobbyPollIdRef.current);

          // Set client countdown start time slightly in future for comfortable start
          const finalStartTime = Date.now() + 3000;
          raceStartTimeRef.current = finalStartTime;

          // Transition to racing screen
          setActiveScreen("racing");

          // Sync start time with server
          fetch(`/api/rooms/${data.roomId}/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startTime: finalStartTime })
          }).catch(err => console.error("Failed to sync room start time:", err));

          const syncedRoom = { ...newRoom, status: "countdown" as const, startTime: finalStartTime };
          setRoom(syncedRoom);

          // Trigger physics simulation and backend synchronization
          startPhysicsSimulation(syncedRoom);
          startStateSynchronization(data.roomId, data.playerId);
        }
        
        setLoadingProgress(progress);
        
        if (progress < 25) {
          setLoadingMessage("路線区間インフラ & 駅構内データ読込中...");
        } else if (progress < 50) {
          setLoadingMessage("ATC/ATS 自動列車保安装置システム接続中...");
        } else if (progress < 75) {
          setLoadingMessage("高低差勾配・制限速度標識データ同期中...");
        } else if (progress < 95) {
          setLoadingMessage("列車運行ダイヤグラム調整及び運転指令承認中...");
        } else {
          setLoadingMessage("安全ヨシ！出発進行！");
        }
      }, 100);

      // Background room status sync polling
      startMatchPolling(data.roomId, data.playerId, loadingInterval);
    } catch (e) {
      console.error("Game start error:", e);
      alert("サーバーとの通信に失敗しました。");
    }
  };

  // Start matchmaking and game state sync polling
  const startMatchPolling = (rId: string, pId: string, loadingInterval: NodeJS.Timeout) => {
    if (lobbyPollIdRef.current) clearInterval(lobbyPollIdRef.current);

    lobbyPollIdRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${rId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: pId }),
        });
        const data = await res.json();

        if (data.expired) {
          clearInterval(lobbyPollIdRef.current);
          clearInterval(loadingInterval);
          setActiveScreen("lobby");
          alert("ルームがタイムアウトしました。");
          return;
        }

        // Just silently update the room data in background while loading finishes
        setRoom(data);
      } catch (e) {
        console.error("Lobby polling error:", e);
      }
    }, 1000);
  };

  // Start server synchronization during active gameplay (runs every 300ms)
  const startStateSynchronization = (rId: string, pId: string) => {
    if (syncIntervalIdRef.current) clearInterval(syncIntervalIdRef.current);

    syncIntervalIdRef.current = setInterval(async () => {
      // Find CPU ID if matching against CPU
      const cpuKey = room ? Object.keys(room.players).find((k) => k.startsWith("cpu_")) : null;
      let cpuStats: any = null;

      // Host simulates the CPU and uploads its position to server
      if (cpuKey && room) {
        cpuStats = {
          id: cpuKey,
          name: "AI特急ライナー",
          position: cpuPositionRef.current,
          speed: cpuSpeedRef.current,
          mascon: cpuMasconRef.current,
          overheat: cpuOverheatRef.current,
          derailed: cpuDerailedRef.current,
          derailTimeLeft: cpuDerailTimeLeftRef.current,
          finished: cpuFinishedRef.current,
        };
        room.players[cpuKey] = cpuStats;
      }

      const clientStats: PlayerStats = {
        id: pId,
        name: nickname,
        position: myPositionRef.current,
        speed: mySpeedRef.current,
        mascon: myMasconRef.current,
        overheat: myOverheatRef.current,
        derailed: myDerailedRef.current,
        derailTimeLeft: myDerailTimeLeftRef.current,
        finished: myFinishedRef.current,
        finishTime: myFinishTimeRef.current,
      };

      try {
        const res = await fetch(`/api/rooms/${rId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: pId,
            stats: clientStats,
            cpuStats: cpuStats, // Send CPU stats to server!
          }),
        });
        const updatedRoom: GameRoom = await res.json();

        if (updatedRoom && updatedRoom.players) {
          setRoom(updatedRoom);

          // Extract opponent information
          const oppKey = Object.keys(updatedRoom.players).find((id) => id !== pId);
          if (oppKey) {
            const opp = updatedRoom.players[oppKey];
            if (!isCpuMatch) {
              opponentPositionRef.current = opp.position;
              opponentSpeedRef.current = opp.speed;
              opponentFinishedRef.current = opp.finished;
              opponentDerailedRef.current = opp.derailed;
              opponentMasconRef.current = opp.mascon;
            }

            setRenderStats((prev) => ({
              ...prev,
              myMascon: myMasconRef.current,
              opponentPosition: isCpuMatch ? cpuPositionRef.current : opp.position,
              opponentSpeed: isCpuMatch ? cpuSpeedRef.current : opp.speed,
              opponentFinished: isCpuMatch ? cpuFinishedRef.current : opp.finished,
              opponentDerailed: isCpuMatch ? cpuDerailedRef.current : opp.derailed,
              opponentName: opp.name,
              opponentMascon: isCpuMatch ? cpuMasconRef.current : opp.mascon,
            }));
          }

          // If race completed
          if (updatedRoom.status === "completed") {
            clearInterval(syncIntervalIdRef.current);
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            setActiveScreen("completed");
            fetchLeaderboard();

            // Submit finish record automatically if finished safely
            if (myFinishedRef.current && myFinishTimeRef.current) {
              submitLeaderboardRecord(nickname, myFinishTimeRef.current);
            }
          }
        }
      } catch (e) {
        console.error("API sync error:", e);
      }
    }, 300);
  };

  // Submit record to global leaderboard database
  const submitLeaderboardRecord = async (name: string, time: number) => {
    try {
      await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, time }),
      });
      fetchLeaderboard();
    } catch (e) {
      console.error("Failed to submit score:", e);
    }
  };

  // Leave active room / reset back to lobby
  const handleLeaveRace = async () => {
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    if (syncIntervalIdRef.current) clearInterval(syncIntervalIdRef.current);
    if (lobbyPollIdRef.current) clearInterval(lobbyPollIdRef.current);

    // Stop background audio and train motor sound
    audioEngineRef.current?.stopBgm();
    audioEngineRef.current?.stopMotor();

    if (roomId && playerId) {
      try {
        await fetch(`/api/rooms/${roomId}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });
      } catch (_) {}
    }

    setPlayerId(null);
    setRoomId(null);
    setRoom(null);
    resetLocalPhysics();
    setActiveScreen("lobby");
  };

  // CPU Drive Strategy Brain
  const updateCpuDriverSim = (dt: number, trackFeatures: TrackFeature[]) => {
    if (cpuFinishedRef.current) return;

    const activeLine = room?.line || 'shonan';
    const cfg = getLineConfig(activeLine, cpuStationIdxRef.current);
    const currentCpuStation = cfg.stations[cpuStationIdxRef.current];

    // Finish check
    if (cpuPositionRef.current >= cfg.trackLength) {
      cpuPositionRef.current = cfg.trackLength;
      cpuSpeedRef.current = 0;
      cpuFinishedRef.current = true;
      return;
    }

    const personality = cpuPersonalityRef.current || "steady";

    // 1. Tick down boarding timer at station
    if (cpuStationTimerRef.current > 0) {
      cpuStationTimerRef.current = Math.max(0, cpuStationTimerRef.current - dt);
      cpuMasconRef.current = "N";
      cpuSpeedRef.current = 0;
      if (cpuStationTimerRef.current <= 0) {
        cpuStationTimerRef.current = 0;
        if (currentCpuStation) {
          cpuPositionRef.current = currentCpuStation.end + 5; // push past station block
        }
        if (cpuStationIdxRef.current < cfg.stations.length - 1) {
          cpuStationIdxRef.current += 1;
        } else {
          cpuFinishedRef.current = true;
        }
      }
      // Return early because train is currently loading passengers
      animateCpuPhysics(dt, 0);
      return;
    }

    // 2. Calculate general cruising target speed based on personality
    let targetSpeed = 100;
    if (activeLine === 'yamanote') {
      targetSpeed = personality === "aggressive" ? 88 : personality === "speedster" ? 84 : 78;
    } else if (activeLine === 'chuo') {
      targetSpeed = personality === "aggressive" ? 118 : personality === "speedster" ? 114 : 108;
    } else { // shonan
      targetSpeed = personality === "aggressive" ? 116 : personality === "speedster" ? 112 : 106;
    }

    // Rubber-banding: make it feel like a competitive, neck-and-neck race
    const distanceDiff = myPositionRef.current - cpuPositionRef.current; // player ahead is positive
    if (distanceDiff > 50) {
      // Player is ahead! CPU accelerates to catch up (up to +10 km/h boost)
      const catchupBoost = Math.min(10, (distanceDiff - 50) * 0.05);
      targetSpeed += catchupBoost;
    } else if (distanceDiff < -80) {
      // CPU is far ahead! CPU slows down slightly to let the player catch up (up to -8 km/h)
      const slowDown = Math.min(8, (-distanceDiff - 80) * 0.04);
      targetSpeed -= slowDown;
    }

    // Calculate signals state from room start time
    const elapsedSec = raceStartTimeRef.current ? (Date.now() - raceStartTimeRef.current) / 1000 : 0;
    
    // Check signals
    const firstSignalRed = elapsedSec < 12;
    const secondSignalRed = elapsedSec < 24;

    if (cpuPositionRef.current < cfg.signal1 && cpuPositionRef.current > cfg.signal1 - 250 && firstSignalRed) {
      // Decelerate early for Signal 1 Red light
      const dist = cfg.signal1 - cpuPositionRef.current;
      targetSpeed = Math.min(targetSpeed, Math.max(0, dist * 0.45));
    }
    if (cpuPositionRef.current < cfg.signal2 && cpuPositionRef.current > cfg.signal2 - 250 && secondSignalRed) {
      // Decelerate early for Signal 2 Red light
      const dist = cfg.signal2 - cpuPositionRef.current;
      targetSpeed = Math.min(targetSpeed, Math.max(0, dist * 0.45));
    }

    // Check speed limit zones curves (anticipatory deceleration based on personality)
    const brakeAnticipationDist = personality === "aggressive" ? 120 : personality === "speedster" ? 150 : 185;
    trackFeatures.forEach((f) => {
      if (f.type === "speed_limit") {
        // approaching limit zone, brake!
        if (cpuPositionRef.current < f.position && cpuPositionRef.current > f.position - brakeAnticipationDist) {
          const distToLimit = f.position - cpuPositionRef.current;
          const ratio = distToLimit / brakeAnticipationDist;
          const approachTarget = f.value + (targetSpeed - f.value) * ratio;
          targetSpeed = Math.min(targetSpeed, approachTarget);
        }
        // inside limit zone
        if (cpuPositionRef.current >= f.position && cpuPositionRef.current <= f.position + f.length) {
          const limitModifier = personality === "aggressive" ? 1.5 : personality === "steady" ? -1.0 : 0.0;
          targetSpeed = Math.min(targetSpeed, f.value + limitModifier);
        }
      }
    });

    // 3. Handles Station Stop smooth pattern deceleration based on personality
    const distToStop = currentCpuStation ? (currentCpuStation.stop - cpuPositionRef.current) : 99999;
    if (currentCpuStation && distToStop < 220 && distToStop > -3) {
      let stationTargetSpeed = 0;
      
      if (personality === "aggressive") {
        if (distToStop > 100) {
          stationTargetSpeed = 85;
        } else if (distToStop > 50) {
          stationTargetSpeed = 55;
        } else if (distToStop > 20) {
          stationTargetSpeed = 30;
        } else if (distToStop > 6) {
          stationTargetSpeed = 12;
        } else if (distToStop > 1) {
          stationTargetSpeed = 4;
        } else {
          stationTargetSpeed = 0;
        }
      } else if (personality === "speedster") {
        if (distToStop > 110) {
          stationTargetSpeed = 80;
        } else if (distToStop > 55) {
          stationTargetSpeed = 48;
        } else if (distToStop > 22) {
          stationTargetSpeed = 26;
        } else if (distToStop > 7) {
          stationTargetSpeed = 10;
        } else if (distToStop > 1) {
          stationTargetSpeed = 3;
        } else {
          stationTargetSpeed = 0;
        }
      } else { // steady
        if (distToStop > 130) {
          stationTargetSpeed = 70;
        } else if (distToStop > 65) {
          stationTargetSpeed = 40;
        } else if (distToStop > 28) {
          stationTargetSpeed = 20;
        } else if (distToStop > 9) {
          stationTargetSpeed = 8;
        } else if (distToStop > 1.5) {
          stationTargetSpeed = 2;
        } else {
          stationTargetSpeed = 0;
        }
      }

      targetSpeed = Math.min(targetSpeed, stationTargetSpeed);

      // Stopped within acceptable accuracy zone (-1m to +2m)
      if (distToStop <= 1.5 && distToStop >= -1 && cpuSpeedRef.current < 0.5) {
        cpuSpeedRef.current = 0;
        cpuMasconRef.current = "N";
        
        const boardingDwell = personality === "aggressive" ? 3.0 + Math.random() * 0.5 : personality === "speedster" ? 3.3 + Math.random() * 0.4 : 3.8 + Math.random() * 0.8;
        cpuStationTimerRef.current = boardingDwell;
        playSynthSound("chime");
        animateCpuPhysics(dt, 0);
        return;
      }
    }

    // 4. Translate target speed into physical Mascon selection
    const speedDiff = targetSpeed - cpuSpeedRef.current;
    if (speedDiff > 8) {
      cpuMasconRef.current = "P4";
    } else if (speedDiff > 3) {
      cpuMasconRef.current = "P2";
    } else if (speedDiff > 0.5) {
      cpuMasconRef.current = "P1";
    } else if (speedDiff < -12) {
      cpuMasconRef.current = "EB";
    } else if (speedDiff < -5) {
      cpuMasconRef.current = "B3";
    } else if (speedDiff < -2) {
      cpuMasconRef.current = "B2";
    } else if (speedDiff < -0.5) {
      cpuMasconRef.current = "B1";
    } else {
      cpuMasconRef.current = "N"; // coast
    }

    // Apply CPU Physics
    animateCpuPhysics(dt, targetSpeed);
  };

  const animateCpuPhysics = (dt: number, limitSpeed: number) => {
    cpuOverheatRef.current = 0;

    // Calculate applied acceleration
    let a = 0;
    if (cpuCrashedRefCurrent()) {
      a = -12.0; // severe force deceleration
    } else {
      const m = cpuMasconRef.current;
      if (m === "P4") a = 2.8;
      else if (m === "P3") a = 2.0;
      else if (m === "P2") a = 1.1;
      else if (m === "P1") a = 0.5;
      else if (m === "B1") a = -1.5;
      else if (m === "B2") a = -3.2;
      else if (m === "B3") a = -5.5;
      else if (m === "EB") a = -9.0;
    }

    // Aerodynamic Drag
    const drag = 0.005 * cpuSpeedRef.current + 0.00015 * cpuSpeedRef.current * cpuSpeedRef.current;
    const netA = a - (cpuSpeedRef.current > 0 ? drag : 0);

    cpuSpeedRef.current = Math.min(125, Math.max(0, cpuSpeedRef.current + netA * dt));
    cpuPositionRef.current += (cpuSpeedRef.current / 3.6) * dt;
  };

  const cpuCrashedRefCurrent = () => {
    // Simple block if CPU crosses RED light (extremely rare but keeps parity)
    const elapsedSec = raceStartTimeRef.current ? (Date.now() - raceStartTimeRef.current) / 1000 : 0;
    if (cpuPositionRef.current >= 1700 && cpuPositionRef.current <= 1715 && elapsedSec < 12) {
      return true;
    }
    if (cpuPositionRef.current >= 2300 && cpuPositionRef.current <= 2315 && elapsedSec < 24) {
      return true;
    }
    return false;
  };

  // --- CORE GAME LOOP (RUNS 60FPS AT VELOCITY SCALE) ---
  const startPhysicsSimulation = (r?: GameRoom) => {
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);

    // Initialize interactive web audio engine on game room load
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current && !audioEngineRef.current) {
      audioEngineRef.current = new TrainAudioEngine();
      audioEngineRef.current.init(audioCtxRef.current);
    }
    if (audioEngineRef.current) {
      audioEngineRef.current.setMuted(isMuted);
      audioEngineRef.current.startBgm();
      audioEngineRef.current.startMotor();
    }
    lastJointPositionRef.current = 0; // reset track joints tracker
    stationStoppedRef.current = false; // reset station stop tracker

    const activeRoom = r || room;
    if (activeRoom) {
      currentFeaturesRef.current = activeRoom.trackFeatures || [];
    }

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000); // capped slice
      lastTime = time;

      const now = Date.now();
      const elapsedSec = raceStartTimeRef.current ? (now - raceStartTimeRef.current) / 1000 : 0;

      // Only simulate physics once countdown has resolved
      if (raceStartTimeRef.current && now >= raceStartTimeRef.current) {
        // Synthesizer real-time audio modulation updates
        if (audioEngineRef.current) {
          audioEngineRef.current.updateMotor(mySpeedRef.current);
        }

        // Play physical railway joints sound based on distance travelled
        if (mySpeedRef.current > 5 && !myDerailedRef.current && !myFinishedRef.current) {
          if (myPositionRef.current - lastJointPositionRef.current >= 30) {
            audioEngineRef.current?.playJointSound();
            lastJointPositionRef.current = myPositionRef.current;
          } else if (myPositionRef.current < lastJointPositionRef.current) {
            lastJointPositionRef.current = myPositionRef.current;
          }
        }
        
        // 1. UPDATE CPU IF CPU OPPONENT ACTIVE
        const features = currentFeaturesRef.current;
        updateCpuDriverSim(dt, features);

        // 2. TIMERS & BUFFS
        if (speedBoostActiveRef.current) {
          setBoostTimer((prev) => {
            if (prev - dt <= 0) {
              setSpeedBoostActive(false);
              speedBoostActiveRef.current = false;
              return 0;
            }
            return prev - dt;
          });
        }

        let positionGain = 0;

        // Inside Station Stop Boarding period
        if (boardingTimeLeftRef.current > 0) {
          // Accumulate paused timer inside station
          pausedTimeMsRef.current += dt * 1000;
          setStationPausedAccumMs(pausedTimeMsRef.current);

          boardingTimeLeftRef.current = Math.max(0, boardingTimeLeftRef.current - dt);
          setBoardingTimeLeft(boardingTimeLeftRef.current);
          if (boardingTimeLeftRef.current <= 0) {
            stationStoppedRef.current = false;
            setStationStopped(false);
            setStationGrade("");
            
            const activeLine_ = activeLineRef.current;
            const cfg_ = getLineConfig(activeLine_, currentStationIdxRef.current);
            const isTerminal = cfg_.stations[currentStationIdxRef.current]?.isTerminal;
            
            if (isTerminal) {
              // Stopped at terminal station! Game is finished successfully!
              myFinishedRef.current = true;
              const finalTimeMs = raceStartTimeRef.current ? (Date.now() - raceStartTimeRef.current - pausedTimeMsRef.current) : 0;
              myFinishTimeRef.current = finalTimeMs;
              playSynthSound("chime");
              audioEngineRef.current?.stopBgm();
              audioEngineRef.current?.stopMotor();
            } else {
              // Proceed to next station
              currentStationIdxRef.current += 1;
              setCurrentStationIdx(currentStationIdxRef.current);
              myStationCompletedRef.current = false;
              myPositionRef.current = cfg_.stationEnd + 5; // push past station block end
              playSynthSound("beep");
            }
          }
          // Stop physics updates during passenger exchange
          mySpeedRef.current = 0;
          myMasconRef.current = "N";
        } else if (speedPenaltyTimeLeftRef.current > 0) {
          // Exceeded speed limit penalty is active: stop train, lock controls
          const prevPenalty = speedPenaltyTimeLeftRef.current;
          speedPenaltyTimeLeftRef.current = Math.max(0, speedPenaltyTimeLeftRef.current - dt);
          setSpeedPenaltyTimeLeft(speedPenaltyTimeLeftRef.current);
          mySpeedRef.current = 0;
          myMasconRef.current = "EB";
          positionGain = 0;

          // If penalty just finished, auto-reset notch to Neutral so they aren't trapped in EB!
          if (speedPenaltyTimeLeftRef.current <= 0 && prevPenalty > 0) {
            myMasconRef.current = "N";
          }
        } else {
          // 3. APPLY PLAYER VEHICLE PHYSICS
          let accelForce = 0;

          if (myDerailedRef.current) {
            accelForce = 0;
            myDerailTimeLeftRef.current -= dt;
            if (myDerailTimeLeftRef.current <= 0) {
              myDerailedRef.current = false;
              myDerailTimeLeftRef.current = 0;
            }
          } else {
            myOverheatRef.current = 0;
            // Active acceleration power based on current mascon handle selection
            const notch = myMasconRef.current;
            // Apply acceleration multiplier if perfect stop speed boost is active
            const boostMultiplier = speedBoostActiveRef.current ? 1.6 : 1.0;

            if (notch === "P4") {
              accelForce = 2.8 * boostMultiplier;
            } else if (notch === "P3") {
              accelForce = 2.0 * boostMultiplier;
            } else if (notch === "P2") {
              accelForce = 1.1 * boostMultiplier;
            } else if (notch === "P1") {
              accelForce = 0.5 * boostMultiplier;
            } else if (notch === "N") {
              accelForce = 0.0;
            } else if (notch === "B1") {
              accelForce = -1.6;
            } else if (notch === "B2") {
              accelForce = -3.5;
            } else if (notch === "B3") {
              accelForce = -5.8;
            } else if (notch === "EB") {
              accelForce = -9.2;
            }
          }

          // Aerodynamic resistance and friction
          const speedDrag = 0.0055 * mySpeedRef.current + 0.00012 * mySpeedRef.current * mySpeedRef.current;
          const netAcceleration = accelForce - (mySpeedRef.current > 0 ? speedDrag : 0);

          // Update speed calculations
          mySpeedRef.current = Math.min(130, Math.max(0, mySpeedRef.current + netAcceleration * dt));
          
          // Update physical side scrolling positions
          positionGain = (mySpeedRef.current / 3.6) * dt * 1.5;
          myPositionRef.current += positionGain;
        }

        // 4. SIGNAL BLOCKS & SPEED LIMIT CROSS-CHECKS
        let currentAtcLimit = 130;
        let warningText = "";
        let riskValue = 0;

        const activeLine = activeLineRef.current;
        const cfg = getLineConfig(activeLine, currentStationIdxRef.current);

        // Check active curves & speed limits with elegant 200m advance notification notice!
        let speedLimitWarning = "";
        let approachingWarning = "";

        features.forEach((feat) => {
          if (feat.type === "speed_limit") {
            const insideLimit = myPositionRef.current >= feat.position && myPositionRef.current <= feat.position + feat.length;
            if (insideLimit) {
              currentAtcLimit = feat.value;
              if (mySpeedRef.current > feat.value) {
                speedLimitWarning = `⚠️ 速度超過！ 制限速度 ${feat.value}km/h`;
                if (speedPenaltyTimeLeftRef.current <= 0) {
                  // Trigger 5-second speed limit violation penalty!
                  speedPenaltyTimeLeftRef.current = 5.0;
                  setSpeedPenaltyTimeLeft(5.0);
                  mySpeedViolationsCountRef.current += 1;
                  setMySpeedViolationsCount(mySpeedViolationsCountRef.current);
                  mySpeedRef.current = 0; // stop train immediately
                  playSynthSound("buzzer");
                }
              }
            } else {
              // Approaching limit early warning check within 200m
              const distToLimit = feat.position - myPositionRef.current;
              if (distToLimit > 0 && distToLimit <= 200) {
                const text = `📢 予告：前方 ${Math.round(distToLimit)}m 先に制限 ${feat.value}km/h (${feat.label || "速度制限"})`;
                if (!approachingWarning) {
                  approachingWarning = text;
                }
              }
            }
          }
        });

        if (speedLimitWarning) {
          warningText = speedLimitWarning;
        } else if (approachingWarning) {
          warningText = approachingWarning;
        }

        // Dynamic Signal colors calculations based on elapsed milliseconds
        const sig1Red = elapsedSec < 12;
        const sig1Yellow = elapsedSec >= 12 && elapsedSec < 18;

        const sig2Red = elapsedSec < 24;
        const sig2Yellow = elapsedSec >= 24 && elapsedSec < 30;

        // Signal 1 check
        if (myPositionRef.current >= cfg.signal1 && myPositionRef.current <= cfg.signal1 + 15) {
          if (sig1Red) {
            triggerEmergencyAtpStop("信号赤！信号冒涜によりATC非常緊急停止");
          } else if (sig1Yellow && mySpeedRef.current > 60) {
            triggerEmergencyAtpStop("警戒！黄色信号の速度制限(60km/h以下)超過");
          }
        }

        // Signal 2 check
        if (myPositionRef.current >= cfg.signal2 && myPositionRef.current <= cfg.signal2 + 15) {
          if (sig2Red) {
            triggerEmergencyAtpStop("信号赤！信号冒涜によりATC非常緊急停止");
          } else if (sig2Yellow && mySpeedRef.current > 60) {
            triggerEmergencyAtpStop("警戒！黄色信号の速度制限(60km/h以下)超過");
          }
        }

        // 5. JAPANESE STATION STOP CHALLENGE
        if (myPositionRef.current >= cfg.stationStart && myPositionRef.current <= cfg.stationEnd && !stationStoppedRef.current && !myStationCompletedRef.current) {
          const deltaStopM = cfg.stationStop - myPositionRef.current;
          
          if (mySpeedRef.current === 0) {
            stationStoppedRef.current = true;
            setStationStopped(true);
            playHTMLStationStop(deltaStopM);
          } else {
            warningText = `🚉 ${cfg.stationLabel}：次駅停車！ 【残り: ${Math.round(deltaStopM)}m】`;
          }
        }

        // Overrun check if passenger completely rolls past station end without stopping
        if (myPositionRef.current > cfg.stationEnd && myPositionRef.current < cfg.stationEnd + 40 && !stationStoppedRef.current && !myStationCompletedRef.current && myPositionRef.current - positionGain <= cfg.stationEnd) {
          stationStoppedRef.current = true;
          setStationStopped(true);
          myStationCompletedRef.current = true;
          setStationGrade("🚨 オーバーラン！ 🚨");
          setStationMsg("停車位置を大幅に超過しました。乗客苦情のため 5.0秒間加速・出力ペナルティ！");
          setAtcWarning("ペナルティ！出力制限中");
          myOverheatRef.current = 80;
          setBoardingTimeLeft(5.0);
          boardingTimeLeftRef.current = 5.0;
          playSynthSound("buzzer");
        }

        // 6. FINISH LINE DETECTOR
        if (myPositionRef.current >= cfg.trackLength && !myFinishedRef.current) {
          myPositionRef.current = cfg.trackLength;
          mySpeedRef.current = 0;
          myFinishedRef.current = true;
          const finalTimeMs = raceStartTimeRef.current ? (Date.now() - raceStartTimeRef.current - pausedTimeMsRef.current) : 0;
          myFinishTimeRef.current = finalTimeMs;
          playSynthSound("chime");
          
          // Stop interactive dynamic background music and engine sounds
          audioEngineRef.current?.stopBgm();
          audioEngineRef.current?.stopMotor();
        }

        // Overwrite warning if speed penalty is active:
        if (speedPenaltyTimeLeftRef.current > 0) {
          warningText = `🚫 速度超過制限！5秒緊急停止中 (${speedPenaltyTimeLeftRef.current.toFixed(1)}s)`;
        }

        // Render warnings inside status bar HUD
        setAtcWarning(warningText);
        setDerailRisk(riskValue);

        // Copy physics calculations inside Refs directly into React render state
        setRenderStats({
          myPosition: myPositionRef.current,
          mySpeed: mySpeedRef.current,
          myOverheat: myOverheatRef.current,
          myDerailed: myDerailedRef.current,
          myDerailTimeLeft: myDerailTimeLeftRef.current,
          myFinished: myFinishedRef.current,
          myFinishTime: myFinishTimeRef.current,
          myMascon: myMasconRef.current,
          opponentPosition: opponentPositionRef.current,
          opponentSpeed: opponentSpeedRef.current,
          opponentFinished: opponentFinishedRef.current,
          opponentDerailed: opponentDerailedRef.current,
          opponentName: renderStats.opponentName,
          opponentMascon: opponentMasconRef.current,
          atcLimit: currentAtcLimit,
        });
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);
  };

  // Trigger severe derailment action
  const triggerDerailment = () => {
    myDerailedRef.current = true;
    mySpeedRef.current = 0;
    myPositionRef.current = Math.max(0, myPositionRef.current - 15); // bounce backward a bit
    myDerailTimeLeftRef.current = 4.0; // 4 seconds downtime
    playSynthSound("derail");
  };

  // Trigger ATP safety system lock stops
  const triggerEmergencyAtpStop = (reason: string) => {
    mySpeedRef.current = 0;
    myMasconRef.current = "EB";
    myDerailTimeLeftRef.current = 3.5; // lock controls for 3.5 seconds
    myDerailedRef.current = true; // reusing derail visual shake
    setAtcWarning(`🚨 ATP非常緊急停止：${reason}`);
    playSynthSound("buzzer");
  };

  // Analyze station stopped accuracy and give buffs/penalties
  const playHTMLStationStop = (delta: number) => {
    const accuracy = Math.abs(delta); // offset in meters

    if (accuracy <= 1.5) {
      setStationGrade("💮 停車エクセレント！ (+0.0m) 💮");
      setStationMsg("完璧な位置に停車しました！ モーター排熱完了＆加速ブースト15秒間獲得！");
      myOverheatRef.current = 0; // reset heat
      setSpeedBoostActive(true);
      speedBoostActiveRef.current = true;
      setBoostTimer(15.0); // 15s speed buff!
      setBoardingTimeLeft(3.0); // standard boarding wait
      boardingTimeLeftRef.current = 3.0;
      playSynthSound("chime");
      playSynthSound("boost");
    } else if (accuracy <= 4.0) {
      setStationGrade("👍 停車グッド！ 👍");
      setStationMsg("良好な位置です。安全に乗客扱中（待ち時間3.5秒）");
      setBoardingTimeLeft(3.5);
      boardingTimeLeftRef.current = 3.5;
      playSynthSound("chime");
    } else {
      setStationGrade("⚠️ 停車バッド (ズレ大) ⚠️ ");
      setStationMsg("位置がずれています。乗降に時間がかかります。（待ち時間5.0秒）");
      setBoardingTimeLeft(5.0);
      boardingTimeLeftRef.current = 5.0;
      playSynthSound("buzzer");
    }
  };

  // Safely stop all simulation routines on unmount
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (syncIntervalIdRef.current) clearInterval(syncIntervalIdRef.current);
      if (lobbyPollIdRef.current) clearInterval(lobbyPollIdRef.current);
      audioEngineRef.current?.stopBgm();
      audioEngineRef.current?.stopMotor();
    };
  }, []);

  // Set local mascon ref on user changes
  const handleSetNotch = (notch: MasconState) => {
    myMasconRef.current = notch;
    playSynthSound("beep");
  };

  // Calculate parallax offsets based on current train position - accelerated for dynamic speed sense
  const skyOffset = -(renderStats.myPosition * 0.25) % 100;
  const mtOffset = -(renderStats.myPosition * 1.5);
  const trackOffset = -(renderStats.myPosition * 12.0) % 100;

  // Render elapsed running time
  const getElapsedTimeStr = () => {
    if (!raceStartTimeRef.current) return "00:00.00";
    const delta = Date.now() - raceStartTimeRef.current - pausedTimeMsRef.current;
    if (delta < 0) return "00:00.00";
    const m = Math.floor(delta / 60000);
    const s = Math.floor((delta % 60000) / 1000);
    const ms = Math.floor((delta % 1000) / 10);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const getLeaderboardTimeStr = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const mils = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${mils.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-150 flex flex-col items-center justify-center antialiased selection:bg-indigo-500 selection:text-white font-sans p-1 sm:p-4 overflow-hidden">
      
      {/* 16:9 Aspect Ratio Arcade Console Frame Container */}
      <div 
        id="widescreen-frame"
        className="w-full max-w-[1440px] aspect-video bg-slate-900 border-2 sm:border-4 border-slate-800 rounded-xl sm:rounded-3xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] overflow-y-auto md:overflow-hidden flex flex-col relative shrink-0"
        style={{
          width: 'min(100%, calc((100vh - 24px) * 16 / 9))',
          aspectRatio: '16/9',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.95), 0 0 60px rgba(99,102,241,0.06)'
        }}
      >
        
        {/* GLOBAL HUD STATUS HEADER */}
        {activeScreen !== "lobby" && (
          <header className="bg-slate-900 border-b-2 border-slate-800 px-6 sm:px-8 py-3 sm:py-4 flex items-center justify-between shadow-md z-10 shrink-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-emerald-500 rounded-lg p-2 sm:p-2.5 shadow-md shadow-emerald-500/25">
                <Train className="w-6 h-6 sm:w-8 sm:h-8 text-slate-950" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold font-mono text-emerald-400 tracking-wider leading-none">
                  トレインレーシング ２Ｄ
                </h1>
                <p className="text-[9px] sm:text-xs text-slate-400 font-mono mt-1 blur-[0.1px]">
                  E231 Tokaido Line Commuter Sim • Retro Edition
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {activeScreen === "racing" && (
                <button
                  onClick={handleLeaveRace}
                  className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 rounded-lg sm:rounded-xl text-rose-400 text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  🏳️ 途中棄権
                </button>
              )}
              
              {/* Audio Mute toggle button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 sm:p-2.5 border-1.5 sm:border-2 border-slate-700 rounded-lg sm:rounded-xl hover:border-slate-500 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
              </button>
            </div>
          </header>
        )}

      {/* --- SCREEN 1: LOBBY & LEADERBOARD MAIN TAB --- */}
      {activeScreen === "lobby" && (
        <main 
          onClick={() => {
            if (!isLobbyStarted) {
              setIsLobbyStarted(true);
              playSynthSound("chime");
            }
          }}
          className={`flex-1 relative overflow-hidden flex flex-col justify-between p-6 md:p-12 transition-all duration-700 ${!isLobbyStarted ? 'cursor-pointer' : ''}`}
        >
          {/* Background Image Container with advanced brightness styling */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 brightness-120"
            style={{
              backgroundImage: `url("${lobbyBgUrl}")`,
            }}
          />

          {/* Minimal overlay backdrop to maintain rich colors while ensuring UI legibility */}
          <div className="absolute inset-0 bg-slate-950/15 pointer-events-none" />

          {!isLobbyStarted ? (
            /* --- SPLASH PRE-START STATE --- */
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 text-center select-none space-y-12 my-auto">
              
              {/* Official Game Title Logo with pixel-perfect transparent white keying */}
              <div className="max-w-[550px] md:max-w-[850px] max-h-[52vh] mx-auto transition-transform duration-300 transform hover:scale-102 flex justify-center drop-shadow-[0_25px_50px_rgba(0,0,0,0.7)] w-[95%]">
                <img 
                  src={transparentLogo} 
                  alt="トレインレーシング TRAIN RACING" 
                  className="w-full h-auto max-h-[52vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Meter and checkerflag stylized header logo */}
              <div className="flex items-center gap-4 bg-slate-900/95 border-2 border-yellow-500 rounded-xl px-5 py-3 shadow-2xl animate-bounce">
                <div className="flex -space-x-1">
                  <div className="w-4 h-8 bg-slate-100 transform -skew-x-12"></div>
                  <div className="w-4 h-8 bg-slate-950 transform -skew-x-12"></div>
                  <div className="w-4 h-8 bg-slate-100 transform -skew-x-12"></div>
                  <div className="w-4 h-8 bg-slate-950 transform -skew-x-12"></div>
                </div>
                <div className="text-sm md:text-lg font-mono font-black text-yellow-400 tracking-widest uppercase">
                  ⚡ HIGH VELOCITY 2D SIMULATOR ⚡
                </div>
              </div>

              {/* Blink trigger text */}
              <div className="space-y-6 flex flex-col items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLobbyStarted(true);
                    playSynthSound("chime");
                  }}
                  className="group relative h-16 w-80 sm:w-96 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-2 border-yellow-350 text-slate-950 font-sans font-extrabold text-2xl rounded-2xl shadow-[0_12px_40px_rgba(234,179,8,0.5)] flex items-center justify-center gap-4 cursor-pointer transform -skew-x-6 transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 shadow-yellow-500/25 z-20"
                >
                  <div className="transform skew-x-6 flex items-center gap-3">
                    <span className="text-3xl animate-bounce">🎮</span>
                    <span className="tracking-widest text-slate-950 font-black">システム起動 / ENTER SYSTEM</span>
                  </div>
                </button>
                
                <div className="text-xs md:text-sm text-slate-400 font-bold tracking-widest bg-slate-950/85 px-4 py-2 rounded-xl border border-slate-800 shadow-md">
                  スペースキー または 画面をタップしてシステム起動
                </div>
              </div>

              {/* Version indicator */}
              <div className="absolute bottom-0 text-xs font-mono text-slate-500">
                VER 1.0.0 • PRO-GRADE 2D RAIL RETRO ENGINE
              </div>
            </div>
          ) : (
            /* --- ACTIVE STARTED LOBBY STATE (SLID FROM LEFT TO RIGHT) --- */
            <motion.div 
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 16 }}
              className="flex-1 relative z-10 flex flex-col justify-between h-full"
            >
              {/* Core Layout: Controls middle left, metadata top left (No title text "トレインレーシング" display matches the spec) */}
              <div className="flex flex-col items-start gap-8 max-w-4xl select-none md:mt-4">
                
                {/* Accent Indicators */}
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-4 bg-slate-900/90 border-2 border-yellow-500 rounded-xl px-5 py-3 shadow-2xl">
                    <div className="flex -space-x-1">
                      <div className="w-4 h-8 bg-slate-100 transform -skew-x-12"></div>
                      <div className="w-4 h-8 bg-slate-950 transform -skew-x-12"></div>
                      <div className="w-4 h-8 bg-slate-100 transform -skew-x-12"></div>
                      <div className="w-4 h-8 bg-slate-950 transform -skew-x-12"></div>
                    </div>
                    <div className="text-xs md:text-sm font-mono font-black text-yellow-400 tracking-widest uppercase">
                      ⚡ HIGH VELOCITY 2D SIMULATOR ⚡
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-600 via-amber-600 to-yellow-500 border-2 border-yellow-400 py-2.5 px-8 transform -skew-x-12 shadow-xl hover:brightness-110 transition-all pl-6">
                    <div className="transform skew-x-12 text-slate-950 font-black text-base md:text-lg italic tracking-widest leading-none drop-shadow-sm flex items-center gap-2.5">
                      <span>最速で目的地を目指せ！</span>
                    </div>
                  </div>
                </div>

                {/* Main Menu Button List - Scaled Up for visibility */}
                <div className="flex flex-col gap-2.5 w-80 sm:w-96 md:w-[420px]">
                  
                  {/* 1. Game Start Button */}
                  <button 
                    onClick={() => { playSynthSound('chime'); setActiveModal('game_start'); }}
                    className="group relative h-14 sm:h-16 md:h-18 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-2 border-yellow-350 text-slate-950 font-sans font-extrabold text-xl sm:text-2xl rounded-xl shadow-[0_8px_25px_rgba(234,179,8,0.45)] flex items-center justify-between px-6 cursor-pointer transform -skew-x-12 transition-all duration-200 hover:scale-103 hover:brightness-105 active:scale-97 active:translate-y-0.5"
                  >
                    <div className="transform skew-x-12 flex items-center gap-3 sm:gap-4">
                      <span className="text-2xl sm:text-3xl">🏁</span>
                      <span className="tracking-wide text-slate-950 font-black">ゲームスタート</span>
                    </div>
                    <div className="transform skew-x-12 text-xl font-black text-slate-950">▶</div>
                  </button>

                  {/* 2. Train Encyclopedia Button */}
                  <button 
                    onClick={() => { playSynthSound('beep'); setActiveModal('train_encyclopedia'); }}
                    className="group relative h-11 sm:h-12 bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-900 border-2 border-emerald-500 hover:border-emerald-400 text-slate-100 font-sans font-bold text-sm sm:text-base rounded-xl shadow-lg flex items-center justify-between px-6 cursor-pointer transform -skew-x-12 transition-all duration-200 hover:scale-102 active:scale-98"
                  >
                    <div className="transform skew-x-12 flex items-center gap-3 sm:gap-4">
                      <span className="text-xl sm:text-2xl">📖</span>
                      <span className="font-extrabold">車両図鑑</span>
                    </div>
                    <div className="transform skew-x-12 text-base font-black text-emerald-300">▶</div>
                  </button>

                  {/* 3. Ranking Button */}
                  <button 
                    onClick={() => { playSynthSound('beep'); setActiveModal('ranking'); }}
                    className="group relative h-11 sm:h-12 bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-900 border-2 border-blue-500 hover:border-blue-400 text-slate-100 font-sans font-bold text-sm sm:text-base rounded-xl shadow-lg flex items-center justify-between px-6 cursor-pointer transform -skew-x-12 transition-all duration-200 hover:scale-102 active:scale-98"
                  >
                    <div className="transform skew-x-12 flex items-center gap-3 sm:gap-4">
                      <span className="text-xl sm:text-2xl">🏆</span>
                      <span className="font-extrabold">ランキング</span>
                    </div>
                    <div className="transform skew-x-12 text-base font-black text-blue-300">▶</div>
                  </button>

                  {/* 4. Options Button */}
                  <button 
                    onClick={() => { playSynthSound('beep'); setActiveModal('options'); }}
                    className="group relative h-11 sm:h-12 bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-900 border-2 border-blue-500 hover:border-blue-400 text-slate-100 font-sans font-bold text-sm sm:text-base rounded-xl shadow-lg flex items-center justify-between px-6 cursor-pointer transform -skew-x-12 transition-all duration-200 hover:scale-102 active:scale-98"
                  >
                    <div className="transform skew-x-12 flex items-center gap-3 sm:gap-4">
                      <span className="text-xl sm:text-2xl">⚙️</span>
                      <span className="font-extrabold">オプション</span>
                    </div>
                    <div className="transform skew-x-12 text-base font-black text-blue-300">▶</div>
                  </button>

                </div>

              </div>

              {/* Bottom Indicators (Left: Ver, Right: News/Howto) */}
              <div className="w-full flex items-end justify-between select-none mt-8">
                
                {/* Version Ticker */}
                <div className="bg-slate-950/80 px-4 py-2 rounded-lg border border-slate-800 text-slate-350 font-mono font-bold text-sm tracking-wide">
                  Ver.1.0.0
                </div>

                {/* Announcement & Play Guide Small buttons - Scaled Up for better touch targeting */}
                <div className="flex gap-5">
                  {/* News / Notice */}
                  <button 
                    onClick={() => { playSynthSound('beep'); setActiveModal('news'); }}
                    className="bg-gradient-to-b from-blue-950 to-indigo-950 hover:brightness-110 border-2 border-indigo-500 rounded-xl px-5 py-4 shadow-lg flex flex-col items-center justify-center gap-2 cursor-pointer w-28 h-28 transition-all font-sans animate-none"
                  >
                    <span className="text-4xl animate-pulse">📢</span>
                    <span className="text-[11px] sm:text-xs text-slate-200 font-black tracking-widest mt-1">お知らせ</span>
                  </button>

                  {/* Instructions Guide */}
                  <button 
                    onClick={() => { playSynthSound('beep'); setActiveModal('how_to_play'); }}
                    className="bg-gradient-to-b from-blue-950 to-indigo-950 hover:brightness-110 border-2 border-indigo-500 rounded-xl px-5 py-4 shadow-lg flex flex-col items-center justify-center gap-2 cursor-pointer w-28 h-28 transition-all font-sans"
                  >
                    <span className="text-4xl font-extrabold text-indigo-400 leading-none">❓</span>
                    <span className="text-[11px] sm:text-xs text-slate-200 font-black tracking-widest mt-1">遊び方</span>
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* AnimatePresence for beautiful overlay system dialog modals */}
          <AnimatePresence>
            {activeModal !== "none" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex items-center justify-center p-4 md:p-8"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, y: 15, opacity: 0 }}
                  transition={{ type: "spring", duration: 0.4 }}
                  className="bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-slate-700/85 shadow-[0_10px_35px_rgba(0,0,0,0.9)] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative flex flex-col"
                >
                  {/* Decorative Metal Window Header */}
                  <div className="bg-gradient-to-r from-indigo-900 to-blue-900 border-b-4 border-slate-700 px-8 py-5 flex items-center justify-between text-slate-100">
                    <h3 className="font-sans font-black text-xl md:text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-indigo-100">
                      {activeModal === "game_start" && "🏁 運転開始・乗務員室"}
                      {activeModal === "stage_select" && "🗺️ 運行路線・ステージダイヤ選択"}
                      {activeModal === "train_select" && "🚄 運転車両・モデリング庫"}
                      {activeModal === "ranking" && "🏆 全国運転士 ハイスコア・ランキング"}
                      {activeModal === "options" && "⚙️ システム指令・オプション設定"}
                      {activeModal === "news" && "📢 運行指令・トピックス"}
                      {activeModal === "how_to_play" && "❓ 新任運転士 養成実習マニュアル"}
                      {activeModal === "train_encyclopedia" && "📖 運転車両・大日本鉄道車両図鑑"}
                    </h3>
                    <button 
                      onClick={() => { playSynthSound('buzzer'); setActiveModal('none'); }}
                      className="text-slate-400 hover:text-slate-100 font-mono font-bold text-2xl cursor-pointer p-1"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Body Containers */}
                  <div className="p-8 md:p-10 space-y-8">

                    {/* MODAL: GAME START & DRIVER REGISTRATION */}
                    {activeModal === "game_start" && (
                      <div className="space-y-6">
                        <div className="space-y-2 text-center">
                          <p className="text-sm text-slate-300 font-sans leading-relaxed">
                            乗務に先立ち、運転指令室に運転士の登録名を入力し、路線と車両を選択してください。
                          </p>
                        </div>

                        {/* Driver nick form entry */}
                        <div className="space-y-3">
                          <label className="block text-sm font-mono font-black text-amber-400 tracking-wider">
                            DRIVER NICKNAME / 運転士登録名
                          </label>
                          <input
                            type="text"
                            maxLength={16}
                            placeholder="例：新米運転士"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-6 py-4 text-slate-200 font-mono font-bold placeholder-slate-700 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all text-center text-xl"
                          />
                        </div>

                        {/* SELECT LINE & TRAIN */}
                        <div className="space-y-3">
                          <label className="block text-sm font-mono font-black text-emerald-400 tracking-wider">
                            SELECT LINE & TRAIN / 運行路線・車両選択
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                              {
                                id: 'shonan',
                                name: '湘南新宿ライン',
                                desc: 'E231系 (湘南色)',
                                details: '全5駅（茅ヶ崎まで）の超ロング路線。最高速運転を維持しつつ、安全に運行しよう！',
                                length: '21000m',
                                target: '950.0秒',
                                activeColor: 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                              },
                              {
                                id: 'yamanote',
                                name: '山手線',
                                desc: 'E235系 (ウグイス)',
                                details: '全5駅（新宿まで）の都心路線。こまめな加減速と、ホームと被らない綺麗な速度制限を攻略しよう！',
                                length: '13000m',
                                target: '650.0秒',
                                activeColor: 'bg-lime-950/40 border-lime-500 text-lime-300 shadow-[0_0_15px_rgba(132,204,22,0.2)]'
                              },
                              {
                                id: 'chuo',
                                name: '中央快速線',
                                desc: 'E233系 (中央色)',
                                details: '全5駅（高円寺まで）の直線快速。高出力モーターの加減速性能を活かして駆け抜けよう！',
                                length: '18000m',
                                target: '850.0秒',
                                activeColor: 'bg-red-950/40 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                              }
                            ].map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSelectedLine(item.id as any);
                                  playSynthSound('chime');
                                }}
                                className={`flex flex-col p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer h-full ${
                                  selectedLine === item.id
                                    ? item.activeColor
                                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:scale-[1.01]'
                                }`}
                              >
                                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block mb-1">
                                  {item.desc}
                                </span>
                                <span className="font-sans font-black text-slate-100 text-sm md:text-base block mb-1">
                                  {item.name}
                                </span>
                                <p className="text-slate-400 text-xs leading-snug mb-3 flex-grow">
                                  {item.details}
                                </p>
                                <div className="border-t border-slate-800/80 pt-2 w-full flex items-center justify-between font-mono text-[11px] font-bold">
                                  <span className="text-amber-400">{item.length}</span>
                                  <span className="text-slate-500">⏱️ {item.target}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Start action launchers */}
                        <div className="space-y-4 pt-6 border-t border-slate-800/80">
                          <button
                            onClick={() => {
                              if (!nickname.trim()) {
                                alert("運転士のニックネームを入力してください。");
                                return;
                              }
                              setActiveModal('none');
                              handleJoinQueue(); // Always play solo Time Attack
                            }}
                            className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-sans font-black text-lg py-4.5 px-8 rounded-2xl shadow-lg cursor-pointer transform transition-all active:scale-98 flex items-center justify-center gap-2 hover:scale-101 border-2 border-yellow-350 shadow-yellow-500/10"
                          >
                            <span>⏱️</span> 単独乗務開始 (タイムアタックスタート)
                          </button>
                        </div>
                      </div>
                    )}


                    {/* MODAL: RANKING */}
                    {activeModal === "ranking" && (
                      <div className="space-y-4">
                        <span className="text-xs font-mono text-indigo-400 block border-b border-slate-800 pb-2 font-bold">
                          {"🚈"} 2D車両精密モデリング・シミュレーター
                        </span>
                          <div className="h-28 flex items-center justify-center overflow-hidden bg-slate-900/60 rounded-xl px-4">
                            <TrainVisual speed={45} isPlayer={true} line={selectedLine} />
                          </div>
                          <div className="text-xs text-slate-300 px-4 leading-relaxed font-sans">
                            {selectedLine === 'shonan' && "【E231系】 湘南新宿ライン、上野東京ライン等で長年に渡り活躍する中距離快速。長い編成と加速した際のモーター唸り音が魅力。"}
                            {selectedLine === 'yamanote' && "【E235系】 現在の山手線の顔であり、正面がスマートフォンを彷彿とさせる未来的デザイン。高密度のATC加減速を得意とする。"}
                            {selectedLine === 'chuo' && "【E233系】 中央特快として、高出力モーターにより一気に時速100キロ以上に到達する頼もしきオレンジの韋駄天。"}
                          </div>
                        </div>
                    )}

                    {/* MODAL: TRAIN ENCYCLOPEDIA */}
                    {activeModal === "train_encyclopedia" && (
                      <div className="space-y-6">
                        <p className="text-sm text-slate-300 text-center font-sans">
                          あなたがこれまでに獲得した車両と、各路線の車両図鑑です。
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {(['shonan', 'yamanote', 'chuo'] as const).map((line) => (
                            <div
                              key={line}
                              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${
                                acquiredTrains.includes(line)
                                  ? 'bg-slate-950 border-emerald-500'
                                  : 'bg-slate-900 border-slate-800 opacity-60'
                              }`}
                            >
                              <span className="text-3xl">
                                {acquiredTrains.includes(line) ? '✅' : '🔒'}
                              </span>
                              <span className="text-xs font-black text-slate-200">
                                {line === 'shonan' ? '湘南新宿 E231' : line === 'yamanote' ? '山手線 E235' : '中央快速 E233'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* MODAL: RANKING */}
                    {activeModal === "ranking" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <p className="text-xs text-slate-400 font-sans">
                            安全と正確、最速タイムを極めた全国の上位運転士たちです。
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">TOP 10 DRIVERS</span>
                        </div>

                        {/* Leaderboard Rendering */}
                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                          {leaderboard.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-600 font-mono">
                              ランキング記録がまだありません。
                            </div>
                          ) : (
                            leaderboard.slice(0, 10).map((entry, index) => (
                              <div
                                key={entry.id || idx(index, entry.name)}
                                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono transition-all ${
                                  index === 0 
                                    ? "bg-amber-950/30 border-amber-500/60 text-amber-200 shadow-md" 
                                    : index === 1 
                                      ? "bg-slate-800/60 border-slate-700 text-slate-200" 
                                      : "bg-slate-950 border-slate-900 text-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                                    index === 0 
                                      ? "bg-amber-500 text-slate-950 shadow-sm" 
                                      : index === 1 
                                        ? "bg-slate-400 text-slate-950" 
                                        : index === 2 
                                          ? "bg-amber-700 text-slate-100" 
                                          : "bg-slate-800 text-slate-400"
                                  }`}>
                                    {index + 1}
                                  </span>
                                  <span className="truncate max-w-[140px] font-bold text-sm">{entry.name}</span>
                                </div>
                                <span className="font-extrabold text-sm text-emerald-400">
                                  {getLeaderboardTimeStr(entry.time)}
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[9.5px] text-slate-400 font-sans leading-relaxed">
                          🏆 **安全運行指針**: 信号冒涜（赤走中）やカーブ制限速度の危険超過は即時「脱線」または「ATC自動緊急停止ペナルティ」を起こし、大きなタイムロスになります。
                        </div>
                      </div>
                    )}

                    {/* MODAL: OPTIONS */}
                    {activeModal === "options" && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-xs font-sans font-black text-indigo-400 uppercase tracking-widest">
                            音量オーディオ・シグナル
                          </h4>
                          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-4">
                            <span className="text-sm text-slate-300 font-sans">
                              マスターシステム・チャイム音
                            </span>
                            <button
                              onClick={() => { setIsMuted(!isMuted); playSynthSound('beep'); }}
                              className="px-4 py-2 rounded-lg font-mono font-bold text-xs cursor-pointer transition-all border flex items-center gap-2"
                              style={{
                                backgroundColor: isMuted ? '#4c0519' : '#064e3b',
                                borderColor: isMuted ? '#f43f5e' : '#10b981',
                                color: isMuted ? '#fda4af' : '#a7f3d0'
                              }}
                            >
                              {isMuted ? '🔇 消音中 (MUTED)' : '🔊 鳴動中 (ACTIVE)'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-sans font-black text-indigo-400 uppercase tracking-widest">
                            公式走行競路規約 (Rules)
                          </h4>
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 font-sans space-y-2 leading-relaxed">
                            <p>
                              1. **中間駅停車**: 本シミュレータには運行上の重要チェックポイントとして、中間に旅客扱い駅が存在します。
                            </p>
                            <p>
                              2. 停車指定範囲（±1.5m以内）に完全に停止すると、乗客扱い待機が最速で終了し、さらに15秒間の**1.6倍加速ブースト**を獲得できます！
                            </p>
                            <p>
                              3. オーバーラン（超過）すると、苦情処理ペナルティとして5.0秒間強制加速出力ゼロの重い足枷が課せられます。
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODAL: NEWS */}
                    {activeModal === "news" && (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-xs text-slate-300 space-y-4 font-sans leading-relaxed">
                        <div className="border-b border-slate-800 pb-3">
                          <span className="text-indigo-400 font-mono font-bold block">[UPDATE 2026-06-16]</span>
                          <span className="text-slate-100 font-black text-sm mt-1 block">トレインレーシング ２Ｄ 運行全面開始！</span>
                        </div>
                        <p>
                          ・**JR東日本主力車両の乗り入れ対応完了！** 湘南色E231系を筆頭に、最新山手線E235系、中央高速仕様のE233系がフルパワー運転できるようになりました。
                        </p>
                        <p>
                          ・**中駅「完璧制動ボーナス」実装！** 停車精度±1.5m以下の「エクセレント」を記録すると、加速が飛躍的にアップする限定ブーストと、排熱瞬間冷却が発動します。
                        </p>
                        <p>
                          ・**信号保安設備(ATC)アップデート！** 路線進行上で「警戒制限(黄色: 60km/h以下)」および「赤（即停止）」シグナルをシミュレート。スピード構造に細心の注意を払いましょう。
                        </p>
                      </div>
                    )}

                    {/* MODAL: HOW TO PLAY */}
                    {activeModal === "how_to_play" && (
                      <div className="space-y-6">
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 font-sans">
                          <span className="text-[11px] font-black text-indigo-400 block border-b border-slate-800 pb-2 uppercase tracking-wider">
                            🎮 司令室・マスコン(マニュアル)操作方法
                          </span>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col items-center text-center">
                              <span className="px-2 py-1 bg-amber-500 rounded text-slate-950 font-bold font-mono">W キー</span>
                              <span className="text-[10px] text-slate-400 mt-1">または ↑矢印キー</span>
                              <span className="text-slate-200 mt-2 font-bold">マスコン投入 (加速)</span>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col items-center text-center">
                              <span className="px-2 py-1 bg-blue-500 rounded text-slate-950 font-bold font-mono">S キー</span>
                              <span className="text-[10px] text-slate-400 mt-1">または ↓矢印キー</span>
                              <span className="text-slate-200 mt-2 font-bold">ブレーキ制動 (減速)</span>
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center text-xs">
                            <span className="px-2 py-1 bg-red-600 rounded text-white font-bold font-mono">Space キー</span>
                            <span className="text-slate-200 ml-2 font-bold">EB 非常ブレーキ始動！</span>
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 font-sans space-y-2 leading-relaxed">
                          <span className="text-amber-400 font-bold block">💡 快速ランの裏ワザ・プロ技：</span>
                          <p>
                            ・【過熱に注意】：加速「P4」を連続投入し続けるとモーターが過熱、100%に達すると保護システムが作動して、完全に冷却(25%以下)されるまで一切加速できなくなります。駅への進入や減速時(B1〜B3)に効率よく冷却しましょう！
                          </p>
                          <p>
                            ・【信号機を注視】：走行中にある「🚦1」と「🚦2」の信号。時間が経過すると自動的に赤から黄色、そして青へ変わります。赤信号のまま突入すると即ATC自動緊急停止により数秒間コントロール不能になります！
                          </p>
                        </div>
                      </div>
                    )}

                    {/* MODAL: TRAIN ENCYCLOPEDIA (車両図鑑) */}
                    {activeModal === "train_encyclopedia" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                        {/* Sidebar list of trains */}
                        <div className="flex flex-col gap-2.5 md:col-span-1">
                          <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase border-b border-slate-800 pb-1.5 block">
                            所有車両リスト (3)
                          </span>
                          {[
                            { id: "yamanote", name: "E235系 山手線", spec: "SiC-VVVF • 新型通勤型", color: "border-l-emerald-500", label: "山手線" },
                            { id: "chuo", name: "E233系 中央線", spec: "IGBT-VVVF • 快速大容量", color: "border-l-orange-500", label: "中央快速線" },
                            { id: "shonan", name: "E231系 湘南新宿", spec: "近郊型仕様 • 高速運転対応", color: "border-l-teal-600", label: "湘南新宿ライン" }
                          ].map((train) => {
                            const isSelected = selectedEncyTrain === train.id;
                            return (
                              <button
                                key={train.id}
                                onClick={() => { playSynthSound("beep"); setSelectedEncyTrain(train.id as any); }}
                                className={`w-full text-left p-3 rounded-lg border flex flex-col transition-all cursor-pointer ${
                                  isSelected 
                                    ? "bg-indigo-950/40 border-indigo-500/80 shadow-[0_0_12px_rgba(99,102,241,0.2)]" 
                                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50"
                                } border-l-4 ${train.color}`}
                              >
                                <span className="text-[9px] text-slate-500 uppercase tracking-widest">{train.label}</span>
                                <span className="font-bold text-slate-100 text-sm mt-0.5">{train.name}</span>
                                <span className="text-[10px] text-slate-400 mt-1">{train.spec}</span>
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded-sm mt-2 self-start border border-emerald-500/20">
                                  所有中 (OWNED)
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Train Details View Panel */}
                        <div className="md:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-5 md:p-6 space-y-5 flex flex-col h-full min-h-[380px]">
                          {(() => {
                            const details = {
                              yamanote: {
                                name: "E235系 一般型通勤電車 (山手線)",
                                slogan: "次世代の通勤型標準車両、INTEROSシステム搭載",
                                year: "2015年 (平成27年)",
                                config: "11両/15両編成対応 (SiC-VVVF制御)",
                                speed: "最高設計速度 120 km/h",
                                accel: "起動加速度 3.0 km/h/s",
                                brake: "常用減速度 4.5 km/h/s (非常時 5.2 km/h/s)",
                                desc: "山手線向けに導入された次世代通勤型電車。車体側面部の黄緑色の縦帯が特徴的で、前面部にはデジタルサイネージ技術を初採用。列車制御伝送システム「INTEROS」を実用化し、大量のデータを毎秒100MBで伝送することでリアルタイムに車両情報を把握可能な、最先端のシステムを誇る日本有数のインテリジェント車両です。",
                                accent: "text-emerald-400"
                              },
                              chuo: {
                                name: "E233系 一般型通勤電車 (中央線快速)",
                                slogan: "高信頼性と乗客満足度を追求した中央快速線の主軸",
                                year: "2006年 (平成18年)",
                                config: "10防/15両編成対応 (IGBT-VVVF制御)",
                                speed: "最高設計速度 120 km/h",
                                accel: "起動加速度 3.0 km/h/s",
                                brake: "常用減速度 5.0 km/h/s",
                                desc: "主要部品の二重系化などトラブルに強い高信頼性設計が初めて本格採用された通勤型のエース。中央線のオレンジ色（バーミリオン）をまとい、非常に強力な加速性能と高い制動レスポンスを持ちます。車内案内用液晶モニタの増設やバリアフリー化が進んでおり、通勤ラッシュの過酷なダイヤを毎日フルパワーで支えるタフな名車です。",
                                accent: "text-orange-400"
                              },
                              shonan: {
                                name: "E231系 / E233系 一般型近郊電車 (湘南新宿ライン)",
                                slogan: "中距離輸送の王様、15両ロング編成による大馬力高速運転",
                                year: "2000年 (E231系) / 2007年 (E233系3000番台)",
                                config: "10両＋5両：最大15両編成 (ダブルデッカーグリーン車連結)",
                                speed: "最高設計速度 120 km/h (最高運転速度 110 km/h)",
                                accel: "起動加速度 2.3 km/h/s",
                                brake: "常用減速度 4.0 km/h/s",
                                desc: "北は東北本線・高崎線、南は東海道本線・横須賀線を直通する15両編成の超巨大コミューター。ダブルデッカー（2階建て）グリーン車を2両組み込み、郊外から都心を一気に貫通します。他の通勤電車と異なり、高速域からの力強い走りとスムーズな高速走行性能に優れたギア比が設計されており、日本の鉄道インフラの象徴とも言える長大編成です。",
                                accent: "text-teal-400"
                              }
                            }[selectedEncyTrain];

                            return (
                              <>
                                {/* Train title panel */}
                                <div className="border-b border-slate-800 pb-3">
                                  <div className="flex justify-between items-start gap-4">
                                    <div>
                                      <h4 className="font-black text-lg text-slate-100 font-sans tracking-tight">
                                        {details.name}
                                      </h4>
                                      <p className="text-xs text-slate-400 mt-1 font-medium italic">
                                        “ {details.slogan} ”
                                      </p>
                                    </div>
                                    <span className="shrink-0 text-2xl font-sans">🚄</span>
                                  </div>
                                </div>

                                {/* Tech Specs Specs */}
                                <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-4 border border-slate-900 rounded-lg text-xs font-mono">
                                  <div>
                                    <span className="text-slate-500 block">導入年度</span>
                                    <span className="text-slate-200 font-bold">{details.year}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">標準編成・出力</span>
                                    <span className="text-slate-200 font-bold">{details.config}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">起動加速度</span>
                                    <span className="text-slate-200 font-bold">{details.accel}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">減速性能</span>
                                    <span className="text-slate-200 font-bold">{details.brake}</span>
                                  </div>
                                  <div className="col-span-2 pt-1 border-t border-slate-900">
                                    <span className="text-slate-500 block">最高設計・運転速度</span>
                                    <span className={`font-bold ${details.accent}`}>{details.speed}</span>
                                  </div>
                                </div>

                                {/* Detailed History */}
                                <div className="text-xs text-slate-300 leading-relaxed font-sans space-y-2 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin">
                                  <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">実車概説</span>
                                  <p>{details.desc}</p>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-900/80 flex items-center justify-between text-xs font-mono">
                                  <span className="text-slate-500">所有ステータス：</span>
                                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    ● 運転可能 (READY FOR DEPARTURE)
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Modal Footer Decorative */}
                  <div className="bg-slate-950 border-t border-slate-800 px-6 py-4 flex items-center justify-end">
                    <button
                      onClick={() => { playSynthSound('buzzer'); setActiveModal('none'); }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-bold text-xs py-2 px-5 rounded-lg shadow cursor-pointer"
                    >
                      閉じる
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* --- SCREEN 2: ACTIVE ROUTE LOADING SCREEN --- */}
      {activeScreen === "matchmaking" && (
        <main className="flex-1 flex flex-col items-center justify-center p-4 my-auto text-center select-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden"
          >
            {/* Cyberpunk retro circuit scanlines/rail pattern background */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
            
            {/* Top Indicator Status */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                SYSTEM ONLINE
              </span>
              <span className="text-slate-500">TIMETABLE: TIME ATTACK ONLY</span>
            </div>

            {/* Rotating Train Icon & Header */}
            <div className="space-y-3">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                {/* Glow ring */}
                <div className="absolute inset-0 border-4 border-dashed border-t-amber-500 border-indigo-500/20 rounded-full animate-spin duration-3000"></div>
                <Train className="w-9 h-9 text-amber-400 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-sans font-black text-slate-100 tracking-wider">
                  運行路線ダイヤ 調整中
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedLine === 'yamanote' ? "山手線ダイヤ (恵比寿駅停車)" : selectedLine === 'chuo' ? "中央快速線ダイヤ (三鷹駅停車)" : "湘南新宿ラインダイヤ (湘南大磯駅停車)"} を構成中...
                </p>
              </div>
            </div>

            {/* Diagnostic Logs (Changes color/status checklist beautifully as progress grows) */}
            <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-4 text-left font-mono text-[11px] space-y-2 text-slate-300 leading-relaxed shadow-inner">
              <div className="flex items-center justify-between">
                <span>1. 線路セグメント & 勾配データ展開:</span>
                <span className={loadingProgress >= 25 ? "text-emerald-400 font-bold" : "text-amber-400 animate-pulse"}>
                  {loadingProgress >= 25 ? "【完了】" : "【処理中...】"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. ATS保安装置 & 信号インフラ同期:</span>
                <span className={loadingProgress >= 50 ? "text-emerald-400 font-bold" : loadingProgress >= 25 ? "text-amber-400 animate-pulse" : "text-slate-600"}>
                  {loadingProgress >= 50 ? "【完了】" : loadingProgress >= 25 ? "【初期化中...】" : "【待機】"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. 停車駅(ホームドア・停止限界)キャリブレーション:</span>
                <span className={loadingProgress >= 75 ? "text-emerald-400 font-bold" : loadingProgress >= 50 ? "text-amber-400 animate-pulse" : "text-slate-600"}>
                  {loadingProgress >= 75 ? "【完了】" : loadingProgress >= 50 ? "【調整中...】" : "【待機】"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>4. 運転士登録名「{nickname}」乗務署名承認:</span>
                <span className={loadingProgress >= 95 ? "text-emerald-400 font-bold" : loadingProgress >= 75 ? "text-amber-400 animate-pulse" : "text-slate-600"}>
                  {loadingProgress >= 95 ? "【承認】" : loadingProgress >= 75 ? "【確認中...】" : "【待機】"}
                </span>
              </div>
            </div>

            {/* Retro Scrolling Rails with Mini Train moving left-to-right based on loadingProgress! */}
            <div className="relative bg-slate-950 h-10 border border-slate-800 rounded-lg overflow-hidden flex items-end">
              <div 
                className="absolute inset-x-0 bottom-1 h-1 bg-slate-700"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 2'%3E%3Cline x1='0' y1='1' x2='10' y2='1' stroke='%23475569' stroke-width='0.5'/%3E%3Cline x1='2' y1='0' x2='2' y2='2' stroke='%23475569' stroke-width='0.5'/%3E%3Cline x1='7' y1='0' x2='7' y2='2' stroke='%23475569' stroke-width='0.5'/%3E%3C/svg%3E")`,
                  backgroundSize: '10px 4px'
                }}
              />
              
              {/* Train Avatar shifting proportionally to loading progress */}
              <div 
                className="absolute bottom-1.5 transition-all duration-100 ease-out flex flex-col items-center"
                style={{ left: `calc(${loadingProgress}% - 24px)` }}
              >
                <div className="bg-amber-400 text-[8px] text-slate-950 font-black px-1 rounded-sm shadow-sm leading-none py-0.5 animate-pulse mb-0.5">
                  YOU
                </div>
                <div className="text-xl leading-none">🚃</div>
              </div>
            </div>

            {/* Simulated Loading Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline font-mono text-xs text-slate-400">
                <span className="text-amber-400 font-bold animate-pulse text-left w-5/6 block truncate">{loadingMessage}</span>
                <span className="text-indigo-400 font-black">{loadingProgress}%</span>
              </div>
              <div className="bg-slate-950 h-3 w-full rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 h-full rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Cycling Train Driver Tips banner */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3.5 text-xs text-slate-400 text-left font-sans leading-relaxed">
              <span className="text-amber-400 font-bold block mb-1">💡 運転指令室アドバイス：</span>
              {loadingProgress < 33 ? (
                <p className="animate-fade-in">
                  【オーバーヒートに注意】加速（P4）を使用し続けるとモーターが熱を持ちます。過熱100%に達すると保護システムが働き、数秒間一切加速できなくなります。駅ホームへの進入時や減速時（B1〜B3）に効率よく冷却させましょう。
                </p>
              ) : loadingProgress < 66 ? (
                <p className="animate-fade-in">
                  【駅へのジャスト停車】停止限界線（±1.5m）の範囲にピッタリあわせて 0km/h まで減速すると「エクセレント停車」判定が下り、その場から即座に発車可能になる15秒間加速ブーストが与えられます！
                </p>
              ) : (
                <p className="animate-fade-in">
                  【信号確認】路線に設置された信号（🚦1, 🚦2）は、時間経過とともに赤から黄、青へと切り替わります。赤信号のまま突破すると、ATC自動非常ブレーキによって数秒間強制緊急停止処分を受けます。
                </p>
              )}
            </div>

            {/* Cancel trigger */}
            <button
              onClick={() => {
                if (lobbyPollIdRef.current) clearInterval(lobbyPollIdRef.current);
                setActiveScreen("lobby");
              }}
              className="w-full bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 font-mono font-bold py-2 px-4 rounded-xl cursor-pointer text-xs transition-colors"
            >
              乗務登録を取り消してロビーへ戻る
            </button>
          </motion.div>
        </main>
      )}

      {/* --- SCREEN 3: ACTIVE GAMEBOARD RACING --- */}
      {activeScreen === "racing" && room && (
        <main className="flex-1 flex flex-col p-3 sm:p-4 gap-3 md:gap-4 relative select-none overflow-y-auto justify-between h-full">
          
          {/* TRACK HUD BAR PANEL */}
          {(() => {
            const lineType = room?.line || 'shonan';
            const cfg = getLineConfig(lineType, currentStationIdx);
            const dynamicTrackLength = cfg.trackLength;
            
            return (
              <section className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap gap-4 items-center justify-between">
                {/* Left Section: Progress track layout overview */}
                <div className="flex-1 min-w-[280px]">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span>始発駅 (0m)</span>
                    <span className="text-emerald-400 font-bold">🚉 {cfg.stationLabel}停車 ( {cfg.stationStart}〜{cfg.stationEnd}m )</span>
                    <span>終点駅 ({dynamicTrackLength}m)</span>
                  </div>
                  <div className="relative bg-slate-950 h-5 border-2 border-slate-800 rounded-lg overflow-hidden flex items-center">
                    {/* Station Zone anchor on physical map bar */}
                    <div 
                      className="absolute bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.3)] border-x border-emerald-500/50 h-full text-[9px] text-emerald-300/80 font-mono font-bold flex items-center justify-center animate-pulse"
                      style={{
                        left: `${(cfg.stationStart / dynamicTrackLength) * 100}%`,
                        width: `${((cfg.stationEnd - cfg.stationStart) / dynamicTrackLength) * 100}%`
                      }}
                    >
                      STATION
                    </div>

                    {/* Signals markers on bar */}
                    <div 
                      className="absolute w-2 h-full border-x border-amber-500/30 font-mono bg-amber-500/10 flex items-center justify-center font-bold text-[8px] text-amber-400"
                      style={{ left: `${(cfg.signal1 / dynamicTrackLength) * 100}%` }}
                    >
                      🚦1
                    </div>
                    {cfg.signal2 && (
                      <div 
                        className="absolute w-2 h-full border-x border-amber-500/30 font-mono bg-amber-500/10 flex items-center justify-center font-bold text-[8px] text-amber-400"
                        style={{ left: `${(cfg.signal2 / dynamicTrackLength) * 100}%` }}
                      >
                        🚦2
                      </div>
                    )}

                    {/* Speed limit zones warnings blocks */}
                    <div 
                      className="absolute border-x border-rose-500/30 font-mono bg-rose-500/5 flex items-center justify-center text-[7px]"
                      style={{ 
                        left: `${(lineType === 'yamanote' ? 200 : lineType === 'chuo' ? 1600 : 1200) / dynamicTrackLength * 100}%`, 
                        width: `${(lineType === 'yamanote' ? 250 : lineType === 'chuo' ? 300 : 300) / dynamicTrackLength * 100}%` 
                      }}
                    >
                      {lineType === 'yamanote' ? 'CURVE' : 'BRIDGE'}
                    </div>

                    {/* PLAYER POSITION ICON */}
                    <div 
                      className="absolute w-4 h-4 bg-indigo-500 border border-white rounded-full z-10 transition-all duration-300 flex items-center justify-center -translate-x-1/2 shadow-md shadow-indigo-600/50"
                      style={{ left: `${Math.min(100, (renderStats.myPosition / dynamicTrackLength) * 100)}%` }}
                    >
                      <span className="text-[8px] text-white font-extrabold">▼</span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Time ticker, remaining distance progress details */}
                <div className="flex gap-4 items-center">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-500">ELAPSED TIME</div>
                    <div className="text-2xl font-mono font-bold text-slate-200 tracking-wider">
                      {getElapsedTimeStr()}
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-right">
                    <div className="text-[9px] font-mono text-emerald-400">STAGE QUOTA 目標</div>
                    <div className="text-sm font-mono font-bold text-emerald-300">
                      {getLineConfig(room.line || "shonan").quotaTime}.00秒
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-right">
                    <div className="text-[9px] font-mono text-indigo-400">NEXT GOAL DIST</div>
                    <div className="text-sm font-mono font-bold text-indigo-200">
                      {Math.round(dynamicTrackLength - renderStats.myPosition)}m
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}

          {/* ACTIVE 2D PARALLAX RAILWAY RACING STAGE */}
          <section className="relative h-36 sm:h-44 md:h-48 lg:h-52 bg-gradient-to-b from-sky-950 to-indigo-950 border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-end shrink-0">
            
            {/* Background Parallax: Sky & Stars */}
            <div 
              className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none transition-all duration-100"
              style={{ backgroundPosition: `${skyOffset}px 0` }}
            ></div>

            {/* Speed Lines Overlay to maximize sense of velocity! */}
            {renderStats.mySpeed > 5 && (
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                {[...Array(Math.min(12, Math.floor(renderStats.mySpeed / 10) + 2))].map((_, i) => {
                  const speedPercent = renderStats.mySpeed / 120; // ratio normalized
                  const duration = Math.max(0.15, 0.9 - (speedPercent * 0.75)); // faster animation at high speed
                  const opacity = Math.min(0.6, 0.1 + (speedPercent * 0.5));
                  const width = 80 + (renderStats.mySpeed * 1.5) + (i * 15); // longer streaks at high speed
                  const top = 10 + (i * 8.5) % 75; // distributed heights
                  const delay = i * 0.08;
                  
                  return (
                    <div 
                      key={i}
                      className="absolute bg-gradient-to-r from-transparent via-white/40 to-transparent h-[1.5px] rounded-full animate-speedline"
                      style={{
                        top: `${top}%`,
                        width: `${width}px`,
                        opacity: opacity,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Station Approaching Overlay Alert */}
            {(() => {
              const lineType = room?.line || 'shonan';
              const cfg = getLineConfig(lineType, currentStationIdx);
              const isApproaching = renderStats.myPosition >= (cfg.stationStart - 180) && renderStats.myPosition <= cfg.stationEnd && !myStationCompletedRef.current;
              
              if (!isApproaching) return null;
              
              const distanceToStop = Math.max(0, Math.round(cfg.stationStop - renderStats.myPosition));
              
              return (
                <div id="station-approaching-hud" className="absolute top-3 left-1/2 -translate-x-1/2 z-25 w-76 sm:w-88 bg-slate-950/95 border-2 border-emerald-500 rounded-xl p-2.5 shadow-[0_0_25px_rgba(16,185,129,0.5)] flex flex-col gap-1 text-center pointer-events-none animate-bounce">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-slate-100 font-sans text-[11px] font-black tracking-widest uppercase">
                      まもなく停車駅 🚉 {cfg.stationLabel}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                  
                  <div className="flex items-baseline justify-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
                    <span className="text-slate-400 text-[8.5px] font-mono font-bold tracking-wider">STOP TARGET:</span>
                    <span className="text-amber-400 font-mono text-xl font-black tracking-wider leading-none">
                      {distanceToStop}
                    </span>
                    <span className="text-amber-500 text-[11px] font-bold">m</span>
                  </div>
                  
                  <div className="text-[7.5px] sm:text-[8px] font-sans text-emerald-400 animate-pulse tracking-tight font-bold">
                    【ブレーキ解除待機】停止線にピッタリ合わせて非常ブレーキを解除！
                  </div>
                </div>
              );
            })()}

            {/* Parallax Mountains & Cityscapes layer based on Line Selection */}
            {/* 1. Global Distant Glowing City Skyscrapers (Visible on ALL lines to enhance speed feeling!) */}
            <div 
              className="absolute bottom-11 left-0 right-0 h-28 bg-repeat-x bg-bottom pointer-events-none opacity-85"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Cpath d='M0,200 L0,110 L25,110 L25,70 L55,70 L55,140 L80,140 L80,90 L120,90 L120,160 L140,160 L140,60 L180,60 L180,150 L210,150 L210,120 L240,120 L240,165 L270,165 L270,80 L320,80 L320,160 L350,160 L350,100 L390,100 L390,140 L420,140 L420,70 L460,70 L460,150 L490,150 L490,110 L520,110 L520,160 L550,160 L550,50 L600,50 L600,145 L630,145 L630,95 L670,95 L670,150 L710,150 L710,85 L740,85 L740,135 L770,135 L770,105 L800,105 L800,200 Z' fill='%2347608a'/%3E%3Crect x='10' y='120' width='3' height='4' fill='%23fef08a' opacity='1'/%3E%3Crect x='18' y='120' width='3' height='4' fill='%2360a5fa' opacity='1'/%3E%3Crect x='10' y='130' width='3' height='4' fill='%23fef08a' opacity='1'/%3E%3Crect x='145' y='80' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='155' y='80' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='165' y='80' width='4' height='5' fill='%23ffffff' opacity='1'/%3E%3Crect x='145' y='90' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='165' y='90' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='145' y='100' width='4' height='5' fill='%2360a5fa' opacity='1'/%3E%3Crect x='155' y='100' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='280' y='100' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='290' y='100' width='4' height='5' fill='%23ffffff' opacity='1'/%3E%3Crect x='300' y='100' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='280' y='110' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='300' y='110' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='290' y='120' width='4' height='5' fill='%2360a5fa' opacity='1'/%3E%3Crect x='560' y='70' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='570' y='70' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='580' y='70' width='4' height='5' fill='%23ffffff' opacity='1'/%3E%3Crect x='560' y='80' width='4' height='5' fill='%23ffffff' opacity='1'/%3E%3Crect x='570' y='80' width='4' height='5' fill='%2360a5fa' opacity='1'/%3E%3Crect x='580' y='80' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='560' y='90' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3Crect x='580' y='90' width='4' height='5' fill='%23fef08a' opacity='1'/%3E%3C/svg%3E")`,
                backgroundSize: '800px 112px',
                backgroundPosition: `${mtOffset * 0.4}px bottom`
              }}
            ></div>

            {/* 2. Global Mid-ground Glowing City Skyscrapers (Visible on ALL lines to enhance speed feeling!) */}
            <div 
              className="absolute bottom-11 left-0 right-0 h-20 bg-repeat-x bg-bottom pointer-events-none opacity-90"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Cpath d='M0,200 L0,140 L35,140 L35,120 L75,120 L75,150 L115,150 L115,130 L155,130 L155,160 L195,160 L195,110 L235,110 L235,145 L275,145 L275,170 L315,170 L315,135 L355,135 L355,155 L395,155 L395,140 L435,140 L435,160 L475,160 L475,130 L515,130 L515,150 L555,150 L555,120 L595,120 L595,165 L635,165 L635,145 L675,145 L675,170 L715,170 L715,130 L755,130 L755,150 L800,150 L800,200 Z' fill='%235c75a3'/%3E%3Crect x='10' y='150' width='4' height='6' fill='%23fef08a' opacity='1'/%3E%3Crect x='20' y='150' width='4' height='6' fill='%23ffffff' opacity='1'/%3E%3Crect x='10' y='160' width='4' height='6' fill='%23fef08a' opacity='1'/%3E%3Crect x='125' y='140' width='4' height='6' fill='%23ffffff' opacity='1'/%3E%3Crect x='135' y='140' width='4' height='6' fill='%23fef08a' opacity='1'/%3E%3Crect x='125' y='150' width='4' height='6' fill='%2360a5fa' opacity='1'/%3E%3Crect x='325' y='145' width='4' height='6' fill='%23fef08a' opacity='1'/%3E%3Crect x='335' y='145' width='4' height='6' fill='%23ffffff' opacity='1'/%3E%3Crect x='325' y='155' width='4' height='6' fill='%23fef08a' opacity='1'/%3E%3Crect x='525' y='140' width='4' height='6' fill='%23fef08a' opacity='1'/%3E%3Crect x='535' y='140' width='4' height='6' fill='%2360a5fa' opacity='1'/%3E%3Crect x='525' y='150' width='4' height='6' fill='%23ffffff' opacity='1'/%3E%3C/svg%3E")`,
                backgroundSize: '800px 80px',
                backgroundPosition: `${mtOffset * 0.8}px bottom`
              }}
            ></div>

            {(() => {
              const lineType = room?.line || 'shonan';
              if (lineType === "yamanote") {
                // Yamanote Line: Tokyo Skyscrapers
                return (
                  <>
                    <div 
                      className="absolute bottom-11 left-0 right-0 h-28 bg-repeat-x bg-bottom pointer-events-none opacity-30"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Cpath d='M0,200 L0,150 L30,150 L30,130 L60,130 L60,160 L90,160 L90,100 L130,100 L130,170 L160,170 L160,80 L200,80 L200,165 L240,165 L240,120 L270,120 L270,180 L310,180 L310,70 L360,70 L360,160 L400,160 L400,110 L440,110 L440,150 L480,150 L480,90 L520,90 L520,175 L560,175 L560,130 L600,130 L600,60 L650,60 L650,165 L690,165 L690,105 L730,105 L730,155 L770,155 L770,115 L800,115 L800,200 Z' fill='%231e293b'/%3E%3C/svg%3E")`,
                        backgroundSize: '800px 112px',
                        backgroundPosition: `${mtOffset * 1.5}px bottom`
                      }}
                    ></div>
                    <div 
                      className="absolute bottom-11 left-0 right-0 h-16 bg-repeat-x bg-bottom pointer-events-none opacity-40"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Cpath d='M0,200 L0,170 L40,170 L40,160 L80,160 L80,180 L120,180 L120,150 L170,150 L170,185 L210,185 L210,165 L260,165 L260,190 L300,190 L300,155 L350,155 L350,175 L400,175 L400,160 L450,160 L450,180 L500,180 L500,150 L550,150 L550,185 L600,185 L600,170 L650,170 L650,190 L700,190 L700,160 L750,160 L750,175 L800,175 L800,200 Z' fill='%23334155'/%3E%3C/svg%3E")`,
                        backgroundSize: '800px 64px',
                        backgroundPosition: `${mtOffset * 2.5}px bottom`
                      }}
                    ></div>
                  </>
                );
              } else if (lineType === "chuo") {
                // Chuo Line: Mount Fuji in distance, suburban houses
                return (
                  <>
                    <div 
                      className="absolute bottom-11 left-1/4 w-44 h-24 bg-no-repeat bg-bottom pointer-events-none opacity-25"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'%3E%3Cpolygon points='0,100 100,20 200,100' fill='%23334155'/%3E%3Cpolygon points='75,40 100,20 125,40 100,50' fill='%23ffffff'/%3E%3C/svg%3E")`,
                        backgroundSize: '176px 96px',
                        backgroundPosition: `${mtOffset * 0.4}px bottom`
                      }}
                    ></div>
                    <div 
                      className="absolute bottom-11 left-0 right-0 h-16 bg-repeat-x bg-bottom pointer-events-none opacity-30"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Cpath d='M0,200 L0,180 L20,180 L30,170 L40,180 L60,180 L60,165 L80,165 L90,155 L100,165 L120,165 L120,185 L140,185 L150,175 L160,185 L180,185 L180,170 L200,170 L210,160 L220,170 L240,170 L240,180 L260,180 L270,170 L280,180 L300,180 L300,165 L320,165 L330,155 L340,165 L360,165 L360,185 L380,185 L390,175 L400,185 L420,185 L420,170 L440,170 L450,160 L460,170 L480,170 L480,180 L500,180 L510,170 L520,180 L540,180 L540,165 L560,165 L570,155 L580,165 L600,165 L600,185 L620,185 L630,175 L640,185 L660,185 L660,170 L680,170 L690,160 L700,170 L720,170 L720,180 L740,180 L750,170 L760,180 L780,180 L780,170 L800,170 L800,200 Z' fill='%231e293b'/%3E%3C/svg%3E")`,
                        backgroundSize: '800px 64px',
                        backgroundPosition: `${mtOffset * 1.8}px bottom`
                      }}
                    ></div>
                  </>
                );
              } else {
                // Shonan Line: Coastline, Sea, Enoshima & distant Fuji
                // But display skyscrapers/buildings before Totsuka (currentStationIdx === 0)
                if (currentStationIdx === 0) {
                  return (
                    <>
                      {/* Distant Skyscrapers */}
                      <div 
                        className="absolute bottom-11 left-0 right-0 h-28 bg-repeat-x bg-bottom pointer-events-none opacity-25"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Cpath d='M0,200 L0,150 L30,150 L30,130 L60,130 L60,160 L90,160 L90,100 L130,100 L130,170 L160,170 L160,80 L200,80 L200,165 L240,165 L240,120 L270,120 L270,180 L310,180 L310,70 L360,70 L360,160 L400,160 L400,110 L440,110 L440,150 L480,150 L480,90 L520,90 L520,175 L560,175 L560,130 L600,130 L600,60 L650,60 L650,165 L690,165 L690,105 L730,105 L730,155 L770,155 L770,115 L800,115 L800,200 Z' fill='%231e293b'/%3E%3C/svg%3E")`,
                          backgroundSize: '800px 112px',
                          backgroundPosition: `${mtOffset * 1.5}px bottom`
                        }}
                      ></div>
                      {/* Mid-ground modern urban buildings */}
                      <div 
                        className="absolute bottom-11 left-0 right-0 h-16 bg-repeat-x bg-bottom pointer-events-none opacity-35"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Cpath d='M0,200 L0,170 L40,170 L40,160 L80,160 L80,180 L120,180 L120,150 L170,150 L170,185 L210,185 L210,165 L260,165 L260,190 L300,190 L300,155 L350,155 L350,175 L400,175 L400,160 L450,160 L450,180 L500,180 L500,150 L550,150 L550,185 L600,185 L600,170 L650,170 L650,190 L700,190 L700,160 L750,160 L750,175 L800,175 L800,200 Z' fill='%23334155'/%3E%3C/svg%3E")`,
                          backgroundSize: '800px 64px',
                          backgroundPosition: `${mtOffset * 2.5}px bottom`
                        }}
                      ></div>
                    </>
                  );
                } else {
                  return (
                    <>
                      <div 
                        className="absolute bottom-11 right-1/3 w-32 h-20 bg-no-repeat bg-bottom pointer-events-none opacity-20"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'%3E%3Cpolygon points='0,100 100,20 200,100' fill='%23334155'/%3E%3Cpolygon points='75,40 100,20 125,40 100,50' fill='%23ffffff'/%3E%3C/svg%3E")`,
                          backgroundSize: '128px 80px',
                          backgroundPosition: `${mtOffset * 0.3}px bottom`
                        }}
                      ></div>
                      <div 
                        className="absolute bottom-11 left-0 right-0 h-10 bg-repeat-x bg-bottom pointer-events-none opacity-30"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 100'%3E%3Cpath d='M0,100 C150,90 250,95 400,100 C550,90 650,95 800,100 L800,100 L0,100 Z' fill='%230284c7'/%3E%3C/svg%3E")`,
                          backgroundSize: '800px 40px',
                          backgroundPosition: `${mtOffset * 1.2}px bottom`
                        }}
                      ></div>
                      <div 
                        className="absolute bottom-11 left-0 right-0 h-8 bg-repeat-x bg-bottom pointer-events-none opacity-40"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 100'%3E%3Cpath d='M0,100 Q40,70 80,100 Q120,70 160,100 Q200,70 240,100 Q280,70 320,100 Q360,70 400,100 Z' fill='%230f172a'/%3E%3C/svg%3E")`,
                          backgroundSize: '400px 32px',
                          backgroundPosition: `${mtOffset * 2.2}px bottom`
                        }}
                      ></div>
                    </>
                  );
                }
              }
            })()}

            {/* Signals structures physically visible on the track side scrolling! */}
            {(() => {
              const elapsedSec = raceStartTimeRef.current ? (Date.now() - raceStartTimeRef.current) / 1000 : 0;
              const lineType = room?.line || 'shonan';
              const cfg = getLineConfig(lineType, currentStationIdx);

              const s1Red = elapsedSec < 12;
              const s1Yellow = elapsedSec >= 12 && elapsedSec < 18;

              const s2Red = elapsedSec < 24;
              const s2Yellow = elapsedSec >= 24 && elapsedSec < 30;

              // Compute physical scrolling offsets of signals relative to player train position
              const signal1ScrollX = ((cfg.signal1 - renderStats.myPosition) * 12.0) + 120; // centered screen offset
              const signal2ScrollX = (cfg.signal2 ? ((cfg.signal2 - renderStats.myPosition) * 12.0) + 120 : -999);

              const stationScrollX = ((cfg.stationStop - renderStats.myPosition) * 12.0) + 120;

              return (
                <>
                  {/* Station building & High Detail Platform visible */}
                  {stationScrollX > -3500 && stationScrollX < 12000 && (
                    <div 
                      id="station-platform-block"
                      className="absolute bottom-11 h-16 bg-slate-800 border-x-2 border-t-2 border-slate-600 flex flex-col justify-between z-0 shadow-2xl text-slate-200 pointer-events-none w-[7200px] overflow-hidden rounded-t-lg"
                      style={{ left: `${stationScrollX - 6822}px` }}
                    >
                      {/* Platform header: blind block and safety rail */}
                      <div className="h-3.5 bg-slate-700 border-b-2 border-amber-400 flex items-center justify-between px-4 text-[6.5px] font-bold text-amber-300 font-mono relative overflow-hidden">
                        <div className="absolute inset-0 bg-repeat-x opacity-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 10'%3E%3Cpolygon points='0,10 10,0 20,10' fill='%23f59e0b'/%3E%3C/svg%3E")`, backgroundSize: '12px 6px' }}></div>
                        <span className="tracking-widest animate-pulse z-10">◀ KEEP OUT 危険区域 ◀ 15両編成停車ホーム ◀</span>
                        <span className="bg-amber-500 text-slate-950 px-2 rounded-sm text-[5.5px] font-black z-10">点字ブロック (YELLOW BRAILLE TILE SYSTEM)</span>
                        <span className="tracking-widest animate-pulse z-10">▶ KEEP OUT 危険区域 ▶ 電車とホームの隙間にご注意ください ▶</span>
                      </div>
                      
                      {/* Rich Station Platform Interior Scenery (Pillars, Signs, Machines, Benches, LEDs) */}
                      <div className="relative flex-1 bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-b border-slate-800 overflow-hidden">
                        {(() => {
                          const isVisible = (relativeX: number) => {
                            const screenX = stationScrollX - 6822 + relativeX;
                            return screenX >= -350 && screenX <= 1550;
                          };
                          return (
                            <>
                              {/* 1. Station Structural Pillars (Spaced every 250px) */}
                              {Array.from({ length: 29 }).map((_, i) => {
                                const left = i * 250 + 120;
                                if (!isVisible(left)) return null;
                                return (
                                  <div key={`pillar-${i}`} className="absolute top-0 w-3.5 h-full bg-gradient-to-r from-slate-700 via-slate-600 to-slate-800 border-x border-slate-500 z-0 opacity-90 shadow-inner" style={{ left: `${left}px` }} />
                                );
                              })}

                              {/* 2. Hanging Station Name Signboards (Spaced every 600px, JR East Look) */}
                              {Array.from({ length: 12 }).map((_, i) => {
                                const left = i * 600 + 220;
                                if (!isVisible(left)) return null;
                                return (
                                  <div key={`sign-${i}`} className="absolute top-1 bg-white text-slate-900 border border-slate-800 rounded px-2.5 py-0.5 shadow-md flex flex-col items-center z-10 min-w-[70px] border-b-[3px] border-b-emerald-600" style={{ left: `${left}px` }}>
                                    <span className="text-[7.5px] font-black tracking-widest leading-none border-b border-slate-200 pb-0.5 w-full text-center font-sans">{cfg.stationLabel}</span>
                                    <div className="flex justify-between w-full text-[4px] font-mono text-slate-500 mt-0.5 leading-none">
                                      <span className="text-left font-sans">◀ 前駅</span>
                                      <span className="font-sans font-bold text-slate-400">{cfg.stationLabel.toUpperCase()}</span>
                                      <span className="text-right font-sans">次駅 ▶</span>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* 3. Detailed Vending Machines (Spaced every 850px) */}
                              {Array.from({ length: 9 }).map((_, i) => {
                                const left = i * 850 + 380;
                                if (!isVisible(left)) return null;
                                const brandColor = i % 2 === 0 ? "bg-red-600" : "bg-blue-600";
                                const shadowColor = i % 2 === 0 ? "shadow-red-500/20" : "shadow-blue-500/20";
                                return (
                                  <div key={`vending-${i}`} className={`absolute bottom-0.5 w-7 h-10.5 ${brandColor} rounded border border-slate-900 shadow-lg p-0.5 flex flex-col justify-between z-10 ${shadowColor}`} style={{ left: `${left}px` }}>
                                    {/* Beverage Display Rows */}
                                    <div className="bg-slate-950/90 h-5 flex flex-wrap gap-0.5 p-0.5 rounded-sm overflow-hidden border border-slate-800">
                                      <span className="w-1 h-1 bg-cyan-400 rounded-2xs"></span>
                                      <span className="w-1 h-1 bg-rose-500 rounded-2xs"></span>
                                      <span className="w-1 h-1 bg-emerald-400 rounded-2xs"></span>
                                      <span className="w-1 h-1 bg-yellow-400 rounded-2xs"></span>
                                      <span className="w-1 h-1 bg-orange-400 rounded-2xs"></span>
                                      <span className="w-1 h-1 bg-white rounded-2xs"></span>
                                      <span className="w-1 h-1 bg-indigo-400 rounded-2xs"></span>
                                      <span className="w-1 h-1 bg-amber-500 rounded-2xs"></span>
                                    </div>
                                    {/* Coin slot & brand plate */}
                                    <div className="flex justify-between items-center leading-none">
                                      <span className="text-[3px] font-mono text-white/90 font-bold tracking-tighter">DRINK</span>
                                      <div className="w-1.5 h-1 bg-yellow-300 rounded-2xs"></div>
                                      <div className="w-2.5 h-1.5 bg-slate-950 border border-slate-800 rounded-2xs"></div>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* 4. Detailed Station Benches (Spaced every 1000px) */}
                              {Array.from({ length: 8 }).map((_, i) => {
                                const left = i * 1000 + 480;
                                if (!isVisible(left)) return null;
                                return (
                                  <div key={`bench-${i}`} className="absolute bottom-0.5 flex gap-1 z-10" style={{ left: `${left}px` }}>
                                    {/* Three connected platform seats */}
                                    {Array.from({ length: 3 }).map((_, sIdx) => (
                                      <div key={sIdx} className="w-4 h-4 bg-amber-800/90 border border-amber-950 rounded-sm shadow relative flex flex-col justify-between p-0.5">
                                        <div className="h-1 w-full bg-amber-700 rounded-2xs"></div>
                                        <div className="w-0.5 h-2 bg-slate-900 absolute bottom-0 left-0.5"></div>
                                        <div className="w-0.5 h-2 bg-slate-900 absolute bottom-0 right-0.5"></div>
                                        <span className="text-[3px] text-white/40 leading-none block text-center">🪑</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}

                              {/* 5. Hanging LED Schedule Boards (Spaced every 1200px) */}
                              {Array.from({ length: 6 }).map((_, i) => {
                                const left = i * 1200 + 160;
                                if (!isVisible(left)) return null;
                                return (
                                  <div key={`led-${i}`} className="absolute top-1 w-32 h-6 bg-slate-950 border border-slate-700 rounded p-0.5 shadow-lg flex flex-col justify-between font-mono text-[4px] z-10" style={{ left: `${left}px` }}>
                                    <div className="flex justify-between text-amber-500 leading-none">
                                      <span>特別快速 東京 15両</span>
                                      <span className="text-emerald-400 animate-pulse">先発 11:45</span>
                                    </div>
                                    <div className="flex justify-between text-amber-600 leading-none border-t border-slate-900 pt-0.5">
                                      <span>快速 新宿 15両</span>
                                      <span className="text-orange-400">次発 11:52</span>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* 6. Emergency SOS button and speaker rails */}
                              {Array.from({ length: 18 }).map((_, i) => {
                                const left = i * 400 + 90;
                                if (!isVisible(left)) return null;
                                return (
                                  <div key={`sos-${i}`} className="absolute top-1 flex flex-col items-center gap-1 z-10" style={{ left: `${left}px` }}>
                                    <div className="w-1.5 h-4 bg-red-600 border border-slate-950 p-0.5 flex flex-col items-center justify-center rounded-2xs">
                                      <span className="text-[3px] font-bold text-white leading-none scale-75">SOS</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>

                      {/* Info footer */}
                      <div className="flex justify-between items-center bg-slate-950 text-[6.5px] px-4 py-0.5 font-mono text-slate-500 z-10">
                        <span className="text-rose-400 font-bold">※ 停止線ぴったり（±1.5m）に合わせて 0km/h に減速！ 【15両編成対応ホーム：プラットフォーム長さ：約300m】</span>
                        <span className="text-amber-400 animate-pulse font-bold">🎯 TARGET: 0 km/h</span>
                      </div>
                    </div>
                  )}

                  {/* Signal 1 structure */}
                  {signal1ScrollX > -50 && signal1ScrollX < 1200 && (
                    <div 
                      className="absolute bottom-11 w-8 h-20 flex flex-col items-center justify-end z-0 pointer-events-none"
                      style={{ left: `${signal1ScrollX}px` }}
                    >
                      {/* Signal post frame */}
                      <div className="w-4 h-6 bg-slate-900 border border-slate-700 rounded-md p-0.5 flex flex-col justify-around items-center">
                        <circle cx="0" cy="0" r="1.5" className={`w-1.5 h-1.5 rounded-full ${s1Red ? "bg-red-500 animate-pulse shadow-[0_0_8px_red]" : "bg-red-950"}`} />
                        <circle cx="0" cy="0" r="1.5" className={`w-1.5 h-1.5 rounded-full ${s1Yellow ? "bg-amber-500 shadow-[0_0_8px_yellow]" : "bg-amber-950"}`} />
                        <circle cx="0" cy="0" r="1.5" className={`w-1.5 h-1.5 rounded-full ${(!s1Red && !s1Yellow) ? "bg-emerald-500 shadow-[0_0_8px_green]" : "bg-emerald-950"}`} />
                      </div>
                      <div className="w-1.5 h-14 bg-slate-700"></div>
                      <div className="text-[7px] font-mono text-slate-500">{cfg.signal1}m</div>
                    </div>
                  )}

                  {/* Signal 2 structure */}
                  {cfg.signal2 && signal2ScrollX > -50 && signal2ScrollX < 1200 && (
                    <div 
                      className="absolute bottom-11 w-8 h-20 flex flex-col items-center justify-end z-0 pointer-events-none"
                      style={{ left: `${signal2ScrollX}px` }}
                    >
                      <div className="w-4 h-6 bg-slate-900 border border-slate-700 rounded-md p-0.5 flex flex-col justify-around items-center">
                        <circle cx="0" cy="0" r="1.5" className={`w-1.5 h-1.5 rounded-full ${s2Red ? "bg-red-500 animate-pulse shadow-[0_0_8px_red]" : "bg-red-950"}`} />
                        <circle cx="0" cy="0" r="1.5" className={`w-1.5 h-1.5 rounded-full ${s2Yellow ? "bg-amber-500 shadow-[0_0_8px_yellow]" : "bg-amber-950"}`} />
                        <circle cx="0" cy="0" r="1.5" className={`w-1.5 h-1.5 rounded-full ${(!s2Red && !s2Yellow) ? "bg-emerald-500 shadow-[0_0_8px_green]" : "bg-emerald-950"}`} />
                      </div>
                      <div className="w-1.5 h-14 bg-slate-700"></div>
                      <div className="text-[7px] font-mono text-slate-500">{cfg.signal2}m</div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* TRACK 1: Player's Train (Track layout) */}
            <div className="h-16 relative bg-slate-900/60 border-b border-indigo-900/40 z-10 flex items-center pr-12 overflow-visible">
              {/* Rails moving background */}
              <div 
                className="absolute inset-0 bg-repeat-x opacity-25"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 8'%3E%3Cline x1='0' y1='4' x2='40' y2='4' stroke='%23ffffff' stroke-width='1.5'/%3E%3Cline x1='10' y1='0' x2='10' y2='8' stroke='%23ffffff' stroke-width='1.5'/%3E%3Cline x1='30' y1='0' x2='30' y2='8' stroke='%23ffffff' stroke-width='1.5'/%3E%3C/svg%3E")`,
                  backgroundSize: '40px 8px',
                  backgroundPosition: `${trackOffset}px bottom`
                }}
              ></div>

              {/* Player train consist rendering: 15-car continuous linkage */}
              <div className="absolute left-[120px] flex flex-row-reverse overflow-visible" style={{ height: '91px', width: 'auto' }}>
                {Array.from({ length: 15 }).map((_, idx) => {
                  const carNum = idx + 1; // 1: Front (rightmost), 15: Tail (leftmost)
                  let carType: 'front' | 'middle' | 'tail' = 'middle';
                  if (carNum === 1) carType = 'front';
                  else if (carNum === 15) carType = 'tail';

                  // Realistic pantograph placement: cars 3, 7, 11 (typically on powered intermediate Moha cars)
                  const hasPanto = carType === 'middle' && (carNum === 3 || carNum === 7 || carNum === 11 || carNum === 13);
                  
                  // Car offset translation: spacing them perfectly based on 378px interlocking length
                  const offsetLeft = -(idx * 378);

                  // Visibility optimization for performance
                  const screenX = 120 + offsetLeft;
                  const isVisible = screenX >= -450 && screenX <= (typeof window !== "undefined" ? window.innerWidth : 1600) + 100;
                  if (!isVisible) return null;

                  return (
                    <div 
                      key={`player-car-${idx}`}
                      className="absolute top-0 transition-all duration-100 ease-out" 
                      style={{ 
                        left: `${offsetLeft}px`, 
                        width: '420px', 
                        height: '91px',
                        transform: carType === 'tail' ? 'scaleX(-1)' : undefined,
                        zIndex: 15 - idx
                      }}
                    >
                      <TrainVisual 
                        speed={renderStats.mySpeed} 
                        isBraking={myMasconRef.current.startsWith("B") || myMasconRef.current === "EB"}
                        isPlayer={true}
                        derailed={renderStats.myDerailed}
                        line={room?.line || 'shonan'}
                        carType={carType}
                        hasPantograph={hasPanto}
                      />
                    </div>
                  );
                })}
              </div>

              {/* High-Detail Platform Screen Doors (可動式ホーム柵) Layer - placed in front of train (z-20) */}
              {(() => {
                const lineType = room?.line || 'shonan';
                const cfg = getLineConfig(lineType, currentStationIdx);
                const stationScrollX = ((cfg.stationStop - renderStats.myPosition) * 12.0) + 120;
                
                if (stationScrollX <= -3500 || stationScrollX >= 12000) return null;

                // Open doors only when speed is exactly 0 and stopped inside target zone
                const isStationStopZone = Math.abs(cfg.stationStop - renderStats.myPosition) < 3.5;
                const isDoorsOpen = renderStats.mySpeed === 0 && isStationStopZone;

                return (
                  <div 
                    id="platform-screen-doors"
                    className="absolute bottom-0 h-7 z-20 flex items-end pointer-events-none w-[7200px] overflow-hidden"
                    style={{ left: `${stationScrollX - 6822}px` }}
                  >
                    {/* Background safety wall structure */}
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-slate-100 border-t-2 border-b border-slate-300 shadow-md">
                      {/* Active Line Color Band */}
                      <div className="h-1 w-full" style={{
                        backgroundImage: lineType === 'yamanote' 
                          ? 'linear-gradient(to right, #8cc63f, #8cc63f)' 
                          : lineType === 'chuo'
                            ? 'linear-gradient(to right, #ff5f00, #ff5f00)'
                            : 'linear-gradient(to right, #006c35 60%, #f77f00 40%)',
                        backgroundSize: '100% 100%'
                      }}></div>
                    </div>

                    {/* Generate screen door pairs perfectly aligned to train cabin doors */}
                    {Array.from({ length: 15 }).map((_, carIdx) => {
                      const carOffset = carIdx * 378;
                      const isMiddle = carIdx > 0 && carIdx < 14;

                      // Visibility optimization: only render visible platform doors
                      const screenX = stationScrollX - 6822 + 7200 - 378 - carOffset;
                      const isDoorVisible = screenX >= -400 && screenX <= (typeof window !== "undefined" ? window.innerWidth : 1600) + 100;
                      if (!isDoorVisible) return null;

                      // Door positions (middle car has 5 doors, front/tail has 4 doors)
                      const doorCoords = isMiddle 
                        ? [123, 228, 333, 438, 500] 
                        : [123, 228, 333, 438];

                      return (
                        <div key={`psd-car-${carIdx}`} className="absolute bottom-0 h-full w-[378px]" style={{ right: `${carOffset}px` }}>
                          {doorCoords.map((coord, dIdx) => {
                            // Scale down door offset coordinates (420px width of visual / 600px of viewBox)
                            const doorCenter = coord * (420 / 600);
                            const doorWidth = 22;

                            return (
                              <div 
                                key={`psd-door-${dIdx}`} 
                                className="absolute bottom-0 h-6 bg-slate-950 border-x border-slate-300/80 overflow-hidden"
                                style={{ 
                                  left: `${doorCenter - doorWidth/2}px`, 
                                  width: `${doorWidth}px` 
                                }}
                              >
                                {/* Left half panel sliding */}
                                <div 
                                  className="absolute inset-y-0 left-0 w-1/2 bg-slate-50 border-r border-cyan-400/80 transition-transform duration-1000 ease-in-out flex items-center justify-end pr-0.5"
                                  style={{ transform: isDoorsOpen ? 'translateX(-100%)' : 'translateX(0)' }}
                                >
                                  <span className="w-1 h-2 bg-cyan-200/50 rounded-2xs border border-slate-300"></span>
                                </div>
                                {/* Right half panel sliding */}
                                <div 
                                  className="absolute inset-y-0 right-0 w-1/2 bg-slate-50 border-l border-cyan-400/80 transition-transform duration-1000 ease-in-out flex items-center justify-start pl-0.5"
                                  style={{ transform: isDoorsOpen ? 'translateX(100%)' : 'translateX(0)' }}
                                >
                                  <span className="w-1 h-2 bg-cyan-200/50 rounded-2xs border border-slate-300"></span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Start Countdown Chime / Semaphore Banner Overlay */}
            {room.status === "countdown" && room.countdownSec !== undefined && room.countdownSec > 0 && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center font-mono z-20">
                <div className="text-[10px] text-emerald-400 tracking-widest uppercase mb-1">AUTOMATIC ATC INITIATING</div>
                <div className="text-4xl font-extrabold text-slate-100 animate-pulse tracking-tight">
                  信号変化まで あと {room.countdownSec} 秒
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  画面のマスコンハンドル［P4 / Wキー］に指をかけて発車待機！
                </div>
              </div>
            )}

            {/* Station stopped boarding indicator timer */}
            {boardingTimeLeft > 0 && (
              <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center font-mono z-20 p-4">
                <div className="w-full max-w-lg bg-slate-900 border-2 border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col items-center space-y-4">
                  
                  {/* Station JR-East style Signboard */}
                  <div className="w-full bg-white text-slate-900 border-t-8 border-emerald-600 rounded-lg p-2.5 shadow-md flex flex-col items-center select-none">
                    <div className="text-[10px] text-slate-400 tracking-wider font-sans font-bold">PLATFORM 1 / 1番線ホーム</div>
                    <div className="text-xl font-extrabold font-sans tracking-tight flex items-center gap-2 text-slate-800">
                      <span>🚉</span> {getLineConfig(activeLineRef.current, currentStationIdxRef.current).stationLabel}
                    </div>
                    <div className="text-[9px] text-slate-500 font-sans tracking-widest font-semibold mt-0.5 uppercase">
                      {getLineConfig(activeLineRef.current, currentStationIdxRef.current).stationEnglishLabel}
                    </div>
                  </div>

                  {/* Animated Door and Passenger Scene Panel */}
                  <div className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex flex-col justify-end p-2">
                    {/* Sky/Platform background */}
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-slate-900/60 flex items-center justify-between px-6 border-b border-slate-800/40">
                      <div className="text-[9px] text-slate-500 font-bold">● 乗車口 4号車</div>
                      <div className="text-[9px] text-slate-500 font-bold">LED案内板: 先発 各駅停車</div>
                    </div>

                    {/* Emojis of Passengers walking on platform */}
                    <div className="absolute inset-x-0 bottom-4 h-12 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
                      {/* Left-to-right boarding passengers */}
                      <motion.div 
                        initial={{ x: -180, opacity: 0 }}
                        animate={{ x: [ -180, -20, 0 ], opacity: [ 0, 1, 0 ] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                        className="absolute text-xl"
                      >
                        🏃‍♂️
                      </motion.div>
                      <motion.div 
                        initial={{ x: -140, opacity: 0 }}
                        animate={{ x: [ -140, -10, 0 ], opacity: [ 0, 1, 0 ] }}
                        transition={{ duration: 2.4, delay: 0.5, repeat: Infinity, ease: "linear" }}
                        className="absolute text-xl"
                      >
                        👨‍💼
                      </motion.div>
                      <motion.div 
                        initial={{ x: -200, opacity: 0 }}
                        animate={{ x: [ -200, -30, 0 ], opacity: [ 0, 1, 0 ] }}
                        transition={{ duration: 3.2, delay: 1.0, repeat: Infinity, ease: "linear" }}
                        className="absolute text-xl"
                      >
                        👩‍💼
                      </motion.div>

                      {/* Right-to-left boarding passengers */}
                      <motion.div 
                        initial={{ x: 180, opacity: 0 }}
                        animate={{ x: [ 180, 20, 0 ], opacity: [ 0, 1, 0 ] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
                        className="absolute text-xl"
                      >
                        🏃‍♀️
                      </motion.div>
                      <motion.div 
                        initial={{ x: 130, opacity: 0 }}
                        animate={{ x: [ 130, 10, 0 ], opacity: [ 0, 1, 0 ] }}
                        transition={{ duration: 2.3, delay: 0.6, repeat: Infinity, ease: "linear" }}
                        className="absolute text-xl"
                      >
                        🚶‍♂️
                      </motion.div>
                      <motion.div 
                        initial={{ x: 210, opacity: 0 }}
                        animate={{ x: [ 210, 30, 0 ], opacity: [ 0, 1, 0 ] }}
                        transition={{ duration: 3.0, delay: 1.2, repeat: Infinity, ease: "linear" }}
                        className="absolute text-xl"
                      >
                        👩‍⚕️
                      </motion.div>
                    </div>

                    {/* Train Wall and Sliding Doors */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-slate-800 border-t border-slate-700 z-20 flex justify-center overflow-hidden">
                      {/* Train line accent color bar */}
                      <div className={`absolute top-2 inset-x-0 h-3 flex ${
                        activeLineRef.current === 'yamanote' 
                          ? 'bg-emerald-500' 
                          : activeLineRef.current === 'chuo' 
                            ? 'bg-orange-500' 
                            : 'bg-gradient-to-r from-orange-500 to-green-600'
                      }`} />

                      {/* Sliding Doors Container */}
                      <div className="relative w-28 h-full bg-slate-900 border-x border-slate-700 flex">
                        {/* Inside Door Area */}
                        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                          <span className="text-sm">🚃</span>
                        </div>

                        {/* Left Door Leaf */}
                        <motion.div 
                          animate={{ 
                            x: boardingTimeLeft > 0.6 ? -45 : 0 
                          }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="absolute left-0 w-1/2 h-full bg-slate-600 border-r border-slate-500 shadow-inner flex items-center justify-end pr-1"
                        >
                          <div className="w-1 h-12 bg-yellow-400 rounded-sm" />
                        </motion.div>

                        {/* Right Door Leaf */}
                        <motion.div 
                          animate={{ 
                            x: boardingTimeLeft > 0.6 ? 45 : 0 
                          }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="absolute right-0 w-1/2 h-full bg-slate-600 border-l border-slate-500 shadow-inner flex items-center justify-start pl-1"
                        >
                          <div className="w-1 h-12 bg-yellow-400 rounded-sm" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Platform floor */}
                    <div className="w-full h-4 bg-slate-700 border-t-2 border-yellow-400 z-30" />
                  </div>

                  {/* Grading and Messages */}
                  <div className="text-center space-y-1">
                    <span className="text-sm text-emerald-400 font-bold block">{stationGrade}</span>
                    <span className="text-[11px] text-slate-300 block max-w-sm">{stationMsg}</span>
                  </div>

                  {/* Countdown Timer with Door Indicator */}
                  <div className="w-full space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400">🚪 {boardingTimeLeft > 0.6 ? "乗客乗降中 (ドア開放)" : "まもなくドアが閉まります"}</span>
                      <span className="text-emerald-400 animate-pulse">{boardingTimeLeft.toFixed(1)}s</span>
                    </div>
                    {/* Animated Progress Bar */}
                    <div className="w-full bg-slate-950 h-2.5 rounded-full border border-slate-800 overflow-hidden">
                      <motion.div 
                        initial={{ width: "100%" }}
                        animate={{ width: `${(boardingTimeLeft / 5.0) * 100}%` }}
                        transition={{ duration: 0.1, ease: "linear" }}
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full"
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Active derailment emergency overlay */}
            {renderStats.myDerailed && boardingTimeLeft === 0 && (
              <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center font-mono z-20 animate-pulse">
                <ShieldAlert className="w-12 h-12 text-red-500 animate-bounce mb-2" />
                <div className="text-lg font-bold text-red-200">🚨 脱線転覆事故 発生 🚨</div>
                <div className="text-xs text-red-400 mt-1 max-w-xs text-center leading-normal">
                  制限速度を過大に超過、もしくは赤信号通過により脱線。非常保線車両にて復旧中です...
                </div>
                <div className="font-bold text-sm text-slate-200 mt-3 bg-red-800/60 px-4 py-1 rounded-full">
                  復旧完了まで あと {renderStats.myDerailTimeLeft.toFixed(1)} 秒
                </div>
              </div>
            )}

            {/* ATC safety limit Warning alerts overlay */}
            {atcWarning && !renderStats.myDerailed && boardingTimeLeft === 0 && (
              <div className="absolute left-4 top-4 bg-amber-950/85 border border-amber-600/50 rounded-lg px-3 py-1.5 font-mono text-[10px] text-amber-300 z-10 animate-pulse flex items-center gap-2">
                <AlertIcon className="w-3.5 h-3.5 animate-bounce" />
                <span>{atcWarning}</span>
              </div>
            )}

            {/* Speed Boost notifier indicator */}
            {speedBoostActive && (
              <div className="absolute right-4 top-4 bg-emerald-950/85 border border-emerald-600/50 rounded-lg px-3 py-1 text-[10px] font-mono text-emerald-300 z-10 flex items-center gap-1.5 animate-pulse">
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>⚡️ 大磯停車ブースト（残: {Math.round(boostTimer)}s） x1.6 加速!</span>
              </div>
            )}

          </section>

          {/* ACTIVE CAB MASCON INTERACTIVE CONTROLLER PANEL */}
          <section className="mt-auto">
            <MasconController 
              currentNotch={renderStats.myMascon}
              setNotch={handleSetNotch}
              speed={renderStats.mySpeed}
              acceleration={
                renderStats.myDerailed 
                  ? 0 
                  : (renderStats.myMascon === "P4" ? 2.8 : renderStats.myMascon === "P3" ? 2.0 : renderStats.myMascon === "P2" ? 1.1 : renderStats.myMascon === "P1" ? 0.5 : renderStats.myMascon === "N" ? 0 : renderStats.myMascon === "B1" ? -1.6 : renderStats.myMascon === "B2" ? -3.5 : renderStats.myMascon === "B3" ? -5.8 : -9.2)
              }
              atcLimit={renderStats.atcLimit}
            />
          </section>
        </main>
      )}

      {/* --- SCREEN 4: GAME OVER / RACE COMPLETE PODIUM --- */}
      {activeScreen === "completed" && room && (
        <main className="flex-1 max-w-lg w-full mx-auto p-6 md:p-8 flex flex-col justify-center items-center my-auto text-slate-100">
          <div className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 text-center">
            
            <div className="space-y-2 border-b border-slate-800 pb-5">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto shadow-md shadow-amber-500/25">
                <Award className="w-10 h-10 text-slate-950 animate-bounce" />
              </div>
              <h2 className="text-2xl font-mono font-bold text-slate-100">
                タイムアタック 終了！
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                終端付近。走行区間を無事完走しました。
              </p>
            </div>

            {/* Race Summary Statistics and Solo Time Attack evaluations */}
            {(() => {
              const lineType = room?.line || "shonan";
              const cfg = getLineConfig(lineType, 4);
              const isCleared = renderStats.myFinishTime && (renderStats.myFinishTime <= cfg.quotaTime * 1000);
              
              return (
                <div className="space-y-4 bg-slate-950 border border-slate-800/80 rounded-xl p-5 text-left font-mono">
                  
                  {/* Status Banner */}
                  <div className="text-center py-3 rounded-lg border flex flex-col justify-center items-center gap-1 bg-slate-900 border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">クリア目標判定</span>
                    {isCleared ? (
                      <span className="text-xl font-bold font-sans text-emerald-400 animate-pulse flex items-center gap-1">
                        🏆 ノルマ達成 (STAGE CLEAR!)
                      </span>
                    ) : (
                      <span className="text-xl font-bold font-sans text-rose-500 animate-pulse flex items-center gap-1">
                        🚨 ノルマ未達成 (STAGE FAILED)
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-2 text-xs">
                    <h4 className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-850 pb-1">走行リザルト明細</h4>
                    
                    {/* Selected Line */}
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">乗務路線：</span>
                      <span className="font-bold text-slate-200">
                        {room.line === "yamanote" ? "山手線ダイヤ" : room.line === "chuo" ? "中央快速線ダイヤ" : "湘南新宿ラインダイヤ"}
                      </span>
                    </div>

                    {/* Final Finish Time */}
                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/50">
                      <span className="text-slate-400">運転タイム (補正後)：</span>
                      <span className={`font-black text-sm ${isCleared ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {renderStats.myFinishTime ? getLeaderboardTimeStr(renderStats.myFinishTime) : "記録なし"}
                      </span>
                    </div>

                    {/* Stage Quota Goal */}
                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/50">
                      <span className="text-slate-400">ノルマ設定：</span>
                      <span className="font-bold text-slate-200">
                        {cfg.quotaTime}.00 秒以内
                      </span>
                    </div>

                    {/* Violations Count */}
                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/50">
                      <span className="text-slate-400">速度制限超過ペナルティ：</span>
                      <span className={`font-bold ${mySpeedViolationsCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {mySpeedViolationsCount} 回 ({mySpeedViolationsCount * 5} 秒間強制停止)
                      </span>
                    </div>

                    {/* Station Stopped Paused Accrued Time */}
                    <div className="flex justify-between items-center py-0.5 border-t border-slate-900/50">
                      <span className="text-slate-400">途中駅客扱タイマー停止補正：</span>
                      <span className="font-bold text-amber-400">
                        -{(stationPausedAccumMs / 1000).toFixed(2)} 秒
                      </span>
                    </div>
                  </div>

                  {isCleared ? (
                    <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-lg text-[10.5px] text-emerald-300 text-center leading-relaxed">
                      🎉 おめでとうございます！過酷な速度超過ペナルティと駅制動を乗り越え、制限ノルマをクリアしました！
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-rose-950/20 border border-rose-900/50 rounded-lg text-[10.5px] text-rose-350 text-center leading-relaxed">
                      🏁 タイムアップ！速度制限を遵守し、途中駅でのエクセレント停車（15秒ブースト）を有効活用してタイム短縮を狙いましょう！
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Back action */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleLeaveRace}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <RotateCcw className="w-4 h-4" /> 
                競路乗務員ロビーへ戻る
              </button>
            </div>

          </div>
        </main>
      )}

      {/* Close 16:9 Aspect Ratio Arcade Console Frame Container */}
      </div>

      {/* FOOTER GENERAL INFO */}
      <footer className="bg-slate-950 py-3 border-t border-slate-900/60 px-6 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-600 font-mono z-10 w-full max-w-[1440px] mt-2 shrink-0">
        <span>© 2026 JR Shonan Sim Co. Ltd. • All Rights Reserved.</span>
        <span className="flex items-center gap-4 mt-2 md:mt-0">
          <span>サーバーポート: 3000 (Ingress)</span>
          <span>開発ビルド検証済み</span>
        </span>
      </footer>

    </div>
  );
}

// Simple fallback id generation if duplicates are detected
function idx(index: number, name: string): string {
  return `${index}_${name.substring(0, 31)}`;
}
