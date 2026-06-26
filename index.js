function disableScroll() {
  document.body.classList.add("no-scroll");
}
function enableScroll() {
  document.body.classList.remove("no-scroll");
}
disableScroll();
(() => {
  let locked = false;
  let scrollY = 0;
  function hasOpenOverlay() {
    return (
      isMessagesOpen ||
      isHistoryOpen ||
      isWalletOpen ||
      isPointsOpen ||
      isProOpen ||
      isLoginOpen ||
      isSettingsOpen ||
      isHelpOpen || searchActive
    );
  }
  function lock() {
    if (locked) return;
    locked = true;
    scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  }
  function unlock() {
    if (!locked) return;
    locked = false;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, scrollY);
  }
  function sync() {
    hasOpenOverlay() ? lock() : unlock();
  }
  ["focusin", "focusout", "resize", "orientationchange"].forEach(e =>
    document.addEventListener(e, sync, true)
  );
  window.addEventListener("popstate", sync);
  setInterval(sync, 100);
})();

let globalOverlay = null;
function showOverlay() {
  if (!globalOverlay) {
    globalOverlay = document.createElement("div");
    globalOverlay.style.position = "fixed";
    globalOverlay.style.top = "0";
    globalOverlay.style.left = "0";
    globalOverlay.style.width = "100%";
    globalOverlay.style.height = "100%";
    globalOverlay.style.background = "rgba(0,0,0,0)"; // شفاف
    globalOverlay.style.zIndex = "99999"; // عالي جدًا
    globalOverlay.style.pointerEvents = "auto"; // يمنع التفاعل مع الصفحة
    document.body.appendChild(globalOverlay);
  } else {
    globalOverlay.style.display = "block";
  }
}

function hideOverlay() {
  if (globalOverlay) {
    globalOverlay.style.display = "none";
  }
}

const isHomePage = window.location.pathname === '/';
const splash = document.getElementById("splash");
const spinner = document.getElementById("global-spinner");
const logo = document.getElementById("logo");
if (isHomePage) {
  function startLogoIntro() {
    if (!logo || !splash) return;
    splash.classList.remove("hidden");
    setTimeout(() => {
      logo.style.animation = "logoIntro 4s ease-in-out forwards";
    }, 1000);
    logo.addEventListener(
      "animationend",
      () => {
        splash.classList.add("hidden");
        enableScroll();
      },
      { once: true }
    );
  }
  if (logo && logo.complete) {
    startLogoIntro();
  } else if (logo) {
    logo.onload = startLogoIntro;
  }
} else {
  function startSpinnerIntro() {
    if (!splash || !spinner) return;
    splash.classList.remove("hidden");
    spinner.classList.add("use-dot");
    spinner.classList.remove("hidden");
    disableScroll();
    setTimeout(() => {
      splash.classList.add("hidden");
      spinner.classList.add("hidden");
      spinner.classList.remove("use-dot");
      enableScroll();
    }, 4000);
  }
  startSpinnerIntro();
}

function lazy() {
  const main = document.querySelector("main");
  main.querySelectorAll("p, h1, h2, h3, h4, h5, h6, svg, i")
  .forEach(el => {
    if (el.classList.contains("no-lazy")) return;
    el.classList.add("lazy");
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  });
  document.querySelectorAll(".lazy").forEach(el => observer.observe(el));
}

async function checkAuth() {
  try {
    const res = await fetch("http://localhost:3000/auth/me", {
      method: "GET",
      credentials: "include"
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.user : null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

window.addEventListener("load", () => {
  setTimeout(async () => {
    const path = location.pathname.replace("/", "");
    let loginModule;
    const loginPaths = ["login", "signup", "forgot"];
    if (loginPaths.includes(path)) {
      loginModule = await import('./scripts/login-modal.js');
    }
    let settingsModule;
    const settingsPaths = ["settings", "language-settings", "appearance-settings", "notifications-settings", "account-settings", "privacy-settings"];
    if (settingsPaths.includes(path)) {
      settingsModule = await import('./scripts/settings.js');
    }
    let helpModule;
    const helpPaths = [
      "help", "question-help", "suggestion-help", "report-help",
      "about-help", "privacy-help", "terms-help"
    ];
    if (helpPaths.includes(path)) {
      helpModule = await import('./scripts/help-modal.js');
    }
    const routes = {
      "profile": () => navigateToPage('profile'),
      "request-service": () => navigateToPage('request-service'),
      "find-job": () => navigateToPage('find-job'),
      "training": () => navigateToPage('training'),
      "forsaty-store": () => navigateToPage('forsaty-store'),
      "messages": () => showMessagesModal(),
      "points": () => showPointsModal(),
      "wallet": () => showWalletModal(),
      "history": () => showHistoryModal(),
      "pro": () => showProModal(),
      "login": () => loginModule.initLogin(),
      "signup": () => loginModule.initLogin('signup'),
      "forgot": () => loginModule.initLogin('forgot'),
      "settings": () => settingsModule.initSettings(),
      "language-settings": () => settingsModule.initSettings('language'),
      "appearance-settings": () => settingsModule.initSettings('appearance'),
      "notifications-settings": () => settingsModule.initSettings('notifications'),
      "account-settings": () => settingsModule.initSettings('account'),
      "privacy-settings": () => settingsModule.initSettings('privacy'),
      "help": () => helpModule.openHelpModalFromTemplate(),
      "question-help": () => helpModule.openHelpModalFromTemplate('question'),
      "suggestion-help": () => helpModule.openHelpModalFromTemplate('suggestion'),
      "report-help": () => helpModule.openHelpModalFromTemplate('report'),
      "about-help": () => helpModule.openHelpModalFromTemplate('about'),
      "privacy-help": () => helpModule.openHelpModalFromTemplate('privacy'),
      "terms-help": () => helpModule.openHelpModalFromTemplate('terms')
    };
    if (routes[path]) routes[path]();
  }, 2000);
});

(() => {
  const EXCLUDE_CLASS = "no-loader";
  const NO_RELATIVE_CLASS = "no-relative";
  const spinner = document.getElementById("global-spinner");
  const originalFetch = window.fetch;
  const LOADER_DELAY = 200;
  window.fetch = async (...args) => {
    const btn = document.activeElement?.closest("button");
    if (!btn || btn.classList.contains(EXCLUDE_CLASS)) {
      return originalFetch(...args);
    }
    if (!btn.classList.contains(NO_RELATIVE_CLASS)) {
      btn.style.position ||= "relative";
    }
    let textSpan = btn.querySelector(".btn-text");
    if (!textSpan) {
      textSpan = document.createElement("span");
      textSpan.className = "btn-text";
      textSpan.innerHTML = btn.innerHTML;
      btn.innerHTML = "";
      btn.appendChild(textSpan);
    }
    let showTimeout;
    let loaderVisible = false;
    const showLoader = () => {
      textSpan.style.visibility = "hidden";
      spinner.classList.toggle(
        "use-doti",
        btn.classList.contains(NO_RELATIVE_CLASS)
      );
      spinner.classList.remove("hidden");
      spinner.style.top = "50%";
      spinner.style.left = "50%";
      spinner.style.transform = "translate(-50%, -50%)";
      btn.appendChild(spinner);
      btn.disabled = true;
      showOverlay();
      loaderVisible = true;
    };
    showTimeout = setTimeout(showLoader, LOADER_DELAY);
    try {
      return await originalFetch(...args);
    } finally {
      clearTimeout(showTimeout);
      if (loaderVisible) {
        spinner.classList.add("hidden");
        spinner.classList.remove("use-doti");
        textSpan.style.visibility = "visible";
        btn.disabled = false;
        hideOverlay();
      }
    }
  };
})();

function copyID(btn, event) {
  event.stopPropagation();
  const textEl = btn.closest("div")?.querySelector(".id-text");
  if (!textEl) return;
  // نص للنسخ
  const text = textEl.innerText.replace("ID: ", "").trim();
  // طريقة احتياطية للنسخ (input مؤقت)
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  tempInput.setSelectionRange(0, 99999); // للأجهزة المحمولة
  document.execCommand("copy");
  document.body.removeChild(tempInput);
  // تأثير على الأيقونة
  const icon = btn.querySelector("i");
  if (!icon) return;
  icon.style.opacity = "0.7";
  icon.style.transition = "opacity 0.3s";
  setTimeout(() => {
    icon.style.opacity = "1";
  }, 3000);
  showToast(selectedLanguage === "ar" ? "تم نسخ المعرف" : getTranslation("copyID"));
}

let activeTooltip = null;
let activeOwner = null;
let hideTimer = null;
const isTouch = 'ontouchstart' in window;
document.addEventListener("click", (e) => {
  const owner = e.target.closest("[data-message]");
  if (!owner) {
    closeTooltip();
    return;
  }
  if (owner === activeOwner) {
    closeTooltip();
    return;
  }
  openTooltip(owner);
});
function openTooltip(el) {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  closeTooltip();
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.innerHTML = el.dataset.message;
  document.body.appendChild(tooltip);
  activeTooltip = tooltip;
  activeOwner = el;
  const SAFE_MARGIN = 24;
  const updatePosition = () => {
    const rect = el.getBoundingClientRect();
    const tW = tooltip.offsetWidth;
    const tH = tooltip.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const showAbove = rect.bottom + tH + 150 > vh;
    tooltip.classList.toggle("top", showAbove);
    tooltip.classList.toggle("bottom", !showAbove);
    let top = showAbove ? rect.top - tH - 10 : rect.bottom + 10;
    let left = rect.left + rect.width / 2 - tW / 2;
    if (left < SAFE_MARGIN) left = SAFE_MARGIN;
    if (left + tW > vw - SAFE_MARGIN) left = vw - tW - SAFE_MARGIN;
    tooltip.style.top = top + window.scrollY + "px";
    tooltip.style.left = left + window.scrollX + "px";
    const arrowX = rect.left + rect.width / 2 - left - 6;
    tooltip.style.setProperty("--arrow-x", arrowX + "px");
  };
  updatePosition();
  window.addEventListener("scroll", updatePosition);
  window.addEventListener("resize", updatePosition);
  requestAnimationFrame(() => tooltip.classList.add("show"));
  hideTimer = setTimeout(closeTooltip, 3000);
}
function closeTooltip() {
  if (!activeTooltip) return;
  activeTooltip.remove();
  activeTooltip = null;
  activeOwner = null;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  window.removeEventListener("scroll", null);
  window.removeEventListener("resize", null);
}
function hoverTooltip() {
  if (isTouch) return; // على الهاتف لا نستخدم hover
  document.querySelectorAll("[data-message]").forEach(el => {
    let hoverTimer = null;
    el.addEventListener("mouseenter", () => {
      hoverTimer = setTimeout(() => openTooltip(el), 600);
    });
    el.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimer);
      hideTimer = setTimeout(closeTooltip, 3000);
    });
  });
}
hoverTooltip();

let toastTimer = null;
function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  toastMessage.textContent = message;
  toast.classList.remove("opacity-0", "pointer-events-none");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("opacity-0", "pointer-events-none");
  }, duration);
}


