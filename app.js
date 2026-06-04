/* =========================================================
   Atlas Automation — interactive demo controller
   Pure client-side. Mirrors the real MVP conversation engine
   (awaiting_issue -> name -> time -> confirm -> confirmed)
   but runs 100% in the browser with sample data only.
   ========================================================= */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     CONFIG — edit these two lines to point at your real contact.
     Used to build the "Book a demo" mailto links. No accounts,
     no backend; the prospect's mail app opens pre-filled.
  ---------------------------------------------------------- */
  var CONFIG = {
    contactEmail: 'atlas-autonomous-agent@proton.me',
    contactName: 'Emeka',
    company: 'Atlas Automation',
  };

  /* ---------- Personalization ---------- */
  var BUSINESS = Personalize.getBusinessName(window.location.search);
  var PERSONALIZED = Personalize.isPersonalized(window.location.search);
  // Capitalised label for nicer sentences when not personalized.
  var BIZ_LABEL = PERSONALIZED ? BUSINESS : 'your business';
  var BIZ_SMS = PERSONALIZED ? BUSINESS : 'Peterborough Plumbing'; // sample brand in the SMS thread

  function applyPersonalization() {
    setText('biz-hero', BIZ_LABEL);
    setText('biz-demo', BIZ_LABEL);
    setText('biz-cta', BIZ_LABEL);
    setText('phone-biz', BIZ_SMS);
    setText('dash-biz-sub', PERSONALIZED ? BUSINESS + ' · morning view' : 'your morning view');
    var avatar = document.getElementById('avatar');
    if (avatar) avatar.textContent = Personalize.initials(BIZ_SMS);
    if (PERSONALIZED) {
      setText('problem-lead',
        BUSINESS + ', most owner-operators miss 1 in 4 calls during busy season — on a roof, ' +
        'in a crawlspace, or after hours. Each one is a $300–$2,000 job that goes to whoever answers first.');
      var fine = document.getElementById('book-fine');
      if (fine) fine.textContent = 'Prefer to just reply to the message I sent you, ' + BUSINESS + '? That works too.';
    }
    if (document.title && PERSONALIZED) {
      document.title = 'Atlas Automation · a demo for ' + BUSINESS;
    }
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ---------- CTA (mailto) wiring ---------- */
  function wireCTAs() {
    var subj = 'Demo for ' + (PERSONALIZED ? BUSINESS : 'my business') + ' — missed-call text-back';
    var body =
      'Hi ' + CONFIG.contactName + ',\n\n' +
      'I checked out the Atlas missed-call demo' +
      (PERSONALIZED ? ' (with ' + BUSINESS + ' on it)' : '') + '.\n' +
      'I\'d like to book the 10-minute call to see it live.\n\n' +
      'A couple of times that work for me:\n  - \n  - \n\n' +
      'Thanks,\n';
    var mailto = 'mailto:' + CONFIG.contactEmail +
      '?subject=' + encodeURIComponent(subj) +
      '&body=' + encodeURIComponent(body);

    var callSubj = 'Call me back about the missed-call demo';
    var callBody =
      'Hi ' + CONFIG.contactName + ',\n\nPlease give me a call about the missed-call text-back demo.\n' +
      'Best number: \nBest time: \n\nThanks,\n';
    var callto = 'mailto:' + CONFIG.contactEmail +
      '?subject=' + encodeURIComponent(callSubj) +
      '&body=' + encodeURIComponent(callBody);

    var emailBtn = document.getElementById('book-email');
    var callBtn = document.getElementById('book-call');
    if (emailBtn) emailBtn.setAttribute('href', mailto);
    if (callBtn) callBtn.setAttribute('href', callto);
  }

  /* ====================================================
     Conversation engine (client-side mirror of server.js)
  ==================================================== */
  var STATES = { ISSUE: 'awaiting_issue', NAME: 'awaiting_name', TIME: 'awaiting_time', CONFIRM: 'awaiting_confirm', DONE: 'confirmed' };

  var thread = document.getElementById('thread');
  var input = document.getElementById('input');
  var sendBtn = document.getElementById('send');
  var startBtn = document.getElementById('start');
  var resetBtn = document.getElementById('reset');
  var composer = document.getElementById('composer');
  var quickWrap = document.getElementById('quick-replies');
  var quickBtns = document.getElementById('quick-reply-buttons');

  var lead = null;          // current in-flight lead
  var leadSeq = 0;          // id counter
  var leads = [];           // dashboard rows

  var QUICK = {
    awaiting_issue: ['Water heater leaking', 'No heat upstairs', 'Clogged drain'],
    awaiting_name: ['Dave', 'Sarah M.', 'Mike'],
    awaiting_time: ['Tomorrow morning', 'Today if possible', 'Friday after 3pm'],
    awaiting_confirm: ['YES', 'NO'],
  };

  function greeting() {
    return 'Hi, this is ' + BIZ_SMS + '. Sorry we missed your call! ' +
      'I can get you booked in by text. What do you need help with?';
  }

  // Returns the bot reply for an incoming customer message and advances state.
  function handleIncoming(text) {
    text = (text || '').trim();
    var reply;
    switch (lead.status) {
      case STATES.ISSUE:
        lead.issue = text;
        lead.status = STATES.NAME;
        reply = 'Got it — "' + text + '". And who am I speaking with? (Your name)';
        break;
      case STATES.NAME:
        lead.name = text;
        lead.status = STATES.TIME;
        reply = 'Thanks ' + text + '! When\'s a good time for us to come by? (e.g. "tomorrow morning", "Fri after 3pm")';
        break;
      case STATES.TIME:
        lead.preferred_time = text;
        lead.status = STATES.CONFIRM;
        reply = 'Let me confirm:\n' +
          '• Name: ' + lead.name + '\n' +
          '• Issue: ' + lead.issue + '\n' +
          '• Preferred time: ' + lead.preferred_time + '\n\n' +
          'Is that right? Reply YES to confirm or NO to start over.';
        break;
      case STATES.CONFIRM:
        if (/^(y|yes|yep|yeah|correct|right|confirm)/i.test(text)) {
          lead.status = STATES.DONE;
          reply = 'You\'re all set, ' + lead.name + '! ' + BIZ_SMS +
            ' will reach out to confirm your appointment. Talk soon. 👍';
        } else if (/^(n|no|nope|wrong)/i.test(text)) {
          lead.name = null; lead.issue = null; lead.preferred_time = null;
          lead.status = STATES.ISSUE;
          reply = 'No problem, let\'s start over. What do you need help with?';
        } else {
          reply = 'Sorry, I didn\'t catch that. Reply YES to confirm or NO to start over.';
        }
        break;
      default:
        reply = greeting();
    }
    return reply;
  }

  /* ---------- UI helpers ---------- */
  function bubble(text, cls) {
    var div = document.createElement('div');
    div.className = 'bubble ' + cls;
    div.textContent = text;
    thread.appendChild(div);
    thread.scrollTop = thread.scrollHeight;
  }
  function sys(text) {
    var div = document.createElement('div');
    div.className = 'sys';
    div.textContent = text;
    thread.appendChild(div);
    thread.scrollTop = thread.scrollHeight;
  }
  function showTyping() {
    var div = document.createElement('div');
    div.className = 'typing'; div.id = 'typing'; div.textContent = 'typing…';
    thread.appendChild(div); thread.scrollTop = thread.scrollHeight;
  }
  function clearTyping() { var t = document.getElementById('typing'); if (t) t.remove(); }
  function setEnabled(on) {
    input.disabled = !on; sendBtn.disabled = !on;
    if (on) input.focus();
  }
  function renderQuick() {
    quickBtns.innerHTML = '';
    var opts = (lead && QUICK[lead.status]) || null;
    if (!opts) { quickWrap.hidden = true; return; }
    quickWrap.hidden = false;
    opts.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'qr-btn'; b.textContent = o;
      b.addEventListener('click', function () { submitCustomer(o); });
      quickBtns.appendChild(b);
    });
  }

  /* ---------- Flow control ---------- */
  function startConversation() {
    leadSeq += 1;
    lead = { id: leadSeq, name: null, issue: null, preferred_time: null, status: STATES.ISSUE };
    thread.innerHTML = '';
    sys('📞 Missed call from a new customer');
    showTyping();
    window.setTimeout(function () {
      clearTyping();
      bubble(greeting(), 'in');
      setEnabled(true);
      addOrUpdateLead(); // lands as "in progress" immediately
      renderQuick();
    }, 650);
  }

  function submitCustomer(message) {
    message = (message || '').trim();
    if (!message || !lead || lead.status === STATES.DONE) return;
    bubble(message, 'out');
    input.value = '';
    setEnabled(false);
    quickWrap.hidden = true;
    showTyping();
    window.setTimeout(function () {
      clearTyping();
      var reply = handleIncoming(message);
      bubble(reply, 'in');
      addOrUpdateLead();
      if (lead.status === STATES.DONE) {
        sys('✅ Lead confirmed and saved to the dashboard.');
        setEnabled(false);
        quickWrap.hidden = true;
      } else {
        setEnabled(true);
        renderQuick();
      }
    }, 600);
  }

  /* ---------- Dashboard ---------- */
  var RECOVERED_PER_LEAD = 450; // illustrative avg job value for "est. recovered"

  function addOrUpdateLead() {
    var existing = null;
    for (var i = 0; i < leads.length; i++) { if (leads[i].id === lead.id) { existing = leads[i]; break; } }
    var snapshot = {
      id: lead.id,
      name: lead.name || '—',
      issue: lead.issue || '…',
      preferred_time: lead.preferred_time || '…',
      status: lead.status,
    };
    if (existing) {
      Object.assign(existing, snapshot);
    } else {
      leads.unshift(snapshot);
    }
    renderDashboard(!existing);
  }

  function renderDashboard(isNewRow) {
    var tbody = document.getElementById('dash-rows');
    tbody.innerHTML = '';
    if (leads.length === 0) {
      var er = document.createElement('tr');
      er.className = 'dash-empty';
      er.innerHTML = '<td colspan="4">No leads yet — run the simulator to see one land here.</td>';
      tbody.appendChild(er);
    } else {
      leads.forEach(function (l, idx) {
        var tr = document.createElement('tr');
        if (isNewRow && idx === 0) tr.className = 'row-new';
        var confirmed = l.status === STATES.DONE;
        var pill = confirmed
          ? '<span class="pill pill-confirmed">Confirmed</span>'
          : '<span class="pill pill-active">In progress</span>';
        tr.appendChild(td(l.name));
        tr.appendChild(td(l.issue));
        tr.appendChild(td(l.preferred_time));
        var statusTd = document.createElement('td');
        statusTd.innerHTML = pill;
        tr.appendChild(statusTd);
        tbody.appendChild(tr);
      });
    }
    updateStats();
  }

  function td(text) { var c = document.createElement('td'); c.textContent = text; return c; }

  function updateStats() {
    var total = leads.length;
    var confirmed = leads.filter(function (l) { return l.status === STATES.DONE; }).length;
    var active = total - confirmed;
    var recovered = confirmed * RECOVERED_PER_LEAD;
    flashSet('stat-total', String(total));
    flashSet('stat-confirmed', String(confirmed));
    flashSet('stat-active', String(active));
    flashSet('stat-recovered', '$' + recovered.toLocaleString('en-CA'));
  }

  function flashSet(id, val) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.textContent !== val) {
      el.textContent = val;
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    }
  }

  function resetAll() {
    lead = null; leads = []; leadSeq = 0;
    thread.innerHTML = '';
    sys('Tap “Simulate missed call” to begin.');
    setEnabled(false);
    quickWrap.hidden = true;
    renderDashboard(false);
  }

  /* ---------- Wire events ---------- */
  function init() {
    applyPersonalization();
    wireCTAs();

    if (startBtn) startBtn.addEventListener('click', startConversation);
    if (resetBtn) resetBtn.addEventListener('click', resetAll);
    if (composer) composer.addEventListener('submit', function (e) {
      e.preventDefault();
      submitCustomer(input.value);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
