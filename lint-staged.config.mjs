import { quote } from 'shell-quote';
import { relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ESLint } from 'eslint';

const eslint = new ESLint();

function escape(str) {
  const escaped = quote(str);
  return escaped.replace(/\\@/g, '@');
}
const __dirname = dirname(fileURLToPath(import.meta.url));

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  '**/*.{ts,tsx,css}': async (filenames) => {
    const relativeFiles = filenames.map((f) => relative(__dirname, f));
    const escapedFileNames = filenames.map((f) => escape([f])).join(' ');

    const filteredFiles = [];
    for (const file of relativeFiles) {
      const ignored = await eslint.isPathIgnored(file);
      if (!ignored) {
        filteredFiles.push(`${file}`);
      }
    }

    return [
      `prettier --ignore-path --write ${escapedFileNames}`,
      `next lint  --fix`,
    ];
  },
  '**/*.ts?(x)': () => {
    return [`tsc -p tsconfig.json --noEmit`];
  },
}