// =====================
// أدوات التحقق (Reusable)
// =====================
function isValidPassword(password) {
  return password.length >= 8;
}
function isValidName(name) {
  name = name.trim();
  if (name.length < 4) return false;
  const regex = /^[\p{L}\s]+$/u;
  return regex.test(name);
}
function hasLetters(value) {
  return /[a-zA-Z]/.test(value);
}
function isOnlyNumbers(value) {
  return /^\d+$/.test(value);
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPhone(phone) {
  const digitsOnly = phone.replace(/\s+/g, '');
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(digitsOnly);
}

function showAlert({
  message = "",
  inputLabel,
  inputPlaceholder = "",
  inputType = "text",
  inputLabel2,
  inputPlaceholder2 = "",
  inputType2 = "text",
  confirmText,
  cancelText,
  icon
}) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("alertOverlay");
    const box = document.getElementById("alertBox");
    const msg = document.getElementById("alertMessage");
    const box1 = document.getElementById("inputBox1");
    const box2 = document.getElementById("inputBox2");
    const input1 = document.getElementById("input1");
    const input2 = document.getElementById("input2");
    const label1 = document.getElementById("inputLabel1");
    const label2 = document.getElementById("inputLabel2");
    const btnOk = document.getElementById("alertConfirm");
    const btnCancel = document.getElementById("alertCancel");
    const iconBox = document.getElementById("iconBox");
    const iconAlert = document.getElementById("iconAlert");
    if (icon) {
      iconBox.classList.remove("hidden");
      iconAlert.classList.add(...icon.split(" "));
    } else {
      iconBox.classList.add("hidden");
    }
    msg.textContent = message;
    // ---------- INPUT 1 ----------
    if (inputLabel) {
      box1.classList.remove("hidden");
      label1.textContent = inputLabel;
      input1.placeholder = inputPlaceholder;
      input1.type = inputType;
      input1.value = "";
    } else box1.classList.add("hidden");
    // ---------- INPUT 2 ----------
    if (inputLabel2) {
      box2.classList.remove("hidden");
      label2.textContent = inputLabel2;
      input2.placeholder = inputPlaceholder2;
      input2.type = inputType2;
      input2.value = "";
    } else box2.classList.add("hidden");
    // ---------- BUTTONS ----------
    btnOk.classList.toggle("hidden", !confirmText);
    btnCancel.classList.toggle("hidden", !cancelText);
    if (confirmText) btnOk.textContent = confirmText;
    if (cancelText) btnCancel.textContent = cancelText;
    // ---------- SHOW (مع أنيميشن) ----------
    overlay.classList.remove("hidden");
    initPasswordToggle(box);
    requestAnimationFrame(() => {
      overlay.classList.remove("opacity-0");
      box.classList.remove("opacity-0", "scale-90");
    });
    const close = (result) => {
      // ---------- HIDE (مع أنيميشن) ----------
      overlay.classList.add("opacity-0");
      box.classList.add("opacity-0", "scale-90");
      setTimeout(() => {
        overlay.classList.add("hidden");
        document.onkeydown = null;
        resolve(result);
      }, 300);
    };
    // ---------- VALIDATION ----------
    function validateInput(value, type) {
      switch (type) {
        case "password":
          return isValidPassword(value) ? true : "كلمة السر يجب أن تكون 8 أحرف على الأقل";
        case "text":
          return isValidName(value) ? true : "يرجى ملء الحقل بشكل صحيح";
        case "email":
          return isValidEmail(value) ? true : "البريد الإلكتروني غير صالح";
        case "phone":
          return isValidPhone(value) ? true : "رقم الهاتف غير صالح";
        default:
          return true;
      }
    }
    btnOk.onclick = () => {
    // تحقق Input 1
    if (inputLabel) {
     if (!input1.value) {
       showToast("يرجى ملء الحقل");
       input1.focus();
       return;
     }
     const v1 = validateInput(input1.value, inputType);
     if (v1 !== true) {
       showToast(v1);
       input1.focus();
       return;
     }
   }
   // تحقق Input 2
   if (inputLabel2) {
     if (!input2.value) {
       showToast("يرجى ملء جميع الحقول");
       input2.focus();
       return;
     }
     const v2 = validateInput(input2.value, inputType2);
     if (v2 !== true) {
       showToast(v2);
       input2.focus();
       return;
     }
     if (input1.value !== input2.value) {
       showToast("كلمتا السر غير متطابقتين");
       input2.focus();
       return;
     }
   }
   if (inputLabel2) {
     close({ ok: true, value1: input1.value, value2: input2.value });
   } else if (inputLabel) {
     close({ ok: true, value: input1.value });
   } else {
     close({ ok: true });
   }
  };
    btnCancel.onclick = () => close({ ok: false });
    overlay.onclick = (e) => {
      if (e.target === overlay) close({ ok: false });
    };
    document.onkeydown = (e) => {
      if (e.key === "Escape") close({ ok: false });
      if (e.key === "Enter" && confirmText) btnOk.click();
    };
  });
}

async function changePasswordForForgot(email, tempToken) {
  const res = await showAlert({
    message: "تغيير كلمة السر",
    inputLabel: "كلمة السر الجديدة",
    inputType: "password",
    inputPlaceholder: "••••••••",
    inputLabel2: "تأكيد كلمة السر",
    inputType2: "password",
    inputPlaceholder2: "••••••••",
    confirmText: "حفظ",
    cancelText: "إلغاء",
    icon: "fa-solid fa-key"
  });
  if (!res.ok) return;
  const { value1: newPassword } = res;
  try {
    const response = await fetch("http://localhost:3000/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword, token: tempToken })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    showToast("تم تغيير كلمة السر بنجاح");
  } catch (err) {
    showToast("خطأ في الاتصال بالسيرفر: " + err.message);
  }
}

let loginLoaded = false;
window.isLoginOpen = false;
document.getElementById("open-login-modal-btn").addEventListener("click", async () => {
  closeSidebar();
  if (!loginLoaded) {
    const loginModule = await import("./scripts/login-modal.js"); // تحميل الملف عند الحاجة
    loginModule.initLogin(); // تنفيذ كل الكود
    loginLoaded = true;
  }
});

let tokenClient;
window.onload = () => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: "1089008954789-jn5ms5urevmqe99jkk4b4247l3rrki42.apps.googleusercontent.com",
    scope: "openid email profile",
    callback: handleGoogleResponse
  });
};
function handleGoogleResponse(response) {
  if (!response.access_token) {
    showToast('فشل Google Sign-In');
    return;
  }
  fetch('/google-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: response.access_token })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      window.closeLoginModal();
      setTimeout(() => { location.reload(); }, 300);
    } else {
      showToast(data.message || 'فشل تسجيل الدخول/إنشاء الحساب');
    }
  })
  .catch(err => {
    showToast('حدث خطأ أثناء الاتصال بالسيرفر');
  });
}

