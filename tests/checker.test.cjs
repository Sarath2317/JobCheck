const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'web/app.js'), 'utf8');
// Exercise the shipped analyzer without initializing its DOM controller.
const rules = src.slice(src.indexOf('  const FREE_MAIL'), src.indexOf('  function switchTab'));
const functions = src.slice(src.indexOf('  function getDomain'), src.indexOf('  function newCaseId'));
const ctx = { URL };
vm.createContext(ctx);
vm.runInContext(rules + functions + ';this.check = analyze;', ctx);
const run = (text = '', url = '', email = '') => ctx.check({text, url, email});

test('bare URL and sender email remain insufficient evidence', () => {
  assert.equal(run('', 'https://example.com').label, 'INSUFFICIENT EVIDENCE');
  assert.equal(run('', '', 'hr@example.com').score, 0);
});
test('ordinary job wording and safety advice do not score', () => {
  assert.equal(run('Remote job. No experience required. Never share your OTP. We never ask for a registration fee.').score, 0);
});
test('payment and secret requests remain flagged', () => {
  assert(run('Pay a registration fee today.').score >= 30);
  assert(run('Send your OTP now.').score >= 60);
  assert(run('Never share your OTP, but send your password.').score >= 60);
});
test('different recruiter platforms and subdomains are informational', () => {
  assert.equal(run('', 'https://boards.greenhouse.io/example', 'hr@example.com').score, 0);
  assert.equal(run('', 'https://jobs.company.com', 'hr@company.com').score, 0);
  assert.equal(run('', 'https://example.co.uk', 'hr@different.co.uk').flags.find(f => f.title.includes('do not match')).points, 0);
});
test('unsupported protocol receives warning', () => {
  assert(run('', 'javascript://example.com').score >= 30);
});
test('website and extension share identical analyzer and styles', () => {
  for (const name of ['app.js', 'styles.css']) assert.equal(fs.readFileSync(path.join(root, 'web', name), 'utf8'), fs.readFileSync(path.join(root, 'extension', name), 'utf8'));
});
test('extension toolbar and selection events open local URLs', () => {
  const handlers = {}, urls = [], menus = [];
  const chrome = {
    runtime: {onInstalled: {addListener: f => handlers.install = f}, getURL: p => 'chrome-extension://test/' + p},
    contextMenus: {removeAll: f => f(), create: m => menus.push(m), onClicked: {addListener: f => handlers.menu = f}},
    action: {onClicked: {addListener: f => handlers.action = f}},
    tabs: {create: o => urls.push(o.url)}
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'extension/background.js'), 'utf8'), {chrome});
  handlers.install(); assert.equal(menus[0].contexts[0], 'selection');
  handlers.action(); assert.equal(urls[0], 'chrome-extension://test/index.html');
  const text = 'Offer ₹5000 & <script> 日本語';
  handlers.menu({menuItemId: 'jobcheck-selection', selectionText: text});
  assert.equal(new URLSearchParams(urls[1].split('#')[1]).get('text'), text);
  handlers.menu({menuItemId: 'other'}); assert.equal(urls.length, 2);
});
