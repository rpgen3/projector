import {diffColor} from 'https://rpgen3.github.io/projector/mjs/diffColor.mjs';
const kuro = [...new Array(9)].map((v,i) => 11849 + i),
      siro = [...new Array(9)].map((v,i) => 11945 - i),
      getKuro = (r, g, b) => [...new Array(9)].map((v,i)=>(i+1)/10).map(v=>[r,g,b].map(v2=>v2*v).map(v=>Math.round(v))).reverse(),
      getSiro = (r, g, b) => [...new Array(9)].map((v,i)=>(i+1)/10).map(v=>[r,g,b].map(v2=>v2+(255-v2)*v).map(v=>Math.round(v)));
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
const colorsMap = new Map;
for(const s of (await(await fetch('https://rpgen3.github.io/projector/data/colors.txt')).text()).split('\n')) {
    if(!s.includes('#')) continue;
    const [a, b] = s.split(' '),
          rgb = a.match(/[0-9A-F]{2}/g).map(v => parseInt(v,16));
    colorsMap.set(b, rgb);
}
const trendMap = new Map;
const add = (r, g, b, yuka, mono) => {
    const code = getTrendCode(r, g, b);
    if(!trendMap.has(code)) trendMap.set(code, []);
    trendMap.get(code).push([r, g, b, yuka, mono]);
};
for(const [id, [r, g, b]] of colorsMap) {
    add(r, g, b, id);
    if(r === 0 && g === 0 && b === 0) continue;
    for(const [i, v] of getKuro(r, g, b).entries()) add(...v, id, kuro[i]);
    if(r === 0xFF && g === 0xFF && b === 0xFF) continue;
    for(const [i, v] of getSiro(r, g, b).entries()) add(...v, id, siro[i]);
}
export const getSprite = (r, g, b, type = 0) => {
    const code = getTrendCode(r, g, b);
    if(!trendMap.has(code)) throw 'missing dic';
    let min = 1, output = null;
    for(const v of trendMap.get(code)) {
        const dif = diffColor([r, g, b], v, type);
        if(min > dif) {
            min = dif;
            output = v;
        }
    }
    return output;
};
