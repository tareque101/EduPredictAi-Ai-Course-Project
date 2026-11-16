// Run with:  npm test   (uses Node's built-in test runner, no extra packages)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, daysBetween, fmtHours, fmtMinutes, greeting, initialsOf, relativeDay } from './format.js';
import { parseQuickAdd } from './quickAdd.js';

const TODAY = '2026-11-11'; // a Wednesday

test('parseQuickAdd reads priority, category, weekday and estimate', () => {
  assert.deepEqual(parseQuickAdd('Finish report !high #study fri ~1h30m', TODAY), {
    title: 'Finish report', priority: 3, category: 'Study', due_date: '2026-11-13', estimate_min: 90,
  });
});

test('parseQuickAdd due dates', () => {
  assert.equal(parseQuickAdd('x tomorrow', TODAY).due_date, '2026-11-12');
  assert.equal(parseQuickAdd('x today', TODAY).due_date, TODAY);
  assert.equal(parseQuickAdd('x +3d', TODAY).due_date, '2026-11-14');
  assert.equal(parseQuickAdd('x 2026-12-01', TODAY).due_date, '2026-12-01');
  assert.equal(parseQuickAdd('Review wed', TODAY).due_date, '2026-11-18', 'same weekday means next week');
});

test('parseQuickAdd estimates and categories', () => {
  assert.equal(parseQuickAdd('Read ~2h', TODAY).estimate_min, 120);
  assert.equal(parseQuickAdd('Read ~45m', TODAY).estimate_min, 45);
  assert.equal(parseQuickAdd('Read ~45', TODAY).estimate_min, 45);
  assert.equal(parseQuickAdd('Lab #eca !low', TODAY).category, 'ECA');
  assert.equal(parseQuickAdd('Lab !low', TODAY).priority, 1);
});

test('parseQuickAdd keeps unknown tokens in the title', () => {
  assert.equal(parseQuickAdd('Fix #bug now', TODAY).title, 'Fix #bug now');
  assert.equal(parseQuickAdd('Buy monitor', TODAY).title, 'Buy monitor');
  assert.equal(parseQuickAdd('   ', TODAY).title, '');
});

test('date and format helpers', () => {
  assert.equal(addDays('2026-12-30', 3), '2027-01-02');
  assert.equal(daysBetween('2026-11-01', '2026-11-11'), 10);
  assert.equal(relativeDay('2026-11-10', TODAY), 'Yesterday');
  assert.equal(relativeDay('2026-11-14', TODAY), 'in 3d');
  assert.equal(fmtMinutes(95), '1h 35m');
  assert.equal(fmtMinutes(0), '0 min');
  assert.equal(fmtHours(0.5), '30 min');
  assert.equal(fmtHours(2), '2 h');
  assert.equal(greeting(9), 'Good morning');
  assert.equal(greeting(20), 'Good evening');
  assert.equal(initialsOf('tareq ahmed khan'), 'TA');
});
