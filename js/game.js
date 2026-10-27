const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const C = { x: 400, y: 300, ro: [350, 250], ri: [190, 110] }; // piste : ellipse ext. / int.
const LAPS = 3;
const keys = {};
let state = 'idle', player, ais, startAt, raceStart, progress, lastSector, finalTime = 0;
let driftT = 0, boostT = 0, item = null, coins = 0, boxes = [], coinList = [], slowUntil = 0;

addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function onTrack(x, y) {
  const o = ((x - C.x) / C.ro[0]) ** 2 + ((y - C.y) / C.ro[1]) ** 2;
  const i = ((x - C.x) / C.ri[0]) ** 2 + ((y - C.y) / C.ri[1]) ** 2;
  return o <= 1 && i >= 1;
}

function sectorOf(x, y) {
  const ang = (Math.atan2(y - C.y, x - C.x) + 2 * Math.PI) % (2 * Math.PI);
  return Math.floor(ang / (Math.PI / 2)); // 0..3
}

function reset() {
  player = { x: C.x + 270, y: C.y, a: Math.PI / 2, v: 0, color: '#ffc107' };
  ais = [0, 1, 2].map(i => ({
    t: -0.06 * (i + 1), speed: 0.015 + i * 0.001,
    color: ['#dc3545', '#0d6efd', '#20c997'][i], done: false
  }));
    coins = 0; item = null; boostT = 0; driftT = 0; slowUntil = 0;
  boxes = [0.8, 2.4, 3.9, 5.4].map(a => ({ a, until: 0 }));
  coinList = Array.from({ length: 16 }, (_, i) => ({ a: i * Math.PI / 8 + 0.2, got: false }));
  progress = 0; lastSector = 0;
}

function readInput() {
  let accel = (keys['arrowup'] || keys['w']) ? 1 : 0;
  let brake = (keys['arrowdown'] || keys['s']) ? 1 : 0;
  let steer = ((keys['arrowright'] || keys['d']) ? 1 : 0) - ((keys['arrowleft'] || keys['a']) ? 1 : 0);
  let drift = !!keys[' '] || !!keys['shift'];
  let useItem = !!keys['e'] || !!keys['x'];

  const gp = [...navigator.getGamepads()].find(g => g);
  if (gp) {
    const dz = v => (Math.abs(v) > 0.15 ? v : 0);
    const stick = dz(gp.axes[0]);
    const pad = (gp.buttons[15]?.pressed ? 1 : 0) - (gp.buttons[14]?.pressed ? 1 : 0);
    if (stick || pad) steer = stick || pad;
    accel = Math.max(accel, gp.buttons[7]?.value || 0, gp.buttons[0]?.pressed ? 1 : 0); // RT ou A
    brake = Math.max(brake, gp.buttons[6]?.value || 0, gp.buttons[1]?.pressed ? 1 : 0); // LT ou B
    drift = drift || !!gp.buttons[5]?.pressed || !!gp.buttons[4]?.pressed;              // RB ou LB
    useItem = useItem || !!gp.buttons[2]?.pressed;                                     // X
  }
  return { accel, brake, steer, drift, useItem };
}

function drive() {
  const p = player, inp = readInput(), now = performance.now();
  const base = onTrack(p.x, p.y) ? 5 + coins * 0.1 : 2;
  const max = boostT > 0 ? 8 : base;

  p.v += inp.accel * 0.15 - inp.brake * 0.1;
  if (boostT > 0) p.v += 0.3;
  p.v *= 0.99;
  if (p.v > max) p.v = Math.max(max, p.v - 0.2);
  p.v = Math.max(-2, p.v);

  // Dérapage : tourner + maintenir le bouton ; relâcher après ~1 s = mini-turbo
  const drifting = inp.drift && p.v > 3 && inp.steer !== 0;
  if (Math.abs(p.v) > 0.2) p.a += inp.steer * (drifting ? 0.075 : 0.05) * Math.sign(p.v);
  if (drifting) driftT++;
  else { if (driftT > 60) boostT = 60; driftT = 0; }
  if (boostT > 0) boostT--;

  p.x = Math.max(0, Math.min(800, p.x + Math.cos(p.a) * p.v));
  p.y = Math.max(0, Math.min(600, p.y + Math.sin(p.a) * p.v));

  // Boîtes à objets
  boxes.forEach(b => {
    const bx = C.x + 270 * Math.cos(b.a), by = C.y + 180 * Math.sin(b.a);
    if (now > b.until && !item && Math.hypot(p.x - bx, p.y - by) < 28) {
      item = currentPosition() > 2 ? 'slow' : 'turbo';
      b.until = now + 3000;
    }
  });
  if (inp.useItem && item) {
    if (item === 'turbo') boostT = 90;
    if (item === 'slow') slowUntil = now + 3000;
    item = null;
  }

  // Pièces
  coinList.forEach(c => {
    const cx = C.x + 270 * Math.cos(c.a), cy = C.y + 180 * Math.sin(c.a);
    if (!c.got && Math.hypot(p.x - cx, p.y - cy) < 20) { c.got = true; coins = Math.min(10, coins + 1); }
  });

  // Comptage des tours
  const s = sectorOf(p.x, p.y);
  const d = (s - lastSector + 4) % 4;
  if (d === 1) progress++; else if (d === 3) progress--;
  lastSector = s;
  if (progress >= 4 * LAPS) finish();
}

