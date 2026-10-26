(function () {
    var dlg = null;
    var img = null;
    var cap = null;
    var lastFocus = null;

    function build() {
        dlg = document.createElement('dialog');
        dlg.className = 'lb';
        dlg.setAttribute('aria-label', 'Photo preview');

        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'lb-close';
        close.setAttribute('aria-label', 'Close photo');
        close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

        img = document.createElement('img');
        img.className = 'lb-img';
        img.alt = '';
        img.decoding = 'async';

        cap = document.createElement('p');
        cap.className = 'lb-cap';

        dlg.appendChild(close);
        dlg.appendChild(img);
        dlg.appendChild(cap);
        document.body.appendChild(dlg);

        dlg.addEventListener('click', function () { dlg.close(); });
        dlg.addEventListener('close', function () {
            document.documentElement.classList.remove('lb-open');
            img.removeAttribute('src');
            if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
        });
    }

    function open(src, text) {
        if (!dlg) build();
        img.src = src;
        img.alt = text;
        cap.textContent = text;
        cap.hidden = !text;
        document.documentElement.classList.add('lb-open');
        dlg.showModal();
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-lightbox]');
        if (!btn) return;
        var src = btn.getAttribute('data-lightbox');
        if (!/^https:\/\//.test(src)) return;
        e.preventDefault();
        lastFocus = btn;
        open(src, btn.getAttribute('data-alt') || '');
    });
})();