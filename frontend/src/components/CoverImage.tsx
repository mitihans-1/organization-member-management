import React, { useEffect, useState } from 'react';
import {
  defaultBlogImage,
  defaultEventImage,
  FALLBACK_SVG_DATA_URI,
} from '../constants/defaultImages';

type Props = {
  stored?: string | null;
  slotIndex: number;
  variant: 'event' | 'blog';
  alt?: string;
  className?: string;
};

/**
 * DB URL when valid; otherwise bundled default JPEG for this slot.
 * If a stored URL fails (404), falls back to the local default, then SVG.
 */
const CoverImage: React.FC<Props> = ({
  stored,
  slotIndex,
  variant,
  alt = '',
  className = '',
}) => {
  const slotDefault =
    variant === 'event'
      ? defaultEventImage(slotIndex)
      : defaultBlogImage(slotIndex);

  const preferred = stored?.trim() ? stored.trim() : slotDefault;
  const [src, setSrc] = useState(preferred);

  useEffect(() => {
    const def =
      variant === 'event'
        ? defaultEventImage(slotIndex)
        : defaultBlogImage(slotIndex);
    setSrc(stored?.trim() ? stored.trim() : def);
  }, [stored, slotIndex, variant]);

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
      onError={() => {
        setSrc((cur) => {
          if (cur === FALLBACK_SVG_DATA_URI) return cur;
          if (cur === slotDefault) return FALLBACK_SVG_DATA_URI;
          return slotDefault;
        });
      }}
    />
  );
};

export default CoverImage;
