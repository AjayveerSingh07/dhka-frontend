/* The only place the backend address lives. */
(function () {
    var host = location.hostname;
    var isLocal = /^(localhost|127\.0\.0\.1|\[?::1\]?|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|.+\.local)$/.test(host);

    window.DHKA_API = isLocal
        ? 'http://' + host + ':5000/api'
        : 'https://dhka-api.onrender.com/api'; /* FAKE: replace after you deploy the backend */
})();