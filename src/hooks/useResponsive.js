import { useState, useEffect } from 'react';

const PHONE_MAX = 520;
const TABLET_MAX = 1024;

export const useResponsive = () => {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    width,
    isPhone: width < PHONE_MAX,
    isTablet: width >= PHONE_MAX && width < TABLET_MAX,
    isDesktop: width >= TABLET_MAX,
  };
};
