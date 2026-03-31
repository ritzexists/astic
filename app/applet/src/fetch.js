const fs = require('fs');
fetch('https://cs.lmu.edu/~ray/notes/vrmlexamples/').then(r=>r.text()).then(t=>fs.writeFileSync('out.txt', t));