function initPhoneFormatting(root = document) {
  root.querySelectorAll("input[type='tel']").forEach(input => {
    input.addEventListener("input", e => {
      let raw = input.value.replace(/\D/g, '').slice(0, 10);
      let formatted = '';
      for (let i = 0; i < raw.length; i++) {
        if (i > 0 && i % 2 === 0) formatted += ' ';
        formatted += raw[i];
      }
      input.value = formatted;
      input.setSelectionRange(formatted.length, formatted.length);
    });
    input.addEventListener("keydown", e => {
      if (e.key === " ") e.preventDefault();
    });
    input.addEventListener("click", () => {
      input.setSelectionRange(input.value.length, input.value.length);
    });
    input.addEventListener("focus", () => {
      input.setSelectionRange(input.value.length, input.value.length);
    });
  });
}

function initPasswordToggle(root = document) {
  root.querySelectorAll('input[type="password"], input[type="text"]').forEach((input) => {
    const wrapper = input.parentElement;
    let eye = wrapper.querySelector('.fa-eye');
    let eyeSlash = wrapper.querySelector('.fa-eye-slash');

    if (!eye) {
      eye = document.createElement("i");
      eye.className = "show-pass fa-solid fa-eye hidden";
      wrapper.appendChild(eye);
    }
    if (!eyeSlash) {
      eyeSlash = document.createElement("i");
      eyeSlash.className = "show-pass fa-solid fa-eye-slash hidden";
      wrapper.appendChild(eyeSlash);
    }

    let showing = input.type === "text";

    const updateEye = () => {
      if (input.value.length === 0) {
        eye.classList.add("hidden");
        eyeSlash.classList.add("hidden");
        input.type = "password";   // ← هذا السطر يضمن أن الحقل يعود لنقاط الباسورد
        showing = false;
      } else {
        if (showing) {
          eye.classList.add("hidden");
          eyeSlash.classList.remove("hidden");
        } else {
          eye.classList.remove("hidden");
          eyeSlash.classList.add("hidden");
        }
      }
    };

    updateEye();

    input.addEventListener("input", () => {
      // لا نغير type هنا
      updateEye();
    });

    eye.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      input.type = "text";
      showing = true;
      updateEye();
    });

    eyeSlash.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      input.type = "password";
      showing = false;
      updateEye();
    });

    const observer = new MutationObserver(updateEye);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  });
}

document.querySelectorAll(".no-spaces").forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === " ") e.preventDefault();
  });
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\s/g, "");
  });
});

let currentPage = "home";
let searchActive = false;
let lastScrollY = window.scrollY;
const header = document.getElementById("main-header");

// Sidebar functionality
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const headerRightBtn = document.getElementById("header-right-btn");
const menuIcon = document.getElementById("menu-icon");
const backIcon = document.getElementById("back-icon");
const headerLogo = document.getElementById("header-logo");
const headerTitle = document.getElementById("header-title");
const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("search-input");
const mainHeader = document.getElementById("main-header");

async function checkAuthUI() {
  const user = await checkAuth();
  const nameEls = document.querySelectorAll('[data-user-name]');
  const idEls = document.querySelectorAll('[data-user-id]');
  const emailEls = document.querySelectorAll('[data-user-email]');
  const phoneEls = document.querySelectorAll('[data-user-phone]');
  const avatarEls = document.querySelectorAll('[data-user-avatar]');
  const authOnlyEls = document.querySelectorAll('[data-auth="true"]');
  const guestOnlyEls = document.querySelectorAll('[data-auth="false"]');
  const emailWrappers = document.querySelectorAll('.user-email-wrapper');
  const phoneWrappers = document.querySelectorAll('.user-phone-wrapper');
  nameEls.forEach(el => {
    if (!el.dataset.original) {
      el.dataset.original = el.textContent;
    }
  });
  idEls.forEach(el => {
    if (!el.dataset.original) {
      el.dataset.original = el.textContent;
    }
  });
  emailEls.forEach(el => {
    if (!el.dataset.original) {
      el.dataset.original = el.textContent;
    }
  });
  phoneEls.forEach(el => {
    if (!el.dataset.original) {
      el.dataset.original = el.textContent;
    }
  });
  if (user) {
    authOnlyEls.forEach(el => el.classList.remove("hidden"));
    guestOnlyEls.forEach(el => el.classList.add("hidden"));
    nameEls.forEach(el => {
      if (el.hasAttribute('data-i18n')) el.removeAttribute('data-i18n');
      el.textContent = user.name;
    });
    idEls.forEach(el => el.textContent = 'ID: ' + user.user_id);
    emailEls.forEach(el => el.textContent = user.email);
    if (!user.email) {
      emailWrappers.forEach(wrapper => wrapper.classList.add('hidden'));
    }
    phoneEls.forEach(el => el.textContent = user.phone);
    if (!user.phone) {
      phoneWrappers.forEach(wrapper => wrapper.classList.add('hidden'));
    }
    avatarEls.forEach(el => {
      if (!user.avatar) return;
      if (user.avatar.startsWith('fa-')) {
        el.innerHTML = `<i class="fas ${user.avatar}"></i>`;
      } else {
        const imgSrc = 'backend/uploads/users/' + user.avatar;
        el.innerHTML = `<img src="${imgSrc}" class="w-full h-full rounded-full object-cover">`;
      }
    });
  } else {
    authOnlyEls.forEach(el => el.classList.add("hidden"));
    guestOnlyEls.forEach(el => el.classList.remove("hidden"));
    nameEls.forEach(el => el.textContent = el.dataset.original);
    idEls.forEach(el => el.textContent = el.dataset.original);
    emailEls.forEach(el => el.textContent = el.dataset.original);
    phoneEls.forEach(el => el.textContent = el.dataset.original);
  }
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  const res = await fetch('http://localhost:3000/logout', {
    method: 'POST',
    credentials: 'include'
  });
  const data = await res.json();
  if (data.success) {
    closeSidebar();
    showToast("تم تسجيل الخروج");
    setTimeout(() => location.reload(), 500);
  } else {
    showToast((data.message || "خطأ في الاتصال بالسيرفر"));
  }
});


// Language selection functionality
let selectedLanguage = localStorage.getItem("appLanguage") || "ar";

function selectLanguage(button, lang) {
  selectedLanguage = lang;

  // Remove active state from all language options
  document.querySelectorAll(".language-option").forEach((opt) => {
    opt.classList.remove("border-purple-400");
    opt.classList.add("border-gray-200");
    opt.style.color = "";
    opt.classList.add("text-gray-700");
    const checkmark = opt.querySelector(".checkmark");
    if (checkmark) checkmark.classList.add("hidden");
  });

  // Add active state to selected option
  button.classList.remove("border-gray-200");
  button.classList.add("border-purple-400");
  button.classList.remove("text-gray-700");
  button.style.color = "var(--primary-color)";
  const checkmark = button.querySelector(".checkmark");
  if (checkmark) checkmark.classList.remove("hidden");
}



let translations = {};

async function loadTranslations(lang) {
  if (lang === "ar") {
    translations = {};
    localStorage.removeItem("appLanguage");
    return; // إيقاف الدالة
  }
  const response = await fetch(`lang/${lang}.json`);
  translations = await response.json();
  updatePlaceholders();
  applyTranslations();
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!translations[key]) return; // ✅ لا تغيّر النص
    el.textContent = translations[key];
  });
}

function getTranslation(key, vars = {}) {
  let text = translations[key] || key;
  Object.keys(vars).forEach((k) => {
    text = text.replace(`{${k}}`, vars[k]);
  });
  return text;
}

function updatePlaceholders() {
  if (selectedLanguage === "ar") return; // لا تغيّر إذا العربية
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const translation = translations[key];
    if (!translation) return;
    if (el.tagName === "INPUT") {
      el.setAttribute("placeholder", translation);
    }
  });
}

function saveLanguage() {
  localStorage.setItem("appLanguage", selectedLanguage);
  document.documentElement.setAttribute(
    "dir",
    selectedLanguage === "ar" ? "rtl" : "ltr"
  );
  document.documentElement.setAttribute("lang", selectedLanguage);
  loadTranslations(selectedLanguage); // تحميل النصوص الجديدة
  const langNames = { ar: "العربية", en: "English", fr: "Français" };
  // نفترض أن loadTranslations ترجع Promise
  loadTranslations(selectedLanguage).then(() => {
    // توست آمن بعد تحميل الترجمات
    if (selectedLanguage === "ar") {
      showToast("تم حفظ اللغة");
    } else {
      showToast(getTranslation("toastLanguageSaved"));
    }
  });
  // إعادة تحميل الصفحة بعد 3 ثوانٍ (3000 مللي ثانية)
  setTimeout(() => {
    location.reload();
  }, 3000);
}

