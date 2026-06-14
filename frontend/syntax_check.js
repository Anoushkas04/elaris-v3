const fs = require('fs');
const html = fs.readFileSync('game.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
let allCode = '';
scriptMatches.forEach(m => allCode += m[1] + '\n');
try {
  new (require('vm').Script)(allCode);
  console.log('Syntax OK');
} catch (e) {
  console.error('Syntax Error:', e);
}
