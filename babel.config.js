module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['>0.2%', 'not dead', 'not ie <= 11', 'not op_mini all'],
        },
        useBuiltIns: 'entry',
        corejs: 3,
      },
    ],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    ['import', { libraryName: 'antd', libraryDirectory: 'es', style: true }],
    process.env.NODE_ENV === 'development' && 'react-refresh/babel',
  ].filter(Boolean),
};
