import { readFile, writeFile } from 'node:fs/promises'

const packages = [
  'react', 'react-dom', 'lucide-react', '@fontsource/barlow-condensed',
  '@fontsource-variable/inter', '@fontsource-variable/jetbrains-mono',
]
const licenseText = await Promise.all(packages.map(async name => name + '\n\n' +
  await readFile(new URL('../node_modules/' + name + '/LICENSE', import.meta.url), 'utf8')))
await writeFile(new URL('../dist/third-party-licenses.txt', import.meta.url), licenseText.join('\n\n---\n\n'))
