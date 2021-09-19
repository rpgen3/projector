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
        'url'
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
        accept: 'image/*,video/*'
    }).on('change', ({target}) => {
        const file = target.files[0],
              {type} = file;
        hImage.add(hVideo).hide();
        if(type.includes('image')) {
            image.src = URL.createObjectURL(file);
            hImage.show();
        }
        else if(type.includes('video')) {
            video.controls = true;
            video.src = URL.createObjectURL(file);
            hVideo.show();
            video.onload = () => {
                fVideo.width(video.width).height(video.height);
            };
        }
        foot.empty();
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
        value: 'CIEDE2000による色差の計算'
    });
    // 画像処理
    const hImage = $('<div>').appendTo(body).hide(),
          image = $('<img>').appendTo(hImage).get(0);
    const inputWidth = rpgen3.addInputNum(hImage, {
        label: '幅',
        save: true,
        min: 16,
        max: 300,
        value: 60
    });
    addBtn(hImage.append('<br>'), '出力', () => main2()).css({
        color: 'white',
        backgroundColor: 'red'
    });
    const main2 = async () => {
        const {width, height} = image,
              w = inputWidth(),
              h = w * (height / width) | 0,
              cv = $('<canvas>').prop({
                  width: w,
                  height: h
              }),
              ctx = cv.get(0).getContext('2d');
        ctx.drawImage(image, 0, 0, width, height, 0, 0, w, h);
        const yuka = [...new Array(h)].map(() => [...new Array(w)]),
              mono = yuka.map(v => v.slice());
        const imgData = ctx.getImageData(0, 0, width, height),
              {data} = imgData;
        for(let i = 0; i < data.length; i += 4) {
            const x = (i >> 2) % w,
                  y = (i >> 2) / w | 0,
                  output = getSprite(...data.slice(i, i + 3), inputType());
            if(!output) throw msg('getSprite is err', true);
            yuka[y][x] = output[3];
            if(output[4]) mono[y][x] = output[4];
        }
        const floor = yuka.map(v => v.join(' ')).join('\n'),
              map = mono.map(v => v.join(' ')).join('\n');
        const mapData = [
            await(await fetch('data.txt')).text(),
            `#FLOOR\n${floor}#END`,
            `#MAP\n${map}#END`
        ].join('\n\n');
        rpgen3.addInputStr(foot.empty(),{
            value: rpgen.set(mapData),
            copy: true
        });
    };
    // 動画処理
    const hVideo = $('<div>').appendTo(body).hide();
    const fVideo = $('<div>').appendTo(hVideo).css({
        position: 'relative'
    });
    const video = $('<video>').appendTo(fVideo).get(0);
    const cover = $('<div>').appendTo(fVideo).css({
        position: 'absolute',
        backgroundColor: 'rgba(255, 0, 0, 0.5)'
    });
    const seek = x => new Promise(resolve => {
        const seeked = () => {
            video.removeEventListener('seeked', seeked);
            resolve();
        };
        video.addEventListener('seeked', seeked);
        video.currentTime = x;
    });
    const inputTrim = rpgen3.addInputStr(hVideo, {
        label: 'トリミング(x,y,w,h)'
    });
    const getTrim = () => {
        const m = inputTrim().match(/[0-9]+/g);
        return m && m.length === 4 ? m.map(Number) : false;
    };
    inputTrim.elm.on('input', () => {
        const t = getTrim();
        if(t) cover.css({
            left: t[0],
            top: t[1],
            width: t[2],
            height: t[3]
        }).show();
        else cover.hide();
    });
    const is12 = rpgen3.addInputBool(hVideo, {
        label: '高さ12',
        save: true,
        value: true
    });
    const limit300 = rpgen3.addInputBool(hVideo, {
        label: '300マスまで',
        save: true,
        value: true
    });
    const inputFPS = rpgen3.addInputNum(hVideo, {
        label: 'FPS',
        save: true,
        min: 1,
        max: 60,
        value: 8
    });
    addBtn(hVideo.append('<br>'), '映写開始', () => main()).css({
        color: 'white',
        backgroundColor: 'red'
    });
    let _w, _h;
    const main = async () => {
        foot.empty();
        video.muted = true;
        if(limit300()) {
            _w = 20;
            _h = 25;
        }
        else {
            const len = video.duration * inputFPS;
            _w = _h = Math.sqrt(len) + 1 | 0;
        }
        const width = 15,
              height = is12() ? 12 : 11,
              cv = $('<canvas>').prop({width, height}),
              ctx = cv.get(0).getContext('2d'),
              yuka = [...new Array(_h * 12)].map(() => [...new Array(_w * 15)]),
              mono = yuka.map(v => v.slice()),
              t = getTrim();
        for(let y = 0; y < _h; y++) {
            for(let x = 0; x < _w; x++) {
                const now = x + y * _w;
                await seek(1 / inputFPS * now);
                if(t) ctx.drawImage(video, t[0], t[1], t[2], t[3], 0, 0, width, height);
                else ctx.drawImage(video, 0, 0, width, height);
                const imgData = ctx.getImageData(0, 0, width, height),
                      {data} = imgData;
                for(let i = 0; i < data.length; i += 4) {
                    const _x = x * 15 + (i >> 2) % 15,
                          _y = y * 12 + ((i >> 2) / 15 | 0),
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
    const inputFix = rpgen3.addInputNum(hVideo, {
        label: '遅延修正[ms]',
        save: true,
        min: 0,
        max: 100,
        value: 0
    });
    const inputURL = rpgen3.addInputStr(hVideo, {
        label: '動画URL',
        save: true,
        value: 'https://www.youtube.com/watch?v=FtutLA63Cp8'
    });
    addBtn(hVideo.append('<br>'), '出力', () => output()).css({
        color: 'white',
        backgroundColor: 'red'
    });
    const output = async () => {
        const wait = (1 / inputFPS * 1000 | 0) - inputFix,
              evts = [];
        evts.push(`#MV_CA\ntx:7,ty:5,t:0,s:1,`);
        evts.push(`#MV_PA\ntx:9999,ty:9999,t:0,n:1,s:1,`);
        evts.push(`#CH_YB\nv:${rpgen3.getParam(inputURL()).v},`);
        evts.push(`#WAIT\nt:2000,`);
        evts.push(`#PS_YB`);
        evts.push(`#WAIT\nt:1000,`);
        evts.push(`#PS_YB`);
        evts.push(`#WAIT\nt:1000,`);
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
