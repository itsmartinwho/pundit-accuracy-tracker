import React, { useEffect } from 'react';
import NavBar from './NavBar';
import Footer from './Footer';

const SITE = 'Pundit Accuracy Tracker';

interface PageShellProps {
  /** The page's own name for the tab; the site's name is added after it. */
  title?: string;
  children: React.ReactNode;
}

const PageShell: React.FC<PageShellProps> = ({ title, children }) => {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE;
  }, [title]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <NavBar />
      <main id="main" tabIndex={-1} className="shell flex-1 outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
};

/** Fragments of a line of labels, joined by dots, each kept whole when the line wraps. */
export const Meta: React.FC<{ parts: string[] }> = ({ parts }) => (
  <>
    {parts.map((p, i) => (
      <React.Fragment key={p}>
        {i > 0 && ' · '}
        <span className="whitespace-nowrap">{p}</span>
      </React.Fragment>
    ))}
  </>
);

/** A page title, then an optional lede and a line of labels; split puts them beside the title. */
export const PageHead: React.FC<{
  title: React.ReactNode;
  meta?: React.ReactNode;
  lede?: React.ReactNode;
  split?: boolean;
}> = ({ title, meta, lede, split }) => (
  <header
    className={
      split
        ? 'grid gap-x-16 gap-y-4 pb-8 pt-8 sm:pb-10 sm:pt-12 lg:grid-cols-[auto_minmax(0,31rem)] lg:items-end lg:justify-between'
        : 'pb-8 pt-8 sm:pb-10 sm:pt-14'
    }
  >
    <h1 className="t-name m-0 text-[50px] sm:text-[72px] lg:text-[84px]">{title}</h1>
    {(lede || meta) && (
      <div className={split ? 'min-w-0 lg:pb-2' : 'min-w-0'}>
        {lede && (
          <p className={`m-0 max-w-[34em] text-[18px] leading-snug text-ink-soft sm:text-[20px] ${split ? '' : 'mt-5'}`}>
            {lede}
          </p>
        )}
        {meta && <p className="t-label m-0 mt-3">{meta}</p>}
      </div>
    )}
  </header>
);

export default PageShell;
