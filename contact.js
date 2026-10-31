// Contact form. With a Web3Forms access key, messages are sent straight to Binu's inbox;
// without one, the visitor's email app opens with the message already filled in.
//
// To turn on direct sending: get a free key at https://web3forms.com (enter
// binumadhavan2@gmail.com, the key arrives by email) and paste it below.
(function () {
  const ACCESS_KEY = '';
  const TO = 'binumadhavan2@gmail.com';

  const form = document.getElementById('contactForm');
  if (!form) return;
  const status = form.querySelector('.cf-status');
  const btn = form.querySelector('button[type="submit"]');
  const btnText = btn.querySelector('span');

  function setStatus(msg, kind = '') {
    status.textContent = msg;
    status.className = `cf-status mono ${kind}`;
  }

  function validate() {
    let ok = true;
    form.querySelectorAll('[required]').forEach(el => {
      const bad = !el.value.trim() || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      el.classList.toggle('bad', bad);
      el.setAttribute('aria-invalid', bad);
      if (bad && ok) { el.focus(); ok = false; }
    });
    return ok;
  }
  form.addEventListener('input', e => {
    if (e.target.classList.contains('bad')) { e.target.classList.remove('bad'); e.target.removeAttribute('aria-invalid'); }
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.elements.botcheck.checked) return;                              // filled by a bot
    if (!validate()) return setStatus('✗ please fill in your name, a valid email and a message', 'err');

    const name = form.elements['name'].value.trim();
    const email = form.elements.email.value.trim();
    const company = form.elements.company.value.trim();
    const message = form.elements.message.value.trim();
    const subject = `Portfolio message from ${name}${company ? ` (${company})` : ''}`;

    if (!ACCESS_KEY) {
      const body = `${message}\n\n${name}${company ? `\n${company}` : ''}\n${email}`;
      location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus('✓ your email app should open with the message ready. Just press send.', 'ok');
      return;
    }

    btn.disabled = true;
    btnText.textContent = 'Sending…';
    setStatus('');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: ACCESS_KEY, subject, from_name: 'Portfolio', name, email, company, message, replyto: email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || res.status);
      form.reset();
      setStatus(`✓ sent! Thanks ${name.split(' ')[0]}, Binu will reply to ${email} soon.`, 'ok');
    } catch (err) {
      setStatus(`✗ couldn't send right now. Please email ${TO} directly.`, 'err');
    } finally {
      btn.disabled = false;
      btnText.textContent = 'Send Message';
    }
  });
})();
