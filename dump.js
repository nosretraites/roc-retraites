var data = require('./public/fileProjection.json')

console.log(['Variable', 'Scénario', 'Année', 'Valeur'].join(';'));
Object.keys(data).map(v => {
  Object.keys(data[v]).map(s => {
    Object.keys(data[v][s]).map(y => {
      console.log([v, s, y, data[v][s][y].toString().replace('.', ',')].join(';'))
    });
  })
})