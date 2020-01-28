var raw = require('./public/fileProjection.json')

var scenario = '3';
var props = {
	PNSN : ({P, TCR, TCS}) => P * ((1 - TCR) / (1 - TCS))
}

var data = {};
Object.keys(raw).map(variable => {
	Object.keys(raw[variable][scenario]).map(y => {
		data[y] = data[y] || {};
		section = data[y];
		section[variable] = raw[variable][scenario][y];
	});
});

Object.keys(data).forEach(year => {
	Object.keys(props).forEach(prop => {
		data[year][prop] = props[prop](data[year]);
	});
});

console.log(JSON.stringify(data));