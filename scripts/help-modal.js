export async function openHelpModalFromTemplate(screenToShow) {
  if (!document.getElementById("help-modal-overlay")) {
  const res = await fetch("/modals/help-template.html");
  const html = await res.text();
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const template = temp.querySelector("template");
  document.body.appendChild(template.content.cloneNode(true));
}
  // جذر النسخة المنسوخة
  const overlay = document.body.querySelector('#help-modal-overlay');
  const modal = overlay.querySelector('#help-modal');
  modal.style.opacity = '0';
  modal.style.transform = 'scale(0.95)';
  modal.style.transition = "all 0.3s ease-out";
  currentHelpOverlay = overlay;
  currentHelpModal = modal;
  // دوال فتح وإغلاق النسخة
  function showHelpModal() {
    modal.style.opacity = '1';
    modal.style.transform = 'scale(1)';
    overlay.style.pointerEvents = 'all';
    isHelpOpen = true;
  }
  function hideHelpModal() {
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.95)';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => {
      overlay.remove(); // حذف النسخة من DOM عند الإغلاق
    }, 300);
    isHelpOpen = false;
    if (currentPage === "home") {
      history.pushState({ page: "home" }, "", "/");
    } else {
      history.pushState({ page: currentPage }, "", `/${currentPage}`);
    }
  }
  // دوال الشاشات
  function showHelpScreen(screen) {
    modal.querySelectorAll('.help-screen').forEach(s => {
      s.classList.remove('active');
      s.classList.add('hidden');
    });
    const targetScreen = modal.querySelector('#help-' + screen + '-screen');
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      targetScreen.classList.add('active');
    }
    modal.scrollTop = 0;
    modal.querySelector('#close-help-modal').classList.add('hidden');
    modal.querySelector('#back-help-modal').classList.remove('hidden');
    const titles = {
      question: { ar:"طرح تساؤل", en:"Ask a question", fr:"Poser une question" },
      suggestion: { ar:"تقديم اقتراح", en:"Make a Suggestion", fr:"Faire une suggestion" },
      report: { ar:"إبلاغ عن مشكل", en:"Report an Issue", fr:"Signaler un problème" },
      about: { ar:"عن فرصتي", en:"About Forsaty", fr:"À propos Forsaty" },
      privacy: { ar:"سياسة الخصوصية", en:"Privacy Policy", fr:"Politique de confidentialité" },
      terms: { ar:"الشروط والأحكام", en:"Terms & Conditions", fr:"Conditions d'utilisation" }
    };
    modal.querySelector('#help-modal-title').textContent = titles[screen]?.[selectedLanguage] || '';
    const stateName = `${screen}-help`;
    history.pushState({ page: stateName }, '', stateName);
  }

  function showMainHelpMenu() {
    modal.querySelectorAll('.help-screen').forEach(s => {
      s.classList.remove('active');
      s.classList.add('hidden');
      s.scrollTop = 0;
      history.pushState({ page: 'help' }, '', 'help');
    });

    const openBtn = document.querySelector('.open-help-modal-btn');
    const btnText = openBtn?.querySelector('span')?.textContent || openBtn?.textContent || '';
    modal.querySelector('#help-main-menu').classList.add('active');
    modal.querySelector('#help-main-menu').classList.remove('hidden');
    modal.querySelector('#help-modal-title').textContent = btnText;
    modal.querySelector('#close-help-modal').classList.remove('hidden');
    modal.querySelector('#back-help-modal').classList.add('hidden');
  }

  // ربط الأحداث
  overlay.querySelector('#close-help-modal').addEventListener('click', hideHelpModal);
  overlay.querySelector('#back-help-modal').addEventListener('click', showMainHelpMenu);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) hideHelpModal(); });

  // الفورمات
  ['question', 'suggestion', 'report'].forEach(type => {
    const form = overlay.querySelector(`#${type}-form`);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const subject = form.querySelector(`#${type}-type`).value.trim();
      const message = form.querySelector(`#${type}-text`).value.trim();
      if (!subject || !message) { showToast('الرجاء ملء جميع الحقول'); return; }
      if (subject.length < 3 || message.length < 7) { showToast('الرجاء ملء الموضوع والرسالة بشكل صحيح'); return; }
      let email = '';
if (type === 'question') {
  const user = await checkAuth();
    if (!user || !user.email || user.email.trim() === '') {
    const result = await showAlert({
      message: "الرجاء إدخال بريدك الإلكتروني لإرسال السؤال",
      inputLabel: "البريد الإلكتروني",
      inputPlaceholder: "example@mail.com",
      inputType: "email",
      icon: "fa-solid fa-envelope",
      confirmText: "إرسال",
      cancelText: "إلغاء",
      inputValidator: (value) => {
        if (!value || value.trim() === '') return "البريد الإلكتروني لا يمكن أن يكون فارغًا";
      }
    });
    if (!result.ok) return;
    email = result.value.trim(); // نأخذ البريد من الـ Alert
  } else {
    email = user.email.trim();
  }
}
      try {
        showToast('جاري الإرسال...', 6000);
        const payload = { subject, message };
        if (type === 'question') payload.email = email;
        const response = await fetch(form.action, {
          method: form.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const msg = type === 'question' ? 'تم إرسال سؤالك بنجاح! سنرد عليك في اقرب وقت ممكن'
                    : type === 'suggestion' ? 'شكراً لاقتراحك! سنأخذه بعين الاعتبار'
                    : 'تم استلام بلاغك! سنتعامل معه في أسرع وقت';
          showToast(msg);
          form.reset();
          hideHelpModal();
        } else showToast('حدث خطأ أثناء الإرسال');
      } catch {
        showToast('خطأ في الاتصال');
      }
    });
  });
  function scrollToFooter() {
  hideHelpModal();
  if (currentPage !== "home") {
    navigateToPage("home");
  }
  setTimeout(() => {
    const footer = document.querySelector('footer');
    const icons = document.querySelectorAll('.social-icon');
    if (!footer) return;
    footer.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      icons.forEach((icon, i) => {
        setTimeout(() => {
          icon.classList.add('animate-footer-icon');
          setTimeout(() => icon.classList.remove('animate-footer-icon'), 500);
        }, i * 200);
      });
    }, 800);
  }, 300);
}
    // ربط الأزرار داخل النسخة المنسوخة بالشاشات
const questionBtn = overlay.querySelector('#help-question-btn');
const suggestionBtn = overlay.querySelector('#help-suggestion-btn');
const reportBtn = overlay.querySelector('#help-report-btn');
const aboutBtn = overlay.querySelector('#help-about-btn');
const privacyBtn = overlay.querySelector('#help-privacy-btn');
const termsBtn = overlay.querySelector('#help-terms-btn');
const footerBtn = overlay.querySelector('#help-footer-btn');

questionBtn?.addEventListener('click', () => showHelpScreen('question'));
suggestionBtn?.addEventListener('click', () => showHelpScreen('suggestion'));
reportBtn?.addEventListener('click', () => showHelpScreen('report'));
aboutBtn?.addEventListener('click', () => showHelpScreen('about'));
privacyBtn?.addEventListener('click', () => showHelpScreen('privacy'));
termsBtn?.addEventListener('click', () => showHelpScreen('terms'));
footerBtn?.addEventListener('click', () => scrollToFooter());
  showHelpModal();
  if (screenToShow) showHelpScreen(screenToShow);
  let stateName = screenToShow ? `${screenToShow}-help` : 'help';
  history.pushState({ page: stateName }, '', stateName);
}