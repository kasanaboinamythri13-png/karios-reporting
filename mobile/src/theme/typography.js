// mobile/src/theme/typography.js
import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  h1: {
    fontFamily,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  caption: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  captionBold: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  small: {
    fontFamily,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
};
