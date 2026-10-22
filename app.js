'use strict';
/* Meine Steuererklärung – Version 1.0.0 */
const APP_VERSION = '1.0.0';

/* ---------- Steuerwerte ---------- */
const RATE_PENDEL = 0.38;      // € je Entfernungskilometer ab 2026, ab dem 1. km
const RATE_REISE = 0.30;       // € je gefahrenem km bei Dienst-/Fortbildungsfahrten
const VERPFLEGUNG_8H = 14;     // € bei mehr als 8 Std. Abwesenheit
const HO_TAG = 6, HO_MAX = 1260;
const PAUSCHBETRAG_DEFAULT = { 2026: 1230 };
const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

/* ---------- Checkliste ---------- */
const ITEMS = [
  { id:'stid', sec:'Vorbereitung', kind:'check', t:'Steuer-ID und IBAN bereitlegen',
    d:'Die Steuer-ID steht auf der Lohnsteuerbescheinigung. Die IBAN braucht das Finanzamt für die Erstattung.', e:'Hauptvordruck' },
  { id:'elster', sec:'Vorbereitung', kind:'check', t:'ELSTER-Zugang einrichten',
    d:'Konto auf elster.de anlegen. Der Aktivierungsbrief kommt nach etwa 1–2 Wochen per Post.', e:'elster.de → Registrieren' },
  { id:'lstb', sec:'Vorbereitung', kind:'check', t:'Lohnsteuerbescheinigung',
    d:'Schickt der Arbeitgeber bis Ende Februar des Folgejahres. In ELSTER kannst du die Werte über den Belegabruf übernehmen.', e:'Anlage N, Arbeitslohn (Belegabruf)' },

  { id:'pendel', sec:'Arbeit', kind:'calc', grp:'wk', t:'Weg zur Arbeit',
    d:'0,38 € je Entfernungskilometer (einfache Strecke) und Arbeitstag zur ersten Tätigkeitsstätte. Die Tage trägst du im Rechner ein.', e:'Anlage N, Entfernungspauschale' },
  { id:'dienst', sec:'Arbeit', kind:'calc', grp:'wk', t:'Dienstfahrten zu anderen Standorten',
    d:'Fahrten zu einem Standort, der nicht deine erste Tätigkeitsstätte ist: 0,30 € je gefahrenem Kilometer, abzüglich Erstattung vom Betrieb.', e:'Anlage N, Reisekosten' },
  { id:'kurs', sec:'Arbeit', kind:'calc', grp:'wk', t:'Fahrten zum Meisterkurs',
    d:'Fortbildung zählt wie eine Reise: 0,30 € je gefahrenem Kilometer, bei mehr als 8 Stunden unterwegs 14 € Verpflegung. Erstattungen werden abgezogen.', e:'Anlage N, Fortbildungskosten' },
  { id:'kursneben', sec:'Arbeit', kind:'amount', grp:'wk', t:'Eigene Kosten Meisterkurs',
    d:'Was der Betrieb nicht bezahlt, zum Beispiel Fachbücher, Kopien oder Material für die Meisterarbeit.', e:'Anlage N, Fortbildungskosten' },
  { id:'handy', sec:'Arbeit', kind:'amount', grp:'wk', share:true, t:'Handy und Vertrag',
    d:'Beruflicher Anteil der Handykosten. Ohne genauen Nachweis erkennen Finanzämter oft 20 % an, höchstens 20 € im Monat.', e:'Anlage N, Arbeitsmittel' },
  { id:'pc', sec:'Arbeit', kind:'amount', grp:'wk', share:true, t:'PC, Laptop, Drucker',
    d:'Beruflicher Anteil von Geräten und Zubehör wie Druckerpatronen. Computer darfst du im Jahr der Anschaffung voll ansetzen.', e:'Anlage N, Arbeitsmittel' },
  { id:'kleidung', sec:'Arbeit', kind:'amount', grp:'wk', t:'Arbeitskleidung',
    d:'Nur typische Berufskleidung wie Sicherheitsschuhe, Overall oder Stallkleidung. Alltagskleidung zählt nicht.', e:'Anlage N, Arbeitsmittel' },
  { id:'homeoffice', sec:'Arbeit', kind:'days', grp:'wk', t:'Homeoffice-Tage',
    d:'6 € für jeden Tag, an dem du überwiegend zu Hause arbeitest, höchstens 1.260 € im Jahr.', e:'Anlage N, Homeoffice-Pauschale' },
  { id:'verband', sec:'Arbeit', kind:'amount', grp:'wk', t:'Beiträge zu Berufsverbänden',
    d:'Beiträge an Verbände, die deinen Beruf vertreten, etwa Gewerkschaft oder Berufsverband. Ein normaler Vereinsbeitrag zählt nicht. Im Zweifel beim Verband nachfragen.', e:'Anlage N, Beiträge zu Berufsverbänden' },
  { id:'konto', sec:'Arbeit', kind:'amount', grp:'wk', def:16, t:'Kontoführung',
    d:'Viele Finanzämter erkennen pauschal 16 € im Jahr ohne Nachweis an.', e:'Anlage N, Weitere Werbungskosten' },
  { id:'rechtsschutz', sec:'Arbeit', kind:'amount', grp:'wk', share:true, t:'Rechtsschutz (beruflicher Anteil)',
    d:'Absetzbar ist nur der Anteil für Arbeitsrechtsschutz. Er steht oft getrennt auf der Beitragsrechnung.', e:'Anlage N, Weitere Werbungskosten' },

  { id:'haftpflicht', sec:'Versicherungen', kind:'amount', grp:'vors', t:'Privathaftpflicht',
    d:'Zählt zu den sonstigen Vorsorgeaufwendungen. Bei Angestellten ist der Höchstbetrag durch Kranken- und Pflegeversicherung meist schon ausgeschöpft. Eintragen schadet trotzdem nicht.', e:'Anlage Vorsorgeaufwand' },
  { id:'vorsorge', sec:'Versicherungen', kind:'amount', grp:'vors', t:'Altersvorsorge',
    d:'Riester, Rürup oder eine alte Lebensversicherung mit Vertragsbeginn vor 2005. Die Bescheinigung schickt der Anbieter.', e:'Anlage AV (Riester) oder Anlage Vorsorgeaufwand' },
  { id:'pferd', sec:'Versicherungen', kind:'amount', grp:'none', t:'Pferdehaftpflicht',
    d:'Gilt als private Tierhaltung und ist in der Regel nicht absetzbar. Nur zur Übersicht.', e:'Kein Eintrag nötig' },

  { id:'krank', sec:'Besondere Kosten', kind:'amount', grp:'agb', t:'Krankheitskosten',
    d:'Zuzahlungen, Brille, Zahnarzt. Es wirkt nur der Teil oberhalb der zumutbaren Belastung. Die schätzt der Rechner, wenn du dein Einkommen einträgst.', e:'Anlage Außergewöhnliche Belastungen' },

  { id:'schaetzer', sec:'Nebeneinkünfte', kind:'amount', grp:'none', minYear:2027, income:true, t:'Schätzerhonorar (Einnahmen)',
    d:'Einnahmen als Wildschadensschätzer. Wie sie eingeordnet werden und ob ein Freibetrag greift, klärst du mit dem Finanzamt oder einem Lohnsteuerhilfeverein.', e:'Anlage noch klären' },
];
const CATS = ITEMS.filter(i => i.kind === 'amount');

