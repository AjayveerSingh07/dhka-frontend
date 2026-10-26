(function () {
    var root = document.documentElement;
    var pill = document.getElementById('pill');
    var burger = document.getElementById('burger');
    var menu = document.getElementById('menu');
    var lockTargets = document.querySelectorAll('main, footer, #pill');
    if (!pill || !burger || !menu) return;

    var lastY = window.scrollY;
    var ticking = false;
    var menuOpen = false;

    function setHidden(hidden) {
        pill.classList.toggle('is-hidden', hidden);
        burger.classList.toggle('is-solo', hidden);
    }
    

    function updateHeader() {
        var y = window.scrollY;
        var delta = y - lastY;

        pill.classList.toggle('is-solid', y > 40);

        if (!menuOpen) {
            if (y <= 200) {
                setHidden(false);
                lastY = y;
            } else if (Math.abs(delta) > 4) {
                setHidden(delta > 0);
                lastY = y;
            }
        }
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(updateHeader);
        }
    }, { passive: true });

    

    function setOrigin() {
        var r = burger.getBoundingClientRect();
        var ox = r.left + r.width / 2;
        var oy = r.top + r.height / 2;
        var radius = Math.ceil(Math.hypot(
            Math.max(ox, window.innerWidth - ox),
            Math.max(oy, window.innerHeight - oy)
        )) + 24;
        menu.style.setProperty('--ox', ox + 'px');
        menu.style.setProperty('--oy', oy + 'px');
        menu.style.setProperty('--r', radius + 'px');
    }

    function openMenu() {
        setOrigin();
        menuOpen = true;
        setHidden(false);
        root.classList.add('menu-open');
        menu.classList.add('is-open');
        menu.inert = false;
        lockTargets.forEach(function (el) { el.inert = true; });
        burger.setAttribute('aria-expanded', 'true');
        burger.setAttribute('aria-label', 'Close menu');
        window.setTimeout(function () {
            if (menuOpen) {
                var first = menu.querySelector('a');
                if (first) first.focus({ preventScroll: true });
            }
        }, 700);
    }

    function closeMenu(returnFocus) {
        menuOpen = false;
        root.classList.remove('menu-open');
        menu.classList.remove('is-open');
        menu.inert = true;
        lockTargets.forEach(function (el) { el.inert = false; });
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Open menu');
        lastY = window.scrollY;
        if (returnFocus) burger.focus();
    }

    burger.addEventListener('click', function () {
        if (menuOpen) closeMenu(false); else openMenu();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menuOpen) closeMenu(true);
    });

    menu.addEventListener('click', function (e) {
        if (e.target.closest('a')) closeMenu(false);
    });

    window.addEventListener('resize', function () {
        if (menuOpen) setOrigin();
    });

    updateHeader();
})();