function currentPosition() {
  return 1 + ais.filter(ai => ai.t / (Math.PI / 2) > progress).length;
}

function finish() {
  state = 'finished';
  finalTime = (performance.now() - raceStart) / 1000;
  document.getElementById('pos').textContent = 1 + ais.filter(a => a.done).length;
  submitScore(finalTime);
}

function update() {
  if (state === 'countdown' && performance.now() - startAt > 3000) {
    state = 'racing'; raceStart = performance.now();
  }
  if (state !== 'racing') return;
  drive();
  ais.forEach(ai => {
    if (ai.done) return;
       ai.t += ai.speed * (performance.now() < slowUntil ? 0.4 : 1);
    if (ai.t >= 2 * Math.PI * LAPS) ai.done = true;
  });
  document.getElementById('lap').textContent = Math.min(LAPS, Math.floor(Math.max(progress, 0) / 4) + 1);
  document.getElementById('time').textContent = ((performance.now() - raceStart) / 1000).toFixed(2);
  document.getElementById('pos').textContent = currentPosition();
}

function ellipse(r) {
  ctx.beginPath();
  ctx.ellipse(C.x, C.y, r[0], r[1], 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawKart(x, y, a, color) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = '#111'; ctx.fillRect(-14, -12, 10, 5); ctx.fillRect(-14, 7, 10, 5);
  ctx.fillRect(6, -12, 10, 5); ctx.fillRect(6, 7, 10, 5);
  ctx.fillStyle = color; ctx.fillRect(-14, -8, 28, 16);
  ctx.fillStyle = '#fff'; ctx.fillRect(4, -4, 6, 8);
  ctx.restore();
}

function draw() {
  ctx.fillStyle = '#2e7d32'; ctx.fillRect(0, 0, 800, 600);
  ctx.fillStyle = '#555'; ellipse(C.ro);
  ctx.fillStyle = '#2e7d32'; ellipse(C.ri);

  ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.setLineDash([8, 8]);
  ctx.beginPath(); ctx.moveTo(C.x + C.ri[0], C.y); ctx.lineTo(C.x + C.ro[0], C.y); ctx.stroke();
  ctx.setLineDash([]);

  drawObjects();
  ais.forEach(ai => {
    const x = C.x + 270 * Math.cos(ai.t), y = C.y + 180 * Math.sin(ai.t);
    drawKart(x, y, Math.atan2(180 * Math.cos(ai.t), -270 * Math.sin(ai.t)), ai.color);
  });
  drawKart(player.x, player.y, player.a, player.color);

  ctx.fillStyle = '#fff'; ctx.font = 'bold 72px sans-serif'; ctx.textAlign = 'center';
  if (state === 'countdown') {
    ctx.fillText(Math.ceil(3 - (performance.now() - startAt) / 1000), 400, 320);
  } else if (state === 'racing' && performance.now() - raceStart < 700) {
    ctx.fillText('GO !', 400, 320);
  } else if (state === 'finished') {
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('Arrivée ! ' + finalTime.toFixed(2) + ' s', 400, 320);
    drawHud();
  }
}

function drawObjects() {
  const now = performance.now();
  boxes.forEach(b => {
    if (now < b.until) return;
    const x = C.x + 270 * Math.cos(b.a), y = C.y + 180 * Math.sin(b.a);
    ctx.fillStyle = '#6f42c1'; ctx.fillRect(x - 12, y - 12, 24, 24);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('?', x, y + 6);
  });
  coinList.forEach(c => {
    if (c.got) return;
    ctx.fillStyle = '#ffd43b';
    ctx.beginPath(); ctx.arc(C.x + 270 * Math.cos(c.a), C.y + 180 * Math.sin(c.a), 7, 0, 7); ctx.fill();
  });
}

function drawHud() {
  ctx.textAlign = 'left'; ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#fff';
  ctx.fillText('🪙 ' + coins + '/10', 15, 30);
  ctx.fillText('Objet : ' + (item === 'turbo' ? '🚀 Turbo' : item === 'slow' ? '🐌 Ralentisseur' : '-'), 15, 58);
  if (boostT > 0) ctx.fillText('🔥 TURBO !', 15, 86);
  else if (driftT > 60) ctx.fillText('✨ Mini-turbo prêt (relâche)', 15, 86);
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

// --- Scores (PHP) ---
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function loadBoard() {
  try {
    const rows = await (await fetch('api/leaderboard.php')).json();
    document.getElementById('board').innerHTML = rows.map((r, i) =>
      `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td>${(r.time_ms / 1000).toFixed(2)} s</td></tr>`).join('');
  } catch (e) { console.error(e); }
}

async function submitScore(time) {
  const name = document.getElementById('pseudo').value.trim();
  try {
    await fetch('api/save_score.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, time })
    });
  } catch (e) { console.error(e); }
  loadBoard();
}

document.getElementById('start').addEventListener('click', () => {
  if (!document.getElementById('pseudo').value.trim()) { alert('Entre un pseudo !'); return; }
  reset(); state = 'countdown'; startAt = performance.now();
  document.getElementById('start').blur();
});

reset(); loadBoard(); loop();