/* ---------- Speicher (IndexedDB) ---------- */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('meine-steuer', 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('kv'); d.createObjectStore('photos'); };
      r.onsuccess = () => { DB.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  tx(store, mode, fn) {
    return new Promise((res, rej) => {
      const t = DB.db.transaction(store, mode); const s = t.objectStore(store);
      let out; const q = fn(s); if (q) q.onsuccess = () => { out = q.result; };
      t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  },
  get(store, k) { return DB.tx(store, 'readonly', s => s.get(k)); },
  put(store, k, v) { return DB.tx(store, 'readwrite', s => s.put(v, k)); },
  del(store, k) { return DB.tx(store, 'readwrite', s => s.delete(k)); },
  keys(store) { return DB.tx(store, 'readonly', s => s.getAllKeys()); },
  clear(store) { return DB.tx(store, 'readwrite', s => s.clear()); },
};

function newState() {
  return {
    v: 1, year: 2026, font: 1, lastBackup: null, lastHintDismiss: null,
    sites: [
      { id:'goe', name:'Göllnitz', km:0, type:'erste' },
      { id:'lie', name:'Lieskau', km:0, type:'dienst' },
    ],
    lock: { mode:'none', pinHash:null, credId:null },
    years: {},
    receipts: [],
  };
}
function yd(y) {
  y = y || S.year;
  if (!S.years[y]) S.years[y] = { checks:{}, manual:{}, homeoffice:0, days:{}, kurs:[], dienstErstattung:0, income:0, pausch: PAUSCHBETRAG_DEFAULT[y] || 1230 };
  const Y = S.years[y];
  S.sites.forEach(s => { if (!Y.days[s.id]) Y.days[s.id] = Array(12).fill(0); });
  ITEMS.forEach(i => { if (i.def != null && Y.manual[i.id] == null) Y.manual[i.id] = i.def; });
  return Y;
}

let S = newState();
let tab = 'home';
let openItem = null;
let unlocked = false;
const photoCache = {};

async function save() {
  try { await DB.put('kv', 'state', S); } catch (e) { toast('Speichern hat nicht geklappt'); }
}

/* ---------- Hilfen ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = v => { const n = parseFloat(String(v).replace(/\./g,'').replace(',', '.')); return isFinite(n) ? n : 0; };
const numIn = v => { const s = String(v).trim(); if (!s) return 0; const n = parseFloat(s.includes(',') ? s.replace(/\./g,'').replace(',', '.') : s); return isFinite(n) ? n : 0; };
const eur = n => (Math.round(n * 100) / 100).toLocaleString('de-DE', { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' €';
const eur0 = n => Math.round(n).toLocaleString('de-DE') + ' €';
const fmtIn = n => n ? String(Math.round(n * 100) / 100).replace('.', ',') : '';
const dDE = d => d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' });
const isoToDE = s => { if (!s) return ''; const [y,m,d] = s.split('-'); return `${d}.${m}.${y}`; };
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

/* ---------- Berechnungen ---------- */
function calcPendel(Y) {
  let sum = 0, tage = 0;
  S.sites.filter(s => s.type === 'erste').forEach(s => {
    const t = (Y.days[s.id] || []).reduce((a, b) => a + (+b || 0), 0); tage += t;
    sum += t * (+s.km || 0) * RATE_PENDEL;
  });
  return { sum, tage };
}
function calcDienst(Y) {
  let sum = 0, tage = 0;
  S.sites.filter(s => s.type === 'dienst').forEach(s => {
    const t = (Y.days[s.id] || []).reduce((a, b) => a + (+b || 0), 0); tage += t;
    sum += t * (+s.km || 0) * 2 * RATE_REISE;
  });
  return { sum: Math.max(0, sum - (+Y.dienstErstattung || 0)), brutto: sum, tage };
}
function kursRow(k) { return Math.max(0, (+k.km || 0) * RATE_REISE + (k.v8 ? VERPFLEGUNG_8H : 0) - (+k.erst || 0)); }
function calcKurs(Y) { return { sum: Y.kurs.reduce((a, k) => a + kursRow(k), 0), n: Y.kurs.length }; }
function receiptsFor(cat, y) { return S.receipts.filter(r => r.cat === cat && r.year === (y || S.year)); }
function rEff(r) { return (+r.amount || 0) * ((r.share == null ? 100 : r.share) / 100); }
function itemValue(i, Y) {
  Y = Y || yd();
  if (i.kind === 'calc') return i.id === 'pendel' ? calcPendel(Y).sum : i.id === 'dienst' ? calcDienst(Y).sum : calcKurs(Y).sum;
  if (i.kind === 'days') return Math.min(HO_MAX, (+Y.homeoffice || 0) * HO_TAG);
  if (i.kind === 'amount') return (+Y.manual[i.id] || 0) + receiptsFor(i.id).reduce((a, r) => a + rEff(r), 0);
  return 0;
}
function zumutbar(gde) {
  // ledig, ohne Kinder: 5 % bis 15.340 €, 6 % bis 51.130 €, 7 % darüber (stufenweise)
  const a = Math.min(gde, 15340), b = Math.min(Math.max(gde - 15340, 0), 51130 - 15340), c = Math.max(gde - 51130, 0);
  return a * 0.05 + b * 0.06 + c * 0.07;
}
function visibleItems() { return ITEMS.filter(i => !i.minYear || S.year >= i.minYear); }
function sums() {
  const Y = yd(); const out = { wk:0, vors:0, agb:0, fahrt:0, arbeitsmittel:0 };
  visibleItems().forEach(i => {
    const v = itemValue(i, Y);
    if (i.grp && out[i.grp] != null) out[i.grp] += v;
    if (i.kind === 'calc') out.fahrt += v;
    if (['handy','pc','kleidung'].includes(i.id)) out.arbeitsmittel += v;
  });
  return out;
}

/* ---------- Fristen ---------- */
function shiftWE(d) { const w = d.getDay(); if (w === 6) d.setDate(d.getDate() + 2); else if (w === 0) d.setDate(d.getDate() + 1); return d; }
function fristen(y) {
  return [
    { k:'lstb', t:'Lohnsteuerbescheinigung kommt', d:new Date(y + 1, 1, 28), s:'Arbeitgeber übermittelt bis Ende Februar' },
    { k:'pflicht', t:'Abgabe selbst über ELSTER', d:shiftWE(new Date(y + 1, 6, 31)), s:'Gilt, wenn du zur Abgabe verpflichtet bist', main:true },
    { k:'berater', t:'Mit Lohnsteuerhilfeverein oder Berater', d:shiftWE(new Date(y + 2, 2, 0)), s:'Längere Frist, wenn ein Verein oder Berater abgibt' },
    { k:'frei', t:'Letzter Tag für freiwillige Abgabe', d:new Date(y + 4, 11, 31), s:'Wenn du nicht verpflichtet bist' },
  ];
}
function daysUntil(d) { const t = new Date(); t.setHours(0,0,0,0); const x = new Date(d); x.setHours(0,0,0,0); return Math.round((x - t) / 86400000); }
function nextFrist() { return fristen(S.year).find(f => f.k !== 'lstb' && daysUntil(f.d) >= 0) || null; }

/* ---------- Monatshinweis ---------- */
function monthHint() {
  const now = new Date(); const Y = yd();
  let last = now.getFullYear() > S.year ? 11 : now.getFullYear() === S.year ? now.getMonth() - 1 : -1;
  for (let m = last; m >= 0; m--) {
    const any = S.sites.some(s => (+Y.days[s.id][m] || 0) > 0);
    if (!any) return { m, text:`Arbeitstage ${MONATE[m]} eintragen` };
  }
  return null;
}

/* ---------- Icons ---------- */
const IC = {
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9"/></svg>',
  rec:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 21V3h14v18l-3-2-2 2-2-2-2 2-2-2z"/><path d="M9 8h6M9 12h6"/></svg>',
  calc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/></svg>',
  photo:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>',
};
const TABS = [['home','Übersicht',IC.home],['list','Checkliste',IC.list],['rec','Belege',IC.rec],['calc','Rechner',IC.calc],['cal','Fristen',IC.cal]];

function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([k, l, ic]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}" aria-label="${l}">${ic}<span>${l}</span></button>`).join('');
}

/* ---------- Render ---------- */
function render() {
  if (!unlocked) return;
  $('#hsub').textContent = `Steuerjahr ${S.year}`;
  document.documentElement.style.setProperty('--fs', S.font === 2 ? '19px' : '16px');
  renderTabs();
  const m = $('#main');
  if (tab === 'home') m.innerHTML = vHome();
  else if (tab === 'list') m.innerHTML = vList();
  else if (tab === 'rec') m.innerHTML = vRec();
  else if (tab === 'calc') m.innerHTML = vCalc();
  else if (tab === 'cal') m.innerHTML = vCal();
  else if (tab === 'newrec') m.innerHTML = vRecForm();
  else if (tab === 'set') m.innerHTML = vSet();
  afterRender();
}

function vHome() {
  const Y = yd(); const its = visibleItems();
  const done = its.filter(i => Y.checks[i.id]).length;
  const s = sums(); const nf = nextFrist(); const h = monthHint();
  const rc = S.receipts.filter(r => r.year === S.year).length;
  const over = s.wk - (+Y.pausch || 0);
  const backupDays = S.lastBackup ? Math.floor((Date.now() - S.lastBackup) / 86400000) : null;
  return `
  ${h ? `<div class="hint"><span>🔔</span><span>${esc(h.text)}</span><button class="btn" data-go="calc">Öffnen</button></div>` : ''}
  ${(backupDays == null && rc > 0) || backupDays > 7 ? `<div class="hint"><span>💾</span><span>${backupDays == null ? 'Noch keine Datensicherung gemacht' : `Letzte Sicherung vor ${backupDays} Tagen`}</span><button class="btn" data-act="export">Sichern</button></div>` : ''}
  <div class="card">
    <div class="row" style="justify-content:space-between"><span>Checkliste</span><span class="muted">${done} von ${its.length} erledigt</span></div>
    <div class="bar"><div style="width:${its.length ? Math.round(done / its.length * 100) : 0}%"></div></div>
  </div>
  <div class="grid2">
    <div class="metric"><div class="l">Fahrtkosten</div><div class="n">${eur0(s.fahrt)}</div></div>
    <div class="metric"><div class="l">Arbeitsmittel</div><div class="n">${eur0(s.arbeitsmittel)}</div></div>
    <div class="metric"><div class="l">Belege</div><div class="n">${rc}</div></div>
    <div class="metric"><div class="l">Nächste Frist</div><div class="n" style="font-size:1.05rem">${nf ? dDE(nf.d) : '–'}</div></div>
  </div>
  <div class="card">
    <h2>Werbungskosten gesamt: ${eur(s.wk)}</h2>
    <div class="muted">${over > 0
      ? `Das sind ${eur(over)} mehr als der Arbeitnehmer-Pauschbetrag von ${eur0(Y.pausch)}. Nur dieser Teil senkt deine Steuer zusätzlich.`
      : `Noch ${eur(-over)} unter dem Arbeitnehmer-Pauschbetrag von ${eur0(Y.pausch)}. Den zieht das Finanzamt ohnehin ab.`}</div>
  </div>
  <div class="tiny">Alle Beträge sind eigene Schätzungen und ersetzen keine Steuerberatung. Version ${APP_VERSION}</div>`;
}

function vList() {
  const Y = yd(); let html = ''; let sec = '';
  visibleItems().forEach(i => {
    if (i.sec !== sec) { sec = i.sec; html += `<h3 class="sec">${esc(sec)}</h3>`; }
    const val = itemValue(i, Y); const on = !!Y.checks[i.id]; const open = openItem === i.id;
    html += `<div class="item">
      <div class="top" data-open="${i.id}">
        <button class="cb ${on ? 'on' : ''}" data-check="${i.id}" aria-label="${esc(i.t)} erledigt" aria-pressed="${on}"></button>
        <span class="t">${esc(i.t)}</span>
        ${i.kind !== 'check' ? `<span class="v">${eur(val)}</span>` : ''}
      </div>
      ${open ? `<div class="body">
        <div class="muted">${esc(i.d)}</div>
        <div><span class="chip">ELSTER: ${esc(i.e)}</span></div>
        ${itemBody(i, Y)}
      </div>` : ''}
    </div>`;
  });
  return html;
}
function itemBody(i, Y) {
  if (i.kind === 'calc') return `<button class="btn" data-go="calc">Im Rechner bearbeiten</button>`;
  if (i.kind === 'days') return `<label class="f">Anzahl Homeoffice-Tage im Jahr
      <input id="ho" inputmode="numeric" value="${Y.homeoffice || ''}" placeholder="0"></label>`;
  if (i.kind === 'amount') {
    const rs = receiptsFor(i.id);
    return `<label class="f">Betrag ohne Beleg (zusätzlich)
        <input id="man_${i.id}" data-man="${i.id}" inputmode="decimal" value="${fmtIn(Y.manual[i.id])}" placeholder="0,00"></label>
      <div class="row"><span class="muted" style="flex:1">${rs.length} Beleg${rs.length === 1 ? '' : 'e'}: ${eur(rs.reduce((a, r) => a + rEff(r), 0))}</span>
      <button class="btn" data-newrec="${i.id}">+ Beleg</button></div>`;
  }
  return '';
}

function vRec() {
  const rs = S.receipts.filter(r => r.year === S.year).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return `<div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:1.05rem">Belege ${S.year}</h2>
    <button class="btn primary" data-newrec="">+ Neu</button></div>
  <div class="card list">${rs.length ? rs.map(r => {
    const c = ITEMS.find(i => i.id === r.cat);
    return `<div class="r" data-edit="${r.id}"><div class="th" data-thumb="${r.photo || ''}">${IC.photo}</div>
      <div style="flex:1;min-width:0"><div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.title || 'Ohne Bezeichnung')}</div>
      <div class="tiny">${isoToDE(r.date)} · ${esc(c ? c.t : 'Sonstiges')}${r.share != null && r.share < 100 ? ` · ${r.share} %` : ''}</div></div>
      <span style="font-variant-numeric:tabular-nums">${eur(+r.amount || 0)}</span></div>`;
  }).join('') : `<div class="empty">Noch keine Belege für ${S.year}.<br>Mit „+ Neu“ fotografierst du den ersten Beleg.</div>`}</div>`;
}

