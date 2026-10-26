(function () {
    var list = document.getElementById('evList');
    if (!list) return;

    var API = window.DHKA_API;
    var panel = document.getElementById('evPanel');
    var loading = document.getElementById('evLoading');
    var errorBox = document.getElementById('evError');
    var emptyBox = document.getElementById('evEmpty');
    var emptyTitle = document.getElementById('evEmptyTitle');
    var emptyText = document.getElementById('evEmptyText');
    var emptyBtn = document.getElementById('evEmptyBtn');
    var tabUp = document.getElementById('tabUpcoming');
    var tabPast = document.getElementById('tabPast');
    var cntUp = document.getElementById('cntUpcoming');
    var cntPast = document.getElementById('cntPast');

    var state = { upcoming: [], past: [], tab: 'upcoming' };
    var io = null;

    var PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';

    function parse(s) {
        var p = String(s).split('-');
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }

    function fmt(d) {
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function el(tag, cls, text) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function safeUrl(u) {
        return typeof u === 'string' && /^https:\/\//.test(u) ? u : '';
    }

    function setView(view) {
        loading.hidden = view !== 'loading';
        errorBox.hidden = view !== 'error';
        emptyBox.hidden = view !== 'empty';
        list.hidden = view !== 'list';
        panel.setAttribute('aria-busy', view === 'loading' ? 'true' : 'false');
    }

    function card(e, i, past) {
        var image = safeUrl(e.image_url);
        var pdf = safeUrl(e.pdf_url);
        var li = el('li', 'ev' + (image ? ' ev--has-img' : '') + (past ? ' ev--past' : ''));
        li.style.setProperty('--i', i);

               if (image) {
            var frame = el('div', 'ev-frame');
            var zoom = el('button', 'ev-zoom');
            zoom.type = 'button';
            zoom.setAttribute('data-lightbox', image);
            zoom.setAttribute('data-alt', e.title);
            zoom.setAttribute('aria-label', 'View full photo: ' + e.title);

            var img = document.createElement('img');
            img.src = image;
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            zoom.appendChild(img);

            var hint = el('span', 'ev-zoom-hint');
            hint.setAttribute('aria-hidden', 'true');
            hint.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
            zoom.appendChild(hint);

            frame.appendChild(zoom);
            li.appendChild(frame);
        }
        var body = el('div', 'ev-body');
        var when = el('time', 'ev-date', fmt(parse(e.event_date)));
        when.setAttribute('datetime', e.event_date);
        body.appendChild(when);
        body.appendChild(el('h3', 'ev-title', e.title));

        if (e.location) {
            var place = el('p', 'ev-place');
            var icon = el('span');
            icon.innerHTML = PIN;
            place.appendChild(icon.firstChild);
            place.appendChild(el('span', '', e.location));
            body.appendChild(place);
        }
        if (e.description) body.appendChild(el('p', 'ev-text', e.description));
        if (pdf) {
            var a = el('a', 'btn btn--ghost', 'Download details (PDF)');
            a.href = pdf;
            a.target = '_blank';
            a.rel = 'noopener';
            body.appendChild(a);
        }

        li.appendChild(body);
        return li;
    }

    function observe(items) {
        if (!('IntersectionObserver' in window)) {
            items.forEach(function (n) { n.classList.add('is-in'); });
            return;
        }
        if (io) io.disconnect();
        io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
        items.forEach(function (n) { io.observe(n); });
    }

    function render() {
        var past = state.tab === 'past';
        var data = state[state.tab];

        tabUp.setAttribute('aria-selected', past ? 'false' : 'true');
        tabUp.tabIndex = past ? -1 : 0;
        tabPast.setAttribute('aria-selected', past ? 'true' : 'false');
        tabPast.tabIndex = past ? 0 : -1;
        panel.setAttribute('aria-labelledby', past ? 'tabPast' : 'tabUpcoming');

        list.textContent = '';

        if (!data.length) {
            var other = past ? state.upcoming.length : state.past.length;
            emptyTitle.textContent = past ? 'No past events yet' : 'No upcoming events right now';
            emptyText.textContent = past ? 'Our past events will appear here.' : 'New events are added regularly. Please check back soon.';
            emptyBtn.hidden = !other;
            emptyBtn.textContent = past ? 'See upcoming events' : 'See past events';
            setView('empty');
            return;
        }

        var items = data.map(function (e, i) { return card(e, i, past); });
        items.forEach(function (n) { list.appendChild(n); });
        setView('list');
        observe(items);
    }

    function select(tab, focus) {
        state.tab = tab;
        render();
        if (focus) (tab === 'past' ? tabPast : tabUp).focus();
    }

    tabUp.addEventListener('click', function () { select('upcoming'); });
    tabPast.addEventListener('click', function () { select('past'); });
    emptyBtn.addEventListener('click', function () {
        select(state.tab === 'past' ? 'upcoming' : 'past');
    });

    [tabUp, tabPast].forEach(function (tab) {
        tab.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                select(state.tab === 'past' ? 'upcoming' : 'past', true);
            }
        });
    });
    function addSchema(upcoming) {
        var old = document.getElementById('evSchema');
        if (old) old.remove();
        if (!upcoming.length) return;

        var data = upcoming.map(function (e) {
            var item = {
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: e.title,
                startDate: e.event_date,
                eventStatus: 'https://schema.org/EventScheduled',
                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
                location: {
                    '@type': 'Place',
                    name: e.location || 'Hoshiarpur, Punjab',
                    address: {
                        '@type': 'PostalAddress',
                        addressLocality: 'Hoshiarpur',
                        addressRegion: 'Punjab',
                        addressCountry: 'IN'
                    }
                },
                organizer: {
                    '@type': 'SportsOrganization',
                    name: 'Distt. Hoshiarpur Karate Do Association',
                    url: 'https://dhka-live.netlify.app/'
                }
            };
            if (e.description) item.description = e.description;
            if (safeUrl(e.image_url)) item.image = [e.image_url];
            return item;
        });

        var s = document.createElement('script');
        s.type = 'application/ld+json';
        s.id = 'evSchema';
        s.text = JSON.stringify(data).replace(/</g, '\\u003c');
        document.head.appendChild(s);
    }

    function load() {
        setView('loading');
        fetch(API + '/events')
            .then(function (res) {
                if (!res.ok) throw new Error('bad status');
                return res.json();
            })
            .then(function (all) {
                var now = new Date();
                var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                state.upcoming = all.filter(function (e) { return parse(e.event_date) >= today; })
                    .sort(function (a, b) { return a.event_date < b.event_date ? -1 : 1; });
                state.past = all.filter(function (e) { return parse(e.event_date) < today; })
                    .sort(function (a, b) { return a.event_date < b.event_date ? 1 : -1; });
                cntUp.textContent = state.upcoming.length;
                cntPast.textContent = state.past.length;
                addSchema(state.upcoming);
                render();
            })
            .catch(function () { setView('error'); });
    }

    document.getElementById('evRetry').addEventListener('click', load);
    load();
})();