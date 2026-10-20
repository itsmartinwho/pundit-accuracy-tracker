import React, { useEffect, useState } from 'react';
import { initials } from '@/lib/record';
import { cn } from '@/lib/utils';

// A small grey portrait, printed into the paper. The type leads; the face only
// tells you whose row it is. It loads the small copy in public/portraits/small/,
// then the original, then falls back to initials. Decorative: the name is beside it.

const smallCopy = (url: string) => {
  const m = url.match(/^(.*\/portraits\/)([^/]+)\.\w+$/);
  return m ? `${m[1]}small/${m[2]}.jpg` : null;
};

interface PortraitProps {
  name: string;
  src: string;
  size: number;
  className?: string;
}

const Portrait: React.FC<PortraitProps> = ({ name, src, size, className }) => {
  const sources = [smallCopy(src), src].filter((s, i, all): s is string => !!s && all.indexOf(s) === i);
  const [index, setIndex] = useState(0);
  const current = sources[index];
  useEffect(() => setIndex(0), [src]);

  return (
    <span
      className={cn(
        'relative inline-flex size-[var(--portrait)] shrink-0 items-center justify-center overflow-hidden bg-secondary',
        className,
      )}
      style={{ ['--portrait' as string]: `${size}px` }}
    >
      {current ? (
        <img
          src={current}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover mix-blend-multiply [filter:grayscale(1)_contrast(1.08)]"
          style={{ objectPosition: '50% 18%' }}
          onError={() => setIndex((i) => i + 1)}
        />
      ) : (
        <span className="t-label text-ink-soft" aria-hidden="true">
          {initials(name)}
        </span>
      )}
    </span>
  );
};

export default Portrait;
