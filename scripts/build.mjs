import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(projectRoot, 'src');
const output = join(projectRoot, 'dist');

mkdirSync(output, { recursive: true });
cpSync(source, output, { recursive: true, force: true });
console.log('Built dist/ from src/');
