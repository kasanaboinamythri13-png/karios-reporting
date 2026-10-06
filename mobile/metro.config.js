// mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable cjs extension for Firebase SDK compatibility with Expo
config.resolver.sourceExts.push('cjs');

module.exports = config;
