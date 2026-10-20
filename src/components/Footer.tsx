import React from 'react';
import { useSippDataset } from '@/data/loadSipps';
import { fmtDate } from '@/lib/record';

// One line of labels: where the data came from and when, the code, the licence,
// the author. Nothing that repeats the nav.

const Footer: React.FC = () => {
  const { data } = useSippDataset();
  const meta = data?.meta;
  const kind = meta ? (meta.kind === 'synthetic' ? 'Synthetic data' : 'Model-sourced data') : null;

  return (
    <footer className="shell mt-24 sm:mt-32">
      <div className="t-label flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t py-6">
        <p className="m-0">
          {kind}
          {meta?.generatedAt ? `, ${fmtDate(meta.generatedAt)}` : ''}
        </p>
        <ul className="m-0 flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <a className="no-underline hover:text-foreground" href="https://github.com/itsmartinwho/pundit-accuracy-tracker">
              Source on GitHub
            </a>
          </li>
          <li>MIT licence</li>
          <li>
            <a className="no-underline hover:text-foreground" href="https://jjmartin.co">
              By JJ Martin
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
