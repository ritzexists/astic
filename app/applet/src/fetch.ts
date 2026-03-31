const r = await fetch('https://cs.lmu.edu/~ray/notes/vrmlexamples/');
console.log(r.status);
const t = await r.text();
console.log(t.substring(0, 100));
