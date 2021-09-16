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
    const msg = (()=>{
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
    const limit100 = rpgen3.addInputBool(body, {
        label: '100制限',
        save: true,
        value: true
    });
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
    addBtn(body.append('<br>'), '映写開始', () => main()).css({
        color: 'white',
        backgroundColor: 'red'
    });
    const main = async () => {
        foot.empty();
        video.muted = true;
        const width = 15,
              height = is12 ? 12 : 11,
              cv = $('<canvas>').prop({width, height}),
              ctx = cv.get(0).getContext('2d'),
              mass = [...new Array(300)].map(v => [...new Array(300)]);
        for(let y = 0; y < 20; y++) {
            for(let x = 0; x < 25; x++) {
                const now = x + y * 20;
                video.currentTime = 1 / inputFPS * now;
                ctx.drawImage(video, 0, 0, width, height);
                const imgData = ctx.getImageData(0, 0, width, height),
                      {data} = imgData;
                for(let i = 0; i < data.length; i += 4) {
                    const _x = (i >> 2) % width,
                          _y = (i >> 2) / 12 | 0;
                    mass[y + _y][x + _x] = getColor(data.slice(i, i + 4));
                }
                await dialog(`${now}/500`);
            }
        }
        floor = mass.map(v => v.join(' ')).join('\n');
        await dialog(`映写完了`);
    };
    let floor;
    const getColor = ([r, g, b, a]) => {
        return 45;
    };
    const inputDelay = rpgen3.addInputNum(body, {
        label: '遅延修正[ms]',
        save: true,
        min: 0,
        max: 100
    });
    addBtn(body.append('<br>'), '出力', () => output()).css({
        color: 'white',
        backgroundColor: 'red'
    });
    const output = async () => {
        const wait = 1 / inputFPS - inputDelay,
              evts = [];
        evts.push(`#MV_CA\ntx:7,ty:5,t:0,s:1,`);
        evts.push(`#MV_PA\ntx:300,ty:300,t:0,n:1,s:1,`);
        evts.push(`#CH_YB\nv:FtutLA63Cp8,`);
        evts.push(`#WAIT\nt:3000,`);
        evts.push(`#PS_YB\n`);
        evts.push(`#WAIT\nt:500,`);
        evts.push(`#SK_YB\ns:0,`);
        evts.push(`#WAIT\nt:500,`);
        evts.push(`#RS_YB\n`);
        for(let y = 0; y < 20; y++) {
            for(let x = 0; x < 25; x++) {
                evts.push(`#MV_CA\ntx:${x * 15 + 7},ty:${y * 12 + 5},t:0,s:1,`);
            }
            evts.push(`#WAIT\nt:${wait},`);
        }
        const map = '\n'.repeat(7) + ' '.repeat(3) + '45C';
        const mapData = [
            await(await fetch('data.txt')).text(),
            `#FLOOR\n${floor}#END`,
            `#MAP\n${map}#END`,
            new rpgen.FullEvent().make(['#CH_PH\np:0,x:0,y:0,'], 3, 7),
            new rpgen.FullEvent(10).make(evts)
        ].join('\n\n');
        rpgen3.addInputStr(foot.empty(),{
            value: rpgen.set(mapData),
            copy: true
        });
    };
    const rpgen = await Promise.all([
        './export/rpgen.mjs',
        './export/fullEvent.mjs'
    ].map(v=>import(v))).then(v => Object.assign({},...v));
})();
