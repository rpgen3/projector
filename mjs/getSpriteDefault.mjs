import {diffColor} from 'https://rpgen3.github.io/projector/mjs/diffColor.mjs';
const dic = await Promise.all([
    'average',
    'median',
    'mode'
].map(async v => {
    const map = new Map;
    for(const str of (await(await fetch(`mosaic/data/${v}.txt`)).text()).split('\n')) {
        const m = str.match(/([0-9]+_[0-9]+) #([0-9a-f]{6})/);
        if(!m) continue;
        map.set(m[1], m[2].match(/.{2}/g).map(v => parseInt(v, 16)));
    }
    return map;
}));
export const getSpriteDefault = (r, g, b, type = 0, ex = 0) => {
    let min = 1, output = null;
    for(const [k, v] of dic[ex]) {
        const dif = diffColor([r, g, b], v, type);
        if(min > dif) {
            min = dif;
            output = k;
        }
    }
    return output;
};
