const fs = require('fs');
let html = fs.readFileSync('frontend/game.html', 'utf8');
let parts = html.split('<script>');
if (parts.length > 1) {
  let js = parts[parts.length - 1].split('</script>')[0];
  fs.writeFileSync('temp_js_check.js', js);
  console.log('Extracted JS.');
}
