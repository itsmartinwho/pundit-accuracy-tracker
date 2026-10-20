import React from 'react';
import { useLocation } from 'react-router-dom';
import PageShell from '@/components/PageShell';

const NotFound: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <PageShell title="Not found">
      <div className="py-20 sm:py-28">
        <p className="t-label m-0">404</p>
        <h1 className="t-name m-0 mt-4 text-[56px] sm:text-[92px]">No such page</h1>
        <p className="m-0 mt-5 max-w-[34em] text-[19px] text-ink-soft sm:text-[21px]">
          Nothing is filed under <span className="t-figure break-all text-[0.85em] text-foreground">{pathname}</span>.
        </p>
      </div>
    </PageShell>
  );
};

export default NotFound;
