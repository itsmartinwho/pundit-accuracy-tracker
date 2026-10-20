import React, { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useSippDataset } from '@/data/loadSipps';
import type { SIPP } from '@/data/sippData';
import DataNotice from './DataNotice';
import { Meta, PageHead } from './PageShell';
import LeaderboardRow, { ROW_GRID } from './LeaderboardRow';
import { StripAxis } from './RatingStrip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  type Band,
  CATEGORIES,
  type CategoryFilter,
  bandOf,
  categoryLabel,
  fmtScore,
  ratedIn,
  scoreIn,
} from '@/lib/record';

// The leaderboard: search, a category, an order, then one row per pundit.

const shownScore = (sipp: SIPP, category: CategoryFilter) =>
  ratedIn(sipp, category).length ? scoreIn(sipp, category) : NaN;

const BAND_WORD: Record<Band, string> = { low: 'low', middle: 'middle', high: 'high' };

/** One computed sentence over the rows on screen. */
const takeaway = (rows: SIPP[], category: CategoryFilter) => {
  const scored = rows.filter((s) => ratedIn(s, category).length > 0);
  if (!scored.length) return null;
  const scores = scored.map((s) => scoreIn(s, category));
  const lo = Math.min(...scores);
  const hi = Math.max(...scores);
  const where = category === 'all' ? '' : `In ${categoryLabel(category).toLowerCase()}, `;
  const range =
    scored.length === 1
      ? `${where}${scored[0].name} averages ${fmtScore(lo)}`
      : `${where}${where ? 'averages' : 'Averages'} run from ${fmtScore(lo)} to ${fmtScore(hi)}`;
  const bands = scores.map(bandOf);
  const all = bands.every((b) => b === bands[0]);
  const spread = all
    ? scored.length === 1
      ? `, in the ${BAND_WORD[bands[0]]} band`
      : `, all ${scored.length} in the ${BAND_WORD[bands[0]]} band`
    : `: ${(['high', 'middle', 'low'] as Band[])
        .map((b) => [b, bands.filter((x) => x === b).length] as const)
        .filter(([, n]) => n > 0)
        .map(([b, n]) => `${n} ${b}`)
        .join(', ')}`;
  return `${range}${spread}.`;
};

const LEDE =
  'How often ten pundits’ predictions came true. Each prediction is rated 1 to 3 once its outcome is known, and the ratings are averaged.';

const Dashboard: React.FC = () => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, isError } = useSippDataset();

  if (isLoading) {
    return (
      <>
        <PageHead title="Leaderboard" lede={LEDE} split />
        <p className="t-label py-16" role="status">
          Loading the record…
        </p>
      </>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-24" role="alert">
        <h2 className="t-name m-0 text-[36px]">The data did not load</h2>
        <p className="mt-3 text-ink-soft">public/data/sippData.json did not load. Reload the page to try again.</p>
      </div>
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const filteredSipps = data.sipps
    .filter((sipp) => {
      // A category shows only the pundits with predictions in it.
      if (selectedCategory !== 'all' && !sipp.predictions.some((p) => p.category === selectedCategory)) return false;
      if (query) return sipp.name.toLowerCase().includes(query) || sipp.shortBio.toLowerCase().includes(query);
      return true;
    })
    .sort((a, b) => {
      // A pundit with nothing rated in the category shows a dash, and goes last.
      const sa = shownScore(a, selectedCategory);
      const sb = shownScore(b, selectedCategory);
      if (Number.isNaN(sa) || Number.isNaN(sb)) return Number.isNaN(sa) ? (Number.isNaN(sb) ? 0 : 1) : -1;
      return sortOrder === 'desc' ? sb - sa : sa - sb;
    });

  const rated = data.sipps.reduce((n, s) => n + ratedIn(s).length, 0);
  const total = data.sipps.reduce((n, s) => n + s.predictions.length, 0);
  const line = takeaway(filteredSipps, selectedCategory);

  return (
    <div>
      <PageHead
        title="Leaderboard"
        lede={LEDE}
        meta={<Meta parts={[`${data.sipps.length} pundits`, `${total} predictions`, `${rated} rated`, `${total - rated} pending`]} />}
        split
      />

      <DataNotice meta={data.meta} />

      <section aria-labelledby="board-title" className="mt-10 sm:mt-12">
        <h2 id="board-title" className="sr-only">
          Pundits
        </h2>

        {/* Controls: search, category, order. */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-8 gap-y-6 md:grid-cols-[minmax(12rem,18rem)_minmax(0,1fr)_auto] md:items-end md:gap-x-10">
          <div>
            <label htmlFor="search" className="t-label block">
              Search
            </label>
            <Input
              id="search"
              type="search"
              placeholder="A name or a line"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
            <span id="category-label" className="t-label block">
              Category
            </span>
            <ToggleGroup
              type="single"
              aria-labelledby="category-label"
              size="sm"
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory((value || 'all') as CategoryFilter)}
              className="mt-1 flex-wrap justify-start gap-x-5 gap-y-0"
            >
              <ToggleGroupItem value="all" className="h-9 px-0">
                All
              </ToggleGroupItem>
              {CATEGORIES.map((c) => (
                <ToggleGroupItem key={c.value} value={c.value} className="h-9 px-0">
                  {c.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="col-start-2 row-start-1 md:col-start-3">
            <span className="t-label block" id="order-label">
              Order
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-describedby="order-label"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="mt-1 h-9 px-0 text-foreground hover:bg-transparent hover:text-pencil"
            >
              {sortOrder === 'desc' ? 'Highest first' : 'Lowest first'}
              {sortOrder === 'desc' ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}
            </Button>
          </div>
        </div>

        {line && (
          <p className="m-0 mt-10 max-w-[40em] font-name text-[25px] leading-tight sm:text-[30px]" aria-live="polite">
            {line}
          </p>
        )}

        {filteredSipps.length > 0 ? (
          <>
            {/* Column heads, aligned with the rows' grid; the strip's scale is spelled out. */}
            <div className="mt-8 border-b border-foreground pb-2" aria-hidden="true">
              <div className={ROW_GRID}>
                <span className="t-label">#</span>
                <span />
                <span className="t-label">Pundit</span>
                <span className="t-label text-right lg:hidden">Average</span>
                <div className="hidden lg:block">
                  <StripAxis />
                </div>
                <span className="t-label hidden text-right lg:block">Average</span>
                <span className="t-label hidden text-right lg:block">Rated</span>
                <span className="t-label hidden text-right lg:block">Pending</span>
              </div>
              <div className={`${ROW_GRID} mt-1 lg:hidden`}>
                <div className="col-span-3 col-start-2">
                  <StripAxis />
                </div>
              </div>
            </div>
            {/* Keyed by category and order: a change deals the whole list again, rather than
                restarting the arrival of whichever rows happened to move. */}
            <ol key={`${selectedCategory}-${sortOrder}`} className="m-0 list-none p-0">
              {filteredSipps.map((sipp, index) => (
                <LeaderboardRow
                  key={sipp.id}
                  sipp={sipp}
                  rank={index + 1}
                  category={selectedCategory}
                  delay={index * 40}
                />
              ))}
            </ol>
          </>
        ) : (
          <div className="mt-10 border-y py-16 text-center">
            <p className="t-name m-0 text-[34px]">No pundit matches</p>
            <p className="m-0 mt-2 text-ink-soft">
              {query ? `Nothing for “${searchQuery.trim()}”` : 'Nothing'}
              {selectedCategory !== 'all' ? ` in ${categoryLabel(selectedCategory).toLowerCase()}` : ''}.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
