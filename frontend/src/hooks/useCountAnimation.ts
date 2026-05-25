import { useState, useEffect, useMemo } from 'react';

const useCountAnimation = (
  targetValue: number | string | null | undefined,
  duration: number = 2000
): string => {
  const [currentValue, setCurrentValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  const numericTarget = useMemo(() => {
    if (targetValue == null) return 0;
    if (typeof targetValue === 'number') return targetValue;
    const numStr = targetValue.replace(/[^0-9]/g, '');
    return parseInt(numStr, 10) || 0;
  }, [targetValue]);

  const suffix = useMemo(() => {
    if (targetValue == null || typeof targetValue === 'number') return '';
    return targetValue.replace(/[0-9]/g, '');
  }, [targetValue]);

  const originalValueStr = useMemo(() => {
    if (targetValue == null) return '0';
    return String(targetValue);
  }, [targetValue]);

  useEffect(() => {
    if (hasAnimated) return;

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(numericTarget * easeOut);
      setCurrentValue(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setHasAnimated(true);
      }
    };

    requestAnimationFrame(animate);
  }, [numericTarget, duration, hasAnimated]);

  // If the original value is not numeric (like a string without numbers), return it as-is
  if (numericTarget === 0 && originalValueStr !== '0' && !originalValueStr.match(/\d/)) {
    return originalValueStr;
  }

  return `${currentValue.toLocaleString()}${suffix}`;
};

export default useCountAnimation;
