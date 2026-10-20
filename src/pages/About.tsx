import React from 'react';
import PageShell, { PageHead } from '@/components/PageShell';
import { useSippDataset } from '@/data/loadSipps';
import { BAND_EDGES, fmtDate } from '@/lib/record';

// The method page: what this is, how a score is made, where the data comes from,
// and the code. Each section has its label in the margin.

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section
    id={id}
    aria-labelledby={`${id}-title`}
    className="grid scroll-mt-8 gap-x-16 gap-y-4 border-t py-10 lg:grid-cols-[13rem_minmax(0,40rem)] lg:py-14"
  >
    <h2 id={`${id}-title`} className="t-label m-0 pt-1.5 text-foreground">
      {title}
    </h2>
    <div className="space-y-4 text-[18px] leading-relaxed text-ink-soft sm:text-[19px] [&_strong]:font-normal [&_strong]:text-foreground">
      {children}
    </div>
  </section>
);

const at = (x: number) => `${((x - 1) / 2) * 100}%`;

/** The scale, drawn: what 1, 2 and 3 mean, and where the bands fall. */
const Scale: React.FC = () => (
  <figure className="m-0 pt-4" aria-labelledby="scale-caption">
    <div className="relative mx-1 h-14">
      {/* the bands */}
      <span className="absolute bottom-0 left-0 h-2 bg-secondary" style={{ width: at(BAND_EDGES[0]) }} />
      <span className="hatch absolute bottom-0 h-2 opacity-60" style={{ left: at(BAND_EDGES[0]), width: `calc(${at(BAND_EDGES[1])} - ${at(BAND_EDGES[0])})` }} />
      <span className="absolute bottom-0 right-0 h-2 bg-pencil" style={{ left: at(BAND_EDGES[1]) }} />
      {/* the rule and its three marks */}
      {[1, 2, 3].map((n) => (
        <span key={n} className="absolute bottom-0 h-6 border-l border-foreground" style={{ left: at(n) }} />
      ))}
      {[1, 2, 3].map((n) => (
        <span
          key={`l${n}`}
          className={`t-figure absolute top-0 text-[22px] leading-none text-foreground ${n === 1 ? '' : n === 2 ? '-translate-x-1/2' : '-translate-x-full'}`}
          style={{ left: at(n) }}
        >
          {n}
        </span>
      ))}
    </div>
    <div className="t-label mt-3 grid grid-cols-3 gap-4">
      <span>Did not come true</span>
      <span className="text-center">Partly</span>
      <span className="text-right">Came true as stated</span>
    </div>
    <figcaption id="scale-caption" className="t-label mt-6 flex flex-wrap gap-x-6 gap-y-2">
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-2 w-5 bg-secondary" aria-hidden="true" /> Low, under {BAND_EDGES[0]}
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="hatch inline-block h-2 w-5 opacity-60" aria-hidden="true" /> Middle
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-2 w-5 bg-pencil" aria-hidden="true" /> High, {BAND_EDGES[1]} and over
      </span>
    </figcaption>
  </figure>
);

const About: React.FC = () => {
  const { data } = useSippDataset();
  const meta = data?.meta;

  return (
    <PageShell title="About">
      <PageHead title="About" lede="How the scores are worked out, and where the data comes from." />

      <div className="mt-6">
        <Section id="what" title="What this is">
          <p>
            A dashboard that scores how often the predictions of ten prominent press personalities came true. The code
            calls them SIPPs, short for Strategically Important Press Personalities. It is a small open-source
            project, not a research product.
          </p>
        </Section>

        <Section id="scores" title="How scores work">
          <p>
            Each prediction has one category: economy, politics, technology, foreign policy or social trends. Once its
            outcome is known it is rated from 1 to 3. One whose outcome is not known yet is pending, and is not scored.
          </p>
          <Scale />
          <ul className="list-none space-y-3 p-0 pt-4">
            <li>
              <strong>A 2</strong> means it partly came true: the right direction, but the wrong size or timing.
            </li>
            <li>
              <strong>A person’s average</strong> is the plain average of their ratings. A category average is the
              average of the ratings in that category; a category with no rated predictions shows a dash.
            </li>
            <li>
              <strong>The bands:</strong> an average under {BAND_EDGES[0]} is low, {BAND_EDGES[1]} and over is high,
              and the rest is middle.
            </li>
            <li>
              <strong>No weighting</strong> for how hard or how specific a prediction was, or for how long it covered.
            </li>
          </ul>
        </Section>

        <Section id="data" title="Where the data comes from">
          {meta?.kind === 'sourced' ? (
            <>
              <p>
                The predictions were found by an AI model searching the web
                {meta.generatedAt ? ` on ${fmtDate(meta.generatedAt)}` : ''}
                {meta.model ? ` (${meta.model})` : ''}. The same model decided whether each outcome was known yet and
                gave the 1 to 3 rating. Each prediction links to its source.
              </p>
              <p>
                No person has checked any of it. A model can misread a source, miss a prediction or rate one wrongly,
                so follow the source before relying on a score. That is what the <strong>Illustrative</strong> flag at
                the top of every page means.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>The data in this copy of the site is synthetic.</strong> The predictions were built from
                sentence templates filled in with random numbers, topics and dates. The outcomes, the ratings and the
                rated or pending status are random too. The names and photos are of real people, but nothing here is
                something they said, and the scores say nothing about how accurate they are.
              </p>
              <p>
                That is what the <strong>Illustrative</strong> flag at the top of every page means. The repository has
                a script that replaces this with predictions found by an AI model searching the web, each with a
                source link. Until someone runs it and publishes the result, treat everything here as a demo of the
                interface.
              </p>
            </>
          )}
        </Section>

        <Section id="code" title="Source code">
          <p>
            Free to reuse under the MIT licence:{' '}
            <a className="link-quiet text-foreground" href="https://github.com/itsmartinwho/pundit-accuracy-tracker">
              github.com/itsmartinwho/pundit-accuracy-tracker
            </a>
            . The README covers how to run it and how to refresh the data.
          </p>
        </Section>
      </div>
    </PageShell>
  );
};

export default About;
