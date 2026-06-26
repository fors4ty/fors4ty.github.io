export async function initLogin(view = "login") {
  if (!document.getElementById("login-modal-overlay")) {
  const res = await fetch("/modals/login-template.html");
  applyLanguage();
  const html = await res.text();
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const template = temp.querySelector("template");
  document.body.appendChild(template.content.cloneNode(true));
}
const loginModalOverlay = document.getElementById("login-modal-overlay");
const loginModal = document.getElementById("login-modal");
const openLoginModalBtn = document.getElementById("open-login-modal-btn");
const closeLoginModalBtn = document.getElementById("close-login-modal");
const backLoginModalBtn = document.getElementById("back-login-modal");
const modalTitle = document.getElementById("modal-title");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const forgotPasswordForm = document.getElementById("forgot-password-form");
const showSignupBtn = document.getElementById("show-signup");
const showLoginFromSignupBtn = document.getElementById("show-login-from-signup");
const forgotPasswordCode = document.getElementById("forgot-password-code");
const showLoginFromForgotBtn = document.getElementById("show-login-from-forgot");

let currentModalView = "login";

function openLoginModal() {
  loginModalOverlay.classList.remove("pointer-events-none", "opacity-0");
  loginModalOverlay.classList.add("opacity-100");
  loginModal.classList.remove("scale-95");
  loginModal.classList.add("scale-100");
  closeSidebar();
  isLoginOpen = true;
  showModalView("login");
}

window.closeLoginModal = function() {
  loginModalOverlay.classList.add("pointer-events-none", "opacity-0");
  loginModalOverlay.classList.remove("opacity-100");
  loginModal.classList.add("scale-95");
  loginModal.classList.remove("scale-100");
  enableScroll();
  isLoginOpen = false;
  if (currentPage === "home") {
    history.pushState({ page: 'home' }, "", "/");
  } else {
    history.pushState({ page: currentPage }, "", `/${currentPage}`);
  }
  const rememberCheckbox = document.getElementById("rememberMe");
  if (rememberCheckbox) rememberCheckbox.checked = false;
}

function showModalView(view) {
  resetForm(loginForm);
  resetForm(signupForm);
  resetForm(forgotPasswordForm);
  currentModalView = view;
  loginForm.classList.add("hidden");
  signupForm.classList.add("hidden");
  forgotPasswordForm.classList.add("hidden");
  if (view === "login") {
    initPasswordToggle(loginForm);
    initPhoneFormatting(loginForm);
    loginForm.classList.remove("hidden");
    modalTitle.textContent = openLoginModalBtn.querySelector("span").textContent;
    closeLoginModalBtn.classList.remove("hidden");
    backLoginModalBtn.classList.add("hidden");
  } else if (view === "signup") {
    initPasswordToggle(signupForm);
    initPhoneFormatting(signupForm);
    signupForm.classList.remove("hidden");
    modalTitle.textContent = showSignupBtn.textContent;
    closeLoginModalBtn.classList.add("hidden");
    backLoginModalBtn.classList.remove("hidden");
  } else if (view === "forgot") {
    forgotPasswordForm.classList.remove("hidden");
    let title = forgotPasswordCode.textContent.replace(/[؟?]/g, "").trim(); // إزالة علامة الاستفهام
    modalTitle.textContent = title;
    closeLoginModalBtn.classList.add("hidden");
    backLoginModalBtn.classList.remove("hidden");
  }
  history.pushState({ auth: view }, '', `/${view}`);
  // التمرير للأعلى تلقائياً
  const modalContent = document.querySelector("#login-modal");
  if (modalContent) {
    modalContent.scrollTop = 0;
  }
}

// Event Listeners
openLoginModalBtn.addEventListener("click", () => {
  openLoginModal();
  closeSidebar();
});

closeLoginModalBtn.addEventListener("click", closeLoginModal);
loginModalOverlay.addEventListener("click", (e) => {
  if (e.target === loginModalOverlay) {
    closeLoginModal();
  }
});

backLoginModalBtn.addEventListener("click", () => {
  showModalView("login");
});

showSignupBtn.addEventListener("click", () => {
  showModalView("signup");
});

showLoginFromSignupBtn.addEventListener("click", () => {
  showModalView("login");
});

forgotPasswordCode.addEventListener("click", () => {
  showModalView("forgot");
});

showLoginFromForgotBtn.addEventListener("click", () => {
  showModalView("login");
});
openLoginModal();
showModalView(view);

document.querySelectorAll('.switch-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('.hide-signup-email').classList.toggle('hidden');
    document.querySelector('.hide-signup-phone').classList.toggle('hidden');
  });
});

