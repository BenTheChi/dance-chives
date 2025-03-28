import { quote } from 'shell-quote';
import { ESLint } from 'eslint';

const eslint = new ESLint();

function escape(str) {
  const escaped = quote(str);
  return escaped.replace(/\\@/g, '@');
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  '**/*.{ts,tsx,css}': async (filenames) => {
    const escapedFileNames = filenames.map((filename) => escape([filename])).join(' ');

    const filteredFiles = [];
    for (const file of filenames) {
      const ignored = await eslint.isPathIgnored(file);
      if (!ignored) {
        filteredFiles.push(`"${file}"`);
      }
    }

    return [
      `prettier --ignore-path --write ${escapedFileNames}`,
      `next lint --no-ignore --fix ${filteredFiles.join(' ')}`,
    ];
  },
  '**/*.ts?(x)': () => {
    return [`tsc -p tsconfig.json --noEmit`];
  },
};
