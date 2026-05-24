module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Path aliases — permet d'importer via @/theme, @/store, etc.
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@theme': './src/theme',
          '@store': './src/store',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@services': './src/services',
          '@ffmpeg': './src/ffmpeg',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@types': './src/types',
          '@components': './src/components',
          '@assets': './src/assets',
        },
      },
    ],
    // IMPORTANT: react-native-reanimated/plugin DOIT être en dernier
    'react-native-reanimated/plugin',
  ],
};
