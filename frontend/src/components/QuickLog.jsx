import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Modal, Segmented } from './ui.jsx';
import { EcaPanel, HabitsPanel, HealthForm, SkillsPanel } from './TrackerPanels.jsx';
import { useApp } from '../context/AppContext.jsx';
import { localDateKey } from '../utils/format.js';

export const OPEN_QUICK_LOG = 'edupredict:quick-log';

/** "Log today" pop-up reachable from anywhere (header button, Ctrl+K). */
export default function QuickLog() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('health');
  const { snapshot } = useApp();
  const today = localDateKey();

  useEffect(() => {
    const handler = (e) => {
      setTab(e.detail?.tab || 'health');
      setOpen(true);
    };
    window.addEventListener(OPEN_QUICK_LOG, handler);
    return () => window.removeEventListener(OPEN_QUICK_LOG, handler);
  }, []);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Log today" size="max-w-xl">
      <Segmented
        className="mb-4 w-full"
        value={tab}
        onChange={setTab}
        options={[{ value: 'health', label: 'Health' }, { value: 'habits', label: 'Habits' }, { value: 'skills', label: 'Skills' }, { value: 'eca', label: 'ECA' }]}
      />
      {tab === 'health' && <HealthForm compact date={today} initial={snapshot?.health} />}
      {tab === 'habits' && <HabitsPanel />}
      {tab === 'skills' && <SkillsPanel date={today} logged={snapshot?.skills} />}
      {tab === 'eca' && <EcaPanel date={today} logged={snapshot?.eca} />}
      <Link to="/tracker" onClick={() => setOpen(false)} className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-violet-600 hover:underline dark:text-violet-400">
        Open the full tracker <ArrowRight className="h-4 w-4" />
      </Link>
    </Modal>
  );
}

export const openQuickLog = (tab) => window.dispatchEvent(new CustomEvent(OPEN_QUICK_LOG, { detail: { tab } }));
