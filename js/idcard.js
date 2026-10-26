(function () {
    var wrap = document.getElementById('idcWrap');
    if (!wrap) return;

    var S = window.DHKA_SESSION;
    var API = window.DHKA_API;

        var current = null;

    if (!S || !S.isLoggedIn()) {
        location.replace('login.html');
        return;
    }

    var BELTS = {
        white: '#FFFFFF', yellow: '#F5C518', orange: '#F28C28', green: '#2E9E4F',
        blue: '#1E5BD8', purple: '#7B3FA0', brown: '#7A4A21', black: '#000000'
    };

    function $(id) { return document.getElementById(id); }

    function show(which) {
        ['idcLoading', 'idcError', 'idcCard'].forEach(function (id) {
            $(id).hidden = id !== which;
        });
                $('idcDownload').hidden = which !== 'idcCard';
        wrap.setAttribute('aria-busy', which === 'idcLoading' ? 'true' : 'false');
    }

    function beltColor(belt) {
        var name = String(belt || '').toLowerCase();
        var key = Object.keys(BELTS).filter(function (k) { return name.indexOf(k) !== -1; })[0];
        return key ? BELTS[key] : '';
    }

    function since(iso) {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '\u2014';
        return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }

    function render(d) {
        current = d;
        $('idcName').textContent = d.name || '\u2014';
        $('idcId').textContent = d.student_id || '\u2014';
        $('idcAge').textContent = d.age || '\u2014';
        $('idcBelt').textContent = d.belt || 'Unranked';
        $('idcSince').textContent = since(d.created_at);
        $('idcEmail').textContent = d.email || '\u2014';

        var color = beltColor(d.belt);
        if (color) $('idcDot').style.background = color;

        show('idcCard');
    }

    function load() {
        show('idcLoading');
        fetch(API + '/my-profile', { headers: { Authorization: 'Bearer ' + S.token() } })
            .then(function (res) {
                if (res.status === 401 || res.status === 403) {
                    S.clear();
                    try { sessionStorage.setItem('dhka_notice', 'Your session expired. Please log in again.'); } catch (e) {}
                    location.replace('login.html');
                    return null;
                }
                if (!res.ok) throw new Error('bad status');
                return res.json().then(render);
            })
            .catch(function () { show('idcError'); });
    }
    /* ---------- download as PNG (drawn on a canvas) ---------- */
    function roundPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function setFont(ctx, weight, size, family) {
        ctx.font = weight + ' ' + size + 'px ' + family;
    }

    function fitText(ctx, text, maxW, size, weight, family) {
        setFont(ctx, weight, size, family);
        while (ctx.measureText(text).width > maxW && size > 20) {
            size -= 2;
            setFont(ctx, weight, size, family);
        }
    }

    function spaced(ctx, px) {
        if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px';
    }

    function loadLogo() {
        return new Promise(function (resolve) {
            var img = new Image();
            img.onload = function () { resolve(img); };
            img.onerror = function () { resolve(null); };
            img.src = 'images/logo.png';
        });
    }

    function drawCard(d, logo) {
        var W = 1012, H = 638;
        var c = document.createElement('canvas');
        c.width = W; c.height = H;
        var ctx = c.getContext('2d');
        var ARCH = 'Archivo, sans-serif';
        var SANS = '"Instrument Sans", sans-serif';

        roundPath(ctx, 0, 0, W, H, 36);
        ctx.clip();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W, H);

        /* header */
        ctx.fillStyle = '#0A2A66';
        ctx.fillRect(0, 0, W, 150);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, 150);
        ctx.clip();
        ctx.strokeStyle = 'rgba(31,196,222,.5)';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(930, 10, 110, 0.5, 4.8);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(92, 75, 46, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#0A2A66';
        ctx.fillRect(46, 29, 92, 92);
        if (logo) ctx.drawImage(logo, 46, 29, 92, 92);
        ctx.restore();
        ctx.strokeStyle = '#1FC4DE';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(92, 75, 46, 0, Math.PI * 2);
        ctx.stroke();

        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#FFFFFF';
        setFont(ctx, 700, 46, ARCH);
        spaced(ctx, 4);
        ctx.fillText('DHKA', 164, 82);
        spaced(ctx, 0);
        ctx.fillStyle = 'rgba(255,255,255,.78)';
        setFont(ctx, 400, 22, SANS);
        ctx.fillText('Distt. Hoshiarpur Karate Do Association', 164, 116);

        /* photo frame (blank) */
        roundPath(ctx, 50, 190, 250, 312, 22);
        ctx.fillStyle = '#F2F2F4';
        ctx.fill();
        ctx.setLineDash([14, 10]);
        ctx.strokeStyle = '#C7C7CC';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#C7C7CC';
        ctx.beginPath();
        ctx.arc(175, 312, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(175, 440, 74, 52, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();

        /* who */
        var X = 350;
        ctx.fillStyle = '#8E8E93';
        setFont(ctx, 600, 20, SANS);
        spaced(ctx, 3);
        ctx.fillText('MEMBER', X, 222);
        spaced(ctx, 0);

        ctx.fillStyle = '#1C1C1E';
        fitText(ctx, d.name || '', 612, 56, 700, ARCH);
        ctx.fillText(d.name || '', X, 285);

        ctx.fillStyle = '#0A2A66';
        setFont(ctx, 600, 28, SANS);
        spaced(ctx, 2);
        ctx.fillText(d.student_id || '', X, 334);
        spaced(ctx, 0);

        ctx.fillStyle = '#E3E3E8';
        ctx.fillRect(X, 366, 612, 2);

        /* details */
                function field(label, value, x, y, maxW, indent) {
            var ind = indent || 0;
            ctx.fillStyle = '#8E8E93';
            setFont(ctx, 600, 18, SANS);
            spaced(ctx, 3);
            ctx.fillText(label.toUpperCase(), x, y);
            spaced(ctx, 0);
            ctx.fillStyle = '#1C1C1E';
            fitText(ctx, value, maxW - ind, 30, 600, SANS);
            ctx.fillText(value, x + ind, y + 40);
        }

        field('Age', String(d.age || '\u2014'), X, 410, 140);
                field('Belt', d.belt || 'Unranked', 540, 410, 200, 28);
        field('Member since', since(d.created_at), 760, 410, 200);
        field('Email', d.email || '\u2014', X, 500, 612);

                var bc = beltColor(d.belt) || '#C7C7CC';
        ctx.beginPath();
        ctx.arc(551, 440, 11, 0, Math.PI * 2);
        ctx.fillStyle = bc;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.25)';
        ctx.lineWidth = 2;
        ctx.stroke();

        /* footer */
        ctx.fillStyle = '#F2F2F4';
        ctx.fillRect(0, 568, W, 70);
        ctx.fillStyle = '#6E6E73';
        setFont(ctx, 600, 18, SANS);
        spaced(ctx, 3);
        ctx.fillText('OFFICIAL MEMBER CARD', 50, 611);
        spaced(ctx, 0);
        roundPath(ctx, 898, 600, 64, 10, 5);
        ctx.fillStyle = '#D72638';
        ctx.fill();

        return c;
    }

    function download() {
        if (!current) return;
        var btn = $('idcDownload');
        btn.disabled = true;
        var fonts = [];
        if (document.fonts && document.fonts.load) {
            fonts = [
                document.fonts.load('700 56px Archivo'),
                document.fonts.load('600 28px "Instrument Sans"')
            ];
        }
        Promise.all(fonts.map(function (p) { return p.catch(function () {}); }))
            .then(function () { return loadLogo(); })
            .then(function (logo) {
                var canvas = drawCard(current, logo);
                canvas.toBlob(function (blob) {
                    btn.disabled = false;
                    if (!blob) return;
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'DHKA-ID-' + String(current.student_id || 'card').replace(/[^\w-]/g, '') + '.png';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
                }, 'image/png');
            })
            .catch(function () { btn.disabled = false; });
    }

    $('idcDownload').addEventListener('click', download);

    $('idcRetry').addEventListener('click', load);
    load();
})();