// تطبيق اللغة المحفوظة عند تحميل الصفحة
function applyLanguage() {
  const lang = localStorage.getItem("appLanguage") || "ar";
  selectedLanguage = lang;
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lang);
  // إضافة/إزالة كلاس ltr على الـ html حسب اللغة
  if (lang === "ar") {
    document.documentElement.classList.remove("ltr");
  } else if (lang === "fr" || lang === "en") {
    document.documentElement.classList.add("ltr");
  }
  setTimeout(() => {
    const langButtons = document.querySelectorAll(".language-option");
    const langs = ["ar", "en", "fr"];
    langButtons.forEach((btn, index) => {
      if (langs[index] === lang) selectLanguage(btn, lang);
    });
  }, 100);
  loadTranslations(lang); // تحميل النصوص للغة المحفوظة
}

function saveAppearance() {
  selectedFontSize =
    parseInt(document.getElementById("font-size-input").value) || 16;
  localStorage.setItem("appTheme", selectedTheme);
  localStorage.setItem("appColor", selectedColor);
  localStorage.setItem("appFontSize", selectedFontSize);
  applyTheme(selectedTheme);
  applyColor(selectedColor);
  document.documentElement.style.fontSize = selectedFontSize + "px";
  document.getElementById("font-size-input").value = selectedFontSize;
  const themeNames = {
    light: "فاتح",
    dark: "داكن",
    auto: "تلقائي",
  };
  const colorNames = {
    purple: "ارجواني",
    blue: "أزرق",
    green: "أخضر",
    orange: "برتقالي",
    pink: "وردي",
  };
  showToast(selectedLanguage === "ar" ? "تم حفظ المظهر" : getTranslation("toastAppearanceSaved"));
  setTimeout(() => {
    location.reload();
  }, 3000);
}

// Theme selection functionality
let selectedTheme = localStorage.getItem("appTheme") || "light";
let selectedFontSize = parseInt(localStorage.getItem("appFontSize")) || 14;
function selectTheme(button, theme) {
  selectedTheme = theme;
  // Remove active state from all theme options
  document.querySelectorAll(".theme-option").forEach((opt) => {
    opt.classList.remove("active");
    opt.classList.remove("border-purple-400");
    opt.classList.add("border-gray-200");
    const text = opt.querySelector(".theme-text");
    text.style.color = "";
    text.classList.add("text-gray-700");
  });
  // Add active state to selected option
  button.classList.add("active");
  button.classList.remove("border-gray-200");
  button.classList.add("border-purple-400");
  const text = button.querySelector(".theme-text");
  text.style.color = "var(--primary-color)";
  text.classList.remove("text-gray-700");
}

// Color selection functionality
let selectedColor = localStorage.getItem("appColor") || "purple";
function selectColor(button, color) {
  selectedColor = color;
  // Remove active state from all color options
  document.querySelectorAll(".color-option").forEach((opt) => {
    opt.classList.remove("active");
    opt.classList.remove(
      "border-purple-400",
      "border-blue-400",
      "border-green-400",
      "border-orange-400",
      "border-pink-400"
    );
    opt.classList.add("border-white");
  });
  // Add active state to selected option
  button.classList.add("active");
  button.classList.remove("border-white");
  const borderColors = {
    purple: "border-purple-400",
    blue: "border-blue-400",
    green: "border-green-400",
    orange: "border-orange-400",
    pink: "border-pink-400",
  };
  button.classList.add(borderColors[color]);
}

function applyTheme(theme) {
  document.body.classList.add("transition-color");
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
    document.documentElement.style.setProperty('--body-color', '#222222');
  } else if (theme === "light") {
    document.body.classList.remove("dark-mode");
    document.documentElement.style.setProperty('--body-color', '#F9FAFB');
  } else {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(isDark ? "dark" : "light");
  }
}

window.applyColor = function(color) {
  document.body.classList.add("transition-color");
  // إذا اختار المستخدم اللون البنفسجي، ارجع للون الأصلي
  if (color === "purple") {
    localStorage.removeItem("appColor");
    return; // إيقاف تنفيذ باقي الدالة
  }
  const colorGradients = {
    purple: "#5c0035",
    blue: "#0e307f",
    green: "#05702d",
    orange: "#8e2a00",
    pink: "#8e004f",
  };
  const secondaryGradients = {
    purple: "#fce4ec",
    blue: "#e0e7ff",
    green: "#dcfce7",
    orange: "#ffedd5",
    pink: "#fce4ec",
  };
  const lightGradients = {
    purple: "#8e0052",
    blue: "#105fbe",
    green: "#008e3a",
    orange: "#c2410c",
    pink: "#be185d",
  };
  document.documentElement.style.setProperty(
    "--primary-color",
    colorGradients[color]
  );
  document.documentElement.style.setProperty(
    "--secondary-color",
    secondaryGradients[color]
  );
  document.documentElement.style.setProperty(
    "--light-color",
    lightGradients[color]
  );
}

function resetForm(container) {
  if (!container) return;
  container.querySelectorAll("input, textarea").forEach(el => {
    el.value = el.dataset.default ?? "";
  });
}

// Initialize app on page load
window.addEventListener("DOMContentLoaded", async () => {
  const savedTheme = localStorage.getItem("appTheme") || "light";
  const savedColor = localStorage.getItem("appColor") || "purple";
  const savedFontSize = parseInt(localStorage.getItem("appFontSize")) || 14;
  selectedTheme = savedTheme;
  selectedColor = savedColor;
  selectedFontSize = savedFontSize;
  applyTheme(savedTheme);
  applyColor(savedColor);
  document.documentElement.style.fontSize = savedFontSize + "px";
  const fontInput = document.getElementById("font-size-input");
  if (fontInput) {
    fontInput.value = savedFontSize;
  }
  const themes = ["light", "dark", "auto"];
  const themeButtons = document.querySelectorAll(".theme-option");
  themeButtons.forEach((btn, index) => {
    if (themes[index] === savedTheme) {
      selectTheme(btn, savedTheme);
    }
  });
  const colors = ["purple", "blue", "green", "orange", "pink"];
  const colorButtons = document.querySelectorAll(".color-option");
  colorButtons.forEach((btn, index) => {
    if (colors[index] === savedColor) {
      selectColor(btn, savedColor);
    }
  });
  applyLanguage();
  lazy();
  await checkAuthUI();
});

let settingsLoaded = false;
window.isSettingsOpen = false;
document.getElementById("open-settings-modal-btn").addEventListener("click", async () => {
  closeSidebar();
  if (!settingsLoaded) {
    const settingsModule = await import("./scripts/settings.js"); // تحميل الملف عند الحاجة
    settingsModule.initSettings(); // تنفيذ كل الكود
    settingsLoaded = true;
  }
});

window.isHelpOpen = false;
let currentHelpModal = null;
let currentHelpOverlay = null;
function closeHelpModal() {
  if (!isHelpOpen || !currentHelpOverlay || !currentHelpModal) return;

  currentHelpOverlay.style.opacity = '0';
  currentHelpOverlay.style.pointerEvents = 'none';
  currentHelpModal.style.transform = 'scale(0.95)';

  setTimeout(() => {
    currentHelpOverlay.remove();
    currentHelpOverlay = null;
    currentHelpModal = null;
    isHelpOpen = false;
  }, 300);

  enableScroll?.();
  if (currentPage === "home") {
    history.pushState({ page: 'home' }, "", "/");
  } else {
    history.pushState({ page: currentPage }, "", `/${currentPage}`);
  }
}

document.querySelectorAll('.open-help-modal-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    closeSidebar();
    const module = await import('./scripts/help-modal.js');
    module.openHelpModalFromTemplate();
  });
});
const privacyFooterBtn = document.querySelector('.help-privacy-btn');
const termsFooterBtn = document.querySelector('.help-terms-btn');
privacyFooterBtn?.addEventListener('click', async () => {
  const module = await import('./scripts/help-modal.js');
  module.openHelpModalFromTemplate('privacy');
});
termsFooterBtn?.addEventListener('click', async () => {
  const module = await import('./scripts/help-modal.js');
  module.openHelpModalFromTemplate('terms');
});

// Page mapping
const pages = {
  "home": document.getElementById("home-page"),
  "request-service": document.getElementById("request-service-page"),
  "find-job": document.getElementById("find-job-page"),
  "training": document.getElementById("training-page"),
  "forsaty-store": document.getElementById("forsaty-store-page"),
  "profile": document.getElementById("profile-page")
};

// Page titles (AR / EN / FR)
const pageTitles = {
  home: {
    ar: "",
    en: "",
    fr: "",
  },
  "request-service": {
    ar: "طلب خدمة",
    en: "Request Service",
    fr: "Demander un service",
  },
  "find-job": {
    ar: "البحث عن عمل",
    en: "Find Job",
    fr: "Trouver un emploi",
  },
  "training": {
    ar: "التدريب والتكوين",
    en: "Training",
    fr: "Formation",
  },
  "forsaty-store": {
    ar: "متجر فرصتي",
    en: "Forsaty Store",
    fr: "Boutique Forsaty",
  },
  "profile": {
    ar: "الملف الشخصي",
    en: "Profile",
    fr: "Profil",
  }
};

