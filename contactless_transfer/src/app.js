'use strict';

// ===== STATE =====
const state = {
  users: JSON.parse(localStorage.getItem('pt_users') || '{}'),
  currentUser: null,
  transactions: [],
  pendingAmount: 0,
  pendingNote: '',
  sendAmountStr: '0',
  pin: '',
};

// ===== STORAGE =====
function saveUsers() { localStorage.setItem('pt_users', JSON.stringify(state.users)); }

function getUser(name) {
  if (!state.users[name]) {
    state.users[name] = { balance: 1000, transactions: [] };
    saveUsers();
  }
  return state.users[name];
}

// ===== SCREEN NAV =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active', 'slide-out');
  });
  const next = document.getElementById('screen-' + id);
  if (next) {
    requestAnimationFrame(() => next.classList.add('active'));
  }
}

// ===== FORMAT CURRENCY =====
function fmt(n) {
  return '$' + parseFloat(n).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== BUILD TX ITEM =====
function buildTxItem(tx) {
  const div = document.createElement('div');
  div.className = 'tx-item';
  const isSent = tx.type === 'sent';
  div.innerHTML = `
    <div class="tx-icon ${isSent ? 'sent' : 'received'}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${isSent
          ? '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'
          : '<polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/>'}
      </svg>
    </div>
    <div class="tx-info">
      <div class="tx-name">${isSent ? 'Envoyé (NFC)' : 'Reçu (NFC)'}</div>
      <div class="tx-date">${tx.note ? tx.note + ' · ' : ''}${tx.date}</div>
    </div>
    <div class="tx-amount ${isSent ? 'sent' : 'received'}">
      ${isSent ? '-' : '+'}${fmt(tx.amount)}
    </div>
  `;
  return div;
}

// ===== REFRESH HOME =====
function refreshHome() {
  const u = state.currentUser;
  const data = getUser(u);
  document.getElementById('home-username').textContent = u;
  document.getElementById('home-balance').textContent = fmt(data.balance);

  const list = document.getElementById('recent-list');
  list.innerHTML = '';
  const txs = [...data.transactions].reverse().slice(0, 5);
  if (txs.length === 0) {
    list.innerHTML = '<p class="empty-msg">Aucune transaction</p>';
  } else {
    txs.forEach(tx => list.appendChild(buildTxItem(tx)));
  }
}

// ===== REFRESH HISTORY =====
function refreshHistory() {
  const data = getUser(state.currentUser);
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  const txs = [...data.transactions].reverse();
  if (txs.length === 0) {
    list.innerHTML = '<p class="empty-msg" style="margin-top:40px">Aucune transaction</p>';
  } else {
    txs.forEach(tx => list.appendChild(buildTxItem(tx)));
  }
}

// ===== PIN PAD =====
function initPinPad() {
  const pins = document.querySelectorAll('.pin-btn');
  const dots = document.querySelectorAll('.pin-row span');
  let pin = '';

  function updateDots() {
    dots.forEach((d, i) => {
      d.classList.toggle('filled', i < pin.length);
    });
  }

  pins.forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.v;
      if (v === 'C') {
        pin = pin.slice(0, -1);
        updateDots();
      } else if (v === 'OK') {
        const username = document.getElementById('login-user').value.trim();
        if (!username) { alert('Entrez un nom d\'utilisateur'); return; }
        if (pin.length < 4) { alert('Entrez un code PIN de 4 chiffres'); return; }
        state.currentUser = username;
        getUser(username);
        refreshHome();
        showScreen('home');
        pin = '';
        updateDots();
      } else {
        if (pin.length < 4) {
          pin += v;
          updateDots();
        }
      }
    });
  });
}

