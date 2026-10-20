import React from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { DatasetMeta } from '@/data/sippData';

interface DataNoticeProps {
  meta: DatasetMeta;
  className?: string;
}

// Says, on every page that shows scores, where the data came from.
const DataNotice: React.FC<DataNoticeProps> = ({ meta, className }) => {
  const synthetic = meta.kind === 'synthetic';

  return (
    <Alert className={`border-amber-300 bg-amber-50 text-amber-950 ${className ?? ''}`}>
      <Info className="h-4 w-4 !text-amber-700" />
      <AlertTitle>{synthetic ? 'Demo data' : 'Not fact-checked'}</AlertTitle>
      <AlertDescription>
        {synthetic ? (
          <>
            The predictions, outcomes and scores here are synthetic: built from templates with
            random numbers. They are not things these people said, and the scores say nothing
            about how accurate they are.{' '}
          </>
        ) : (
          <>
            An AI model found these predictions with a web search and rated them. A person has
            not checked them. Follow a prediction's source before relying on it.{' '}
          </>
        )}
        <Link to="/about" className="underline underline-offset-2">
          How this works
        </Link>
      </AlertDescription>
    </Alert>
  );
};

export default DataNotice;