// toggle search
function toggleSearch(show) {
  searchActive = show;
  if (show) {
    mainHeader.classList.add("search-active");
    setTimeout(() => searchInput.focus(), 300);
    disableScroll();
  } else {
    mainHeader.classList.remove("search-active");
    searchInput.value = "";
    enableScroll();
  }
}

// Navigate to page
const loadedScripts = new Set(); // لتجنب تحميل السكريبتات الخارجية أكثر من مرة

async function navigateToPage(pageName) {
  if (!pages[pageName]) return;

  // تحميل الصفحة مرة واحدة
  if (pageName !== "home" && !pages[pageName].dataset.loaded) {
    try {
      const res = await fetch(`pages/${pageName}.html`);
      if (!res.ok) throw new Error("Fetch error");
      
      // إدراج HTML
      pages[pageName].innerHTML = await res.text();

      // التعامل مع السكريبتات
      const scripts = [...pages[pageName].querySelectorAll("script")];
      for (const oldScript of scripts) {
        if (oldScript.src) {
          if (!loadedScripts.has(oldScript.src)) {
            await new Promise(resolve => {
              const script = document.createElement("script");
              script.src = oldScript.src;
              script.onload = () => {
                loadedScripts.add(oldScript.src);
                resolve();
              };
              document.body.appendChild(script);
            });
          }
        } else {
          // السكريبتات الداخلية: نفذها بعد تحميل الصفحة
          const scriptContent = oldScript.textContent;
          const scriptEl = document.createElement("script");
          scriptEl.textContent = scriptContent;
          pages[pageName].appendChild(scriptEl);
        }
        oldScript.remove();
      }

      pages[pageName].dataset.loaded = "true";
    } catch (e) {
      console.error(e);
    }
  }

  // إخفاء كل الصفحات
  Object.values(pages).forEach(p => p?.classList.remove("active"));
  pages[pageName].classList.add("active");

  // إعداد العنوان والرأس
  const title =
    pageTitles?.[pageName]?.[selectedLanguage] ||
    pageTitles?.[pageName]?.ar ||
    "";
  if (pageName === "home") {
    headerLogo.classList.remove("hidden");
    headerTitle.classList.add("hidden");
    menuIcon.classList.remove("hidden");
    backIcon.classList.add("hidden");
    history.replaceState({ page: "home" }, null, "/");
  } else {
    headerLogo.classList.add("hidden");
    headerTitle.classList.remove("hidden");
    headerTitle.querySelector("h1").textContent = title;
    menuIcon.classList.add("hidden");
    backIcon.classList.remove("hidden");
    history.pushState({ page: pageName }, null, `/${pageName}`);
  }

  currentPage = pageName;

  if (sidebar.classList.contains("open")) toggleSidebar();
  if (searchActive) toggleSearch(false);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function lockScroll(ms = 300) {
  const y = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${y}px`;
  setTimeout(() => {
    document.body.style.position = "";
    document.body.style.top = "";
    window.scrollTo(0, y);
  }, ms);
}

let lastBack = 0;
window.addEventListener("popstate", () => {
  const now = Date.now();
  if (isLoginOpen) {
    window.closeLoginModal();
    return;
  }
  if (isSettingsOpen) {
    closeSettingsModal();
    return;
  }
  if (isHelpOpen) {
    closeHelpModal();
    return;
  }
  if (
    isWalletOpen ||
    isHistoryOpen ||
    isMessagesOpen ||
    isProOpen ||
    isPointsOpen
  ) {
    closeCurrentModal();
    return;
  }
  if (currentPage === "home") {
    if (now - lastBack < 1500) {
      return;
    } else {
      showToast("اضغط مرة أخرى للخروج");
      lockScroll();
      lastBack = now;
      history.pushState({ page: "home" }, "", "/");
    }
  } else {
    navigateToPage("home"); // العودة للصفحة الرئيسية
  }
});

window.isSidebarOpen = false;
function openSidebar() {
  sidebar.classList.add("open");
  sidebar.scrollTop = 0;
  sidebarOverlay.classList.add("active");
  isSidebarOpen = true;
  disableScroll();
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
  isSidebarOpen = false;
  enableScroll();
}

headerRightBtn.addEventListener("click", () => {
  if (currentPage === "home") {
    openSidebar();
  } else {
    navigateToPage("home");
  }
});

let touchStartX = null;
let touchStartY = null;
let touchMoved = false;
const swipeThreshold = 50; // المسافة المطلوبة للسحب

// يمكن السحب فقط إذا لا يوجد overlay ثابت أو أي نافذة مفتوحة
function canSwipeSidebar() {
  // تحقق إذا هناك overlay يمنع السحب
  const blockingOverlay = document.querySelectorAll(".use-dot, .use-doti, .select-overlay, .call-overlay, #splash");
  const isBlockingVisible = Array.from(blockingOverlay).some(
    el => !el.classList.contains("hidden") && el.style.display !== "none"
  );
  return !(
    isLoginOpen ||
    isSettingsOpen ||
    isHelpOpen ||
    isWalletOpen ||
    isHistoryOpen ||
    isMessagesOpen ||
    isProOpen ||
    isPointsOpen ||
    isSidebarOpen ||
    isBlockingVisible
  );
}
document.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchMoved = false;
});

document.addEventListener("touchmove", (e) => {
  if (touchStartX === null) return;

  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  // إذا الحركة أفقية أكثر من عمودية وبالمسافة المطلوبة
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
    touchMoved = true;
  }
});

document.addEventListener("touchend", (e) => {
  if (!touchMoved || touchStartX === null) {
    touchStartX = null;
    touchStartY = null;
    touchMoved = false;
    return;
  }

  const dir = getComputedStyle(document.body).direction;
  const endX = e.changedTouches[0].clientX;

  // السحب الأمامي → فتح Sidebar فقط إذا مغلق وتحقق canSwipeSidebar
  const forwardSwipe =
    (dir === "ltr" && endX - touchStartX > swipeThreshold) ||
    (dir === "rtl" && touchStartX - endX > swipeThreshold);

  if (forwardSwipe && !isSidebarOpen && canSwipeSidebar()) {
    openSidebar();
  }

  // السحب العكسي → إغلاق Sidebar فقط إذا مفتوح، **تجاهل overlay**
  const backwardSwipe =
    (dir === "ltr" && touchStartX - endX > swipeThreshold) ||
    (dir === "rtl" && endX - touchStartX > swipeThreshold);

  if (backwardSwipe && isSidebarOpen) {
    closeSidebar();
  }

  touchStartX = null;
  touchStartY = null;
  touchMoved = false;
});
sidebarOverlay.addEventListener("click", closeSidebar);
searchBtn.addEventListener("click", () => {
  toggleSearch(true);
});
const closeSearchBtn = document.getElementById("close-search-btn");
closeSearchBtn.addEventListener("click", () => {
  toggleSearch(false);
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      performSearch(searchTerm);
    }
  }
});

// البحث المباشر أثناء الكتابة
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.trim();
  if (searchTerm.length > 0) {
    performSearch(searchTerm);
  } else {
    hideSearchResults();
  }
});

// إخفاء البحث والنتائج عند الضغط خارجهما
document.addEventListener("click", (e) => {
  if (searchActive) {
    const searchBar = document.querySelector(".search-bar");
    const searchBtnElement = document.getElementById("search-btn");
    const resultsContainer = document.getElementById("search-results-container");
    // التحقق من أن الضغط ليس على مربع البحث أو النتائج أو زر البحث
    if (
      !searchBar.contains(e.target) &&
      e.target !== searchBtnElement &&
      !searchBtnElement.contains(e.target) &&
      (!resultsContainer || !resultsContainer.contains(e.target))
    ) {
      toggleSearch(false);
      hideSearchResults();
    }
  }
});

// قاعدة بيانات البحث
const searchDatabase = [
  // خدمات رقمية
  {
    id: 1,
    title: "البرمجة",
    category: "خدمة",
    section: "تطبيق، موقع، تطوير...",
    page: "request-service",
    icon: "code",
  },
  {
    id: 2,
    title: "السوشل ميديا",
    category: "خدمة",
    section: "فيسبوك، واتساب، تيكتوك...",
    page: "request-service",
    icon: "msg",
  },
  {
    id: 3,
    title: "الجرافيك",
    category: "خدمة",
    section: "صورة، ايقونة، فوطوشوب...",
    page: "request-service",
    icon: "design",
  },
  {
    id: 4,
    title: "الصوت والتعليق",
    category: "خدمة",
    section: "تعليق، دبلجة، موسيقى...",
    page: "request-service",
    icon: "voice",
  },
  {
    id: 5,
    title: "التسويق",
    category: "خدمة",
    section: "اعلانات، مواقع التواصل...",
    page: "request-service",
    icon: "marketing",
  },
  {
    id: 6,
    title: "المونتاج",
    category: "خدمة",
    section: "فديو",
    page: "request-service",
    icon: "video",
  },
  {
    id: 7,
    title: "الكتابة",
    category: "خدمة",
    section: "مقال، بحث، مذكرة، تدقيق...",
    page: "request-service",
    icon: "write",
  },
  {
    id: 8,
    title: "الترجمة",
    category: "خدمة",
    section: "فرنسية، انجليزية، عربية...",
    page: "request-service",
    icon: "translat",
  },
  // خدمات مهنية
  {
    id: 9,
    title: "الحدادة",
    category: "خدمة",
    section: "غيار، حديد، نحاس، المنيوم...",
    page: "request-service",
    icon: "iron",
  },
  {
    id: 10,
    title: "الكهرباء",
    category: "خدمة",
    section: "سلك، تيار، كهربائي...",
    page: "request-service",
    icon: "electric",
  },
  {
    id: 11,
    title: "السباكة",
    category: "خدمة",
    section: "انبوب، مياه، مسخن...",
    page: "request-service",
    icon: "plumbing",
  },
  {
    id: 12,
    title: "النجارة",
    category: "خدمة",
    section: "اثاث، قطع محددة...",
    page: "request-service",
    icon: "carpenter",
  },
  {
    id: 13,
    title: "التوصيل",
    category: "خدمة",
    section: "دراجة نارية، طاكسي، طرد...",
    page: "request-service",
    icon: "delivery",
  },
  {
    id: 14,
    title: "الدهان",
    category: "خدمة",
    section: "منزل، سيارة، اثاث، طلاء...",
    page: "request-service",
    icon: "paint",
  },
  {
    id: 15,
    title: "الميكانيك",
    category: "خدمة",
    section: "عطل، سيارة، الة...",
    page: "request-service",
    icon: "mikanic",
  },
  {
    id: 16,
    title: "التكييف",
    category: "خدمة",
    section: "مبرد، مدفاة، مسخن...",
    page: "request-service",
    icon: "condit",
  },
  {
    id: 17,
    title: "الحلاقة",
    category: "خدمة",
    section: "شعر، حيوان...",
    page: "request-service",
    icon: "shaving",
  },
  {
    id: 18,
    title: "البناء والترميم",
    category: "خدمة",
    section: "منزل، هدم، حائط، سقف...",
    page: "request-service",
    icon: "building",
  },
  {
    id: 19,
    title: "صيانة الاجهزة",
    category: "خدمة",
    section: "هاتف، حاسوب، تلفاز...",
    page: "request-service",
    icon: "repar",
  },
  {
    id: 20,
    title: "التصوير",
    category: "خدمة",
    section: "كاميرا، مناسبة، حفل...",
    page: "request-service",
    icon: "photo",
  },
  // خدمات منزلية
  {
    id: 21,
    title: "التنظيف",
    category: "خدمة",
    section: "سيارة، تنظيف معمق، اوساخ...",
    page: "request-service",
    icon: "clean",
  },
  {
    id: 22,
    title: "الطهو",
    category: "خدمة",
    section: "مناسبة، حلويات، اكل، طبخ...",
    page: "request-service",
    icon: "cooking",
  },
  {
    id: 23,
    title: "الرعاية",
    category: "خدمة",
    section: "اطفال، كبار السن، حيوان...",
    page: "request-service",
    icon: "love",
  },
  {
    id: 24,
    title: "البستنة",
    category: "خدمة",
    section: "حديقة، اشجار، غرس، سقي...",
    page: "request-service",
    icon: "planting",
  },
  {
    id: 25,
    title: "الصيانة",
    category: "خدمة",
    section: "اجهزة كهربائية، مكيفات...",
    page: "request-service",
    icon: "mikanic",
  },
  {
    id: 26,
    title: "الغسيل",
    category: "خدمة",
    section: "سيارة، ملابس، افرشة...",
    page: "request-service",
    icon: "wash",
  },
  {
    id: 27,
    title: "التسوق",
    category: "خدمة",
    section: "شراء، بقالة، سوق...",
    page: "request-service",
    icon: "market",
  },
  {
    id: 28,
    title: "الامن والمراقبة",
    category: "خدمة",
    section: "حماية، أمن، كاميرات...",
    page: "request-service",
    icon: "security",
  },
  {
    id: 29,
    title: "الديكور والاثاث",
    category: "خدمة",
    section: "ترتيب، حمل، تقسيم، تزيين...",
    page: "request-service",
    icon: "dicor",
  },
  {
    id: 30,
    title: "مكافحة الحشرات",
    category: "خدمة",
    section: "حيوانات ضارة، افاعي، فئران...",
    page: "request-service",
    icon: "insect",
  },
  // خدمات اخرى
  {
    id: 31,
    title: "التعليم",
    category: "خدمة",
    section: "دراسة، دروس عن بعد...",
    page: "request-service",
    icon: "learn",
  },
  {
    id: 32,
    title: "الاستشارة",
    category: "خدمة",
    section: "طبية، نفسية، ادارية، نصيحة...",
    page: "request-service",
    icon: "consul",
  },
  {
    id: 33,
    title: "الادارة",
    category: "خدمة",
    section: "تنظيم، تخطيط، مناسبة، حفل...",
    page: "request-service",
    icon: "admin",
  },
  {
    id: 34,
    title: "الكراء",
    category: "خدمة",
    section: "سيارة، الة، مركبة، منزل...",
    page: "request-service",
    icon: "rental",
  },
  // وظائف
  {
    id: 35,
    title: "مطور ويب",
    category: "وظيفة",
    section: "شركة التقنية الحديثة",
    page: "find-job",
    icon: "job",
  },
  {
    id: 36,
    title: "مصمم جرافيك",
    category: "وظيفة",
    section: "وكالة الابداع الرقمي",
    page: "find-job",
    icon: "job",
  },
  {
    id: 37,
    title: "مدير مبيعات",
    category: "وظيفة",
    section: "شركة التسويق المتقدم",
    page: "find-job",
    icon: "job",
  },
  {
    id: 38,
    title: "كاتب محتوى",
    category: "وظيفة",
    section: "منصة المحتوى الابداعي",
    page: "find-job",
    icon: "job",
  },
  // دورات تدريبية
  {
    id: 39,
    title: "تطوير تطبيقات الويب الحديثة",
    category: "تكوين",
    section: "البرمجة",
    page: "training",
    icon: "course",
  },
  {
    id: 40,
    title: "التصميم الجرافيكي المتقدم",
    category: "تكوين",
    section: "الجرافيك",
    page: "training",
    icon: "course",
  },
  {
    id: 41,
    title: "التسويق الرقمي الشامل",
    category: "تكوين",
    section: "التسويق",
    page: "training",
    icon: "course",
  },
  {
    id: 42,
    title: "تطوير تطبيقات الموبايل",
    category: "تكوين",
    section: "البرمجة",
    page: "training",
    icon: "course",
  },
  {
    id: 43,
    title: "الامن السيبراني",
    category: "تكوين",
    section: "البرمجة",
    page: "training",
    icon: "course",
  },
  {
    id: 44,
    title: "انتاج الموسيقى الرقمية",
    category: "تكوين",
    section: "الصوت والتعليق",
    page: "training",
    icon: "course",
  },
];

// الحصول على الأيقونة المناسبة
function getIcon(iconType) {
  const icons = {
    code: '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>',
    msg: '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/></svg>',
    design:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>',
    voice:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>',
    marketing:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>',
    video:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>',
    write:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>',
    translat:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>',
    clean:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>',
    electric:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
    plumbing:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>',
    carpenter:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
    cooking:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>',
    iron: '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>',
    delivery:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>',
    paint:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>',
    mikanic:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',
    condit:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
    building:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
    shaving:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/></svg>',
    repar:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
    photo:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',
    love: '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>',
    planting:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>',
    wash: '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
    market:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>',
    security:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
    dicor:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2 6h28v20H2V6zm2 2v16h24V8H4zm2 2h20v2H6v-2zm0 4h20v2H6v-2zm0 4h20v2H6v-2z"/></svg>',
    insect:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 2c-1.1 0-2 .9-2 2v1H7l-2-2-1.5 1.5L7 6H4c-1.1 0-2 .9-2 2v1h5v2H2v1c0 1.1.9 2 2 2h3v3c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-3h3c1.1 0 2-.9 2-2v-1h-5v-2h5V8c0-1.1-.9-2-2-2h-3l3.5-3.5L17 3l-2 2h-2V4c0-1.1-.9-2-2-2h-4z"/></svg>',
    learn:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
    consul:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>',
    admin:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
    rental:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>',
    job: '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
    course:
      '<svg class="w-6 h-6" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /> <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/></svg>',
  };
  return icons[iconType] || icons.job;
}

// وظيفة البحث
function performSearch(searchTerm) {
  const results = searchDatabase.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  displaySearchResults(results, searchTerm);
}

// عرض نتائج البحث
function displaySearchResults(results, searchTerm) {
  let existingResults = document.getElementById("search-results-container");
  if (existingResults) {
    existingResults.remove();
  }

  if (results.length === 0) {
    showNoResults(searchTerm);
    return;
  }

  const resultsContainer = document.createElement("div");
  resultsContainer.id = "search-results-container";
  resultsContainer.className =
    "fixed bg-white shadow-2xl overflow-y-auto z-30 border-t-2";
  resultsContainer.style.top = mainHeader.offsetHeight + "px";
  resultsContainer.style.maxHeight = "100%";
  resultsContainer.style.borderTopColor = "var(--primary-color)";
  resultsContainer.style.width = "100%";

  const header = document.createElement("div");
  header.className = "flex p-4 border-b-2 border-primary-200";
  header.innerHTML = `
    <h3 class="mx-auto text-xl font-bold" style="color: var(--primary-color); margin-left:30%;">نتائج البحث (${results.length})</h3>
    `;

  const resultsList = document.createElement("div");
  resultsList.className = "p-2";

  // تجميع النتائج حسب الفئة
  const groupedResults = {
    خدمة: [],
    وظيفة: [],
    تكوين: [],
  };

  results.forEach((result) => {
    groupedResults[result.category].push(result);
  });

  // عرض النتائج مجمعة
  Object.keys(groupedResults).forEach((category) => {
    if (groupedResults[category].length > 0) {
      const categorySection = document.createElement("div");
      categorySection.className = "mb-3";

      groupedResults[category].forEach((result) => {
        const resultItem = document.createElement("div");
        resultItem.className =
          "bg-gradient-to-br from-purple-50 to-white rounded-xl p-2 mb-1 border-2 border-primary-200 hover:border-primary-400 transition-all cursor-pointer hover:shadow-lg";

        resultItem.innerHTML = `
    <div class="flex items-center gap-2">
    <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: var(--secondary-color);">
    ${getIcon(result.icon)}
    </div>
    <div class="flex-1">
    <h5 class="text-lg font-black text-gray-800">${result.title}</h5>
    <p class="text-sm text-gray-600 font-semibold">${result.section}</p>
    </div>
    <div class="px-3 py-1 rounded-full text-xs font-bold text-white" style="background-color: var(--primary-color)">
    ${result.category}
    </div>
    </div>
    `;

        resultItem.addEventListener("click", () => {
          hideSearchResults();
          toggleSearch(false);
          if (pages[result.page]) {
            navigateToPage(result.page);
            // الانتظار حتى يتم تحميل الصفحة ثم التمرير إلى العنصر
            setTimeout(() => {
              scrollToServiceItem(result.title);
            }, 800);
            setTimeout(() => {
              scrollToJobItem(result.title);
            }, 800);
            setTimeout(() => {
              scrollToTrainingItem(result.title);
            }, 800);
          }
        });

        categorySection.appendChild(resultItem);
      });

      resultsList.appendChild(categorySection);
    }
  });

  resultsContainer.appendChild(header);
  resultsContainer.appendChild(resultsList);
  document.body.appendChild(resultsContainer);

  setTimeout(() => {
    document.addEventListener("click", handleClickOutsideResults);
  }, 100);
}

// إغلاق النتائج
  const closeBtn = document.querySelector("#close-search-btn");
  closeBtn.addEventListener("click", hideSearchResults);

// عرض رسالة عدم وجود نتائج
function showNoResults(searchTerm) {
  let existingResults = document.getElementById("search-results-container");
  if (existingResults) {
    existingResults.remove();
  }

  const resultsContainer = document.createElement("div");
  resultsContainer.id = "search-results-container";
  resultsContainer.className =
    "fixed bg-white shadow-2xl z-30 border-t-2";
  resultsContainer.style.top = mainHeader.offsetHeight + "px";
  resultsContainer.style.borderTopColor = "var(--primary-color)";
  resultsContainer.style.height = "100%";
  resultsContainer.style.width = "100%";
  resultsContainer.innerHTML = `
    <div class="p-20 text-center">
    <div class="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style="background-color: var(--secondary-color);">
    <svg class="w-10 h-10" style="color: var(--primary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
    </div>
    <h3 class="text-2xl font-black mb-3" style="color: var(--primary-color)" data-i18n="noResults">لا توجد نتائج</h3>
    <p class="text-gray-600 font-semibold" data-i18n="noResultsDesc">لم نجد أي نتائج مطابقة لـ <span>"${searchTerm}"</span></p>
    </div>
    `;
    applyLanguage();
  document.body.appendChild(resultsContainer);
  setTimeout(() => {
    document.addEventListener("click", handleClickOutsideResults);
  }, 100);
}

// إخفاء نتائج البحث
function hideSearchResults() {
  const existingResults = document.getElementById("search-results-container");
  if (existingResults) {
    existingResults.remove();
  }
  document.removeEventListener("click", handleClickOutsideResults);
}

// التعامل مع الضغط خارج النتائج
function handleClickOutsideResults(e) {
  const resultsContainer = document.getElementById("search-results-container");
  const searchBar = document.querySelector(".search-bar");
  if (
    resultsContainer &&
    !resultsContainer.contains(e.target) &&
    !searchBar.contains(e.target)
  ) {
    hideSearchResults();
  }
}

// وظيفة التمرير إلى الخدمة المحددة
function scrollToServiceItem(serviceTitle) {
  // البحث عن جميع عناصر الخدمات
  const serviceItems = document.querySelectorAll(".service-item h4");
  for (let item of serviceItems) {
    if (item.textContent === serviceTitle) {
      const serviceCard = item.closest(".service-item");
      if (serviceCard) {
        // التمرير بسلاسة إلى العنصر
        serviceCard.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // إضافة تأثير بصري للتركيز على العنصر
        serviceCard.style.animation = "pulse 1.5s ease-in-out";
        serviceCard.style.transform = "scale(1.05)";
        setTimeout(() => {
          serviceCard.style.transform = "scale(1)";
        }, 1500);
        break;
      }
    }
  }
}

// وظيفة التمرير إلى الوظيفة المحددة
function scrollToJobItem(jobTitle) {
  // البحث عن جميع عناصر الوظائف
  const jobItems = document.querySelectorAll(".job-item h4");
  for (let item of jobItems) {
    if (item.textContent === jobTitle) {
      const jobCard = item.closest(".job-item");
      if (jobCard) {
        // التمرير بسلاسة إلى العنصر
        jobCard.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // إضافة تأثير بصري للتركيز على العنصر
        jobCard.style.animation = "pulse 1.5s ease-in-out";
        jobCard.style.transform = "scale(1.05)";
        setTimeout(() => {
          jobCard.style.transform = "scale(1)";
        }, 1500);
        break;
      }
    }
  }
}

// وظيفة التمرير إلى الدورة المحددة
function scrollToTrainingItem(trainingTitle) {
  // البحث عن جميع عناصر الدورات
  const trainingItems = document.querySelectorAll(".training-item h5");
  for (let item of trainingItems) {
    if (item.textContent === trainingTitle) {
      const trainingCard = item.closest(".training-item");
      if (trainingCard) {
        // التمرير بسلاسة إلى العنصر
        trainingCard.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // إضافة تأثير بصري للتركيز على العنصر
        trainingCard.style.animation = "pulse 1.5s ease-in-out";
        trainingCard.style.transform = "scale(1.05)";
        setTimeout(() => {
          trainingCard.style.transform = "scale(1)";
        }, 1500);
        break;
      }
    }
  }
}

// Header scroll hide/show functionality
window.addEventListener("scroll", () => {
  const currentScrollY = window.scrollY;
  if (currentScrollY > lastScrollY && currentScrollY > 100) {
    header.classList.add("header-hidden");
  } else {
    header.classList.remove("header-hidden");
  }
  lastScrollY = currentScrollY;
});

// Section card navigation
const sectionCards = document.querySelectorAll("[data-page]");
sectionCards.forEach((card) => {
  card.addEventListener("click", () => {
    const targetPage = card.getAttribute("data-page");
    if (!targetPage) return;
    const spinner = document.getElementById("global-spinner");
    spinner.classList.add("use-dot");
    spinner.classList.remove("hidden");
    spinner.style.top = "0";
    spinner.style.left = "0";
    spinner.style.transform = "none";
    showOverlay();
    disableScroll();
    navigateToPage(targetPage).finally(() => {
      setTimeout(() => {
        spinner.classList.add("hidden");
        spinner.classList.remove("use-dot");
        hideOverlay();
        enableScroll();
      }, 2000);
    });
  });
});

// Helper function to show messages
function showMessage(title, message) {
  const messageOverlay = document.createElement("div");
  messageOverlay.className =
    "fixed inset-0 bg-black/50 z-50 flex items-center justify-center";
  messageOverlay.style.width = "100%";

  const messageBox = document.createElement("div");
  messageBox.className = "bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl";

  messageBox.innerHTML = `
    <div class="text-center">
    <div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style="background-color: var(--primary-color);">
    <svg class="w-8 h-8" style="color: var(--secondary-color)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
    </svg>
    </div>
    <h3 class="text-2xl font-black mb-3" style="color: var(--primary-color)">${title}</h3>
    <p class="text-gray-600 font-semibold mb-6">${message}</p>
    <button id="close-message" class="w-full font-bold py-4 px-6 rounded-xl transition-all shadow-sm text-center text-white" style="background-color: var(--primary-color);">
    موافق
    </button>
    </div>
    `;

  messageOverlay.appendChild(messageBox);
  document.body.appendChild(messageOverlay);

  const closeBtn = messageBox.querySelector("#close-message");
  closeBtn.addEventListener("click", () => {
    messageOverlay.remove();
  });

  messageOverlay.addEventListener("click", (e) => {
    if (e.target === messageOverlay) {
      messageOverlay.remove();
    }
  });
}

async function showSidebarModal(name) {
  closeSidebar();
  let template;
  const wrapper = document.createElement("div");
  if (!document.querySelector(".template-overlay")) {
    const res = await fetch("/modals/mini-templates.html");
    const html = await res.text();
    wrapper.innerHTML = html;
    const templateId = "modal-" + name;
    template = wrapper.querySelector(`#${templateId}`);
    if (!template) {
      console.warn("Template not found:", templateId);
      return;
    }
    wrapper.innerHTML = "";
    wrapper.appendChild(template.content.cloneNode(true));
  }
  const modalOverlay = document.createElement("div");
  modalOverlay.className =
    "template-overlay fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 opacity-0";
  modalOverlay.style.transition = "opacity 0.3s ease";
  const modalBox = document.createElement("div");
  modalBox.className =
    "bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden overflow-y-auto transform transition-all";
  modalBox.style.maxHeight = "90vh";
  modalBox.style.transform = "translateY(-20px) scale(0.95)";
  modalBox.style.opacity = "0";
  modalBox.style.transition = "all 0.3s ease-out";
  modalBox.appendChild(wrapper);
  modalOverlay.appendChild(modalBox);
  document.body.appendChild(modalOverlay);
  requestAnimationFrame(() => {
    modalOverlay.style.opacity = "1";
    modalBox.style.transform = "translateY(0) scale(1)";
    modalBox.style.opacity = "1";
  });
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay || e.target.closest(".modal-close-x")) {
      modalOverlay.style.opacity = "0";
      modalBox.style.transform = "translateY(-20px) scale(0.95)";
      modalBox.style.opacity = "0";
      closeAllModalsState();
      history.pushState(
        { page: currentPage },
        "",
        currentPage === "home" ? "/" : `/${currentPage}`
      );
      setTimeout(() => {
        modalOverlay.remove();
        enableScroll();
      }, 300);
    }
  });
}
window.isWalletOpen  = false;
window.isHistoryOpen = false;
window.isMessagesOpen = false;
window.isProOpen     = false;
window.isPointsOpen  = false;
function showWalletModal() {
  setTimeout(() => { checkAuthUI();  }, 100);
  closeAllModalsState();
  isWalletOpen = true;
  history.pushState({ modal: "wallet" }, "", "/wallet");
  showSidebarModal("wallet");
}
function showHistoryModal() {
  closeAllModalsState();
  isHistoryOpen = true;
  history.pushState({ modal: "history" }, "", "/history");
  showSidebarModal("history");
}
function showMessagesModal() {
  closeAllModalsState();
  isMessagesOpen = true;
  history.pushState({ modal: "messages" }, "", "/messages");
  showSidebarModal("messages");
}
function showProModal() {
  closeAllModalsState();
  isProOpen = true;
  history.pushState({ modal: "pro" }, "", "/pro");
  showSidebarModal("pro");
}
function showPointsModal() {
  closeAllModalsState();
  isPointsOpen = true;
  history.pushState({ modal: "points" }, "", "/points");
  showSidebarModal("points");
}
function closeAllModalsState() {
  isWalletOpen  = false;
  isHistoryOpen = false;
  isMessagesOpen = false;
  isProOpen     = false;
  isPointsOpen  = false;
}
document.querySelector(".open-wallet-modal-btn")
  ?.addEventListener("click", showWalletModal);
