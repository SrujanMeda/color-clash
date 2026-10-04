import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { DIFFICULTIES, randomColor, sanitizeHsb, scoreGuess } from './colors.js';

const PORT = process.env.PORT || 3001;
const RESULT_MS = 7000;
const DEFAULT_SETTINGS = { rounds: 5, memorizeSec: 5, guessSec: 20, difficulty: 'medium' };
const LIMITS = { rounds: [1, 10], memorizeSec: [2, 15], guessSec: [10, 60] };
const MAX_PLAYERS = 12;
const DEFAULT_GUESS = { h: 180, s: 50, b: 50 };

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'Client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

/** @type {Map<string, any>} */
const rooms = new Map();

function makeCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function cleanName(name) {
  const n = String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, 16);
  return n || 'Player';
}

const clampInt = (v, [min, max]) => Math.min(max, Math.max(min, Math.round(Number(v)) || min));

function applySettings(room, patch) {
  const s = room.settings;
  for (const key of Object.keys(LIMITS)) {
    if (patch[key] !== undefined) s[key] = clampInt(patch[key], LIMITS[key]);
  }
  if (typeof patch.difficulty === 'string' && Object.hasOwn(DIFFICULTIES, patch.difficulty)) {
    s.difficulty = patch.difficulty;
  }
  if (Array.isArray(patch.customColors)) {
    s.customColors = patch.customColors.map(sanitizeHsb).map((c) => ({
      h: Math.round(c.h),
      s: Math.round(c.s),
      b: Math.round(c.b),
    }));
  }
  s.customColors = s.customColors.slice(0, s.rounds);
}

function viewFor(room, playerId) {
  const showTarget = room.phase === 'memorize' || room.phase === 'result';
  const showResults = room.phase === 'result';
  return {
    you: playerId,
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    round: Math.min(room.round + 1, room.settings.rounds),
    totalRounds: room.settings.rounds,
    settings: room.settings,
    remainingMs: Math.max(0, room.endsAt - Date.now()),
    target: showTarget ? room.targets[room.round] : null,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      locked: p.locked,
      guess: showResults ? p.guess : undefined,
      roundScore: showResults ? p.roundScore : undefined,
    })),
  };
}

function broadcast(room) {
  for (const id of room.players.keys()) {
    io.to(id).emit('state', viewFor(room, id));
  }
}

function setPhase(room, phase, ms, onEnd) {
  clearTimeout(room.timer);
  room.phase = phase;
  room.endsAt = ms ? Date.now() + ms : 0;
  broadcast(room);
  room.timer = ms ? setTimeout(onEnd, ms) : null;
}

function startRound(room) {
  for (const p of room.players.values()) {
    p.guess = { ...DEFAULT_GUESS };
    p.locked = false;
    p.roundScore = 0;
  }
  setPhase(room, 'memorize', room.settings.memorizeSec * 1000, () => startGuess(room));
}

function startGuess(room) {
  setPhase(room, 'guess', room.settings.guessSec * 1000, () => endGuess(room));
}

function endGuess(room) {
  const target = room.targets[room.round];
  for (const p of room.players.values()) {
    p.roundScore = scoreGuess(target, p.guess, room.settings.difficulty);
    p.score = Math.round((p.score + p.roundScore) * 10) / 10;
  }
  setPhase(room, 'result', RESULT_MS, () => nextRound(room));
}

function nextRound(room) {
  room.round += 1;
  if (room.round >= room.settings.rounds) {
    setPhase(room, 'final', 0);
  } else {
    startRound(room);
  }
}

function startGame(room) {
  room.round = 0;
  const { rounds, difficulty, customColors } = room.settings;
  room.targets = Array.from({ length: rounds }, (_, i) => customColors[i] ?? randomColor(difficulty));
  for (const p of room.players.values()) p.score = 0;
  startRound(room);
}

function resetToLobby(room) {
  clearTimeout(room.timer);
  room.round = 0;
  room.targets = [];
  for (const p of room.players.values()) {
    p.score = 0;
    p.locked = false;
    p.roundScore = 0;
  }
  setPhase(room, 'lobby', 0);
}

function removePlayer(socket) {
  const code = socket.data.roomCode;
  if (!code) return;
  socket.data.roomCode = null;
  socket.leave(code);
  const room = rooms.get(code);
  if (!room) return;
  room.players.delete(socket.id);
  if (room.players.size === 0) {
    clearTimeout(room.timer);
    rooms.delete(code);
    return;
  }
  if (room.hostId === socket.id) room.hostId = room.players.keys().next().value;
  if (room.phase === 'guess' && allLocked(room)) {
    endGuess(room);
  } else {
    broadcast(room);
  }
}

function allLocked(room) {
  return [...room.players.values()].every((p) => p.locked);
}

function joinRoom(socket, room, name) {
  room.players.set(socket.id, {
    id: socket.id,
    name: cleanName(name),
    score: 0,
    guess: { ...DEFAULT_GUESS },
    locked: false,
    roundScore: 0,
  });
  socket.data.roomCode = room.code;
  socket.join(room.code);
}

io.on('connection', (socket) => {
  socket.on('room:create', ({ name } = {}, cb) => {
    removePlayer(socket);
    const room = {
      code: makeCode(),
      hostId: socket.id,
      players: new Map(),
      settings: { ...DEFAULT_SETTINGS, customColors: [] },
      phase: 'lobby',
      round: 0,
      targets: [],
      endsAt: 0,
      timer: null,
    };
    rooms.set(room.code, room);
    joinRoom(socket, room, name);
    broadcast(room);
    cb?.({ ok: true, code: room.code });
  });

  socket.on('room:join', ({ name, code } = {}, cb) => {
    const room = rooms.get(String(code ?? '').trim().toUpperCase());
    if (!room) return cb?.({ ok: false, error: 'Room not found' });
    if (room.phase !== 'lobby') return cb?.({ ok: false, error: 'Game already in progress' });
    if (room.players.size >= MAX_PLAYERS) return cb?.({ ok: false, error: 'Room is full' });
    removePlayer(socket);
    joinRoom(socket, room, name);
    broadcast(room);
    cb?.({ ok: true, code: room.code });
  });

  socket.on('room:leave', () => removePlayer(socket));

  socket.on('game:start', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;
    startGame(room);
  });

  socket.on('settings:update', (patch = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;
    applySettings(room, patch);
    broadcast(room);
  });

  socket.on('player:kick', ({ id } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || id === socket.id || !room.players.has(id)) return;
    const target = io.sockets.sockets.get(id);
    if (!target) return;
    target.emit('kicked');
    removePlayer(target);
  });

  socket.on('player:promote', ({ id } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || !room.players.has(id)) return;
    room.hostId = id;
    broadcast(room);
  });

  socket.on('game:end', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase === 'lobby') return;
    resetToLobby(room);
  });

  socket.on('game:restart', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'final') return;
    resetToLobby(room);
  });

  socket.on('guess:update', ({ color, lock } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    const player = room?.players.get(socket.id);
    if (!player || room.phase !== 'guess' || player.locked) return;
    player.guess = sanitizeHsb(color);
    if (lock) {
      player.locked = true;
      if (allLocked(room)) return endGuess(room);
      broadcast(room);
    }
  });

  socket.on('disconnect', () => removePlayer(socket));
});

server.listen(PORT, () => console.log(`Color Clash server listening on :${PORT}`));
