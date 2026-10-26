(function () {
    var list = document.getElementById('insList');
    if (!list) return;

    var prev = document.getElementById('insPrev');
    var next = document.getElementById('insNext');
    var items = Array.prototype.slice.call(list.children);
    var desktop = window.matchMedia('(min-width: 960px)');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var STEP = 14; /* keep equal to --stack-step in home.css */
    var ticking = false;

    /* ---------- Desktop: arrows ---------- */
    function updateButtons() {
        if (!prev || !next) return;
        var max = list.scrollWidth - list.clientWidth;
        prev.disabled = list.scrollLeft <= 4;
        next.disabled = list.scrollLeft >= max - 4;
    }

    function slide(dir) {
        var gap = parseFloat(getComputedStyle(list).columnGap) || 20;
        list.scrollBy({ left: dir * (items[0].offsetWidth + gap), behavior: 'smooth' });
    }

    if (prev) prev.addEventListener('click', function () { slide(-1); });
    if (next) next.addEventListener('click', function () { slide(1); });
    list.addEventListener('scroll', updateButtons, { passive: true });

    /* ---------- Phone and tablet: stacking depth ---------- */
    function updateStack() {
        ticking = false;

        if (desktop.matches || reduce.matches) {
            items.forEach(function (item) {
                item.firstElementChild.style.setProperty('--d', 0);
            });
            return;
        }

        var mb = parseFloat(getComputedStyle(items[0]).marginBottom) || 0;
        var pitch = items[0].offsetHeight + mb;
        var span = pitch - STEP;

        items.forEach(function (item, i) {
            var card = item.firstElementChild;
            var following = items[i + 1];
            if (!following) {
                card.style.setProperty('--d', 0);
                return;
            }
            var offset = following.getBoundingClientRect().top - item.getBoundingClientRect().top;
            var d = Math.min(1, Math.max(0, (pitch - offset) / span));
            card.style.setProperty('--d', d.toFixed(3));
        });
    }

    function requestStack() {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(updateStack);
        }
    }

    function onModeChange() {
        list.tabIndex = desktop.matches ? 0 : -1;
        if (!desktop.matches) list.scrollLeft = 0;
        updateButtons();
        updateStack();
    }

    window.addEventListener('scroll', requestStack, { passive: true });
    window.addEventListener('resize', requestStack);

    if (desktop.addEventListener) desktop.addEventListener('change', onModeChange);
    else desktop.addListener(onModeChange);

    onModeChange();
})();