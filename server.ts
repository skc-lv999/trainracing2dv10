import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GameRoom, PlayerStats, TrackFeature, LeaderboardEntry } from "./src/types.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data store for live multiplayer rooms
const rooms: { [id: string]: GameRoom } = {};

// Leaderboard file path for persistence
const LEADERBOARD_FILE = path.join(process.cwd(), "leaderboard.json");

// Helper to load/save Leaderboard
function loadLeaderboard(): LeaderboardEntry[] {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = fs.readFileSync(LEADERBOARD_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load leaderboard:", error);
  }
  
  // Return seed records if no leaderboard exists
  return [
    { name: "湘南のスピードスター (Shonan Speedster)", time: 94500, date: new Date().toISOString(), isCpu: true },
    { name: "マスコン神 (Mascon God)", time: 102200, date: new Date().toISOString(), isCpu: true },
    { name: "特急ライナー一号 (Express Liner)", time: 115000, date: new Date().toISOString(), isCpu: true },
    { name: "鈍行マイペース (Slow Pace Local)", time: 148000, date: new Date().toISOString(), isCpu: true }
  ];
}

function saveLeaderboard(entries: LeaderboardEntry[]) {
  try {
    // Keep only top 100 entries sorted by time ascending
    const sorted = [...entries].sort((a, b) => a.time - b.time).slice(0, 100);
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(sorted, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save leaderboard:", error);
  }
}

// Generate deterministic track features
function generateTrackFeatures(line: "yamanote" | "chuo" | "shonan" | "yokosuka" | "sobukanko" | "keiyo"): TrackFeature[] {
  if (line === "yamanote") {
    return [
      {
        id: "limit_1",
        type: "speed_limit",
        position: 800,
        length: 500,
        value: 60,
        label: "急カーブ制限 (Sharp Curve)",
      },
      {
        id: "signal_1",
        type: "signal",
        position: 1800,
        length: 10,
        value: 0,
        label: "第一閉塞信号機 (First Block Signal)",
      },
      {
        id: "limit_2",
        type: "speed_limit",
        position: 3300,
        length: 600,
        value: 70,
        label: "渋谷手前カーブ (Shibuya Curve)",
      },
      {
        id: "signal_2",
        type: "signal",
        position: 4300,
        length: 10,
        value: 0,
        label: "第二閉塞信号機 (Second Block Signal)",
      },
      {
        id: "limit_3",
        type: "speed_limit",
        position: 5800,
        length: 600,
        value: 65,
        label: "原宿手前カーブ (Harajuku Curve)",
      },
      {
        id: "signal_3",
        type: "signal",
        position: 6800,
        length: 10,
        value: 0,
        label: "第三閉塞信号機 (Third Block Signal)",
      },
      {
        id: "limit_4",
        type: "speed_limit",
        position: 8300,
        length: 600,
        value: 75,
        label: "代々木カーブ (Yoyogi Curve)",
      },
      {
        id: "signal_4",
        type: "signal",
        position: 9300,
        length: 10,
        value: 0,
        label: "第四閉塞信号機 (Fourth Block Signal)",
      },
      {
        id: "limit_5",
        type: "speed_limit",
        position: 10800,
        length: 600,
        value: 80,
        label: "新宿進入前カーブ (Shinjuku Curve)",
      },
      {
        id: "signal_5",
        type: "signal",
        position: 11800,
        length: 10,
        value: 0,
        label: "第五閉塞信号機 (Fifth Block Signal)",
      }
    ];
  } else if (line === "chuo") {
    return [
      {
        id: "limit_1",
        type: "speed_limit",
        position: 1000,
        length: 800,
        value: 95,
        label: "高架直線制限 (Straight Speed Limit)",
      },
      {
        id: "signal_1",
        type: "signal",
        position: 2200,
        length: 10,
        value: 0,
        label: "第一閉塞信号機 (First Block Signal)",
      },
      {
        id: "limit_2",
        type: "speed_limit",
        position: 4200,
        length: 1000,
        value: 85,
        label: "多摩川鉄橋制限 (Tama River Bridge)",
      },
      {
        id: "signal_2",
        type: "signal",
        position: 5700,
        length: 10,
        value: 0,
        label: "第二閉塞信号機 (Second Block Signal)",
      },
      {
        id: "limit_3",
        type: "speed_limit",
        position: 7700,
        length: 1000,
        value: 90,
        label: "西荻カーブ (Nishi-Ogikubo Curve)",
      },
      {
        id: "signal_3",
        type: "signal",
        position: 9200,
        length: 10,
        value: 0,
        label: "第三閉塞信号機 (Third Block Signal)",
      },
      {
        id: "limit_4",
        type: "speed_limit",
        position: 11200,
        length: 1000,
        value: 80,
        label: "荻窪進入前カーブ (Ogikubo Curve)",
      },
      {
        id: "signal_4",
        type: "signal",
        position: 12700,
        length: 10,
        value: 0,
        label: "第四閉塞信号機 (Fourth Block Signal)",
      },
      {
        id: "limit_5",
        type: "speed_limit",
        position: 14700,
        length: 1000,
        value: 95,
        label: "中野鉄橋制限 (Nakano Bridge)",
      },
      {
        id: "signal_5",
        type: "signal",
        position: 16200,
        length: 10,
        value: 0,
        label: "第五閉塞信号機 (Fifth Block Signal)",
      }
    ];
  } else if (line === "yokosuka") {
    return [
      {
        id: "limit_1",
        type: "speed_limit",
        position: 1200,
        length: 1000,
        value: 85,
        label: "多摩川橋梁制限 (Tama River Bridge Limit)",
      },
      {
        id: "signal_1",
        type: "signal",
        position: 2700,
        length: 10,
        value: 0,
        label: "第一閉塞信号機 (First Block Signal)",
      },
      {
        id: "limit_2",
        type: "speed_limit",
        position: 4700,
        length: 1200,
        value: 95,
        label: "鶴見カーブ制限 (Tsurumi Curve Limit)",
      },
      {
        id: "signal_2",
        type: "signal",
        position: 6500,
        length: 10,
        value: 0,
        label: "第二閉塞信号機 (Second Block Signal)",
      },
      {
        id: "limit_3",
        type: "speed_limit",
        position: 8700,
        length: 1200,
        value: 90,
        label: "保土ヶ谷カーブ制限 (Hodogaya Curve Limit)",
      },
      {
        id: "signal_3",
        type: "signal",
        position: 10500,
        length: 10,
        value: 0,
        label: "第三閉塞信号機 (Third Block Signal)",
      },
      {
        id: "limit_4",
        type: "speed_limit",
        position: 12700,
        length: 1200,
        value: 75,
        label: "戸塚手前急カーブ制限 (Totsuka Curve Limit)",
      },
      {
        id: "signal_4",
        type: "signal",
        position: 14500,
        length: 10,
        value: 0,
        label: "第四閉塞信号機 (Fourth Block Signal)",
      },
      {
        id: "limit_5",
        type: "speed_limit",
        position: 16700,
        length: 1200,
        value: 80,
        label: "北鎌倉山間部制限 (Kita-Kamakura Valley Limit)",
      },
      {
        id: "signal_5",
        type: "signal",
        position: 18500,
        length: 10,
        value: 0,
        label: "第五閉塞信号機 (Fifth Block Signal)",
      }
    ];
  } else if (line === "sobukanko") {
    return [
      {
        id: "limit_1",
        type: "speed_limit",
        position: 800,
        length: 500,
        value: 65,
        label: "隅田川橋梁制限 (Sumida River Bridge Limit)",
      },
      {
        id: "signal_1",
        type: "signal",
        position: 1800,
        length: 10,
        value: 0,
        label: "第一閉塞信号機 (First Block Signal)",
      },
      {
        id: "limit_2",
        type: "speed_limit",
        position: 3300,
        length: 600,
        value: 75,
        label: "亀戸急カーブ制限 (Kameido Curve Limit)",
      },
      {
        id: "signal_2",
        type: "signal",
        position: 4300,
        length: 10,
        value: 0,
        label: "第二閉塞信号機 (Second Block Signal)",
      },
      {
        id: "limit_3",
        type: "speed_limit",
        position: 5800,
        length: 600,
        value: 70,
        label: "荒川鉄橋前カーブ制限 (Arakawa Curve Limit)",
      },
      {
        id: "signal_3",
        type: "signal",
        position: 6800,
        length: 10,
        value: 0,
        label: "第三閉塞信号機 (Third Block Signal)",
      },
      {
        id: "limit_4",
        type: "speed_limit",
        position: 8300,
        length: 600,
        value: 80,
        label: "平井直線速度制限 (Hirai Straight Limit)",
      },
      {
        id: "signal_4",
        type: "signal",
        position: 9300,
        length: 10,
        value: 0,
        label: "第四閉塞信号機 (Fourth Block Signal)",
      },
      {
        id: "limit_5",
        type: "speed_limit",
        position: 10800,
        length: 600,
        value: 85,
        label: "新小岩手前カーブ制限 (Shin-Koiwa Curve Limit)",
      },
      {
        id: "signal_5",
        type: "signal",
        position: 11800,
        length: 10,
        value: 0,
        label: "第五閉塞信号機 (Fifth Block Signal)",
      }
    ];
  } else if (line === "keiyo") {
    return [
      {
        id: "limit_1",
        type: "speed_limit",
        position: 1000,
        length: 800,
        value: 90,
        label: "地下区間進出制限 (Underground Exit Limit)",
      },
      {
        id: "signal_1",
        type: "signal",
        position: 2200,
        length: 10,
        value: 0,
        label: "第一閉塞信号機 (First Block Signal)",
      },
      {
        id: "limit_2",
        type: "speed_limit",
        position: 4200,
        length: 1000,
        value: 100,
        label: "高架高速度直線制限 (High Speed Viaduct)",
      },
      {
        id: "signal_2",
        type: "signal",
        position: 5700,
        length: 10,
        value: 0,
        label: "第二閉塞信号機 (Second Block Signal)",
      },
      {
        id: "limit_3",
        type: "speed_limit",
        position: 7700,
        length: 1000,
        value: 95,
        label: "運河鉄橋制限 (Canal Bridge Limit)",
      },
      {
        id: "signal_3",
        type: "signal",
        position: 9200,
        length: 10,
        value: 0,
        label: "第三閉塞信号機 (Third Block Signal)",
      },
      {
        id: "limit_4",
        type: "speed_limit",
        position: 11200,
        length: 1000,
        value: 85,
        label: "ディズニーリゾート近隣湾曲制限 (Disneyland Curve)",
      },
      {
        id: "signal_4",
        type: "signal",
        position: 12700,
        length: 10,
        value: 0,
        label: "第四閉塞信号機 (Fourth Block Signal)",
      },
      {
        id: "limit_5",
        type: "speed_limit",
        position: 14700,
        length: 1000,
        value: 100,
        label: "舞浜進入前直線制限 (Maihama Straight Limit)",
      },
      {
        id: "signal_5",
        type: "signal",
        position: 16200,
        length: 10,
        value: 0,
        label: "第五閉塞信号機 (Fifth Block Signal)",
      }
    ];
  } else {
    // shonan (default)
    return [
      {
        id: "limit_1",
        type: "speed_limit",
        position: 1200,
        length: 1000,
        value: 80,
        label: "急カーブ制限 (Sharp Curve)",
      },
      {
        id: "signal_1",
        type: "signal",
        position: 2700,
        length: 10,
        value: 0,
        label: "第一閉塞信号機 (First Block Signal)",
      },
      {
        id: "limit_2",
        type: "speed_limit",
        position: 4700,
        length: 1200,
        value: 70,
        label: "相模川鉄橋 (Sagami River Bridge)",
      },
      {
        id: "signal_2",
        type: "signal",
        position: 6500,
        length: 10,
        value: 0,
        label: "第二閉塞信号機 (Second Block Signal)",
      },
      {
        id: "limit_3",
        type: "speed_limit",
        position: 8700,
        length: 1200,
        value: 90,
        label: "茅ヶ崎カーブ (Chigasaki Curve)",
      },
      {
        id: "signal_3",
        type: "signal",
        position: 10500,
        length: 10,
        value: 0,
        label: "第三閉塞信号機 (Third Block Signal)",
      },
      {
        id: "limit_4",
        type: "speed_limit",
        position: 12700,
        length: 1200,
        value: 75,
        label: "藤沢急カーブ (Fujisawa Curve)",
      },
      {
        id: "signal_4",
        type: "signal",
        position: 14500,
        length: 10,
        value: 0,
        label: "第四閉塞信号機 (Fourth Block Signal)",
      },
      {
        id: "limit_5",
        type: "speed_limit",
        position: 16700,
        length: 1200,
        value: 85,
        label: "鎌倉カーブ (Kamakura Curve)",
      },
      {
        id: "signal_5",
        type: "signal",
        position: 18500,
        length: 10,
        value: 0,
        label: "第五閉塞信号機 (Fifth Block Signal)",
      }
    ];
  }
}

// API: Get leaderboard entries
app.get("/api/leaderboard", (req, res) => {
  const list = loadLeaderboard();
  res.json(list);
});

// API: Submit leaderboard entry
app.post("/api/leaderboard", (req, res) => {
  const { name, time, isCpu } = req.body;
  if (!name || typeof time !== "number" || time <= 0) {
    res.status(400).json({ error: "Invalid name or time" });
    return;
  }
  const current = loadLeaderboard();
  current.push({
    name: name.substring(0, 30),
    time,
    date: new Date().toISOString(),
    isCpu: !!isCpu
  });
  saveLeaderboard(current);
  res.json({ success: true, leaderboard: loadLeaderboard().slice(0, 10) });
});

// API: Find or create multiplayer room
app.post("/api/matchmaking/join", (req, res) => {
  const { name, line } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "Player name is required" });
    return;
  }

  const requestedLine: "yamanote" | "chuo" | "shonan" | "yokosuka" | "sobukanko" | "keiyo" = (line === "yamanote" || line === "chuo" || line === "shonan" || line === "yokosuka" || line === "sobukanko" || line === "keiyo") ? line : "shonan";
  const trackLength = requestedLine === "yamanote" ? 13000 : requestedLine === "chuo" ? 18000 : requestedLine === "sobukanko" ? 13500 : requestedLine === "keiyo" ? 18000 : 21000;

  const playerId = "p_" + Math.random().toString(36).substring(2, 9);
  const formattedName = name.substring(0, 16);

  // Clean stale rooms (active check / timeouts)
  const now = Date.now();
  Object.keys(rooms).forEach((id) => {
    const room = rooms[id];
    // Delete rooms inactive for more than 10 minutes OR completed rooms older than 5 minutes
    const isCompletedStale = room.status === "completed" && room.startTime && (now - room.startTime > 300000);
    const hasStalePlayers = Object.values(room.players).length === 0;
    if (isCompletedStale || hasStalePlayers) {
      delete rooms[id];
    }
  });

  // For Solo Time Attack flow: always create a new private room that starts countdown immediately!
  const roomId = "room_" + Math.random().toString(36).substring(2, 9);
  const targetRoom: GameRoom = {
    id: roomId,
    status: "countdown",
    startTime: Date.now() + 4000,
    countdownSec: 4,
    players: {},
    trackFeatures: generateTrackFeatures(requestedLine),
    trackLength: trackLength,
    line: requestedLine,
  };
  rooms[roomId] = targetRoom;

  const initialPlayerStats: PlayerStats = {
    id: playerId,
    name: formattedName,
    position: 0,
    speed: 0,
    mascon: "N",
    overheat: 0,
    derailed: false,
    derailTimeLeft: 0,
    finished: false,
  };

  targetRoom.players[playerId] = initialPlayerStats;

  res.json({
    playerId,
    roomId: targetRoom.id,
    players: targetRoom.players,
    status: targetRoom.status,
    startTime: targetRoom.startTime,
    trackFeatures: targetRoom.trackFeatures,
  });
});