let draft = null; // Beleg in Bearbeitung
function vRecForm() {
  const r = draft; const c = ITEMS.find(i => i.id === r.cat);
  const shareOn = c && c.share;
  return `<div class="row"><button class="btn" data-go="rec">← Zurück</button><h2 style="margin:0;font-size:1.05rem">${r.isNew ? 'Neuer Beleg' : 'Beleg bearbeiten'}</h2></div>
  <div class="card" style="display:flex;flex-direction:column;gap:12px">
    <div id="photoBox">${r.photo ? `<img class="photo-big" id="bigPhoto" alt="Foto vom Beleg">` : ''}</div>
    <div class="row"><button class="btn" data-act="cam" style="flex:1">📷 Foto aufnehmen</button><button class="btn" data-act="gal" style="flex:1">🖼️ Aus Galerie</button></div>
    ${r.photo ? `<button class="btn danger" data-act="delphoto">Foto entfernen</button>` : ''}
    <label class="f">Bezeichnung<input id="r_title" value="${esc(r.title)}" placeholder="Arbeitsstiefel"></label>
    <div class="grid2">
      <label class="f">Datum<input id="r_date" type="date" value="${esc(r.date)}"></label>
      <label class="f">Betrag in €<input id="r_amount" inputmode="decimal" value="${fmtIn(r.amount)}" placeholder="0,00"></label>
    </div>
    <label class="f">Gehört zu<select id="r_cat">${CATS.filter(i => !i.minYear || S.year >= i.minYear).map(i => `<option value="${i.id}" ${i.id === r.cat ? 'selected' : ''}>${esc(i.t)}</option>`).join('')}</select></label>
    <div><span class="chip" id="r_elster">ELSTER: ${esc(c ? c.e : '')}</span></div>
    <div id="shareBox" ${shareOn ? '' : 'hidden'}><label class="f">Beruflicher Anteil: <b id="r_shareOut">${r.share == null ? 100 : r.share} %</b>
      <input id="r_share" type="range" min="0" max="100" step="5" value="${r.share == null ? 100 : r.share}"></label></div>
    <label class="f">Notiz oder Ablageort<input id="r_note" value="${esc(r.note)}" placeholder="Ordner Steuer ${S.year}, Fach 3"></label>
    <button class="btn primary" data-act="saverec">Beleg speichern</button>
    ${r.isNew ? '' : `<button class="btn danger" data-act="delrec">Beleg löschen</button>`}
  </div>`;
}

