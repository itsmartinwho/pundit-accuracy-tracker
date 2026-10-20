import React from 'react';
import { Link, NavLink } from 'react-router-dom';

// The masthead: the wordmark, the "Illustrative" flag (on every page, since every
// score here is illustrative), and two links. One hairline under it.

const LINKS = [
  { to: '/', label: 'Leaderboard', end: true },
  { to: '/about', label: 'About', end: false },
];

const NavBar: React.FC = () => (
  <header className="border-b">
    <div className="shell flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-4 sm:py-5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        <Link to="/" className="t-name text-[24px] text-foreground no-underline sm:text-[27px]">
          Pundit Accuracy Tracker
        </Link>
        <Link to="/about#data" className="flag" title="The data is synthetic. How this works.">
          Illustrative
        </Link>
      </div>
      <nav aria-label="Main">
        <ul className="flex items-center gap-6">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} className="nav-link">
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </header>
);

export default NavBar;
