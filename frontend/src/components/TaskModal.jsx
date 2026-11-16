import { useEffect, useState } from 'react';
import { Modal } from './ui.jsx';
import { useApp } from '../context/AppContext.jsx';

export const CATEGORIES = ['Study', 'Skill', 'ECA', 'Health', 'Personal'];
export const PRIORITY = { 1: 'Low', 2: 'Medium', 3: 'High' };
const EMPTY = { title: '', description: '', category: 'Study', priority: 2, due_date: '', estimate_min: '', skill_id: '' };

export default function TaskModal({ open, task, onClose }) {
  const { skills, taskActions } = useApp();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(task ? { ...EMPTY, ...task, description: task.description || '', due_date: task.due_date || '', estimate_min: task.estimate_min || '', skill_id: task.skill_id || '' } : EMPTY);
  }, [open, task]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title, description: form.description, category: form.category, priority: Number(form.priority),
      due_date: form.due_date || null, estimate_min: form.estimate_min ? Number(form.estimate_min) : null, skill_id: form.skill_id ? Number(form.skill_id) : null,
    };
    const result = task ? await taskActions.update(task.id, payload, 'Task updated') : await taskActions.add(payload);
    if (result) onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit task' : 'New task'}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="label">Title</span><input className="input" required maxLength={160} value={form.title} onChange={set('title')} autoFocus /></label>
        <label className="block"><span className="label">Notes</span><textarea className="input min-h-[70px]" maxLength={2000} value={form.description} onChange={set('description')} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="label">Category</span><select className="input" value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="block"><span className="label">Priority</span><select className="input" value={form.priority} onChange={set('priority')}>{Object.entries(PRIORITY).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="block"><span className="label">Due date</span><input type="date" className="input" value={form.due_date} onChange={set('due_date')} /></label>
          <label className="block"><span className="label">Estimate (minutes)</span><input type="number" min="1" max="1440" className="input" value={form.estimate_min} onChange={set('estimate_min')} placeholder="e.g. 45" /></label>
        </div>
        <label className="block"><span className="label">Counts as practice for skill</span>
          <select className="input" value={form.skill_id} onChange={set('skill_id')}>
            <option value="">None</option>
            {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <span className="mt-1 block text-xs text-slate-400">Focus time on this task is logged as practice for the skill.</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">{task ? 'Save changes' : 'Add task'}</button>
        </div>
      </form>
    </Modal>
  );
}
