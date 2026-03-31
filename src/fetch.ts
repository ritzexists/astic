fetch('https://cs.lmu.edu/~ray/notes/vrmlexamples/').then(r=>r.text()).then(t=>console.log(t.match(/href=\"([^\"]+\.wrl)\"/g)))