// API: Set room start time (useful for dynamic countdown coordination)
app.post("/api/rooms/:roomId/start", (req, res) => {
  const { roomId } = req.params;
  const { startTime } = req.body;
  const room = rooms[roomId];

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  room.status = "countdown";
  room.startTime = startTime;
  room.countdownSec = Math.ceil((startTime - Date.now()) / 1000);

  res.json(room);
});

// API: Force room to match against CPU
app.post("/api/rooms/:roomId/cpu", (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  if (room.status !== "waiting") {
    res.status(400).json({ error: "Room is already filled or started" });
    return;
  }

  // Set CPU name based on current room line
  let cpuName = "AI特急ライナー (CPU Driver)";
  if (room.line === "yamanote") {
    cpuName = "山手クイックライナ (CPU Driver)";
  } else if (room.line === "chuo") {
    cpuName = "中央特快クイック (CPU Driver)";
  } else if (room.line === "yokosuka") {
    cpuName = "スカ色爆走快速 (CPU Driver)";
  } else if (room.line === "sobukanko") {
    cpuName = "イエロー各駅停車 (CPU Driver)";
  } else if (room.line === "keiyo") {
    cpuName = "京葉快速赤い彗星 (CPU Driver)";
  }

  const cpuId = "cpu_" + Math.random().toString(36).substring(2, 9);
  const cpuStats: PlayerStats = {
    id: cpuId,
    name: cpuName,
    position: 0,
    speed: 0,
    mascon: "N",
    overheat: 0,
    derailed: false,
    derailTimeLeft: 0,
    finished: false,
  };

  room.players[cpuId] = cpuStats;
  room.status = "countdown";
  room.startTime = Date.now() + 4000;
  room.countdownSec = 4;

  res.json(room);
});

