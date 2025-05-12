import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';

export default {
	input: 'src/index.ts',
	output: [
		{
			file: 'dist/rift-js.cjs.js',
			format: 'cjs',
			sourcemap: true,
		},
		{
			file: 'dist/rift-js.esm.js',
			format: 'esm',
			sourcemap: true,
		},
	],
	plugins: [json(), resolve(), commonjs(), typescript({ useTsconfigDeclarationDir: true })],
};
