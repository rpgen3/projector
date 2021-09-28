import {diffColor} from 'https://rpgen3.github.io/projector/mjs/diffColor.mjs';
const getTrendCode = (r, g, b) => {
    let s = '';
    if(r === g) s += 'a';
    if(r === b) s += 'b';
    if(g === b) s += 'c';
    if(r < b) s += 'd';
    if(r > b) s += 'e';
    if(r < g) s += 'f';
    if(r > g) s += 'g';
    if(g < b) s += 'h';
    if(g > b) s += 'i';
    return s;
};
const dic = [
    'average',
    'median',
    'mode'
].map(async v => {
    const m = new Map;
    for(const str of (await(await fetch(`mosaic/data/${v}.txt`)).text()).split('\n')) {
        const m = str.match(/([0-9]+_[0-9]+) #([0-9a-f]{6})/);
        if(!m) continue;
        m.set(m[1], m[2].match(/.{2}/g).map(v => parseInt(v, 16)));
    }
    return m;
});
const obj = dic.slice().map(v => new Map);
const add = (r, g, b, yuka) => {
    const code = getTrendCode(r, g, b);
    if(!obj[code]) obj[code] = [];
    obj[code].push([r, g, b, yuka]);
};
for(const [i, m] of obj) for(const [k, v] of dic[i]) add(...v, k);
export const getSpriteDefault = (r, g, b, type = 0, ex = 0) => {
    const code = getTrendCode(r, g, b);
    if(!obj[ex][code]) throw 'missing dic';
    let min = 1, output = null;
    for(const v of obj[ex][code]) {
        const dif = diffColor([r, g, b], v, type);
        if(min > dif) {
            min = dif;
            output = v;
        }
    }
    return output;
};
