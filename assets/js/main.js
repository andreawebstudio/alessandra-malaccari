(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: ombra allo scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  var toggleLabel = toggle.querySelector('.sr-only');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    toggleLabel.textContent = open ? 'Chiudi il menu' : 'Apri il menu';
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 992px)').addEventListener('change', function (mq) {
    if (mq.matches) setMenu(false);
  });

  /* ---------- Voce di menu attiva ---------- */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('ul a'));
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (a) {
          var active = a.getAttribute('href') === '#' + id;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- Fade-in leggero ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Accordion FAQ ---------- */
  document.querySelectorAll('.acc-trigger').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (reduceMotion) { panel.hidden = open; return; }
      if (open) {
        panel.style.height = panel.scrollHeight + 'px';
        requestAnimationFrame(function () { panel.style.height = '0px'; });
        panel.addEventListener('transitionend', function done() {
          panel.hidden = true;
          panel.style.height = '';
          panel.removeEventListener('transitionend', done);
        });
      } else {
        panel.hidden = false;
        panel.style.height = '0px';
        requestAnimationFrame(function () { panel.style.height = panel.scrollHeight + 'px'; });
        panel.addEventListener('transitionend', function done() {
          panel.style.height = '';
          panel.removeEventListener('transitionend', done);
        });
      }
    });
  });

  /* ---------- Modulo contatti ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var endpoint = (form.getAttribute('data-endpoint') || '').trim();
    var waNumber = form.getAttribute('data-whatsapp');
    var status = document.getElementById('form-status');
    var channel = document.getElementById('form-channel');
    var submitBtn = form.querySelector('button[type="submit"]');

    channel.textContent = endpoint
      ? 'La richiesta verrà inviata direttamente alla Dott.ssa Malaccari.'
      : 'Premendo “Invia richiesta” si aprirà WhatsApp con il messaggio già compilato: ti basterà confermare l’invio.';

    var rules = [
      { id: 'f-nome', test: function (el) { return el.value.trim().length > 1; } },
      { id: 'f-email', test: function (el) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()); } },
      { id: 'f-msg', test: function (el) { return el.value.trim().length > 4; } },
      { id: 'f-privacy', test: function (el) { return el.checked; } }
    ];

    function validate() {
      var firstInvalid = null;
      rules.forEach(function (r) {
        var el = document.getElementById(r.id);
        var err = document.getElementById(r.id + '-err');
        var ok = r.test(el);
        el.setAttribute('aria-invalid', String(!ok));
        err.hidden = ok;
        var described = (el.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== err.id; });
        if (!ok) described.push(err.id);
        if (described.length) el.setAttribute('aria-describedby', described.join(' ')); else el.removeAttribute('aria-describedby');
        if (!ok && !firstInvalid) firstInvalid = el;
      });
      if (firstInvalid) firstInvalid.focus();
      return !firstInvalid;
    }

    function setStatus(text, type) {
      status.textContent = text;
      status.className = 'form-status' + (type ? ' is-' + type : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('');
      if (form.elements['_gotcha'].value) return; // spam
      if (!validate()) return;

      var data = {
        nome: form.elements['nome'].value.trim(),
        email: form.elements['email'].value.trim(),
        telefono: form.elements['telefono'].value.trim(),
        messaggio: form.elements['messaggio'].value.trim()
      };

      if (!endpoint) {
        // Invio reale tramite WhatsApp, con i dati compilati
        var text = 'Buongiorno Dott.ssa Malaccari, vorrei ricevere informazioni per una consulenza nutrizionale.\n\n' +
          'Nome: ' + data.nome + '\n' +
          'Email: ' + data.email + '\n' +
          (data.telefono ? 'Telefono: ' + data.telefono + '\n' : '') +
          '\n' + data.messaggio + '\n\nGrazie.';
        var url = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(text);
        var win = window.open(url, '_blank');
        if (win) { win.opener = null; } else { window.location.href = url; }
        setStatus('Si è aperto WhatsApp con la tua richiesta: conferma l’invio per completare.', 'success');
        return;
      }

      // Invio tramite servizio configurato (es. Formspree)
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      var fd = new FormData(form);
      fd.append('_subject', 'Nuova richiesta dal sito – ' + data.nome);
      fetch(endpoint, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          setStatus('Grazie! La tua richiesta è stata inviata: ti ricontatterò al più presto.', 'success');
        })
        .catch(function () {
          setStatus('Non è stato possibile inviare la richiesta. Riprova oppure contattami al +39 320 921 9144 o su WhatsApp.', 'error');
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
        });
    });
  }

  /* ---------- Approccio: illumina il punto dell'orbita corrispondente ---------- */
  document.querySelectorAll('.philo-item[data-dot]').forEach(function (item) {
    var dot = document.querySelector('.orbit-dot[data-dot="' + item.getAttribute('data-dot') + '"]');
    if (!dot) return;
    item.addEventListener('mouseenter', function () { dot.classList.add('is-lit'); });
    item.addEventListener('mouseleave', function () { dot.classList.remove('is-lit'); });
  });

  /* ---------- Come funziona: linea che avanza con lo scroll ---------- */
  var timeline = document.getElementById('timeline');
  if (timeline) {
    var steps = Array.prototype.slice.call(timeline.querySelectorAll('.step'));
    var track = timeline.querySelector('.timeline-track');
    var ticking = false;

    function setProgress(p) {
      timeline.style.setProperty('--p', p.toFixed(4));
      var last = steps.length - 1;
      steps.forEach(function (step, i) {
        step.classList.toggle('is-active', p >= (i / last) - 0.02);
      });
    }

    function updateTimeline() {
      ticking = false;
      var r = track.getBoundingClientRect();
      var vh = window.innerHeight;
      var vertical = r.height > r.width;
      var p;
      if (vertical) {
        // la linea si riempie mentre attraversa il centro dello schermo
        p = (vh * 0.6 - r.top) / r.height;
      } else {
        // orizzontale: si riempie mentre la sezione sale dal basso verso il centro
        p = (vh * 0.85 - r.top) / (vh * 0.5);
      }
      setProgress(Math.max(0, Math.min(1, p)));
    }

    if (reduceMotion) {
      setProgress(1);
    } else {
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(updateTimeline); }
      }, { passive: true });
      window.addEventListener('resize', updateTimeline);
      updateTimeline();
    }
  }

  /* ---------- Anno nel footer ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
