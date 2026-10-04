(() => {
  const form = document.querySelector('[data-intake-form]');
  if (!form) return;

  const status = document.getElementById('intake-status');
  const submit = document.getElementById('intake-submit');
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const serviceMode = document.getElementById('service-mode');
  if (mode === 'onsite' || mode === 'remote') serviceMode.value = mode;
  const locationField = document.getElementById('location');
  const syncLocationRequirement = () => { locationField.required = serviceMode.value === 'onsite'; };
  serviceMode.addEventListener('change', syncLocationRequirement);
  syncLocationRequirement();
  if (mode === 'onsite') {
    document.getElementById('booking-hero-title').innerHTML = 'On-site tech support<br><span>in Montana.</span>';
    document.getElementById('booking-hero-copy').textContent = 'Starlink, Wi-Fi, computers, printers, and connected devices. Send a request with your Montana town or county and I will confirm availability.';
    document.getElementById('booking-hero-cta').textContent = 'Request an on-site visit';
    document.getElementById('remote-pricing').hidden = true;
    document.getElementById('service-categories').hidden = true;
    document.querySelector('.book h2').textContent = 'Request an on-site visit';
  }

  const requestType = params.get('requestType');
  if (requestType && /^[a-z0-9_-]{1,80}$/i.test(requestType)) {
    document.getElementById('request-type').value = requestType;
    if (requestType.includes('starlink')) document.getElementById('service').value = 'starlink_setup';
  }
  const sourcePage = params.get('sourcePage');
  if (sourcePage && sourcePage.startsWith('/') && !sourcePage.startsWith('//')) {
    document.getElementById('source-page').value = sourcePage.slice(0, 240);
  }

  let idempotencyKey = crypto.randomUUID();
  submit.disabled = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    const preferredContact = String(values.get('preferredContact') || '');
    const phone = String(values.get('phone') || '').trim();
    const email = String(values.get('email') || '').trim();
    if ((preferredContact === 'email' && !email) || (preferredContact !== 'email' && !phone)) {
      status.textContent = preferredContact === 'email'
        ? 'Please add your email address, or choose phone/text as your preferred contact.'
        : 'Please add a phone number, or choose email as your preferred contact.';
      return;
    }

    const payload = {
      name: String(values.get('name') || '').trim(),
      phone,
      email,
      location: String(values.get('location') || '').trim(),
      preferredContact,
      requestType: String(values.get('requestType') || 'website_request'),
      deviceType: String(values.get('deviceType') || '').trim(),
      serviceMode: String(values.get('serviceMode') || 'undecided'),
      service: String(values.get('service') || ''),
      description: String(values.get('message') || '').trim(),
      requestedDate: String(values.get('date') || ''),
      requestedTime: String(values.get('time') || ''),
      sourcePage: String(values.get('sourcePage') || '/book.html'),
      consentToContact: values.get('consentToContact') === 'on',
      website: String(values.get('website') || ''),
    };

    submit.disabled = true;
    status.textContent = 'Sending your request…';
    try {
      const response = await fetch('https://api.ohgeec.com/v1/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(payload),
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      if (!response.ok) throw new Error('Request unavailable');
      form.reset();
      idempotencyKey = crypto.randomUUID();
      status.textContent = 'Request received. I will follow up using your preferred contact method.';
      submit.textContent = 'Request sent';
    } catch {
      status.textContent = 'I could not send that request right now. Please try again, or email hello@ohgeec.com. Do not include passwords.';
      submit.disabled = false;
    }
  });
})();