// ===== NUMPAD (SEND) =====
function initNumpad() {
  state.sendAmountStr = '0';
  const display = document.getElementById('send-amount-display');

  document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.v;
      if (v === 'DEL') {
        state.sendAmountStr = state.sendAmountStr.length > 1
          ? state.sendAmountStr.slice(0, -1)
          : '0';
      } else if (v === '.') {
        if (!state.sendAmountStr.includes('.')) {
          state.sendAmountStr += '.';
        }
      } else {
        if (state.sendAmountStr === '0') {
          state.sendAmountStr = v;
        } else {
          const parts = state.sendAmountStr.split('.');
          if (parts.length === 2 && parts[1].length >= 2) return;
          state.sendAmountStr += v;
        }
      }
      display.textContent = state.sendAmountStr;
    });
  });
}

// ===== QR CODE (simple canvas renderer) =====
function drawQR(canvas, text) {
  // Use qrcode.js if loaded, otherwise show text-only placeholder
  if (typeof QRCode !== 'undefined') {
    canvas.width = 160; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 160, 160);
    try {
      // Generate QR with the library
      const qr = new QRCode(0, QRCode.QRErrorCorrectionLevel.M);
      qr.addData(text);
      qr.make();
      const mod = qr.getModuleCount();
      const size = Math.floor(160 / mod);
      ctx.fillStyle = '#000';
      for (let r = 0; r < mod; r++) {
        for (let c = 0; c < mod; c++) {
          if (qr.isDark(r, c)) ctx.fillRect(c * size, r * size, size, size);
        }
      }
    } catch(e) {
      // fallback
      ctx.fillStyle = '#6c63ff';
      ctx.font = '10px monospace';
      ctx.fillText(text.substring(0, 20), 8, 80);
    }
  } else {
    drawSimpleQR(canvas, text);
  }
}

function drawSimpleQR(canvas, text) {
  // Minimal visual placeholder when QR lib absent
  canvas.width = 160; canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 160, 160);
  ctx.fillStyle = '#111';
  const hash = [...text].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (seed) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed; };
  let s = hash;
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 20; c++) {
      s = rng(s + r * 20 + c);
      if (s % 2 === 0) ctx.fillRect(8 + c * 7, 8 + r * 7, 6, 6);
    }
  }
  // Corner markers
  [[0,0],[13,0],[0,13]].forEach(([cr, cc]) => {
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.strokeRect(8 + cc * 7, 8 + cr * 7, 7*7, 7*7);
    ctx.fillRect(12 + cc * 7, 12 + cr * 7, 5*7, 5*7);
    ctx.fillStyle = '#fff';
    ctx.fillRect(16 + cc * 7, 16 + cr * 7, 3*7, 3*7);
    ctx.fillStyle = '#111';
    ctx.fillRect(18 + cc * 7, 18 + cr * 7, 7, 7);
  });
}

// ===== NFC TRANSFER =====
// Uses localStorage as a shared channel for same-device demo,
// and Web NFC API (NDEFReader) when available on Android Chrome.

const NFC_KEY = 'pt_nfc_pending';

function activateSend(amount, note) {
  const token = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    sender: state.currentUser,
    amount: parseFloat(amount),
    note,
    ts: Date.now(),
  };
  localStorage.setItem(NFC_KEY, JSON.stringify(token));

  document.getElementById('nfc-send-amount').textContent = fmt(token.amount);
  document.getElementById('nfc-send-status').textContent = 'NFC actif – approchez les téléphones';
  drawQR(document.getElementById('qr-canvas'), JSON.stringify(token));

  // Try Web NFC API (Android Chrome 89+)
  if ('NDEFReader' in window) {
    const ndef = new NDEFReader();
    ndef.write({ records: [{ recordType: 'text', data: JSON.stringify(token) }] })
      .then(() => {
        document.getElementById('nfc-send-status').textContent = 'NFC prêt – posez les téléphones';
      })
      .catch(err => {
        document.getElementById('nfc-send-status').textContent = 'NFC: ' + err.message;
      });
  }
}