const codeModal = document.getElementById('code-modal');
function openCodeModal() {
  disableScroll();
  codeModal.classList.remove('hidden');
  const modalContent = codeModal.querySelector('div');
  setTimeout(() => {
    modalContent.classList.remove('opacity-0', 'scale-90');
  }, 10);
  const firstInput = codeModal.querySelector('input[type="tel"]');
  firstInput.focus();
}

function closeCodeModal() {
  const modalContent = codeModal.querySelector('div');
  modalContent.classList.add('opacity-0', 'scale-90');
  setTimeout(() => {
    codeModal.classList.add('hidden');
  }, 300);
  enableScroll();
}

let codeModalResolver = null;
codeModal.addEventListener('click', (e) => {
  if (e.target !== codeModal) return;
  if (!codeModalResolver) return;
  closeCodeModal();
  codeModalResolver({ ok: false, value: null });
  codeModalResolver = null;
});

let forgotFlowActive = false;
let countdownInterval;
let timeLeft = 120;
const RESEND_DELAY = 30;
const countdownEl = document.getElementById('countdown');
const resendBtn = document.getElementById('resend-code');
function startCountdown() {
  clearInterval(countdownInterval);
  timeLeft = 120;
  resendBtn.classList.add('opacity-50', 'pointer-events-none');
  updateCountdownText();
  countdownInterval = setInterval(() => {
    timeLeft--;
    updateCountdownText();
    if (timeLeft <= 120 - RESEND_DELAY) {
      resendBtn.classList.remove('opacity-50', 'pointer-events-none');
    }
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      countdownEl.textContent = '00:00';
    }
  }, 1000);
}

function updateCountdownText() {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  countdownEl.textContent = `${minutes}:${seconds}`;
}

function clearInputs() {
  const codeInputs = document.querySelectorAll('#code-modal input[type="tel"]');
  codeInputs.forEach(input => input.value = '');
  codeInputs[0].focus();
}

async function handleResend() {
  if (resendBtn.classList.contains('pointer-events-none')) return;

  try {
    const email = document.getElementById("forgot-email").value.trim();
    const sendResponse = await fetch("http://localhost:3000/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await sendResponse.json();

    if (!sendResponse.ok) {
      showToast(data.message || "حدث خطأ أثناء إعادة إرسال الرمز.");
      return;
    }

    showToast("تم إعادة إرسال الرمز!");
    startCountdown(); // فقط عند إرسال جديد ناجح
    clearInputs();
  } catch (err) {
    console.error(err);
    showToast("تعذر الاتصال بالسيرفر.");
  }
}

function showCodeModal() {
  return new Promise((resolve) => {
    codeModalResolver = resolve;
    openCodeModal();
    const codeInputs = document.querySelectorAll('#code-modal input[type="tel"]');
    codeInputs.forEach(input => input.replaceWith(input.cloneNode(true)));

    // تحديث references بعد الاستبدال
    const inputs = document.querySelectorAll('#code-modal input[type="tel"]');

    // دالة لتحديد أول input فارغ للفوكس
    const focusFirstEmpty = () => {
      for (let input of inputs) {
        if (!input.value) {
          input.focus();
          return input;
        }
      }
      return inputs[inputs.length - 1];
    };

    // إدارة إدخال الأرقام والانتقال تلقائيًا
    inputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, ''); // رقم فقط
        if (input.value && index < inputs.length - 1) {
          inputs[index + 1].focus(); // الانتقال إلى التالي
        }
        if (Array.from(inputs).every(i => i.value)) {
          setTimeout(() => {
            submitCode();
          }, 500);
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          e.preventDefault();
          if (input.value) {
            input.value = '';
          } else if (index > 0) {
            inputs[index - 1].value = '';
            inputs[index - 1].focus();
          }
        }
      });

      input.addEventListener('focus', () => {
        const firstEmpty = focusFirstEmpty();
        if (input !== firstEmpty) firstEmpty.focus();
      });
    });

    // دوال التحكم بالزر
    const disableResendButton = () => {
      resendBtn.classList.add('opacity-50', 'pointer-events-none');
    };
    const enableResendButton = () => {
      resendBtn.classList.remove('opacity-50', 'pointer-events-none');
    };
    if (!resendBtn.listenerAdded) {
      resendBtn.addEventListener('click', handleResend);
      resendBtn.listenerAdded = true;
    }
    const submitCode = () => {
      const code = Array.from(inputs).map(i => i.value).join('');
      resolve({ ok: true, value: code });
      clearInputs();
    };
    focusFirstEmpty();
  });
}

