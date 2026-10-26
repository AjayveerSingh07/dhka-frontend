/* Shared login memory, used by every page. */
(function () {
    var TOKEN_KEY = 'dhka_token';
    var USER_KEY = 'dhka_user';

    function read(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    function payload(token) {
        try {
            var p = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            p += '='.repeat((4 - p.length % 4) % 4);
            return JSON.parse(atob(p));
        } catch (e) {
            return null;
        }
    }

    function announce() {
        window.dispatchEvent(new Event('dhka-session'));
    }

    var S = {
        token: function () { return read(TOKEN_KEY); },
        user: function () {
            try { return JSON.parse(read(USER_KEY) || 'null'); } catch (e) { return null; }
        },
        isLoggedIn: function () {
            var t = S.token();
            if (!t || !S.user()) return false;
            var p = payload(t);
            return !!(p && p.exp * 1000 > Date.now());
        },
        save: function (token, user) {
            try {
                localStorage.setItem(TOKEN_KEY, token);
                localStorage.setItem(USER_KEY, JSON.stringify(user));
            } catch (e) {}
            announce();
        },
        clear: function () {
            try {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            } catch (e) {}
            announce();
        }
    };

    if (!S.isLoggedIn() && S.token()) S.clear();
    window.DHKA_SESSION = S;
})();

// Call when the API says the token is no longer valid
function sessionExpired() {
  try {
    localStorage.removeItem('dhka_token');
    localStorage.removeItem('dhka_user');
    sessionStorage.setItem('dhka_notice', 'Your session expired. Please log in again.');
  } catch (e) {}
  window.dispatchEvent(new Event('dhka-session'));
  window.location.href = 'login.html';
}