document.querySelector(".open-history-modal-btn")
  ?.addEventListener("click", showHistoryModal);
document.querySelector(".open-messages-modal-btn")
  ?.addEventListener("click", showMessagesModal);
document.querySelector(".open-pro-modal-btn")
  ?.addEventListener("click", showProModal);
document.querySelector(".open-points-modal-btn")
  ?.addEventListener("click", showPointsModal);
function closeCurrentModal() {
  const modalOverlay = document.querySelector(".template-overlay");
  if (modalOverlay) modalOverlay.remove();
  enableScroll();
  closeAllModalsState();
  if (currentPage === "home") {
    history.pushState({ page: 'home' }, "", "/");
  } else {
    history.pushState({ page: currentPage }, "", `/${currentPage}`);
  }
}
const UNIFIED_WIDTH = 80;

/* ---------- Overlay ---------- */
const overlay = document.createElement('div');
overlay.className = 'select-overlay fixed inset-0 z-20 hidden';
document.body.appendChild(overlay);

/* ---------- Helpers ---------- */
const qs  = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];

function closeAll() {
  qsa('.custom-select-options').forEach(el => el.classList.add('hidden'));
  qsa('.custom-select-arrow').forEach(a => a.style.transform = 'rotate(180deg)');
  overlay.classList.add('hidden');
  enableScroll();
}

