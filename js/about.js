(function () {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
    if (!els.length) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function text(el, n) {
        el.textContent = n + (el.getAttribute('data-suffix') || '');
    }

    function run(el) {
        var to = Number(el.getAttribute('data-count')) || 0;
        var start = null;
        var time = 1600;
        function frame(now) {
            if (start === null) start = now;
            var t = Math.min(1, (now - start) / time);
            text(el, Math.round(to * (1 - Math.pow(1 - t, 3))));
            if (t < 1) window.requestAnimationFrame(frame);
        }
        window.requestAnimationFrame(frame);
    }

    if (reduce || !('IntersectionObserver' in window)) return;

    els.forEach(function (el) { text(el, 0); });

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                run(entry.target);
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });

    els.forEach(function (el) { io.observe(el); });
})();