function vCalc() {
  const Y = yd(); const p = calcPendel(Y), d = calcDienst(Y), k = calcKurs(Y);
  const krank = itemValue(ITEMS.find(i => i.id === 'krank'), Y);
  const zb = Y.income ? zumutbar(+Y.income) : null;
  return `
  <div class="card" style="display:flex;flex-direction:column;gap:10px">
    <h2>Standorte</h2>
    ${S.sites.map(s => `<div style="display:flex;flex-direction:column;gap:6px;border-bottom:1px solid var(--line);padding-bottom:10px">
      <b>${esc(s.name)}</b>
      <div class="grid2">
        <label class="f">km einfache Strecke<input data-sitekm="${s.id}" inputmode="decimal" value="${fmtIn(s.km)}" placeholder="0"></label>
        <label class="f">Art<select data-sitetype="${s.id}">
          <option value="erste" ${s.type === 'erste' ? 'selected' : ''}>Erste Tätigkeitsstätte</option>
          <option value="dienst" ${s.type === 'dienst' ? 'selected' : ''}>Dienstfahrt</option></select></label>
      </div></div>`).join('')}
    <div class="tiny">Welcher Standort deine erste Tätigkeitsstätte ist, legt dein Arbeitgeber fest, meist im Arbeitsvertrag. Es kann nur einen geben. Fahrten zu anderen Standorten zählen dann als Dienstfahrten.</div>
  </div>
  <div class="card">
    <h2>Arbeitstage pro Monat</h2>
    <div class="scroll"><table class="m"><thead><tr><th>Monat</th>${S.sites.map(s => `<th style="text-align:right">${esc(s.name)}</th>`).join('')}</tr></thead><tbody>
    ${MONATE.map((mn, m) => `<tr><td>${mn}</td>${S.sites.map(s => `<td><input data-day="${s.id}:${m}" inputmode="numeric" value="${Y.days[s.id][m] || ''}" placeholder="0" aria-label="${mn} ${esc(s.name)}"></td>`).join('')}</tr>`).join('')}
    </tbody></table></div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">
      <div class="res"><span>Weg zur Arbeit (${p.tage} Tage)</span><span>${eur(p.sum)}</span></div>
      <label class="f">Erstattung vom Betrieb für Dienstfahrten im Jahr<input id="dErst" inputmode="decimal" value="${fmtIn(Y.dienstErstattung)}" placeholder="0,00"></label>
      <div class="res"><span>Dienstfahrten (${d.tage} Tage)</span><span>${eur(d.sum)}</span></div>
    </div>
  </div>
  <div class="card" style="display:flex;flex-direction:column;gap:10px">
    <h2>Fahrten zum Meisterkurs</h2>
    ${Y.kurs.map((x, n) => `<div style="border-bottom:1px solid var(--line);padding-bottom:10px;display:flex;flex-direction:column;gap:6px">
      <div class="grid2">
        <label class="f">Datum<input type="date" data-kurs="${n}:date" value="${esc(x.date)}"></label>
        <label class="f">km hin und zurück<input data-kurs="${n}:km" inputmode="decimal" value="${fmtIn(x.km)}" placeholder="0"></label>
      </div>
      <div class="grid2">
        <label class="f">Erstattet vom Betrieb (€)<input data-kurs="${n}:erst" inputmode="decimal" value="${fmtIn(x.erst)}" placeholder="0,00"></label>
        <label class="f" style="justify-content:flex-end"><span class="row"><input type="checkbox" data-kurs="${n}:v8" ${x.v8 ? 'checked' : ''}> über 8 Std. unterwegs</span></label>
      </div>
      <div class="row" style="justify-content:space-between"><span class="muted">Absetzbar: <b>${eur(kursRow(x))}</b></span><button class="btn danger" data-kursdel="${n}">Entfernen</button></div>
    </div>`).join('')}
    <button class="btn" data-act="kursadd">+ Kursfahrt hinzufügen</button>
    <div class="res"><span>Meisterkurs (${k.n} Fahrten)</span><span>${eur(k.sum)}</span></div>
  </div>
  <div class="card" style="display:flex;flex-direction:column;gap:8px">
    <h2>Krankheitskosten</h2>
    <label class="f">Gesamtbetrag der Einkünfte (ungefähr, aus dem letzten Steuerbescheid)<input id="income" inputmode="decimal" value="${fmtIn(Y.income)}" placeholder="0"></label>
    <div class="muted">Gesammelt: ${eur(krank)}${zb != null ? ` · zumutbare Belastung ca. ${eur(zb)}` : ''}</div>
    ${zb != null ? `<div class="res"><span>Wirkt steuerlich</span><span>${eur(Math.max(0, krank - zb))}</span></div>` : ''}
    <div class="tiny">Berechnung für Ledige ohne Kinder: 5 % bis 15.340 €, 6 % bis 51.130 €, 7 % darüber, stufenweise. Nur eine Schätzung.</div>
  </div>`;
}