// =====================
// Login Form
// =====================
const switchBtns = document.querySelectorAll('.login-switch-btn');
const inputWrappers = document.querySelectorAll('.login-input-wrapper');

function resetButtons() {
  switchBtns.forEach(btn => {
    btn.style.color = 'gray';
    btn.classList.add('opacity-50', 'cursor-pointer', 'hover-opacity');
  });
}

function hideAllInputsAndClear() {
  inputWrappers.forEach(wrap => {
    const input = wrap.querySelector('input');
    if (input) input.value = ''; // تفريغ الإنبوت
    wrap.classList.add('hidden');
  });
}

switchBtns.forEach((btn, index) => {
  btn.addEventListener('click', () => {
    // الأزرار
    resetButtons();
    btn.style.color = 'var(--primary-color)';
    btn.classList.remove('opacity-50', 'cursor-pointer', 'hover-opacity');

    // الإنبوتات
    hideAllInputsAndClear();
    inputWrappers[index].classList.remove('hidden');

    // فوكس
    const input = inputWrappers[index].querySelector('input');
    if (input) input.focus();
  });
});
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const loginValue =
  document.getElementById("login-email")?.value.trim() ||
  document.getElementById("login-phone")?.value.trim() ||
  document.getElementById("login-id")?.value.trim();
  const password = document.getElementById("login-password").value;
  const remember = document.getElementById("rememberMe").checked;
  // ===== Validation =====
  if (!loginValue) {
    showToast("يرجى ملء الحقول");
    return;
  }
  if (!loginValue) {
  showToast("يرجى ملء الحقول");
  return;
}
if (loginValue.includes("@")) {
  if (!isValidEmail(loginValue)) {
    showToast("البريد الإلكتروني غير صالح");
    return;
  }
} else if (loginValue.startsWith("0")) {
  if (!isValidPhone(loginValue)) {
    showToast("رقم الهاتف غير صالح");
    return;
  }
} else if (isOnlyNumbers(loginValue)) {
  if (loginValue.length !== 7) {
    showToast("رقم ID غير صالح");
    return;
  }
} else {
  showToast("الإدخال غير صالح");
  return;
}
  if (!password) { showToast("يرجى إدخال كلمة المرور"); return; }
  if (!isValidPassword(password)) { showToast("كلمة المرور 8 أحرف على الأقل"); return; }
  showToast("جاري تسجيل الدخول...");
  // ===== Fetch Login =====
  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: "include",
      body: JSON.stringify({ loginValue, password, remember })
    });
    const data = await response.json();
    if (data.success) {
      closeLoginModal();
      setTimeout(() => {
        location.reload();
      }, 1000);
      showToast('تم تسجيل الدخول!');
    } else {
      showToast((data.message || 'خطأ غير معروف'));
    }
  } catch (err) {
    showToast('خطأ في الاتصال بالسيرفر');
    console.error(err);
  }
});

