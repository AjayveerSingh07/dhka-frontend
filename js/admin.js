(function () {
    var S = window.DHKA_SESSION;
    var API = window.DHKA_API;
    var me = S && S.isLoggedIn() ? S.user() : null;

    if (!me) { location.replace('login.html'); return; }
    if (me.role !== 'admin') { location.replace('index.html'); return; }

    function $(id) { return document.getElementById(id); }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    }

    function setState(panel, name) {
        panel.querySelectorAll('[data-state]').forEach(function (n) {
            n.hidden = n.getAttribute('data-state') !== name;
        });
        panel.setAttribute('aria-busy', name === 'loading' ? 'true' : 'false');
    }

    var toastTimer;
    function toast(msg) {
        var t = $('toast');
        t.textContent = msg;
        t.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 3800);
    }

    function api(path, options) {
        var opts = options || {};
        opts.headers = Object.assign({ Authorization: 'Bearer ' + S.token() }, opts.headers || {});
        return fetch(API + path, opts).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
                if (res.status === 401 || res.status === 403) {
                S.clear();
if (res.status === 401 || res.status === 403) {
  try { sessionStorage.setItem('dhka_notice', 'Your session expired. Please log in again.'); } catch (e) {}
}
location.replace('login.html');
                    throw new Error('auth');
                }
                if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
                return data;
            });
        }, function () {
            throw new Error('We could not reach the server. Please check your connection.');
        });
    }

    function send(method, body) {
        var o = { method: method };
        if (body) {
            o.headers = { 'Content-Type': 'application/json' };
            o.body = JSON.stringify(body);
        }
        return o;
    }

    function problem(err) {
        if (err && err.message !== 'auth') toast(err.message);
    }

    /* ---------- Dialogs ---------- */
    var dlgCred = $('dlgCred');
    var dlgPlayer = $('dlgPlayer');
    var dlgConfirm = $('dlgConfirm');
    var credText = '';

    function showCreds(title, sub, name, c) {
        $('credTitle').textContent = title;
        $('credSub').textContent = sub;
        $('credId').textContent = c.studentId;
        $('credPw').textContent = c.password;
        credText = 'Name: ' + name + '\nStudent ID: ' + c.studentId + '\nPassword: ' + c.password;
        dlgCred.showModal();
    }

    $('credCopy').addEventListener('click', function () {
        var done = function () { toast('Copied to clipboard'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(credText).then(done, function () { toast('Please copy it by hand.'); });
        } else {
            toast('Please copy it by hand.');
        }
    });
    $('credDone').addEventListener('click', function () { dlgCred.close(); });

    function confirmDlg(title, text, okLabel) {
        return new Promise(function (resolve) {
            $('cfTitle').textContent = title;
            $('cfText').textContent = text;
            $('cfOk').textContent = okLabel;
            $('cfOk').onclick = function () { dlgConfirm.close(); resolve(true); };
            $('cfCancel').onclick = function () { dlgConfirm.close(); resolve(false); };
            dlgConfirm.oncancel = function () { resolve(false); };
            dlgConfirm.showModal();
        });
    }

    /* ---------- Tabs ---------- */
    var panelReq = $('panelReq');
    var panelPl = $('panelPl');
        var panelEv = $('panelEv');
    var tabs = [
        { tab: $('tabReq'), panel: panelReq, load: loadRequests, loaded: false },
        { tab: $('tabPl'), panel: panelPl, load: loadPlayers, loaded: false },
        { tab: $('tabEv'), panel: panelEv, load: loadEvents, loaded: false }
    ];

    function show(i, focus) {
        tabs.forEach(function (t, j) {
            var on = i === j;
            t.tab.setAttribute('aria-selected', on ? 'true' : 'false');
            t.tab.tabIndex = on ? 0 : -1;
            t.panel.hidden = !on;
        });
        if (!tabs[i].loaded) {
            tabs[i].loaded = true;
            tabs[i].load();
        }
        if (focus) tabs[i].tab.focus();
    }

    tabs.forEach(function (t, i) {
        t.tab.addEventListener('click', function () { show(i); });
        t.tab.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                                show((i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true);
            }
        });
    });

    function fail(panel, err) {
        if (err && err.message === 'auth') return;
        setState(panel, 'error');
    }

    /* ---------- Requests ---------- */
    var reqList = $('reqList');

    function loadRequests() {
        setState(panelReq, 'loading');
        api('/admin/requests').then(function (list) {
            $('cntReq').textContent = list.length;
            reqList.textContent = '';
            if (!list.length) {
                setState(panelReq, 'empty');
                return;
            }
            list.forEach(function (r) { reqList.appendChild(requestItem(r)); });
            setState(panelReq, 'list');
        }).catch(function (err) { fail(panelReq, err); });
    }

    function requestItem(r) {
        var li = el('li', 'adm-item');
        var main = el('div');
        main.appendChild(el('p', 'adm-name', r.name));
        var meta = el('p', 'adm-meta');
        if (r.age) meta.appendChild(el('span', '', 'Age ' + r.age));
        meta.appendChild(el('span', '', r.contact));
        if (r.email) meta.appendChild(el('span', '', r.email));
        meta.appendChild(el('span', '', new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })));
        main.appendChild(meta);

        var actions = el('div', 'adm-actions');
        var ok = el('button', 'btn btn--red btn--sm', 'Approve');
        var no = el('button', 'btn btn--ghost btn--sm', 'Reject');
        ok.type = 'button';
        no.type = 'button';

        ok.addEventListener('click', function () {
            ok.disabled = no.disabled = true;
            api('/admin/approve/' + r.id, send('POST')).then(function (data) {
                tabs[1].loaded = false;
                loadRequests();
                showCreds('Request approved', 'Share these details with the student. The password is shown only once.', r.name, data.credentials);
            }).catch(function (err) {
                ok.disabled = no.disabled = false;
                problem(err);
                loadRequests();
            });
        });

        no.addEventListener('click', function () {
            confirmDlg('Reject this request?', r.name + ' will not receive an account.', 'Reject').then(function (yes) {
                if (!yes) return;
                ok.disabled = no.disabled = true;
                api('/admin/reject/' + r.id, send('POST')).then(function () {
                    toast('Request rejected');
                    loadRequests();
                }).catch(function (err) {
                    ok.disabled = no.disabled = false;
                    problem(err);
                    loadRequests();
                });
            });
        });

        actions.appendChild(ok);
        actions.appendChild(no);
        li.appendChild(main);
        li.appendChild(actions);
        return li;
    }

    /* ---------- Players ---------- */
    var players = [];
    var plList = $('plList');
    var search = $('plSearch');

    function loadPlayers() {
        setState(panelPl, 'loading');
        api('/admin/users').then(function (list) {
            players = list;
            renderPlayers();
        }).catch(function (err) { fail(panelPl, err); });
    }

    function renderPlayers() {
        var q = search.value.trim().toLowerCase();
        var rows = players.filter(function (p) {
            return !q || p.name.toLowerCase().indexOf(q) !== -1 || p.student_id.toLowerCase().indexOf(q) !== -1;
        });
        $('cntPl').textContent = players.length;
        plList.textContent = '';
        if (!rows.length) {
            $('plEmptyTitle').textContent = players.length ? 'No players match your search' : 'No players yet';
            $('plEmptyText').textContent = players.length ? 'Try a different name or Student ID.' : 'Add a player, or approve a registration request.';
            setState(panelPl, 'empty');
            return;
        }
        rows.forEach(function (p) { plList.appendChild(playerItem(p)); });
        setState(panelPl, 'list');
    }

    search.addEventListener('input', function () {
        if (tabs[1].loaded && players.length) renderPlayers();
    });

    function playerItem(p) {
        var li = el('li', 'adm-item');
        var main = el('div');
        main.appendChild(el('p', 'adm-name', p.name));
        var meta = el('p', 'adm-meta');
        meta.appendChild(el('span', '', p.student_id));
        if (p.email) meta.appendChild(el('span', '', p.email));
        main.appendChild(meta);
        var chips = el('div', 'adm-chips');
        chips.appendChild(el('span', 'adm-chip', p.belt || 'Unranked'));
        chips.appendChild(el('span', 'adm-chip', p.rank_points + ' pts'));
        if (p.age) chips.appendChild(el('span', 'adm-chip', 'Age ' + p.age));
        main.appendChild(chips);

        var actions = el('div', 'adm-actions');
        var edit = el('button', 'btn btn--ghost btn--sm', 'Edit');
        var reset = el('button', 'btn btn--ghost btn--sm', 'Reset password');
        edit.type = reset.type = 'button';
        edit.addEventListener('click', function () { openPlayer('edit', p); });
        reset.addEventListener('click', function () {
            confirmDlg('Reset password?', p.name + ' will get a new password. The old one stops working immediately.', 'Reset').then(function (yes) {
                if (!yes) return;
                api('/admin/users/' + p.id + '/reset-password', send('POST')).then(function (data) {
                    showCreds('New password ready', 'Share it with the player. It is shown only once.', p.name, data.credentials);
                }).catch(problem);
            });
        });
        actions.appendChild(edit);
        actions.appendChild(reset);
        li.appendChild(main);
        li.appendChild(actions);
        return li;
    }

    /* ---------- Add / edit player ---------- */
    var form = $('plForm');
    var mode = 'add';
    var editing = null;

    function setErr(input, msg) {
        var f = input.closest('.field');
        f.classList.toggle('is-invalid', !!msg);
        f.querySelector('.field-error').textContent = msg || '';
    }

    function openPlayer(m, p) {
        mode = m;
        editing = p || null;
        form.reset();
        form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('is-invalid'); });
        $('plAlert').hidden = true;
        $('plTitle').textContent = m === 'add' ? 'Add a player' : 'Edit ' + p.name;
        $('plSub').textContent = m === 'add' ? 'We will create a Student ID and password for them.' : p.student_id;
        $('plSubmit').textContent = m === 'add' ? 'Add player' : 'Save changes';
        form.querySelectorAll('.js-add-only').forEach(function (n) { n.hidden = m !== 'add'; });
        if (m === 'edit') {
            $('plAge').value = p.age || '';
            $('plPoints').value = p.rank_points;
            $('plBelt').value = p.belt || '';
        }
        dlgPlayer.showModal();
    }

    $('plAdd').addEventListener('click', function () { openPlayer('add'); });
    $('plCancel').addEventListener('click', function () { dlgPlayer.close(); });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        var name = $('plName').value.trim();
        var email = $('plEmail').value.trim();
        var age = $('plAge').value.trim();
        var points = $('plPoints').value.trim();
        var belt = $('plBelt').value.trim();

        if (mode === 'add') {
            var badName = name.length < 2 || name.length > 80;
            setErr($('plName'), badName ? 'Please enter the full name.' : '');
            if (badName) ok = false;
            var badEmail = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            setErr($('plEmail'), badEmail ? 'Please enter a valid email.' : '');
            if (badEmail) ok = false;
        }
        var badAge = age && !(/^\d{1,2}$/.test(age) && +age >= 4 && +age <= 99);
        setErr($('plAge'), badAge ? 'Age must be 4 to 99.' : '');
        if (badAge) ok = false;
        var badPts = points && !(/^\d{1,6}$/.test(points) && +points <= 100000);
        setErr($('plPoints'), badPts ? 'Use a whole number up to 100000.' : '');
        if (badPts) ok = false;
        var badBelt = belt.length > 30;
        setErr($('plBelt'), badBelt ? 'That is too long.' : '');
        if (badBelt) ok = false;
        if (!ok) return;

        var btn = $('plSubmit');
        btn.classList.add('is-loading');
        $('plAlert').hidden = true;

        var req = mode === 'add'
            ? api('/admin/create-user', send('POST', { name: name, email: email, age: age, rankPoints: points, belt: belt }))
            : api('/admin/users/' + editing.id, send('PATCH', { age: age, rankPoints: points, belt: belt }));

        req.then(function (data) {
            dlgPlayer.close();
            if (mode === 'add') {
                showCreds('Player added', 'Share these details with the player. The password is shown only once.', name, data.credentials);
            } else {
                toast('Changes saved');
            }
            loadPlayers();
        }).catch(function (err) {
            if (err.message === 'auth') return;
            $('plAlert').textContent = err.message;
            $('plAlert').hidden = false;
        }).then(function () {
            btn.classList.remove('is-loading');
        });
    });

    document.querySelectorAll('[data-retry]').forEach(function (b) {
        b.addEventListener('click', function () {
                    if (b.closest('#panelReq')) loadRequests();
            else if (b.closest('#panelEv')) loadEvents();
            else loadPlayers();
        });
    });
    /* ---------- Events ---------- */
    var evAdm = $('evAdmList');
    var dlgEvent = $('dlgEvent');
    var evForm = $('evForm');
    var MAX_FILE = 8 * 1024 * 1024;

    function evDate(s) {
        var p = s.split('-');
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))
            .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function loadEvents() {
        setState(panelEv, 'loading');
        fetch(API + '/events', { cache: 'no-store' })
            .then(function (res) {
                if (!res.ok) throw new Error('bad status');
                return res.json();
            })
            .then(function (list) {
                $('cntEv').textContent = list.length;
                evAdm.textContent = '';
                if (!list.length) {
                    setState(panelEv, 'empty');
                    return;
                }
                list.forEach(function (ev) { evAdm.appendChild(eventItem(ev)); });
                setState(panelEv, 'list');
            })
            .catch(function () { setState(panelEv, 'error'); });
    }

    function eventItem(ev) {
        var li = el('li', 'adm-item');
        var main = el('div');
        main.appendChild(el('p', 'adm-name', ev.title));

        var meta = el('p', 'adm-meta');
        meta.appendChild(el('span', '', evDate(ev.event_date)));
        if (ev.location) meta.appendChild(el('span', '', ev.location));
        main.appendChild(meta);

        var chips = el('div', 'adm-chips');
        if (ev.image_url) chips.appendChild(el('span', 'adm-chip', 'Photo'));
        if (ev.pdf_url) chips.appendChild(el('span', 'adm-chip', 'PDF'));
        if (chips.children.length) main.appendChild(chips);

        var actions = el('div', 'adm-actions');
        var del = el('button', 'btn btn--ghost btn--sm', 'Delete');
        del.type = 'button';
        del.addEventListener('click', function () {
            confirmDlg('Delete this event?', ev.title + ' and its files will be removed permanently.', 'Delete').then(function (yes) {
                if (!yes) return;
                del.disabled = true;
                api('/admin/events/' + ev.id, { method: 'DELETE' }).then(function () {
                    toast('Event deleted');
                    loadEvents();
                }).catch(function (err) {
                    del.disabled = false;
                    problem(err);
                });
            });
        });
        actions.appendChild(del);

        li.appendChild(main);
        li.appendChild(actions);
        return li;
    }

    function evErr(input, msg) {
        var f = input.closest('.field');
        f.classList.toggle('is-invalid', !!msg);
        f.querySelector('.field-error').textContent = msg || '';
    }

    function fileProblem(input, kinds, label) {
        var f = input.files && input.files[0];
        if (!f) return '';
        if (kinds.indexOf(f.type) === -1) return 'Please choose a ' + label + '.';
        if (f.size > MAX_FILE) return 'This file is larger than 8 MB.';
        return '';
    }
        function shrinkImage(file) {
        if (!file) return Promise.resolve(null);
        var MAX = 1600;
        var load = window.createImageBitmap
            ? createImageBitmap(file, { imageOrientation: 'from-image' })
            : Promise.reject(new Error('unsupported'));

        return load.then(function (bmp) {
            var w = bmp.width;
            var h = bmp.height;
            if (w <= MAX && h <= MAX && file.type === 'image/jpeg' && file.size <= 1.5 * 1024 * 1024) {
                if (bmp.close) bmp.close();
                return file;
            }
            var scale = Math.min(1, MAX / Math.max(w, h));
            var c = document.createElement('canvas');
            c.width = Math.round(w * scale);
            c.height = Math.round(h * scale);
            var ctx = c.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.drawImage(bmp, 0, 0, c.width, c.height);
            if (bmp.close) bmp.close();
            return new Promise(function (resolve) {
                c.toBlob(function (blob) {
                    resolve(blob && blob.size < file.size ? blob : file);
                }, 'image/jpeg', 0.85);
            });
        }).catch(function () { return file; });
    }

    $('evAdd').addEventListener('click', function () {
        evForm.reset();
        evForm.querySelectorAll('.field').forEach(function (f) { f.classList.remove('is-invalid'); });
        $('evAlert').hidden = true;
        dlgEvent.showModal();
    });

    $('evCancel').addEventListener('click', function () { dlgEvent.close(); });

    evForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var title = $('evTitle').value.trim();
        var date = $('evDate').value;
        var place = $('evPlace').value.trim();
        var text = $('evText').value.trim();
        var ok = true;

        function check(input, msg) {
            evErr(input, msg);
            if (msg) ok = false;
        }

        check($('evTitle'), title.length < 3 || title.length > 120 ? 'Use 3 to 120 characters.' : '');
        check($('evDate'), /^\d{4}-\d{2}-\d{2}$/.test(date) ? '' : 'Please choose a date.');
        check($('evPlace'), place.length > 120 ? 'That is too long.' : '');
        check($('evText'), text.length > 3000 ? 'Please keep it under 3000 characters.' : '');
        check($('evImage'), fileProblem($('evImage'), ['image/jpeg', 'image/png', 'image/webp'], 'JPG, PNG or WebP image'));
        check($('evPdf'), fileProblem($('evPdf'), ['application/pdf'], 'PDF file'));
        if (!ok) return;

        var data = new FormData();
        data.append('title', title);
        data.append('event_date', date);
        data.append('location', place);
        data.append('description', text);
        if ($('evPdf').files[0]) data.append('pdf', $('evPdf').files[0]);

        var btn = $('evSubmit');
        btn.classList.add('is-loading');
        $('evAlert').hidden = true;

                shrinkImage($('evImage').files[0]).then(function (img) {
            if (img) data.append('image', img, 'photo.jpg');
            return api('/admin/events', { method: 'POST', body: data });
        }).then(function () {
            dlgEvent.close();
            toast('Event added');
            loadEvents();
        }).catch(function (err) {
            if (err.message === 'auth') return;
            $('evAlert').textContent = err.message;
            $('evAlert').hidden = false;
        }).then(function () {
            btn.classList.remove('is-loading');
        });
    });

    show(0);
})();