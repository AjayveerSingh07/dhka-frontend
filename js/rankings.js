(function () {
    var card = document.getElementById('rankCard');
    if (!card) return;

    var S = window.DHKA_SESSION;
    var API = window.DHKA_API;

    if (!S || !S.isLoggedIn()) {
        location.replace('login.html');
        return;
    }

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var BELTS = {
        white: '#FFFFFF', yellow: '#F5C518', orange: '#F28C28', green: '#2E9E4F',
        blue: '#1E5BD8', purple: '#7B3FA0', brown: '#7A4A21', black: '#000000'
    };

    function $(id) { return document.getElementById(id); }

    function show(which) {
        ['rkLoading', 'rkError', 'rkContent'].forEach(function (id) {
            $(id).hidden = id !== which;
        });
        card.setAttribute('aria-busy', which === 'rkLoading' ? 'true' : 'false');
    }

    function countUp(el, to) {
        if (reduce || to < 1) {
            el.textContent = to;
            return;
        }
        var start = null;
        var time = 1400;
        function frame(now) {
            if (start === null) start = now;
            var t = Math.min(1, (now - start) / time);
            var eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(to * eased);
            if (t < 1) window.requestAnimationFrame(frame);
        }
        window.requestAnimationFrame(frame);
    }

    function beltColor(belt) {
        var name = String(belt || '').toLowerCase();
        var key = Object.keys(BELTS).filter(function (k) { return name.indexOf(k) !== -1; })[0];
        return key ? BELTS[key] : '';
    }

    function render(d) {
        $('rkAvatar').textContent = (Array.from(String(d.name || '?').trim())[0] || '?').toUpperCase();
        $('rkName').textContent = d.name;
        $('rkId').textContent = d.student_id;
        $('rkBelt').textContent = d.belt || 'Unranked';
        $('rkAge').textContent = d.age || '\u2014';

        var color = beltColor(d.belt);
        if (color) $('rkDot').style.background = color;

        show('rkContent');

        if (d.rank_position) {
            $('rkRanked').hidden = false;
            $('rkUnranked').hidden = true;
            $('rkOf').textContent = 'of ' + d.total_players + (d.total_players === 1 ? ' player' : ' players');
            countUp($('rkPos'), d.rank_position);
        } else {
            $('rkRanked').hidden = true;
            $('rkUnranked').hidden = false;
            $('rkNote').textContent = 'Admin accounts are not part of the rankings.';
            $('rkNote').hidden = false;
        }
        countUp($('rkPoints'), Number(d.rank_points) || 0);
    }

    function load() {
        show('rkLoading');
        fetch(API + '/my-rank', { headers: { Authorization: 'Bearer ' + S.token() } })
            .then(function (res) {
                if (res.status === 401 || res.status === 403) {
                S.clear();
if (res.status === 401 || res.status === 403) {
  try { sessionStorage.setItem('dhka_notice', 'Your session expired. Please log in again.'); } catch (e) {}
}
location.replace('login.html');
                    return null;
                }
                if (!res.ok) throw new Error('bad status');
                return res.json().then(render);
            })
            .catch(function () { show('rkError'); });
    }

    $('rkRetry').addEventListener('click', load);
    load();
})();