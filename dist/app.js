import { sampleBank, geometrySteps } from './questions.js';
import { SECTIONS, validateBank, emptyProgress, restoreProgress, attemptFor, selectAnswer, submitAnswer, stats, filteredQuestions, loadSession, saveSession } from './model.js';

const $ = s => document.querySelector(s);
const letters = 'ABCDE';
const sample = validateBank(sampleBank);
let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw Error(); }, setItem() { throw Error(); } }; }
const session = loadSession(storage, sample);
let filter = 'all', solution = null, stage = 0;
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (value !== null && value !== false) node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) if (child != null) node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  return node;
}
const button = (label, attrs, action) => el('button', { type: 'button', ...attrs, onclick: action }, label);
function persist() {
  const ok = saveSession(storage, session);
  $('#save-status').textContent = ok ? 'Bu cihazda kaydedildi' : 'Kayıt yapılamadı · yalnızca bu oturum';
  $('#save-status').classList.toggle('error', !ok);
}
function focusQuestion() { $('#question-heading')?.focus({ preventScroll: true }); $('#question-container').scrollIntoView({ block: 'start', behavior: 'instant' }); }
function changeQuestion(q, focus = true) {
  session.progress.active = q.id; session.progress.section = q.section; solution = null; stage = 0; persist(); render(); if (focus) focusQuestion();
}
function changeFilter(value) {
  filter = value; solution = null; stage = 0;
  const list = filteredQuestions(session.bank, session.progress, filter);
  if (list.length && !list.some(q => q.id === session.progress.active)) session.progress.active = list[0].id;
  persist(); render();
}
function renderSummary() {
  const s = stats(session.bank, session.progress);
  $('#summary').replaceChildren(el('div', { class: 'summary' },
    el('div', { class: 'summary-top' }, el('strong', {}, String(s.done), el('span', {}, ' / ' + s.total)), el('span', {}, 'soru tamamlandı')),
    el('div', { class: 'progress-track', role: 'progressbar', 'aria-label': 'Tamamlanan sorular', 'aria-valuemin': 0, 'aria-valuemax': s.total, 'aria-valuenow': s.done }, el('div', { class: 'progress-fill', style: `width:${s.done / s.total * 100}%` })),
    el('div', { class: 'summary-bottom' }, el('span', {}, el('b', {}, String(s.correct)), ' doğru'), el('span', {}, el('b', {}, String(s.wrong)), ' yanlış')),
    s.done === s.total ? el('p', { class: 'summary-complete', role: 'status' }, 'Koleksiyon tamamlandı. Yanlışlarını tekrar gözden geçirebilirsin.') : null));
  $('#collection-title').textContent = session.bank.title;
  $('#collection-note').textContent = session.mode === 'sample' ? '12 özgün örnek · Sayısal + Sözel' : 'Cihazındaki soru paketi';
  $('#mode-tag').textContent = session.mode === 'sample' ? 'ÖZGÜN ÖRNEKLER' : 'İÇE AKTARILAN PAKET';
}
function renderNavigation() {
  $('#section-switch').replaceChildren(...Object.entries(SECTIONS).map(([key, title]) => sectionButton(key, title, stats(session.bank, session.progress, key))));
  const inSection = session.bank.questions.filter(q => q.section === session.progress.section);
  const list = filteredQuestions(session.bank, session.progress, filter);
  $('#section-count').textContent = list.length + ' soru';
  $('#filters').replaceChildren(...[['all', 'Tümü'], ['wrong', 'Yanlışlar'], ['saved', 'Kaydedilenler']].map(([value, title]) => button(title, { class: 'filter', 'aria-pressed': String(filter === value) }, () => changeFilter(value))));
  $('#question-nav').replaceChildren(el('div', { class: 'nav-title' }, SECTIONS[session.progress.section] + ' · Soru haritası'), el('div', { class: 'question-grid' }, ...inSection.map((q, i) => {
    const a = attemptFor(session.progress, q.id), result = a.submitted ? (a.selected === q.answer ? 'correct' : 'wrong') : '';
    const status = a.submitted ? (result === 'correct' ? 'doğru' : 'yanlış') : a.selected !== null ? 'seçim yapıldı, gönderilmedi' : 'cevaplanmadı';
    const b = button('', { class: `map-button ${result} ${session.progress.active === q.id ? 'current' : ''}`, 'aria-current': session.progress.active === q.id ? 'true' : null, 'aria-label': `${i + 1}. soru, ${status}${a.bookmarked ? ', kaydedildi' : ''}` }, () => { filter = 'all'; changeQuestion(q); });
    b.append(String(i + 1), a.submitted ? el('span', { 'aria-hidden': 'true' }, result === 'correct' ? ' ✓' : ' ×') : '');
    if (a.bookmarked) b.append(el('span', { class: 'bookmark-mark', 'aria-hidden': 'true' }, '★'));
    return b;
  })));
}
function sectionButton(key, title, s) {
  const b = button('', { class: 'section-button', 'aria-pressed': String(session.progress.section === key), disabled: s.total === 0 }, () => {
    filter = 'all'; changeQuestion(session.bank.questions.find(q => q.section === key), false);
  });
  b.append(el('span', { class: 'section-symbol', 'aria-hidden': 'true' }, key === 'sayisal' ? '∑' : 'Aa'), el('span', {}, title), el('span', { class: 'count' }, `${s.done}/${s.total}`));
  return b;
}
function geometry(currentStage, interactive = false) {
  // Original vector diagram. No pixels or paths from the supplied exam/reference.
  const frame = el('div', { class: 'geometry-frame' }, el('div', { class: 'diagram-label' }, el('span', {}, interactive ? 'ŞEKİL ÜZERİNDE KEŞFET' : 'ÖZGÜN GEOMETRİ ÖRNEĞİ'), el('span', {}, 'Çizim ölçekli değildir')));
  const holder = el('div');
  holder.innerHTML = `<svg class="geometry" viewBox="0 0 400 290" role="img" aria-label="CA ve CB kenarları eşit ABC üçgeni. A açısı 55 derece. D, AB’nin orta noktası. x, ACD açısı.">
    <path class="edge" d="M60 245 L200 45 L340 245 Z"/>
    <path class="median" d="M200 45 V245"/>
    <path class="edge" d="M119 141 l12 8 M269 149 l12 -8 M127 239 v12 M133 239 v12 M267 239 v12 M273 239 v12"/>
    <text x="40" y="259">A</text><text x="346" y="259">B</text><text x="195" y="29">C</text><text x="195" y="270">D</text>
    <text class="given" x="91" y="231">55°</text><text class="given" x="177" y="101">${currentStage === 4 ? '' : 'x'}</text>
    <g class="highlight ${currentStage >= 1 ? 'visible' : ''}"><path d="M308 245 A32 32 0 0 1 321.7 218.8"/><text x="279" y="231">55°</text></g>
    <g class="highlight ${currentStage === 2 ? 'visible' : ''}"><path d="M174.2 81.9 A45 45 0 0 0 225.8 81.9"/><text x="226" y="94">70°</text></g>
    <g class="highlight ${currentStage >= 3 ? 'visible' : ''}"><path class="shade" d="M60 245 L200 45 V245 Z"/><path d="M200 45 V245"/><text x="106" y="190">I</text><text x="276" y="190">II</text></g>
    <g class="highlight final ${currentStage === 4 ? 'visible' : ''}"><path d="M177 78 A40 40 0 0 0 200 85"/><text x="115" y="120">x = 35°</text><text x="213" y="120">35°</text></g>
  </svg>`;
  frame.append(holder); return frame;
}
function solutionPanel(q) {
  const panel = el('section', { class: 'solution-panel', id: 'solution-panel', 'aria-label': solution === 'interactive' ? 'Etkileşimli çözüm' : 'Yazılı çözüm' });
  if (solution === 'written') {
    panel.append(el('h4', {}, 'Adım adım yazılı çözüm'));
    panel.append(q.explanation ? el('ol', { class: 'written-steps' }, ...q.explanation.map(p => el('li', {}, p))) : el('p', { class: 'missing-explanation' }, 'Bu soru için yazılı çözüm henüz eklenmedi. Doğru cevap gösteriliyor; ayrıntılı açıklama mevcut değil.'));
  } else {
    const step = geometrySteps[stage];
    panel.append(geometry(stage, true), el('div', { class: 'step-heading' }, el('span', {}, 'ÇÖZÜMÜN AKIŞI'), el('span', {}, `Adım ${stage} / 4`)), el('div', { class: 'step-dots', 'aria-label': 'Çözüm adımları' }, ...geometrySteps.map((s, i) => button(i === 0 ? 'Şekil' : String(i), { class: 'step-dot', 'aria-current': i === stage ? 'step' : null, 'aria-label': `${i}. adım: ${s.title}` }, () => { stage = i; renderCard(); $('#step-title').focus({ preventScroll: true }); }))), el('div', { class: 'step-explanation', 'aria-live': 'polite' }, el('h4', { id: 'step-title', tabindex: '-1' }, step.title), el('p', {}, step.body), el('span', { class: 'formula' }, step.formula)), el('div', { class: 'step-controls' }, button('← Önceki adım', { class: 'secondary', disabled: stage === 0 }, () => { stage--; renderCard(); $('#step-title').focus({ preventScroll: true }); }), button(stage === 4 ? 'Tamamlandı ✓' : stage === 0 ? 'İlk adım →' : 'Sonraki adım →', { class: 'primary', disabled: stage === 4 }, () => { stage++; renderCard(); $('#step-title').focus({ preventScroll: true }); })));
  }
  return panel;
}
function renderCard() {
  const list = filteredQuestions(session.bank, session.progress, filter);
  const target = $('#question-container');
  if (!list.length) {
    target.replaceChildren(el('section', { class: 'empty-state' }, el('h3', { id: 'question-heading', tabindex: '-1' }, filter === 'wrong' ? 'Burada yanlış soru yok.' : 'Henüz kaydettiğin soru yok.'), el('p', {}, filter === 'wrong' ? 'Cevapladığın yanlış sorular burada birikecek.' : 'Tekrar bakmak istediğin sorularda yıldız düğmesine dokun.'), button('Tüm sorulara dön', { class: 'primary' }, () => changeFilter('all')))); return;
  }
  const q = list.find(q => q.id === session.progress.active) || list[0];
  const a = attemptFor(session.progress, q.id), idx = list.indexOf(q);
  const sectionQuestions = session.bank.questions.filter(x => x.section === q.section);
  const card = el('article', { class: 'question-card', 'aria-labelledby': 'question-heading' });
  card.append(el('div', { class: 'question-meta' }, el('span', { class: 'topic' }, q.topic), button(a.bookmarked ? '★ Kaydedildi' : '☆ Kaydet', { class: 'bookmark', 'aria-pressed': String(a.bookmarked), 'aria-label': a.bookmarked ? 'Soruyu kaydedilenlerden çıkar' : 'Soruyu tekrar için kaydet' }, () => { session.progress.attempts[q.id] = { ...a, bookmarked: !a.bookmarked }; persist(); render(); })), el('span', { class: 'question-index' }, `${SECTIONS[q.section]} / Soru ${sectionQuestions.indexOf(q) + 1 < 10 ? '0' : ''}${sectionQuestions.indexOf(q) + 1}`), el('h3', { id: 'question-heading', tabindex: '-1' }, q.title), el('span', { class: 'source-label' }, session.mode === 'sample' ? 'Özgün örnek · Resmî sınav sorusu değildir' : 'İçe aktarıldı · Kaynak kontrolü yapılmadı'));
  if (q.passage) card.append(el('p', { class: 'passage' }, q.passage));
  card.append(el('p', { class: 'prompt', id: 'question-prompt' }, q.prompt));
  if (q.diagram && solution !== 'interactive') card.append(geometry(0));
  const options = el('fieldset', { class: 'option-list', disabled: a.submitted }, el('legend', { class: 'sr-only' }, 'Cevabını seç'));
  q.options.forEach((option, i) => {
    const selected = a.selected === i;
    const label = el('label', { class: `option ${selected ? 'selected' : ''} ${a.submitted && i === q.answer ? 'correct' : ''} ${a.submitted && selected && i !== q.answer ? 'wrong' : ''}` }, el('input', { type: 'radio', name: 'answer', value: i, checked: selected, 'aria-describedby': 'question-prompt', onchange: () => {
      if (selectAnswer(session.progress, q, i)) { persist(); render(); $(`input[name="answer"][value="${i}"]`)?.focus({ preventScroll: true }); }
    } }), el('span', { class: 'option-letter', 'aria-hidden': 'true' }, letters[i]), el('span', { class: 'option-text' }, option));
    if (a.submitted && (i === q.answer || selected)) label.append(el('span', { class: 'answer-mark' }, i === q.answer ? '✓ Doğru cevap' : '× Senin cevabın'));
    options.append(label);
  });
  card.append(options);
  if (!a.submitted) card.append(el('div', { class: 'answer-actions' }, el('p', { class: 'answer-hint' }, a.selected === null ? 'Önce bir seçenek işaretle.' : 'Hazırsan cevabını kontrol et.'), button('Cevabı kontrol et →', { class: 'primary', disabled: a.selected === null }, () => { if (submitAnswer(session.progress, q)) { persist(); render(); $('#answer-result').focus({ preventScroll: true }); } })));
  else {
    const correct = a.selected === q.answer;
    card.append(el('div', { id: 'answer-result', class: `result ${correct ? '' : 'incorrect'}`, role: 'status', tabindex: '-1' }, el('strong', {}, correct ? '✓ Doğru cevap, güzel bir adım.' : 'Birlikte yeniden bakalım.'), el('p', {}, `Senin cevabın: ${letters[a.selected]} · Doğru cevap: ${letters[q.answer]} (${q.options[q.answer]})`)), el('div', { class: 'solution-toolbar' }, ...[['written', q.explanation ? 'Yazılı çözümü oku' : 'Yazılı çözüm eklenmedi'], ...(q.interactive ? [['interactive', '✳ Şekil üzerinde keşfet']] : [])].map(([type, label]) => button(label, { class: 'solution-button', 'aria-expanded': String(solution === type), 'aria-controls': solution === type ? 'solution-panel' : null }, () => { solution = solution === type ? null : type; stage = 0; renderCard(); if (solution) $('#solution-panel').scrollIntoView({ behavior: 'instant', block: 'nearest' }); })), button('Yeniden dene', { class: 'solution-button' }, () => { session.progress.attempts[q.id] = { selected: null, submitted: false, bookmarked: a.bookmarked }; solution = null; persist(); render(); focusQuestion(); })));
    if (solution) card.append(solutionPanel(q));
  }
  const footer = el('nav', { class: 'question-footer', 'aria-label': 'Sorular arasında gezin' }, button('← Önceki soru', { class: 'secondary', disabled: idx === 0 }, () => changeQuestion(list[idx - 1])), el('span', { class: 'muted' }, `${idx + 1} / ${list.length}`), button(idx === list.length - 1 ? 'Son sorudasın' : 'Sonraki soru →', { class: 'secondary next', disabled: idx === list.length - 1 }, () => changeQuestion(list[idx + 1])));
  target.replaceChildren(card, footer);
}
function render() {
  const list = filteredQuestions(session.bank, session.progress, filter);
  if (list.length && !list.some(q => q.id === session.progress.active)) { session.progress.active = list[0].id; persist(); }
  renderSummary(); renderNavigation(); renderCard();
}
function switchBank(mode) {
  session.saved[session.bank.id] = session.progress;
  session.mode = mode; session.bank = mode === 'sample' ? sample : session.importedBank;
  session.progress = restoreProgress(session.bank, session.saved[session.bank.id]);
  filter = 'all'; solution = null; stage = 0; persist(); render(); renderBankActions();
}
function renderBankActions() {
  $('#bank-actions').replaceChildren(...(session.importedBank ? [button(session.mode === 'sample' ? 'İçe aktarılan pakete geç' : 'Özgün örneklere dön', { class: 'secondary' }, () => { switchBank(session.mode === 'sample' ? 'imported' : 'sample'); $('#import-status').textContent = 'Koleksiyon değiştirildi.'; })] : []));
}
$('#settings-open').addEventListener('click', () => { renderBankActions(); $('#settings').showModal(); });
$('#settings-close').addEventListener('click', () => $('#settings').close());
$('#reset-progress').addEventListener('click', () => {
  if (!window.confirm('Bu koleksiyondaki cevaplar ve kaydedilen sorular silinsin mi?')) return;
  session.progress = emptyProgress(session.bank); filter = 'all'; solution = null; stage = 0; persist(); render(); $('#import-status').textContent = 'Bu koleksiyonun ilerlemesi sıfırlandı.';
});
$('#bank-file').addEventListener('change', async event => {
  const input = event.currentTarget, file = input.files[0];
  if (!file) return;
  try {
    if (!$('#rights-confirm').checked) throw Error('Önce içerik kullanım hakkı onayını işaretle.');
    if (file.size > 1024 * 1024) throw Error('Dosya en fazla 1 MB olabilir.');
    const bank = validateBank(JSON.parse(await file.text()), true);
    if (bank.id === sample.id) throw Error('Paket kimliği başlangıç koleksiyonuyla aynı olamaz.');
    session.saved[session.bank.id] = session.progress;
    session.importedBank = bank; switchBank('imported');
    $('#import-status').textContent = `${bank.questions.length} soru yüklendi. Kaynak doğrulaması yapılmadı.`;
    $('#rights-confirm').checked = false;
  } catch (error) { $('#import-status').textContent = error instanceof SyntaxError ? 'JSON dosyası okunamadı. Lütfen dosya biçimini kontrol et.' : error.message; }
  finally { input.value = ''; }
});
render(); persist();
