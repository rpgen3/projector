(async () => {
    const {importAll, getScript} = await import(`https://rpgen3.github.io/mylib/export/import.mjs`);
    await getScript('https://code.jquery.com/jquery-3.3.1.min.js');
    const $ = window.$;
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const head = $('<div>').appendTo(html),
          body = $('<div>').appendTo(html),
          foot = $('<div>').appendTo(html);
    const rpgen3 = await importAll([
        'input',
        'sample'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    $('<span>').appendTo(head).text('代表色の抽出');
    const addBtn = (h, ttl, func) => $('<button>').appendTo(h).text(ttl).on('click', func);
    const msg = (() => {
        const elm = $('<div>').appendTo(body);
        return (str, isError) => $('<span>').appendTo(elm.empty()).text(str).css({
            color: isError ? 'red' : 'blue',
            backgroundColor: isError ? 'pink' : 'lightblue'
        });
    })();
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const dialog = async str => {
        msg(str);
        await sleep(30);
    };
    // 画像処理
    const image = $('<img>').prop({src: 'https://i.imgur.com/UPFOx4N.png'}).get(0);
    const inputType = rpgen3.addSelect(body, {
        label: '代表色の抽出',
        list: {
            '平均値': 0,
            '中央値': 1,
            '最頻値': 2
        }
    });
    addBtn(body.append('<br>'), '出力', () => main()).css({
        color: 'white',
        backgroundColor: 'red'
    });
    const main = async () => {
        const {width, height} = image,
              cv = $('<canvas>').prop({width, height}),
              ctx = cv.get(0).getContext('2d');
        ctx.drawImage(image, 0, 0);
        const unit = 16,
              m = new Map,
              same = [];
        for(let y = 0; y < height; y += unit) {
            for(let x = 0; x < width; x += unit) {
                const {data} = ctx.getImageData(x, y, unit, unit),
                      ar = [];
                for(let i = 0; i < data.length; i += 4) {
                    const [r, g, b, a] = data.slice(i, i + 4);
                    ar.push([r, g, b].map(v => v * (a / 255) | 0));
                };
                const ex = (() => {
                    switch(inputType) {
                        case 0: return getAve;
                        case 1: return getMed;
                        case 2: return getMod;
                    }
                })()(ar);
                if(!ex) continue;
                const e = ex.map(v => ('0' + v.toString(16)).slice(-2)).join('');
                if(same.includes(e)) continue;
                same.push(e);
                m.set(`${x}_${y}`, e);
            }
        }
        rpgen3.addInputStr(foot.empty(),{
            value: [...m].map(([k, v]) => `${k} #${v}`).join('\n'),
            copy: true
        });
    };
    const luminance = (r, g, b) => r * 0.298912 + g * 0.586611 + b * 0.114478 | 0;
    const getAve = ar => ar.reduce((p, x) => p.map((v, i) => v + x[i]), [0, 0, 0]).map(v => v / ar.length | 0); // 平均値
    const toLum = (ar, func) => {
        const m = new Map;
        for(const v of ar){
            const lum = luminance(...v);
            m.set(lum, v);
        }
        return m.get(func([...m.keys()]));
    };
    const getMed = ar => toLum(ar, rpgen3.median); // 中央値
    const getMod = ar => toLum(ar, rpgen3.mode); // 最頻値
})();
