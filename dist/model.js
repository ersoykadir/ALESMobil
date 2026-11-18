export const STORAGE_KEY = 'alesmobil.study.v1';
export const SECTIONS = { sayisal: 'Sayısal', sozel: 'Sözel' };
const text = (v, max = 6000) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const plain = v => v && typeof v === 'object' && !Array.isArray(v);
const safeId = v => text(v, 100) && /^[a-zA-Z0-9_-]+$/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
export function validateBank(value, imported = false) {
  if (!plain(value) || value.schemaVersion !== 1 || !safeId(value.id) || !text(value.title, 150)) throw new Error('Soru paketi sürüm 1, geçerli kimlik ve başlık içermeli.');
  if (!plain(value.license) || !['original', 'licensed'].includes(value.license.kind) || !text(value.license.statement, 2000)) throw new Error('Özgün içerik veya kullanım izni açıklaması gerekli.');
  if (!Array.isArray(value.questions) || value.questions.length < 1 || value.questions.length > 200) throw new Error('Paket 1–200 soru içermeli.');
  const ids = new Set();
  const questions = value.questions.map(q => {
    if (!plain(q) || !safeId(q.id) || ids.has(q.id)) throw new Error('Soru kimlikleri benzersiz olmalı; yalnızca harf, sayı, alt çizgi ve kısa çizgi içerebilir.');
    ids.add(q.id);
    if (!Object.hasOwn(SECTIONS, q.section) || !text(q.topic, 100) || !text(q.title, 150) || !text(q.prompt)) throw new Error('Her soru için bölüm, konu, başlık ve soru metni gerekli.');
    if (q.passage != null && !text(q.passage)) throw new Error('Paragraf metni geçersiz.');
    if (!Array.isArray(q.options) || q.options.length !== 5 || !q.options.every(o => text(o, 2000)) || new Set(q.options).size !== 5 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 4) throw new Error('Her soruda 5 farklı seçenek ve 0–4 arası doğru cevap indeksi gerekli.');
    if (q.explanation != null && (!Array.isArray(q.explanation) || q.explanation.length < 1 || q.explanation.length > 12 || !q.explanation.every(e => text(e)))) throw new Error('Çözüm adımları metin listesi veya null olmalı.');
    if (imported && (q.diagram || q.interactive)) throw new Error('İçe aktarılan paketlerde çizim veya çalıştırılabilir etkileşim desteklenmiyor.');
    if (q.interactive && q.interactive !== 'isosceles-v1') throw new Error('Bilinmeyen etkileşim.');
    return { id: q.id, section: q.section, topic: q.topic, title: q.title, prompt: q.prompt,
      options: [...q.options], answer: q.answer, passage: q.passage || null,
      explanation: q.explanation ? [...q.explanation] : null,
      diagram: imported ? null : q.diagram || null, interactive: imported ? null : q.interactive || null,
      // Importing a file never constitutes a source/PDF review.
      provenance: { kind: imported ? 'imported' : 'original', verification: 'unverified' } };
  });
  return { schemaVersion: 1, id: value.id, title: value.title, license: { kind: value.license.kind, statement: value.license.statement }, questions };
}
export function signature(bank) { return JSON.stringify(bank); }
export function emptyProgress(bank) {
  return { signature: signature(bank), section: bank.questions[0].section, active: bank.questions[0].id, attempts: {} };
}
export function restoreProgress(bank, raw) {
  const state = emptyProgress(bank);
  if (!plain(raw) || raw.signature !== state.signature) return state;
  if (Object.hasOwn(SECTIONS, raw.section) && bank.questions.some(q => q.section === raw.section)) state.section = raw.section;
  if (bank.questions.some(q => q.id === raw.active && q.section === state.section)) state.active = raw.active;
  else state.active = bank.questions.find(q => q.section === state.section).id;
  for (const q of bank.questions) {
    const a = plain(raw.attempts) ? raw.attempts[q.id] : null;
    if (!plain(a)) continue;
    const selected = Number.isInteger(a.selected) && a.selected >= 0 && a.selected < 5 ? a.selected : null;
    state.attempts[q.id] = { selected, submitted: selected !== null && a.submitted === true, bookmarked: a.bookmarked === true };
  }
  return state;
}
export function attemptFor(state, id) { return (Object.hasOwn(state.attempts, id) ? state.attempts[id] : null) || { selected: null, submitted: false, bookmarked: false }; }
export function selectAnswer(state, q, selected) {
  if (attemptFor(state, q.id).submitted || !Number.isInteger(selected) || selected < 0 || selected > 4) return false;
  state.attempts[q.id] = { ...attemptFor(state, q.id), selected }; return true;
}
export function submitAnswer(state, q) {
  const a = attemptFor(state, q.id);
  if (a.selected === null || a.submitted) return false;
  state.attempts[q.id] = { ...a, submitted: true }; return true;
}
export function stats(bank, state, section) {
  const questions = bank.questions.filter(q => !section || q.section === section);
  let done = 0, correct = 0;
  for (const q of questions) {
    const a = attemptFor(state, q.id);
    if (a.submitted) { done++; if (a.selected === q.answer) correct++; }
  }
  return { total: questions.length, done, correct, wrong: done - correct };
}
export function filteredQuestions(bank, state, filter) {
  return bank.questions.filter(q => q.section === state.section && (filter === 'all' || (filter === 'saved' && attemptFor(state, q.id).bookmarked) || (filter === 'wrong' && attemptFor(state, q.id).submitted && attemptFor(state, q.id).selected !== q.answer)));
}
export function loadSession(storage, sample) {
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY));
    const importedBank = raw?.importedBank ? validateBank(raw.importedBank, true) : null;
    const bank = raw?.mode === 'imported' && importedBank ? importedBank : sample;
    const progress = restoreProgress(bank, raw?.progress?.[bank.id]);
    return { bank, importedBank, mode: bank === sample ? 'sample' : 'imported', progress, saved: plain(raw?.progress) ? raw.progress : {}, available: true };
  } catch { return { bank: sample, importedBank: null, mode: 'sample', progress: emptyProgress(sample), saved: {}, available: false }; }
}
export function saveSession(storage, session) {
  try {
    session.saved[session.bank.id] = session.progress;
    storage.setItem(STORAGE_KEY, JSON.stringify({ mode: session.mode, importedBank: session.importedBank, progress: session.saved }));
    return true;
  } catch { return false; }
}
