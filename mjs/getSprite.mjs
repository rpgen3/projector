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
const dic = {
    85 : [255, 255, 255],
    2408 : [0, 0, 0],
    86 : [255, 0, 0],
    92 : [0, 255, 0],
    87 : [0, 0, 255],
    88 : [255, 255, 0],
    93 : [0, 255, 255],
    90 : [255, 0, 255],
    28477 : [128, 255, 0],
    28478 : [128, 0, 255],
    28479 : [0, 128, 255],
    28480 : [255, 128, 0],
    28481 : [255, 0, 128],
    28482 : [0, 255, 128],
};
const obj = {};
const add = (r, g, b, yuka, mono) => {
    const code = getTrendCode(r, g, b);
    if(!obj[code]) obj[code] = [];
    obj[code].push([r, g, b, yuka, mono]);
};
for(const k in dic) {
    const r = dic[k][0],
          g = dic[k][1],
          b = dic[k][2];
    add(r, g, b, k);
    if(k === '2408') continue;
    for(const [i, v] of getKuro(r, g, b).entries()) add(v[0], v[1], v[2], k, kuro[i]);
    if(k === '85') continue;
    for(const [i, v] of getKuro(r, g, b).entries()) add(v[0], v[1], v[2], k, siro[i]));
}
export const getSprite = (r, g, b, type = 0) => {
    const code = getTrendCode(r, g, b);
    if(!obj[code]) throw 'missing dic';
    let min = 1, output = null;
    for(const [i, v] of obj[code].entries()) {
        const dif = diffColor([r, g, b], [v[0], v[1], v[2]], type);
        if(min < dif) return;
        min = dif;
        output = v;
    }
    return output;
};
