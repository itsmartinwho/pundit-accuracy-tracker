import React from 'react';
import { Link } from 'react-router-dom';
import type { SIPP } from '@/data/sippData';
import RatingStrip from './RatingStrip';
import Portrait from './Portrait';
import { type CategoryFilter, categoryLabel, describeRatings, fmtScore, openIn, ratedIn, scoreIn } from '@/lib/record';

// One pundit on the leaderboard: rank, face, name and line, every rating as a dot,
// the average, and the counts. The name is the link; the whole row answers to it.

export const ROW_GRID =
  'grid grid-cols-[2.25rem_3rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 ' +
  'lg:grid-cols-[2.5rem_3.5rem_minmax(14rem,1fr)_minmax(16rem,1.25fr)_5.5rem_4.5rem_4.5rem] lg:gap-x-6';

interface LeaderboardRowProps {
  sipp: SIPP;
  rank: number;
  category: CategoryFilter;
  delay?: number;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ sipp, rank, category, delay = 0 }) => {
  const ratings = ratedIn(sipp, category).map((p) => p.accuracyRating);
  const open = openIn(sipp, category).length;
  const score = ratings.length ? scoreIn(sipp, category) : NaN;
  const scope = category === 'all' ? '' : ` in ${categoryLabel(category).toLowerCase()}`;

  return (
    <li className="rise group relative border-b py-5 lg:py-4" style={{ animationDelay: `${delay}ms` }}>
      <div className={ROW_GRID}>
        <span className="t-figure self-start pt-1.5 text-[13px] text-muted-foreground lg:self-center lg:pt-0">
          {String(rank).padStart(2, '0')}
        </span>

        <Portrait name={sipp.name} src={sipp.photoUrl} size={48} className="self-start lg:size-14 lg:self-center" />

        <div className="min-w-0 self-start lg:self-center">
          <h3 className="m-0 text-[26px] leading-none sm:text-[30px]">
            <Link
              to={`/sipp/${sipp.id}`}
              className="t-name text-foreground no-underline decoration-pencil decoration-[1.5px] underline-offset-[5px] after:absolute after:inset-0 after:z-10 group-hover:underline"
            >
              {sipp.name}
            </Link>
          </h3>
          <p className="m-0 mt-1.5 line-clamp-2 text-[15px] leading-snug text-ink-soft">{sipp.shortBio}</p>
        </div>

        {/* On a phone the average sits beside the name; from lg it has its own column. */}
        <p className="m-0 self-start text-right lg:hidden">
          <span className="sr-only">Average </span>
          <span className="t-figure block pt-1 text-[22px] leading-none text-pencil">{fmtScore(score)}</span>
        </p>

        <div className="col-span-3 col-start-2 lg:col-span-1 lg:col-start-auto">
          <RatingStrip
            ratings={ratings}
            mean={Number.isFinite(score) ? score : null}
            label={`${sipp.name}${scope}: ${describeRatings(ratings, score)}`}
            dot={6}
            height={48}
          />
          <p className="t-label m-0 mt-2 lg:hidden">
            {ratings.length} rated · {open} pending
          </p>
        </div>

        <p className="t-figure m-0 hidden text-right text-[24px] leading-none text-pencil lg:block">
          <span className="sr-only">Average </span>
          {fmtScore(score)}
        </p>
        <p className="t-figure m-0 hidden text-right text-[15px] text-foreground lg:block">
          {ratings.length}
          <span className="sr-only"> rated</span>
        </p>
        <p className="t-figure m-0 hidden text-right text-[15px] text-muted-foreground lg:block">
          {open}
          <span className="sr-only"> pending</span>
        </p>
      </div>
    </li>
  );
};

export default LeaderboardRow;
