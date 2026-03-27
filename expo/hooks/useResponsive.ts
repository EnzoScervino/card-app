import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

const MAX_CONTENT_WIDTH = 600;
const BREAKPOINT_TABLET = 768;
const BREAKPOINT_DESKTOP = 1024;

interface ResponsiveInfo {
  windowWidth: number;
  windowHeight: number;
  contentWidth: number;
  contentPadding: number;
  isTablet: boolean;
  isDesktop: boolean;
  gridColumns: number;
}

export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription.remove();
  }, []);

  const windowWidth = dimensions.width;
  const windowHeight = dimensions.height;
  const isTablet = windowWidth >= BREAKPOINT_TABLET;
  const isDesktop = windowWidth >= BREAKPOINT_DESKTOP;

  const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH);
  const contentPadding = windowWidth > MAX_CONTENT_WIDTH
    ? (windowWidth - MAX_CONTENT_WIDTH) / 2
    : 20;

  const gridColumns = isDesktop ? 4 : isTablet ? 4 : 3;

  return {
    windowWidth,
    windowHeight,
    contentWidth,
    contentPadding,
    isTablet,
    isDesktop,
    gridColumns,
  };
}