function vCal() {
  const fs = fristen(S.year);
  return fs.map(f => {
    const n = daysUntil(f.d);
    const left = n > 0 ? `noch ${n} Tage` : n === 0 ? 'heute' : 'vorbei';
    return f.main
      ? `<div class="hint" style="flex-direction:column;gap:2px"><span>${esc(f.t)}</span><span style="font-size:1.4rem;font-weight:700">${dDE(f.d)}</span><span>${left}</span></div>`
      : `<div class="card"><div class="row" style="justify-content:space-between"><b>${esc(f.t)}</b><span class="muted">${left}</span></div>
         <div style="font-size:1.05rem;font-weight:600">${dDE(f.d)}</div><div class="tiny">${esc(f.s)}</div></div>`;
  }).join('') + `
  <div class="card"><b>Einspruch gegen den Bescheid</b><div class="muted">Innerhalb eines Monats, nachdem der Bescheid bekannt gegeben wurde. Datum vom Bescheid notieren.</div></div>
  <div class="card"><b>Schätzerhonorar</b><div class="muted">${S.year >= 2027 ? 'Der Bereich ist in der Checkliste unter „Nebeneinkünfte“ freigeschaltet.' : 'Wird ab Steuerjahr 2027 in der Checkliste freigeschaltet.'}</div></div>
  <div class="tiny">Fällt eine Frist auf ein Wochenende, gilt der nächste Werktag. Feiertage berücksichtigt die App nicht.</div>`;
}

