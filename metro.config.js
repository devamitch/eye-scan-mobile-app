const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

// Asset extensions for eye tracking models and resources
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'db',
  'mp3',
  'ttf',
  'OTF',
  'otf',
  'obj',
  'png',
  'jpg',
  'tflite',
  'bin',
  'txt',
];
config.resolver.useWatchman = false;
// Transformer configuration
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;
