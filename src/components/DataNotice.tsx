import React from 'react';
import { Link } from 'react-router-dom';
import type { DatasetMeta } from '@/data/sippData';
import { cn } from '@/lib/utils';

interface DataNoticeProps {
  meta: DatasetMeta;
  className?: string;
}

// Says, on every page that shows scores, where the data came from. Set as an
// editor's note between two pencil rules, with the masthead flag's hatch beside it.
// From md, hatch + label take the leaderboard's search column (18rem), so the
// sentence starts where the category filter does.
const DataNotice: React.FC<DataNoticeProps> = ({ meta, className }) => {
  const synthetic = meta.kind === 'synthetic';

  return (
    <aside aria-labelledby="data-notice-title" className={cn('flex gap-4 border-y border-pencil/40 py-4', className)}>
      <span className="hatch w-[14px] shrink-0 md:w-[18px]" aria-hidden="true" />
      <div className="grid min-w-0 flex-1 gap-x-10 gap-y-1 md:grid-cols-[calc(18rem-34px)_minmax(0,1fr)]">
        <p id="data-notice-title" className="t-label m-0 pt-[3px] text-pencil">
          {synthetic ? 'Demo data' : 'Not fact-checked'}
        </p>
        <p className="m-0 max-w-[46em] text-[16px] leading-normal text-ink-soft sm:text-[17px]">
          {synthetic ? (
            <>
              Every prediction, outcome and score here is synthetic: built from templates and random numbers. None of
              it is anything these people said, and the scores say nothing about how accurate they are.{' '}
            </>
          ) : (
            <>
              An AI model found these predictions with a web search and rated them. No person has checked them; follow
              a prediction’s source before relying on it.{' '}
            </>
          )}
          <Link to="/about#data" className="link-quiet whitespace-nowrap text-foreground">
            How this works
          </Link>
        </p>
      </div>
    </aside>
  );
};

export default DataNotice;
