(function () {
    window.__revealOk = true;

    var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!items.length) return;

    // Children of [data-stagger] get their order, so they animate one after another
    document.querySelectorAll('[data-stagger]').forEach(function (group) {
        var n = 0;
        Array.prototype.forEach.call(group.children, function (el) {
            if (el.hasAttribute('data-reveal')) {
                el.style.setProperty('--i', n++);
            }
        });
    });

    // Split headings into words for the masked rise
    items.forEach(function (el) {
        if (el.getAttribute('data-reveal') !== 'words' || el.children.length) return;
        var text = el.textContent.trim().replace(/\s+/g, ' ');
        var words = text.split(' ');
        el.setAttribute('aria-label', text);
        el.textContent = '';
        words.forEach(function (word, i) {
            var outer = document.createElement('span');
            outer.className = 'w';
            outer.setAttribute('aria-hidden', 'true');
            var inner = document.createElement('span');
            inner.textContent = word;
            inner.style.setProperty('--wi', i);
            outer.appendChild(inner);
            el.appendChild(outer);
            if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
        });
    });

    if (!('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('is-in'); });
        return;
    }

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-in');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });

    items.forEach(function (el) { io.observe(el); });
})();