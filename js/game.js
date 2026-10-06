const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const C = { x: 400, y: 300, ro: [350, 250], ri: [190, 110] }; // piste : ellipse ext. / int.
const LAPS = 3;
const keys = {};
let state = 'idle', player, ais, startAt, raceStart, progress, lastSector, finalTime = 0;

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
  progress = 0; lastSector = 0;
}

function drive() {
  const p = player;
  const max = onTrack(p.x, p.y) ? 5 : 2; // l'herbe ralentit
  if (keys['arrowup'] || keys['w']) p.v += 0.15;
  if (keys['arrowdown'] || keys['s']) p.v -= 0.1;
  p.v *= 0.99;
  if (p.v > max) p.v = Math.max(max, p.v - 0.2);
  p.v = Math.max(-2, p.v);

  const dir = ((keys['arrowright'] || keys['d']) ? 1 : 0) - ((keys['arrowleft'] || keys['a']) ? 1 : 0);
  if (Math.abs(p.v) > 0.2) p.a += dir * 0.05 * Math.sign(p.v);

  p.x = Math.max(0, Math.min(800, p.x + Math.cos(p.a) * p.v));
  p.y = Math.max(0, Math.min(600, p.y + Math.sin(p.a) * p.v));

  // comptage des tours par secteurs
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
    ai.t += ai.speed;
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
  }
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