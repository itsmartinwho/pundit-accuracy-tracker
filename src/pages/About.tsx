import React from 'react';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import { useSippDataset } from '@/data/loadSipps';
import { formatDate } from '@/data/sippData';

const About: React.FC = () => {
  const { data } = useSippDataset();
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <div className="text-center mb-8">
            <motion.h1
              className="text-4xl font-bold tracking-tight mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              About Pundit Accuracy Tracker
            </motion.h1>
            <motion.p
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              How the scores are worked out, and where the data comes from
            </motion.p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>What this is</h2>
            <p>
              A dashboard that scores how often the predictions of ten prominent press
              personalities came true. The site calls them SIPPs, short for Strategically
              Important Press Personalities. It is a small open-source project, not a
              research product.
            </p>

            <h2>How scores work</h2>
            <ul>
              <li>
                Each prediction has one category: economy, politics, technology, foreign
                policy or social trends.
              </li>
              <li>
                A prediction whose outcome is known is rated 1, 2 or 3. 1 means it did not
                come true. 2 means it partly did, for example the right direction but the
                wrong size or timing. 3 means it came true as stated. A prediction whose
                outcome is not known yet is pending and is not scored.
              </li>
              <li>
                A person's overall score is the plain average of their ratings. A category
                score is the average of the ratings in that category. If a person has no
                rated prediction in a category, it shows their overall average.
              </li>
              <li>
                A score under 1.7 is shown as low, 2.3 and above as high, and the rest as
                medium. The "Normalized" figure on a prediction is its rating divided by 3.
              </li>
              <li>
                There is no weighting for how hard or how specific a prediction was, and no
                weighting by how much time it covered.
              </li>
            </ul>

            <h2>Where the data comes from</h2>
            {meta?.kind === 'sourced' ? (
              <>
                <p>
                  The predictions were found by an AI model searching the web
                  {meta.generatedAt ? ` on ${formatDate(meta.generatedAt)}` : ''}
                  {meta.model ? ` (${meta.model})` : ''}. The same model decided whether
                  each outcome was known yet and gave the 1 to 3 rating. Each prediction
                  links to its source.
                </p>
                <p>
                  No person has checked any of it. A model can misread a source, miss a
                  prediction or rate one wrongly, so follow the source before relying on a
                  score.
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>The data in this copy of the site is synthetic.</strong> The
                  predictions were built from sentence templates filled in with random
                  numbers, topics and dates. The outcomes, the ratings and the verified or
                  pending status are random too. The names and photos are of real people,
                  but nothing here is something they said, and the scores say nothing about
                  how accurate they are.
                </p>
                <p>
                  The repository has a script that replaces this with predictions found by
                  an AI model searching the web, each with a source link. Until someone runs
                  it and publishes the result, treat everything on this site as a demo of
                  the interface.
                </p>
              </>
            )}

            <h2>Source code</h2>
            <p>
              Free to reuse under the MIT licence:{' '}
              <a href="https://github.com/itsmartinwho/pundit-accuracy-tracker">
                github.com/itsmartinwho/pundit-accuracy-tracker
              </a>
              . The README covers how to run it and how to refresh the data.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default About;
