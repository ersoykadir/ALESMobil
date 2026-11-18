import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sampleBank, geometrySteps } from '../dist/questions.js';
import { validateBank, emptyProgress, restoreProgress, selectAnswer, submitAnswer, attemptFor, stats, filteredQuestions, loadSession, saveSession, STORAGE_KEY } from '../dist/model.js';
const bank = validateBank(sampleBank);
const memory = () => { let value = null; return { getItem: () => value, setItem: (key, v) => { assert.equal(key, STORAGE_KEY); value = v; } }; };

test('answer requires selection; submitted choice is locked and graded once', () => {
  const state = emptyProgress(bank), q = bank.questions[0];
  assert.equal(submitAnswer(state, q), false);
  assert.equal(selectAnswer(state, q, -1), false);
  assert.equal(selectAnswer(state, q, 4), true);
  assert.equal(selectAnswer(state, q, q.answer), true);
  assert.equal(stats(bank, state).done, 0);
  assert.equal(submitAnswer(state, q), true);
  assert.equal(submitAnswer(state, q), false);
  assert.equal(selectAnswer(state, q, 0), false);
  assert.deepEqual(stats(bank, state, 'sayisal'), { total: 6, done: 1, correct: 1, wrong: 0 });
});
test('both sections, wrong and saved filters, drafts and active question survive reload', () => {
  const storage = memory(), session = loadSession(storage, bank), q = bank.questions[0], verbal = bank.questions[6];
  selectAnswer(session.progress, q, 0); submitAnswer(session.progress, q);
  session.progress.attempts[q.id].bookmarked = true;
  selectAnswer(session.progress, verbal, 2);
  session.progress.active = verbal.id; session.progress.section = 'sozel';
  assert.equal(saveSession(storage, session), true);
  const loaded = loadSession(storage, bank);
  assert.equal(loaded.progress.active, verbal.id);
  assert.equal(attemptFor(loaded.progress, verbal.id).selected, 2);
  assert.equal(attemptFor(loaded.progress, verbal.id).submitted, false);
  loaded.progress.section = 'sayisal';
  assert.deepEqual(filteredQuestions(bank, loaded.progress, 'wrong').map(q => q.id), [q.id]);
  assert.deepEqual(filteredQuestions(bank, loaded.progress, 'saved').map(q => q.id), [q.id]);
});
test('changed question content invalidates saved results even with identical bank id', () => {
  const progress = emptyProgress(bank), q = bank.questions[0];
  selectAnswer(progress, q, q.answer); submitAnswer(progress, q);
  const revised = structuredClone(bank); revised.questions[0].answer = 1;
  assert.equal(stats(revised, restoreProgress(revised, progress)).done, 0);
});
test('bad storage, blocked access and full storage leave a usable session', () => {
  const corrupted = { getItem: () => '{', setItem: () => { throw Error('quota'); } };
  const loaded = loadSession(corrupted, bank);
  assert.equal(loaded.bank, bank);
  assert.equal(saveSession(corrupted, loaded), false);
  assert.equal(loadSession({ getItem() { throw Error('blocked'); } }, bank).available, false);
});
test('restore rejects invalid selections and cross-section active pointers', () => {
  const raw = emptyProgress(bank); raw.section = 'sozel'; raw.attempts[bank.questions[0].id] = { selected: 99, submitted: true, bookmarked: true };
  const restored = restoreProgress(bank, raw);
  assert.equal(restored.active, bank.questions[6].id);
  assert.equal(attemptFor(restored, bank.questions[0].id).submitted, false);
});
test('import validates rights, ids, choices and explanations before replacing data', () => {
  for (const change of [b => { b.license.kind = 'unknown'; }, b => { b.questions[0].answer = 7; }, b => { b.questions[1].id = b.questions[0].id; }, b => { b.questions[0].id = '__proto__'; }, b => { b.id = '__proto__'; }, b => { b.questions[0].options = ['x']; }, b => { b.questions[0].explanation = 'text'; }]) {
    const invalid = structuredClone(sampleBank); change(invalid);
    assert.throws(() => validateBank(invalid));
  }
});
test('import never asserts PDF verification or accepts executable interactive content', () => {
  assert.throws(() => validateBank(sampleBank, true));
  const data = structuredClone(sampleBank); data.id = 'licensed-bank';
  for (const q of data.questions) { delete q.diagram; delete q.interactive; q.provenance = { kind: 'pdf', verification: 'verified', page: 15 }; }
  const imported = validateBank(data, true);
  assert.ok(imported.questions.every(q => q.provenance.verification === 'unverified' && q.provenance.kind === 'imported'));
  const storage = memory();
  const session = { bank: imported, importedBank: imported, mode: 'imported', progress: emptyProgress(imported), saved: {} };
  selectAnswer(session.progress, imported.questions[0], 1);
  saveSession(storage, session);
  const reloaded = loadSession(storage, bank);
  assert.equal(reloaded.mode, 'imported');
  assert.equal(attemptFor(reloaded.progress, imported.questions[0].id).selected, 1);
});
test('sample content is original, complete in both sections, and missing explanations stay explicit', () => {
  assert.equal(bank.questions.length, 12);
  assert.ok(bank.questions.every(q => q.provenance.kind === 'original' && q.provenance.verification !== 'verified'));
  assert.equal(bank.questions.filter(q => !q.explanation).length, 2);
  assert.equal(bank.questions[0].options[bank.questions[0].answer], '35°');
  assert.equal((180 - 55 - 55) / 2, 35);
  assert.equal(geometrySteps.length, 5);
});
