(function () {
    var S = window.DHKA_SESSION;
    var pill = document.getElementById('pill');
    var burger = document.getElementById('burger');
    var menuActions = document.querySelector('.menu-actions');
    if (!S || !pill) return;

    var inner = pill.parentElement;
    var originalActions = menuActions ? menuActions.innerHTML : '';
    var btn = null;
    var panel = null;

    function el(tag, cls, text) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function initial(name) {
        var first = Array.from(String(name || '?').trim())[0] || '?';
        return first.toUpperCase();
    }

    function setOpen(open) {
        if (!panel) return;
        panel.classList.toggle('is-open', open);
        panel.inert = !open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
            var first = panel.querySelector('a, button');
            if (first) first.focus({ preventScroll: true });
        }
    }

    function isOpen() {
        return !!panel && panel.classList.contains('is-open');
    }

    function logout() {
        var path = location.pathname;
        S.clear();
        if (/(rankings|admin|id-card)\.html$/.test(path)) {
            location.href = 'login.html';
        } else if (/login\.html$/.test(path)) {
            location.reload();
        }
    }

    function build(user) {
        var isAdmin = user.role === 'admin';

        btn = el('button', 'acct-btn', initial(user.name));
        btn.type = 'button';
        btn.id = 'acctBtn';
        btn.setAttribute('aria-label', 'Account menu');
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'acctPanel');
        btn.addEventListener('click', function () { setOpen(!isOpen()); });
        pill.appendChild(btn);

        panel = el('div', 'acct-panel');
        panel.id = 'acctPanel';
        panel.inert = true;

        var head = el('div', 'acct-head');
        head.appendChild(el('span', 'acct-avatar', initial(user.name)));
        var who = el('div', 'acct-who');
        who.appendChild(el('span', 'acct-name', user.name));
        who.appendChild(el('span', 'acct-id', user.studentId));
        if (isAdmin) who.appendChild(el('span', 'acct-chip', 'Admin'));
        head.appendChild(who);
        panel.appendChild(head);

        var list = el('div', 'acct-list');
        var rank = el('a', 'acct-link', 'My ranking');
        rank.href = 'rankings.html';
        list.appendChild(rank);
        var idCard = el('a', 'acct-link', 'ID card');
        idCard.href = 'id-card.html';
        list.appendChild(idCard);
        if (isAdmin) {
            var admin = el('a', 'acct-link', 'Admin panel');
            admin.href = 'admin.html';
            list.appendChild(admin);
        }
        var out = el('button', 'acct-link acct-logout', 'Log out');
        out.type = 'button';
        out.addEventListener('click', logout);
        list.appendChild(out);
        panel.appendChild(list);

        inner.appendChild(panel);

        if (menuActions) {
            menuActions.textContent = '';
            menuActions.appendChild(el('p', 'menu-user', 'Signed in as ' + user.name));
            var mRank = el('a', 'btn btn--red', 'My ranking');
            mRank.href = 'rankings.html';
            menuActions.appendChild(mRank);
            var mCard = el('a', 'btn btn--ghost', 'ID card');
            mCard.href = 'id-card.html';
            menuActions.appendChild(mCard);
            if (isAdmin) {
                var mAdmin = el('a', 'btn btn--ghost', 'Admin panel');
                mAdmin.href = 'admin.html';
                menuActions.appendChild(mAdmin);
            }
            var mOut = el('button', 'btn btn--ghost', 'Log out');
            mOut.type = 'button';
            mOut.addEventListener('click', logout);
            menuActions.appendChild(mOut);
        }
    }

    function render() {
        if (btn) btn.remove();
        if (panel) panel.remove();
        btn = null;
        panel = null;
        if (menuActions) menuActions.innerHTML = originalActions;
        if (S.isLoggedIn()) build(S.user());
    }

    document.addEventListener('click', function (e) {
        if (isOpen() && !panel.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen()) {
            setOpen(false);
            btn.focus();
        }
    });

    if (burger) burger.addEventListener('click', function () { setOpen(false); });

    new MutationObserver(function () {
        if (pill.classList.contains('is-hidden')) setOpen(false);
    }).observe(pill, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('dhka-session', render);
    window.addEventListener('storage', render);

    render();
})();