// API: Sync and poll room stats
app.post("/api/rooms/:roomId/sync", (req, res) => {
  const { roomId } = req.params;
  const { playerId, stats, cpuStats } = req.body;
  const room = rooms[roomId];

  if (!room) {
    res.json({ expired: true });
    return;
  }

  const now = Date.now();

  // Handle countdown calculations on serve
  if (room.status === "countdown" && room.startTime) {
    const diff = room.startTime - now;
    if (diff <= 0) {
      room.status = "racing";
      room.countdownSec = 0;
    } else {
      room.countdownSec = Math.ceil(diff / 1000);
    }
  }

  // Update sending player
  if (playerId && room.players[playerId] && stats) {
    room.players[playerId] = {
      ...room.players[playerId],
      position: stats.position,
      speed: stats.speed,
      mascon: stats.mascon,
      overheat: stats.overheat,
      derailed: stats.derailed,
      derailTimeLeft: stats.derailTimeLeft,
      finished: stats.finished,
      finishTime: stats.finishTime,
    };

    // If finished, check if we need to set winner
    if (stats.finished && !room.winnerId) {
      room.winnerId = playerId;
    }
  }

  // Update CPU player stats if provided
  if (cpuStats && room.players[cpuStats.id]) {
    room.players[cpuStats.id] = {
      ...room.players[cpuStats.id],
      position: cpuStats.position,
      speed: cpuStats.speed,
      mascon: cpuStats.mascon,
      overheat: cpuStats.overheat || 0,
      derailed: cpuStats.derailed,
      derailTimeLeft: cpuStats.derailTimeLeft || 0,
      finished: cpuStats.finished,
      finishTime: cpuStats.finishTime,
    };
  }

  // Check game completion status
  const pList = Object.values(room.players);
  const allFinished = pList.length > 0 && pList.every((p) => p.finished);
  if (allFinished && room.status === "racing") {
    room.status = "completed";
  }

  res.json(room);
});

// API: Leave matchmaking/close lobby
app.post("/api/rooms/:roomId/leave", (req, res) => {
  const { roomId } = req.params;
  const { playerId } = req.body;
  const room = rooms[roomId];

  if (room && playerId) {
    delete room.players[playerId];
    if (Object.keys(room.players).length === 0) {
      delete rooms[roomId];
    } else if (room.status === "countdown" || room.status === "racing") {
      // If one leaves mid-race, set room status appropriately
      room.status = "completed";
      const remainingIds = Object.keys(room.players);
      if (remainingIds.length > 0) {
        room.winnerId = remainingIds[0];
        room.players[remainingIds[0]].finished = true;
      }
    }
  }
  res.json({ success: true });
});

async function startServer() {
  // Vite integration in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
