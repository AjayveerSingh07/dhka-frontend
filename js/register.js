(function () {
    var form = document.getElementById('regForm');
    if (!form) return;

    var wrap = document.getElementById('regWrap');
    var done = document.getElementById('regDone');
    var alertBox = document.getElementById('regAlert');
    var submitBtn = document.getElementById('regSubmit');
    var API = window.DHKA_API;

    var rules = {
        name: function (v) {
            return v.length >= 2 && v.length <= 80 ? '' : 'Please enter your full name.';
        },
        age: function (v) {
            var n = Number(v);
            return /^\d{1,2}$/.test(v) && n >= 4 && n <= 99 ? '' : 'Please enter a valid age.';
        },
        contact: function (v) {
            return /^\+?\d{7,15}$/.test(v.replace(/[\s()-]/g, '')) ? '' : 'Please enter a valid mobile number.';
        },
        email: function (v) {
            return v.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address.';
        }
    };

    function check(input) {
        var field = input.closest('.field');
        var msg = rules[input.name](input.value.trim());
        field.classList.toggle('is-invalid', !!msg);
        field.querySelector('.field-error').textContent = msg;
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        return !msg;
    }

    var inputs = Array.prototype.slice.call(form.querySelectorAll('input'));

    inputs.forEach(function (input) {
        input.addEventListener('blur', function () {
            if (input.value.trim()) check(input);
        });
        input.addEventListener('input', function () {
            if (input.closest('.field').classList.contains('is-invalid')) check(input);
        });
    });

    function showAlert(text) {
        alertBox.textContent = text;
        alertBox.hidden = false;
    }

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
            name: form.name.value.trim(),
            age: Number(form.age.value.trim()),
            contact: form.contact.value.replace(/[\s()-]/g, ''),
            email: form.email.value.trim()
        };

        submitBtn.classList.add('is-loading');
        submitBtn.setAttribute('aria-busy', 'true');

        fetch(API + '/register-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (data) {
                    if (res.ok) {
                        document.getElementById('doneName').textContent = payload.name;
                        document.getElementById('doneContact').textContent = payload.contact;
                        wrap.hidden = true;
                        done.hidden = false;
                        done.focus();
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