function vSet() {
  const L = S.lock; const Y = yd();
  return `<div class="row"><button class="btn" data-go="home">← Zurück</button><h2 style="margin:0;font-size:1.05rem">Einstellungen</h2></div>
  <div class="card" style="display:flex;flex-direction:column;gap:10px">
    <h2>Steuerjahr</h2>
    <label class="f">Jahr<select id="yearSel">${[2026,2027,2028,2029,2030].map(y => `<option ${y === S.year ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
    <label class="f">Arbeitnehmer-Pauschbetrag für ${S.year} (€)<input id="pausch" inputmode="decimal" value="${fmtIn(Y.pausch)}"></label>
    ${S.year > 2026 ? `<div class="tiny">Für ${S.year} ist eine Erhöhung geplant. Bitte den Wert prüfen, sobald er beschlossen ist.</div>` : ''}
  </div>
  <div class="card" style="display:flex;flex-direction:column;gap:10px">
    <h2>Sperre</h2>
    <div class="muted">Aktuell: ${L.mode === 'bio' ? 'Fingerabdruck (PIN als Ersatz)' : L.mode === 'pin' ? 'PIN' : 'keine'}</div>
    <button class="btn" data-act="setbio">Fingerabdruck einrichten</button>
    <button class="btn" data-act="setpin">PIN festlegen</button>
    ${L.mode !== 'none' ? `<button class="btn danger" data-act="lockoff">Sperre ausschalten</button>` : ''}
    <div class="tiny">Die Sperre schützt vor neugierigen Blicken. Die Daten selbst werden nicht verschlüsselt.</div>
  </div>
  <div class="card" style="display:flex;flex-direction:column;gap:10px">
    <h2>Datensicherung</h2>
    <div class="muted">Letzte Sicherung: ${S.lastBackup ? dDE(new Date(S.lastBackup)) : 'noch keine'}</div>
    <button class="btn primary" data-act="export">Sicherung als Datei speichern</button>
    <button class="btn" data-act="import">Sicherung einspielen</button>
    <button class="btn" data-act="summary">Zusammenfassung kopieren</button>
    <div class="tiny" id="storeInfo"></div>
  </div>
  <div class="card" style="display:flex;flex-direction:column;gap:10px">
    <h2>Alles löschen</h2>
    <button class="btn danger" data-act="wipe">Alle Daten löschen</button>
    <div id="wipeConfirm"></div>
  </div>`;
}

/* ---------- nach dem Rendern ---------- */
async function afterRender() {
  document.querySelectorAll('[data-thumb]').forEach(async el => {
    const id = el.dataset.thumb; if (!id) return;
    const url = await photoURL(id); if (url) el.innerHTML = `<img src="${url}" alt="">`;
  });
  if (tab === 'newrec' && draft && draft.photo) {
    const url = draft.photoBlob ? URL.createObjectURL(draft.photoBlob) : await photoURL(draft.photo);
    const img = $('#bigPhoto'); if (img && url) img.src = url;
  }
  if (tab === 'set' && navigator.storage && navigator.storage.estimate) {
    try { const e = await navigator.storage.estimate(); const el = $('#storeInfo');
      if (el) el.textContent = `Belegt: ${(e.usage / 1048576).toFixed(1)} MB von etwa ${(e.quota / 1048576).toFixed(0)} MB`; } catch (_) {}
  }
}
async function photoURL(id) {
  if (photoCache[id]) return photoCache[id];
  try { const b = await DB.get('photos', id); if (!b) return null; photoCache[id] = URL.createObjectURL(b); return photoCache[id]; } catch (_) { return null; }
}

/* ---------- Foto verkleinern ---------- */
function shrink(file) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1400; let { width:w, height:h } = img;
      if (w > max || h > max) { const f = max / Math.max(w, h); w = Math.round(w * f); h = Math.round(h * f); }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
      c.toBlob(b => b ? res(b) : rej(new Error('Foto')), 'image/jpeg', 0.7);
    };
    img.onerror = () => rej(new Error('Foto'));
    img.src = url;
  });
}

/* ---------- Belege ---------- */
function startReceipt(cat) {
  draft = { id:uid(), isNew:true, year:S.year, title:'', date:todayISO(), amount:0, cat:cat || 'kleidung', share:100, note:'', photo:null };
  const c = ITEMS.find(i => i.id === draft.cat);
  if (c && c.share && (draft.cat === 'handy')) draft.share = 20;
  tab = 'newrec'; render(); window.scrollTo(0, 0);
}
function readDraftForm() {
  draft.title = $('#r_title').value.trim();
  draft.date = $('#r_date').value || todayISO();
  draft.amount = numIn($('#r_amount').value);
  draft.cat = $('#r_cat').value;
  const c = ITEMS.find(i => i.id === draft.cat);
  draft.share = c && c.share ? +$('#r_share').value : 100;
  draft.note = $('#r_note').value.trim();
}
async function saveReceipt() {
  readDraftForm();
  if (!draft.amount) { toast('Bitte einen Betrag eintragen'); return; }
  const y = +draft.date.slice(0, 4);
  if (y && y !== S.year) { draft.year = y; yd(y); }
  if (draft.photoBlob) {
    if (draft.oldPhoto) { try { await DB.del('photos', draft.oldPhoto); } catch (_) {} delete photoCache[draft.oldPhoto]; }
    await DB.put('photos', draft.photo, draft.photoBlob);
  }
  const rec = { id:draft.id, year:draft.year, title:draft.title, date:draft.date, amount:draft.amount, cat:draft.cat, share:draft.share, note:draft.note, photo:draft.photo };
  const i = S.receipts.findIndex(r => r.id === rec.id);
  if (i >= 0) S.receipts[i] = rec; else S.receipts.push(rec);
  await save(); draft = null; tab = 'rec'; render();
  toast(y && y !== S.year ? `Gespeichert unter Steuerjahr ${y}` : 'Beleg gespeichert');
}

/* ---------- Sperre ---------- */
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ms-' + s)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''); }
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function bioRegister() {
  if (!window.PublicKeyCredential) { toast('Fingerabdruck wird hier nicht unterstützt'); return false; }
  try {
    const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!ok) { toast('Kein Fingerabdruck auf diesem Gerät eingerichtet'); return false; }
    const cred = await navigator.credentials.create({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name:'Meine Steuererklärung' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name:'steuer', displayName:'Meine Steuererklärung' },
      pubKeyCredParams: [{ type:'public-key', alg:-7 }, { type:'public-key', alg:-257 }],
      authenticatorSelection: { authenticatorAttachment:'platform', userVerification:'required', residentKey:'discouraged' },
      timeout: 60000,
    }});
    S.lock.credId = b64(cred.rawId); return true;
  } catch (e) { toast('Fingerabdruck konnte nicht eingerichtet werden'); return false; }
}
async function bioCheck() {
  try {
    await navigator.credentials.get({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type:'public-key', id: unb64(S.lock.credId) }],
      userVerification: 'required', timeout: 60000,
    }});
    return true;
  } catch (_) { return false; }
}
function showLock() {
  const L = S.lock;
  const d = document.createElement('div'); d.className = 'lock'; d.id = 'lockScreen';
  d.innerHTML = `<div style="font-size:1.3rem;font-weight:600">Meine Steuererklärung</div>
    ${L.mode === 'bio' ? `<button class="btn" id="bioBtn" style="background:var(--on-green);color:var(--green);font-weight:600">Mit Fingerabdruck entsperren</button>` : ''}
    <input id="pinIn" type="password" inputmode="numeric" maxlength="8" placeholder="PIN" aria-label="PIN">
    <button class="btn" id="pinBtn">Entsperren</button><div id="pinErr" style="min-height:1.2em"></div>`;
  document.body.appendChild(d);
  const done = () => { d.remove(); unlocked = true; render(); };
  const tryBio = async () => { if (await bioCheck()) done(); };
  if (L.mode === 'bio') { $('#bioBtn').onclick = tryBio; tryBio(); }
  const tryPin = async () => {
    if (L.pinHash && await sha($('#pinIn').value) === L.pinHash) done();
    else { $('#pinErr').textContent = 'PIN stimmt nicht. Bitte noch einmal.'; $('#pinIn').value = ''; }
  };
  $('#pinBtn').onclick = tryPin;
  $('#pinIn').onkeydown = e => { if (e.key === 'Enter') tryPin(); };
}
function pinDialog(after) {
  const m = $('#main');
  m.insertAdjacentHTML('afterbegin', `<div class="card" id="pinSet" style="display:flex;flex-direction:column;gap:8px">
    <h2>PIN festlegen</h2>
    <input id="p1" type="password" inputmode="numeric" maxlength="8" placeholder="Neue PIN (4–8 Ziffern)">
    <input id="p2" type="password" inputmode="numeric" maxlength="8" placeholder="PIN wiederholen">
    <div id="pErr" class="muted"></div>
    <div class="row"><button class="btn primary" id="pOk">Speichern</button><button class="btn" id="pNo">Abbrechen</button></div></div>`);
  window.scrollTo(0, 0);
  $('#pNo').onclick = () => render();
  $('#pOk').onclick = async () => {
    const a = $('#p1').value, b = $('#p2').value;
    if (!/^\d{4,8}$/.test(a)) { $('#pErr').textContent = 'Die PIN braucht 4 bis 8 Ziffern.'; return; }
    if (a !== b) { $('#pErr').textContent = 'Die beiden Eingaben sind unterschiedlich.'; return; }
    S.lock.pinHash = await sha(a); await after(); await save(); render();
  };
}

/* ---------- Export / Import ---------- */
function blobToDataURL(b) { return new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); }
async function dataURLToBlob(u) { return (await fetch(u)).blob(); }
async function doExport() {
  toast('Sicherung wird erstellt …');
  const photos = {};
  for (const r of S.receipts) if (r.photo) { const b = await DB.get('photos', r.photo); if (b) photos[r.photo] = await blobToDataURL(b); }
  S.lastBackup = Date.now(); await save();
  const data = JSON.stringify({ app:'meine-steuer', version:APP_VERSION, created:new Date().toISOString(), state:S, photos });
  const blob = new Blob([data], { type:'application/json' });
  const name = `Steuer_Sicherung_${todayISO()}.json`;
  const file = new File([blob], name, { type:'application/json' });
  if (navigator.canShare && navigator.canShare({ files:[file] })) {
    try { await navigator.share({ files:[file], title:name }); render(); return; } catch (e) { if (e.name === 'AbortError') { render(); return; } }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Sicherung gespeichert'); render();
}
async function doImport(file) {
  try {
    const j = JSON.parse(await file.text());
    if (j.app !== 'meine-steuer' || !j.state) throw new Error('falsche Datei');
    await DB.clear('photos');
    for (const [k, u] of Object.entries(j.photos || {})) await DB.put('photos', k, await dataURLToBlob(u));
    Object.keys(photoCache).forEach(k => delete photoCache[k]);
    S = Object.assign(newState(), j.state); await save();
    tab = 'home'; render(); toast('Sicherung eingespielt');
  } catch (e) { toast('Die Datei ist keine gültige Sicherung'); }
}
function summaryText() {
  const Y = yd(); const s = sums();
  let t = `Meine Steuererklärung ${S.year}\nStand: ${dDE(new Date())}\n\n`;
  let sec = '';
  visibleItems().forEach(i => {
    if (i.sec !== sec) { sec = i.sec; t += `\n${sec.toUpperCase()}\n`; }
    t += `[${Y.checks[i.id] ? 'x' : ' '}] ${i.t}${i.kind !== 'check' ? ': ' + eur(itemValue(i, Y)) : ''}  (${i.e})\n`;
  });
  t += `\nWerbungskosten gesamt: ${eur(s.wk)} (Pauschbetrag ${eur0(Y.pausch)})\n`;
  const rs = S.receipts.filter(r => r.year === S.year);
  if (rs.length) {
    t += `\nBELEGE (${rs.length})\n`;
    rs.sort((a, b) => a.date.localeCompare(b.date)).forEach(r => {
      const c = ITEMS.find(i => i.id === r.cat);
      t += `${isoToDE(r.date)}  ${r.title || '-'}  ${eur(+r.amount)}${r.share < 100 ? ` (${r.share} % beruflich)` : ''}  [${c ? c.t : ''}]${r.note ? '  ' + r.note : ''}\n`;
    });
  }
  return t;
}
async function copySummary() {
  const t = summaryText();
  try { await navigator.clipboard.writeText(t); toast('Zusammenfassung kopiert'); }
  catch (_) {
    $('#main').insertAdjacentHTML('afterbegin', `<div class="card"><textarea rows="12" id="sumTxt">${esc(t)}</textarea><div class="tiny">Text markieren und kopieren.</div></div>`);
    $('#sumTxt').select();
  }
}

/* ---------- Ereignisse ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('button, [data-open], [data-edit]'); if (!el) return;
  const d = el.dataset;
  if (d.tab) { tab = d.tab; openItem = null; render(); window.scrollTo(0, 0); return; }
  if (d.go) { tab = d.go; render(); window.scrollTo(0, 0); return; }
  if (d.check) { e.stopPropagation(); const Y = yd(); Y.checks[d.check] = !Y.checks[d.check]; await save(); render(); return; }
  if (d.newrec != null) { startReceipt(d.newrec); return; }
  if (d.edit) { const r = S.receipts.find(x => x.id === d.edit); if (r) { draft = Object.assign({}, r, { isNew:false }); tab = 'newrec'; render(); window.scrollTo(0, 0); } return; }
  if (d.open) { openItem = openItem === d.open ? null : d.open; render(); return; }
  if (d.kursdel != null) { yd().kurs.splice(+d.kursdel, 1); await save(); render(); return; }
  const a = d.act;
  if (a === 'cam') { readDraftForm(); $('#fileCam').click(); }
  else if (a === 'gal') { readDraftForm(); $('#fileGal').click(); }
  else if (a === 'delphoto') { readDraftForm(); if (!draft.oldPhoto && !draft.isNew) draft.oldPhoto = draft.photo; draft.photo = null; draft.photoBlob = null; render(); }
  else if (a === 'saverec') saveReceipt();
  else if (a === 'delrec') {
    if (el.dataset.sure) {
      S.receipts = S.receipts.filter(r => r.id !== draft.id);
      if (draft.photo) { try { await DB.del('photos', draft.photo); } catch (_) {} }
      await save(); draft = null; tab = 'rec'; render(); toast('Beleg gelöscht');
    } else { el.dataset.sure = '1'; el.textContent = 'Wirklich löschen? Noch einmal tippen'; }
  }
  else if (a === 'kursadd') { yd().kurs.push({ date:todayISO(), km:0, erst:0, v8:false }); await save(); render(); }
  else if (a === 'export') doExport();
  else if (a === 'import') $('#fileImp').click();
  else if (a === 'summary') copySummary();
  else if (a === 'setpin') pinDialog(async () => { if (S.lock.mode === 'none') S.lock.mode = 'pin'; toast('PIN gespeichert'); });
  else if (a === 'setbio') {
    if (!S.lock.pinHash) { toast('Lege zuerst eine PIN als Ersatz fest'); pinDialog(async () => { if (await bioRegister()) { S.lock.mode = 'bio'; toast('Fingerabdruck eingerichtet'); } else S.lock.mode = 'pin'; }); }
    else if (await bioRegister()) { S.lock.mode = 'bio'; await save(); render(); toast('Fingerabdruck eingerichtet'); }
  }
  else if (a === 'lockoff') { S.lock = { mode:'none', pinHash:null, credId:null }; await save(); render(); toast('Sperre ausgeschaltet'); }
  else if (a === 'wipe') {
    $('#wipeConfirm').innerHTML = `<div class="hint" style="flex-direction:column">Alle Belege, Fotos und Eintragungen werden gelöscht. Mach vorher eine Sicherung.<button class="btn danger" data-act="wipeyes">Ja, alles löschen</button></div>`;
  }
  else if (a === 'wipeyes') { await DB.clear('photos'); S = newState(); await save(); tab = 'home'; render(); toast('Alle Daten gelöscht'); }
});

document.addEventListener('input', async e => {
  const t = e.target; const Y = yd();
  if (t.id === 'r_share') { $('#r_shareOut').textContent = t.value + ' %'; return; }
  if (t.dataset.man) { Y.manual[t.dataset.man] = numIn(t.value); }
  else if (t.id === 'ho') Y.homeoffice = Math.max(0, Math.round(numIn(t.value)));
  else if (t.dataset.day) { const [s, m] = t.dataset.day.split(':'); Y.days[s][+m] = Math.max(0, Math.round(numIn(t.value))); }
  else if (t.dataset.sitekm) { S.sites.find(s => s.id === t.dataset.sitekm).km = numIn(t.value); }
  else if (t.id === 'dErst') Y.dienstErstattung = numIn(t.value);
  else if (t.id === 'income') Y.income = numIn(t.value);
  else if (t.id === 'pausch') Y.pausch = numIn(t.value);
  else if (t.dataset.kurs) {
    const [n, f] = t.dataset.kurs.split(':'); const k = Y.kurs[+n];
    if (f === 'date') k.date = t.value; else if (f === 'v8') k.v8 = t.checked; else k[f] = numIn(t.value);
  } else return;
  await save();
  clearTimeout(window._rt); window._rt = setTimeout(softRefresh, 700);
});
// Ergebnisse aktualisieren, ohne das Feld zu verlassen
function softRefresh() {
  const a = document.activeElement; const id = a && (a.id || (a.dataset && Object.entries(a.dataset).map(([k, v]) => `[data-${k}="${v}"]`).join('')));
  const pos = a && a.selectionStart; const y = window.scrollY;
  if (tab === 'newrec') return;
  render(); window.scrollTo(0, y);
  if (id) { const n = a.id ? document.getElementById(a.id) : document.querySelector(id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (_) {} } }
}
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'r_cat') {
    const c = ITEMS.find(i => i.id === t.value);
    $('#r_elster').textContent = 'ELSTER: ' + (c ? c.e : '');
    $('#shareBox').hidden = !(c && c.share);
  } else if (t.dataset.sitetype) {
    S.sites.find(s => s.id === t.dataset.sitetype).type = t.value; await save(); render();
  } else if (t.id === 'yearSel') { S.year = +t.value; yd(); await save(); render(); }
  else if (t.dataset.kurs && t.type === 'checkbox') render();
});

async function onPhoto(e) {
  const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f || !draft) return;
  try {
    const b = await shrink(f);
    if (!draft.isNew && draft.photo && !draft.oldPhoto) draft.oldPhoto = draft.photo;
    draft.photo = uid(); draft.photoBlob = b; render();
    toast(`Foto verkleinert auf ${Math.round(b.size / 1024)} KB`);
  } catch (_) { toast('Das Foto konnte nicht gelesen werden'); }
}
$('#fileCam').addEventListener('change', onPhoto);
$('#fileGal').addEventListener('change', onPhoto);
$('#fileImp').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) doImport(f); });
$('#setBtn').addEventListener('click', () => { if (!unlocked) return; tab = 'set'; render(); window.scrollTo(0, 0); });
$('#fontBtn').addEventListener('click', async () => { S.font = S.font === 2 ? 1 : 2; await save(); render(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && S.lock.mode !== 'none') { window._hiddenAt = Date.now(); }
  else if (!document.hidden && S.lock.mode !== 'none' && window._hiddenAt && Date.now() - window._hiddenAt > 60000 && unlocked) {
    unlocked = false; showLock();
  }
});

/* ---------- Start ---------- */
(async function init() {
  try {
    await DB.open();
    const st = await DB.get('kv', 'state');
    if (st) S = Object.assign(newState(), st);
    else await save();
    if (navigator.storage && navigator.storage.persist) { try { await navigator.storage.persist(); } catch (_) {} }
  } catch (e) {
    $('#main').innerHTML = '<div class="card">Der Speicher des Browsers ist nicht erreichbar. Bitte die App nicht im privaten Modus öffnen.</div>';
    return;
  }
  yd();
  if (S.lock.mode === 'none') { unlocked = true; render(); } else { renderTabs(); showLock(); }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
