/* 双11 花开心 · 房间实时服务（无依赖，Node 20）
   房间事件流 + 在线人数 + 玩家快照 + 群友助力（转盘次数 / 砍价一刀） */
const http = require('http');
const PORT = 4100;
const rooms = new Map();

function getRoom(id) {
  if (!rooms.has(id)) rooms.set(id, { seq: 0, helps: 0, evts: [], players: new Map(), helpList: [] });
  return rooms.get(id);
}
function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}
function readBody(req, cb) {
  let data = '';
  req.on('data', c => { data += c; if (data.length > 20000) req.destroy(); });
  req.on('end', () => {
    try { cb(JSON.parse(data || '{}')); } catch (e) { cb(null); }
  });
}
function online(r) {
  const now = Date.now();
  let n = 0;
  r.players.forEach(p => { if (now - p.ts < 90000) n++; });
  return n;
}
function playerList(r) {
  const out = [];
  r.players.forEach((p, k) => {
    if (Date.now() - p.ts < 180000) out.push({ u: k, name: p.name, petals: p.petals, spent: p.spent, qz: p.qz, wishes: p.wishes || [], spins: p.spins || 0, ts: p.ts });
  });
  return out.sort((a, b) => b.petals - a.petals).slice(0, 30);
}
function helpsFor(r, uid) {
  if (!uid) return [];
  return r.helpList.filter(h => h.target === uid).slice(-30);
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://127.0.0.1');
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const roomId = (u.searchParams.get('room') || '1111').slice(0, 12);
  const uid = (u.searchParams.get('u') || '').slice(0, 40);

  if (u.pathname === '/api/health') return json(res, 200, { ok: true, t: Date.now() });

  if (u.pathname === '/api/room' && req.method === 'GET') {
    const r = getRoom(roomId);
    return json(res, 200, {
      ok: true, seq: r.seq, evts: r.evts, players: playerList(r),
      online: online(r), helps: helpsFor(r, uid), helpSeq: r.helps
    });
  }

  if (u.pathname === '/api/since' && req.method === 'GET') {
    const after = +(u.searchParams.get('after') || 0);
    const r = getRoom(roomId);
    const evts = r.evts.filter(e => e.id > after);
    return json(res, 200, {
      ok: true, seq: r.seq, evts: evts, players: playerList(r),
      online: online(r), helps: helpsFor(r, uid), helpSeq: r.helps
    });
  }

  if (u.pathname === '/api/help' && req.method === 'POST') {
    return readBody(req, b => {
      if (!b || !b.target) return json(res, 400, { ok: false });
      const r = getRoom(roomId);
      r.helps += 1;
      const help = {
        id: r.helps,
        target: String(b.target).slice(0, 40),
        from: String(b.from || '群友').slice(0, 24),
        kind: String(b.kind || 'spin').slice(0, 8),
        amt: Math.max(0, +(b.amt || 0)),
        ts: Date.now()
      };
      r.helpList.push(help);
      if (r.helpList.length > 300) r.helpList.shift();
      json(res, 200, { ok: true, id: help.id });
    });
  }

  if (u.pathname === '/api/evt' && req.method === 'POST') {
    return readBody(req, b => {
      if (!b || !b.text) return json(res, 400, { ok: false });
      const r = getRoom(roomId);
      if (b.cid && r.evts.some(e => e.cid === b.cid)) return json(res, 200, { ok: true, dup: true });
      r.seq += 1;
      const evt = {
        id: r.seq,
        who: String(b.who || '游客').slice(0, 24),
        app: String(b.app || 'chat').slice(0, 12),
        text: String(b.text).slice(0, 200),
        t: String(b.t || '').slice(0, 8),
        cid: String(b.cid || '').slice(0, 40),
        meta: (b.meta && typeof b.meta === 'object')
          ? { target: String(b.meta.target || '').slice(0, 40), kind: String(b.meta.kind || '').slice(0, 8), item: String(b.meta.item || '').slice(0, 20) }
          : null,
        ts: Date.now()
      };
      r.evts.push(evt);
      if (r.evts.length > 200) r.evts.shift();
      json(res, 200, { ok: true, id: evt.id, online: online(r) });
    });
  }

  if (u.pathname === '/api/state' && req.method === 'POST') {
    return readBody(req, b => {
      if (!b || !b.u) return json(res, 400, { ok: false });
      const r = getRoom(roomId);
      r.players.set(String(b.u).slice(0, 40), {
        name: String(b.name || '游客').slice(0, 16),
        petals: Math.max(0, Math.min(6, +(b.petals || 0))),
        spent: Math.max(0, +(b.spent || 0)),
        qz: String(b.qz || '').slice(0, 4),
        spins: Math.max(0, +(b.spins || 0)),
        wishes: Array.isArray(b.wishes) ? b.wishes.slice(0, 3).map(w => String(w).slice(0, 20)) : [],
        ts: Date.now()
      });
      json(res, 200, { ok: true, online: online(r) });
    });
  }

  json(res, 404, { ok: false });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('hx-server listening on 127.0.0.1:' + PORT);
});
