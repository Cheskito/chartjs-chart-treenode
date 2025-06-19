// rollup.config.js
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/plugin.js',
  output: {
    file: 'dist/chartjs-chart-treenode.min.js',
    format: 'umd',
    name: 'ChartTreeNode',
    globals: {
      'chart.js': 'Chart'
    },
    banner: `/*!
 * chartjs-chart-treenode v1.0.0
 * (c) ${new Date().getFullYear()} Francesco Riva
 * Released under the MIT License
 */`
  },
  external: ['chart.js'],
  plugins: [terser()]
};
