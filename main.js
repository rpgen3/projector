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
        'css'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    $('<span>').appendTo(head).text('映写機');
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
    $('<input>').appendTo(body).prop({
        type: 'file',
        accept: 'video/*'
    }).on('change', ({target}) => {
        video.controls = true;
        video.src = URL.createObjectURL(target.files[0]);
    });
    const video = $('<video>').appendTo(body.append('<br>')).get(0);
    const is12 = rpgen3.addInputBool(body, {
        label: '高さ12',
        save: true
    });
    const inputFPS = rpgen3.addInputNum(body, {
        label: 'FPS',
        save: true,
        min: 1,
        max: 60,
        value: 8
    });
    const limit300 = rpgen3.addInputBool(body, {
        label: '300マスまで',
        save: true,
        value: true
    });
    const inputType = rpgen3.addSelect(body, {
        label: '色比較アルゴリズム',
        save: true,
        list: {
            'RGB表色系でのユークリッド距離による色差の計算' : 3,
            'XYZ表色系でのユークリッド距離による色差の計算' : 2,
            'L*a*b*表色系でのユークリッド距離による色差の計算' : 1,
            'CIEDE2000による色差の計算' : 0
        },
        value: 0
    });
    addBtn(body.append('<br>'), '映写開始', () => main()).css({
        color: 'white',
        backgroundColor: 'red'
    });
    let _w, _h;
    const main = async () => {
        foot.empty();
        video.muted = true;
        const width = 15,
              height = is12 ? 12 : 11,
              cv = $('<canvas>').prop({width, height}),
              ctx = cv.get(0).getContext('2d'),
              yuka = [...new Array(300)].map(v => [...new Array(300)]),
              mono = [...new Array(300)].map(v => [...new Array(300)]);
        if(limit300()) {
            _w = 20;
            _h = 25;
        }
        else {
            const len = video.duration * inputFPS;
            _w = _h = (Math.sqrt(len / 3) + 1 | 0) ** 2;
        }
        for(let y = 0; y < _h; y++) {
            for(let x = 0; x < _w; x++) {
                const now = x + y * _w,
                      next = 1 / inputFPS * now;
                video.currentTime = next;
                await sleep(30);
                ctx.drawImage(video, 0, 0, width, height);
                const imgData = ctx.getImageData(0, 0, width, height),
                      {data} = imgData;
                for(let i = 0; i < data.length; i += 4) {
                    const _x = x * 15 + (i >> 2) % 15,
                          _y = y * 12 + ((i >> 2) / 12 | 0),
                          output = getSprite(...data.slice(i, i + 3), inputType());
                    if(!output) throw msg('getSprite is err', true);
                    yuka[_y][_x] = output[3];
                    if(output[4]) mono[_y][_x] = output[4];
                }
                await dialog(`${now}/${_w * _h}`);
            }
        }
        mono[7][3] = (mono[7][3] || 45) + 'C';
        g_floor = yuka.map(v => v.join(' ')).join('\n');
        g_map = mono.map(v => v.join(' ')).join('\n');
        await dialog(`映写完了`);
    };
    let g_floor, g_map;
    const {getSprite} = await import('https://rpgen3.github.io/projector/mjs/getSprite.mjs');
    const inputDelay = rpgen3.addInputNum(body, {
        label: '遅延修正[ms]',
        save: true,
        min: 0,
        max: 100,
        value: 0
    });
    addBtn(body.append('<br>'), '出力', () => output()).css({
        color: 'white',
        backgroundColor: 'red'
    });
    const output = async () => {
        const wait = (1 / inputFPS * 1000 | 0) - inputDelay,
              evts = [];
        evts.push(`#MV_CA\ntx:7,ty:5,t:0,s:1,`);
        evts.push(`#MV_PA\ntx:9999,ty:9999,t:0,n:1,s:1,`);
        evts.push(`#CH_YB\nv:FtutLA63Cp8,`);
        evts.push(`#WAIT\nt:3000,`);
        evts.push(`#PS_YB`);
        evts.push(`#WAIT\nt:500,`);
        evts.push(`#SK_YB\ns:0,`);
        evts.push(`#WAIT\nt:500,`);
        evts.push(`#RS_YB`);
        for(let y = 0; y < _h; y++) {
            for(let x = 0; x < _w; x++) {
                evts.push(`#MV_CA\ntx:${x * 15 + 7},ty:${y * 12 + 5},t:0,s:1,`);
                if(wait > 0) evts.push(`#WAIT\nt:${wait},`);
            }
        }
        const mapData = [
            await(await fetch('data.txt')).text(),
            `#FLOOR\n${g_floor}#END`,
            `#MAP\n${g_map}#END`,
            new rpgen.FullEvent().make(['#CH_PH\np:0,x:0,y:0,'], 3, 7),
            new rpgen.FullEvent(10).make(evts)
        ].join('\n\n');
        rpgen3.addInputStr(foot.empty(),{
            value: rpgen.set(mapData),
            copy: true
        });
    };
    const rpgen = await importAll([
        'rpgen',
        'fullEvent'
    ].map(v=>`https://rpgen3.github.io/midi/export/${v}.mjs`));
})();