function activateReceive() {
  const statusEl = document.getElementById('nfc-receive-status');
  statusEl.textContent = 'NFC activé – en attente...';

  if ('NDEFReader' in window) {
    const ndef = new NDEFReader();
    ndef.scan().then(() => {
      statusEl.textContent = 'Scanner NFC actif...';
      ndef.addEventListener('reading', ({ message }) => {
        for (const rec of message.records) {
          if (rec.recordType === 'text') {
            const decoder = new TextDecoder();
            try {
              const token = JSON.parse(decoder.decode(rec.data));
              completeReceive(token);
            } catch(e) { /* ignore */ }
          }
        }
      });
    }).catch(err => {
      statusEl.textContent = 'NFC non disponible: ' + err.message;
    });
  }

  // Poll localStorage for same-device simulation
  const pollId = setInterval(() => {
    const raw = localStorage.getItem(NFC_KEY);
    if (raw) {
      try {
        const token = JSON.parse(raw);
        if (Date.now() - token.ts < 120000) {
          clearInterval(pollId);
          completeReceive(token);
        }
      } catch(e) { /* skip */ }
    }
  }, 500);
  window._receivePollId = pollId;
}

function completeReceive(token) {
  clearInterval(window._receivePollId);
  localStorage.removeItem(NFC_KEY);

  const receiverData = getUser(state.currentUser);
  const senderData = state.users[token.sender];

  if (senderData) {
    if (senderData.balance < token.amount) {
      alert('Solde insuffisant chez l\'envoyeur.');
      return;
    }
    senderData.balance = +(senderData.balance - token.amount).toFixed(2);
    senderData.transactions.push({
      type: 'sent',
      amount: token.amount,
      note: token.note,
      date: new Date().toLocaleDateString('fr-CA'),
    });
  }

  receiverData.balance = +(receiverData.balance + token.amount).toFixed(2);
  receiverData.transactions.push({
    type: 'received',
    amount: token.amount,
    note: token.note,
    date: new Date().toLocaleDateString('fr-CA'),
  });
  saveUsers();

  showSuccessScreen({
    amount: token.amount,
    type: 'received',
    sender: token.sender,
    note: token.note,
  });
}

function completeSend(amount, note) {
  const data = getUser(state.currentUser);
  if (data.balance < amount) {
    alert('Solde insuffisant.');
    return;
  }
  data.balance = +(data.balance - amount).toFixed(2);
  data.transactions.push({
    type: 'sent',
    amount,
    note,
    date: new Date().toLocaleDateString('fr-CA'),
  });
  saveUsers();

  showSuccessScreen({
    amount,
    type: 'sent',
    sender: state.currentUser,
    note,
  });
}

// ===== SUCCESS SCREEN =====
function showSuccessScreen({ amount, type, sender, note }) {
  document.getElementById('success-amount').textContent = fmt(amount);
  document.getElementById('success-msg').textContent =
    type === 'sent'
      ? 'Votre transfert a été envoyé avec succès.'
      : `Vous avez reçu ${fmt(amount)} de ${sender}.`;

  const details = document.getElementById('success-details');
  const now = new Date();
  const rows = [
    ['Date', now.toLocaleDateString('fr-CA')],
    ['Heure', now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })],
    ['Type', type === 'sent' ? 'Envoi NFC' : 'Réception NFC'],
    ...(note ? [['Note', note]] : []),
    ['Statut', 'Confirmé'],
  ];
  details.innerHTML = rows.map(([k, v]) =>
    `<div class="detail-row"><span>${k}</span><span>${v}</span></div>`
  ).join('');

  showScreen('success');

  // Auto-refresh home data in background
  if (state.currentUser) {
    const data = getUser(state.currentUser);
    document.getElementById('home-balance').textContent = fmt(data.balance);
  }
}

// ===== BACK BUTTONS =====
document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    stopScanner();
    if (window._receivePollId) clearInterval(window._receivePollId);
    if (target === 'home') { refreshHome(); }
    showScreen(target);
  });
});

// ===== BUTTON WIRING =====
document.getElementById('btn-logout').addEventListener('click', () => {
  stopScanner();
  state.currentUser = null;
  showScreen('login');
});