/* ---------- Main Init ---------- */
function initCustomSelect(select) {
  if (select.dataset.customized) return;
  select.dataset.customized = "1";

  select.style.display = 'none';

  const wrapper = document.createElement('div');
  wrapper.className = 'relative inline-flex';
  select.before(wrapper);
  wrapper.appendChild(select);

  const button = document.createElement('div');
  button.className =
    'custom-select-btn mx-1 px-2 py-3 whitespace-nowrap border border-gray-600 bg-primary-200 rounded-xl flex justify-between items-center gap-2 cursor-pointer font-bold text-sm text-[var(--primary-color)] dark:text-[var(--light-color)] transition-all';
  button.innerHTML = `
    <span>${select.options[0]?.text || ''}</span>
    <span class="custom-select-arrow -mx-1 transition-transform rotate-180 duration-300">
      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
    </span>
  `;
  wrapper.appendChild(button);

  const list = document.createElement('div');
  list.className =
    'custom-select-options absolute bg-white py-1 border border-gray-200 rounded-xl shadow-md hidden z-30';
  Object.assign(list.style, {
    minWidth: UNIFIED_WIDTH + 'px',
    maxHeight: '200px',
    overflowY: 'auto'
  });
  document.body.appendChild(list);

  /* ----- Create Options ----- */
  [...select.options].slice(1).forEach(opt => {
    if (!opt.text) return;

    const item = document.createElement('div');
    item.className =
      'p-3 cursor-pointer text-gray-600 sm:hover:px-5 text-sm font-bold';
    item.textContent = opt.text;

    item.onclick = () => {
      qs('span', button).textContent = opt.text;
      select.value = opt.value || opt.text;

      qsa('div', list).forEach(el => {
        el.classList.remove('text-[var(--light-color)]');
        el.classList.add('text-gray-600');
      });

      item.classList.remove('text-gray-600');
      item.classList.add('text-[var(--light-color)]');

      closeAll();
    };

    list.appendChild(item);
  });

  /* ----- Toggle ----- */
  button.onclick = e => {
    e.stopPropagation();

    const open = !list.classList.contains('hidden');
    closeAll();
    if (open) return;

    disableScroll();

    const rect = button.getBoundingClientRect();
    const rtl  = getComputedStyle(button).direction === 'rtl';

    let left = rtl ? rect.right - UNIFIED_WIDTH : rect.left;
    left = Math.min(Math.max(left, 5), window.innerWidth - UNIFIED_WIDTH - 5);

    Object.assign(list.style, {
      top: rect.bottom + window.scrollY + 'px',
      left: left + window.scrollX + 'px'
    });

    list.classList.remove('hidden');
    qs('.custom-select-arrow', button).style.transform = 'rotate(90deg)';
    overlay.classList.remove('hidden');
  };
}

/* ---------- Global Listeners ---------- */
overlay.onclick = closeAll;

document.addEventListener('click', e => {
  if (!e.target.closest('.custom-select-btn') &&
      !e.target.closest('.custom-select-options')) {
    closeAll();
  }
}, true);

/* ---------- Init Existing ---------- */
qsa('select').forEach(initCustomSelect);

/* ---------- Observe DOM ---------- */
new MutationObserver(m => {
  m.forEach(r =>
    r.addedNodes.forEach(n => {
      if (n.tagName === 'SELECT') initCustomSelect(n);
      if (n.querySelectorAll)
        qsa('select', n).forEach(initCustomSelect);
    })
  );
}).observe(document.body, { childList: true, subtree: true });