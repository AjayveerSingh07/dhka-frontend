try {
  var notice = sessionStorage.getItem('dhka_notice');
  if (notice) {
    var box = document.getElementById('loginAlert');
    if (box) { box.textContent = notice; box.hidden = false; }
    sessionStorage.removeItem('dhka_notice');
  }
} catch (e) {}
(function () {
    var form = document.getElementById('loginForm');
    if (!form) return;

    var S = window.DHKA_SESSION;
    var API = window.DHKA_API;
    var wrap = document.getElementById('loginWrap');
    var done = document.getElementById('loginDone');
    var alertBox = document.getElementById('loginAlert');
    var submitBtn = document.getElementById('loginSubmit');
    var pwInput = document.getElementById('loginPassword');
    var pwToggle = document.getElementById('pwToggle');

    var rules = {
        studentId: function (v) {
            return /^[A-Za-z0-9-]{4,30}$/.test(v) ? '' : 'Please enter your Student ID, for example DHKA-2026-1234.';
        },
        password: function (v) {
            return v.length ? '' : 'Please enter your password.';
        }
    };

    function check(input) {
        var field = input.closest('.field');
        var value = input.name === 'password' ? input.value : input.value.trim();
        var msg = rules[input.name](value);
        field.classList.toggle('is-invalid', !!msg);
        field.querySelector('.field-error').textContent = msg;
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        return !msg;
    }

    var inputs = Array.prototype.slice.call(form.querySelectorAll('input'));

    inputs.forEach(function (input) {
        input.addEventListener('blur', function () {
            if (input.value) check(input);
        });
        input.addEventListener('input', function () {
            if (input.closest('.field').classList.contains('is-invalid')) check(input);
        });
    });

    pwToggle.addEventListener('click', function () {
        var show = pwInput.type === 'password';
        pwInput.type = show ? 'text' : 'password';
        pwToggle.textContent = show ? 'Hide' : 'Show';
        pwToggle.setAttribute('aria-pressed', show ? 'true' : 'false');
    });

    function showDone(user) {
        document.getElementById('doneName').textContent = (user && user.name) || 'student';
        wrap.hidden = true;
        done.hidden = false;
        done.focus();
    }

    function showAlert(text) {
        alertBox.textContent = text;
        alertBox.hidden = false;
    }

    if (S && S.isLoggedIn()) showDone(S.user());

    document.getElementById('logoutBtn').addEventListener('click', function () {
        S.clear();
        form.reset();
        done.hidden = true;
        wrap.hidden = false;
        form.studentId.focus();
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        alertBox.hidden = true;

        var firstBad = null;
        inputs.forEach(function (input) {
            if (!check(input) && !firstBad) firstBad = input;
        });
        if (firstBad) {
            firstBad.focus();
            return;
        }

        var payload = {
            studentId: form.studentId.value.trim().toUpperCase(),
            password: form.password.value
        };

        submitBtn.classList.add('is-loading');
        submitBtn.setAttribute('aria-busy', 'true');

        fetch(API + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (data) {
                    if (res.ok && data.token) {
                        S.save(data.token, data.user);
                        form.reset();
                        showDone(data.user);
                    } else if (res.status === 401) {
                        showAlert('Student ID or password is incorrect.');
                    } else {
                        showAlert(data.error || 'Something went wrong. Please try again.');
                    }
                });
            })
            .catch(function () {
                showAlert('We could not reach the server. Please check your connection and try again.');
            })
            .then(function () {
                submitBtn.classList.remove('is-loading');
                submitBtn.removeAttribute('aria-busy');
            });
    });
})();