// =====================
// Signup Form
// =====================

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const phone = document.getElementById("signup-phone").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("signup-confirm-password").value;
  // ===== Validation =====
  if (!name) { showToast("يرجى إدخال الاسم"); return; }
  if (!isValidName(name)) { showToast("الإسم غير صالح"); return; }
  if (!email && !phone) {
  showToast("يرجى ملء جميع الحقول");
    return;
  }
  if (email && !isValidEmail(email)) {
    showToast("يرجى إدخال بريد إلكتروني صالح");
    return;
  }
  if (phone && (!isValidPhone(phone))) {
    showToast("رقم الهاتف غير صالح");
    return;
  }
  if (!password) { showToast("يرجى إدخال كلمة المرور"); return; }
  if (!isValidPassword(password)) { showToast("كلمة المرور 8 أحرف على الأقل"); return; }
  if (password !== confirmPassword) { showToast("كلمتا المرور غير متطابقتين"); return; }
  showToast("جاري إنشاء الحساب...");
  // ===== Fetch Signup =====
  try {
    const response = await fetch('http://localhost:3000/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: "include",
      body: JSON.stringify({ name, email, phone, password })
    });
    const data = await response.json();
    if (data.success) {
  try {
    const loginResponse = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginValue: email || phone, password })
    });
    const loginData = await loginResponse.json();

    if (loginData.success) {
      showToast('تم إنشاء الحساب!');
    } else {
      showToast('تم إنشاء الحساب!');
    }
  } catch (err) {
    showToast('تم إنشاء الحساب!');
  } finally {
    closeLoginModal();
    setTimeout(() => { location.reload(); }, 1500);
  }
} else {
  showToast((data.message || 'خطأ غير معروف'));
}
  } catch (err) {
    showToast('خطأ في الاتصال بالسيرفر');
  }
});

// =====================
// Google Sign-In Integration
// =====================

document.getElementById('login-google').onclick = () => {
    tokenClient.requestAccessToken(); // يظهر popup Google
  };
  document.getElementById('signup-google').onclick = () => {
    tokenClient.requestAccessToken(); // يظهر popup Google
  };

// =====================
// Facebook Sign-In Integration
// =====================

function fbLogin() {
    FB.login(function(response) {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        fetch('/facebook-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            closeLoginModal();
            setTimeout(() => { location.reload(); }, 300);
          } else {
            showToast(data.message || 'فشل تسجيل الدخول/إنشاء الحساب');
          }
        })
        .catch(err => console.error(err));
      } else {
        showToast('تم إلغاء تسجيل الدخول على Facebook');
      }
    }, {scope: 'email,public_profile'});
  }

  document.getElementById('login-facebook').onclick = fbLogin;
  document.getElementById('signup-facebook').onclick = fbLogin;

// =====================
// Forgot Password Form
// =====================

forgotPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  forgotFlowActive = true;
  const email = document.getElementById("forgot-email").value.trim();
  if (!email) {
    showToast("يرجى إدخال البريد الإلكتروني");
    return;
  }
  if (!isValidEmail(email)) {
    showToast("البريد الإلكتروني غير صالح");
    return;
  }
  try {
    const sendResponse = await fetch("http://localhost:3000/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await sendResponse.json();
    if (!sendResponse.ok) {
      showToast(data.message || "حدث خطأ أثناء إرسال الرمز.");
      return;
    }
    startCountdown();
    closeLoginModal();
    let verified = false;
    while (forgotFlowActive && !verified) {
      const result = await showCodeModal();
      if (!result.ok) {
        forgotFlowActive = false;
        break;
      }
      const userCode = result.value.trim();
      const verifyResponse = await fetch("http://localhost:3000/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: userCode }),
      });
      const verifyData = await verifyResponse.json();
      if (verifyResponse.ok) {
        closeCodeModal();
        showToast("تم التحقق بنجاح!");
        localStorage.setItem("tempToken", verifyData.token);
        changePasswordForForgot(email, verifyData.token);
        verified = true;
      } else {
        showToast(verifyData.message || "الرمز غير صحيح، حاول مرة أخرى");
      }
    }
  } catch (err) {
    console.error(err);
    showToast("تعذر الاتصال بالسيرفر.");
  }
});

signupForm.noValidate = true;
loginForm.noValidate = true;
forgotPasswordForm.noValidate = true;
}