document.getElementById('btn-go-send').addEventListener('click', () => {
  state.sendAmountStr = '0';
  document.getElementById('send-amount-display').textContent = '0';
  document.getElementById('send-note').value = '';
  showScreen('send');
});

document.getElementById('btn-go-receive').addEventListener('click', () => {
  document.getElementById('nfc-receive-status').textContent = 'NFC activé – en attente...';
  showScreen('receive');
  activateReceive();
});

document.getElementById('btn-go-history').addEventListener('click', () => {
  refreshHistory();
  showScreen('history');
});

document.getElementById('btn-activate-send').addEventListener('click', () => {
  const amount = parseFloat(state.sendAmountStr);
  if (!amount || amount <= 0) { alert('Entrez un montant valide'); return; }
  const data = getUser(state.currentUser);
  if (data.balance < amount) { alert('Solde insuffisant'); return; }
  state.pendingAmount = amount;
  state.pendingNote = document.getElementById('send-note').value.trim();
  showScreen('nfc-send');
  activateSend(amount, state.pendingNote);
});

document.getElementById('btn-simulate-send').addEventListener('click', () => {
  document.getElementById('nfc-send-status').textContent = 'Transfert en cours...';
  setTimeout(() => {
    completeSend(state.pendingAmount, state.pendingNote);
  }, 800);
});

// ===== QR CAMERA SCANNER =====
let scanStream = null;
let scanRAF = null;

function stopScanner() {
  if (scanRAF) { cancelAnimationFrame(scanRAF); scanRAF = null; }
  if (scanStream) {
    scanStream.getTracks().forEach(t => t.stop());
    scanStream = null;
  }
  document.getElementById('scanner-box').classList.remove('active');
}

async function startScanner() {
  const box = document.getElementById('scanner-box');
  const video = document.getElementById('qr-video');
  const statusEl = document.getElementById('nfc-receive-status');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('La caméra n\'est pas disponible. Une connexion HTTPS est requise.');
    return;
  }

  try {
    scanStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
  } catch (err) {
    alert('Accès caméra refusé : ' + err.message + '\n(HTTPS requis sur mobile)');
    return;
  }

  box.classList.add('active');
  video.srcObject = scanStream;
  video.setAttribute('playsinline', true);
  await video.play();
  statusEl.textContent = 'Visez le QR code de l\'envoyeur...';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  function tick() {
    if (!scanStream) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (typeof jsQR !== 'undefined') {
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data) {
          try {
            const token = JSON.parse(code.data);
            if (token && token.amount && token.sender) {
              statusEl.textContent = 'QR détecté !';
              stopScanner();
              setTimeout(() => completeReceive(token), 400);
              return;
            }
          } catch (e) { /* not our QR, keep scanning */ }
        }
      }
    }
    scanRAF = requestAnimationFrame(tick);
  }
  scanRAF = requestAnimationFrame(tick);
}

document.getElementById('btn-scan-qr').addEventListener('click', () => {
  if (scanStream) { stopScanner(); }
  else { startScanner(); }
});

document.getElementById('btn-simulate-receive').addEventListener('click', () => {
  const raw = localStorage.getItem(NFC_KEY);
  if (!raw) {
    alert('Aucun paiement en attente. L\'envoyeur doit d\'abord activer le transfert.');
    return;
  }
  try {
    const token = JSON.parse(raw);
    document.getElementById('nfc-receive-status').textContent = 'Signal détecté !';
    setTimeout(() => completeReceive(token), 600);
  } catch(e) {
    alert('Erreur de lecture du token NFC.');
  }
});

document.getElementById('btn-success-home').addEventListener('click', () => {
  refreshHome();
  showScreen('home');
});

// ===== SPLASH + BOOT =====
function boot() {
  initPinPad();
  initNumpad();

  const fill = document.querySelector('.loader-fill');
  setTimeout(() => {
    showScreen('login');
  }, 2000);
}

boot();
