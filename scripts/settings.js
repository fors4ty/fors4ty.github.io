export async function initSettings(view = "main") {
  if (!document.getElementById("settings-modal-overlay")) {
  const res = await fetch("/modals/settings.html");
  applyLanguage();
  const html = await res.text();
  const temp = document.createElement("div");
  temp.innerHTML = html;
  document.body.appendChild(temp);
  await checkAuthUI();
}
// Settings Modal Management (نفس أسلوب نافذة الدخول)
const settingsModalOverlay = document.getElementById("settings-modal-overlay");
const settingsModal = document.getElementById("settings-modal");
const openSettingsModalBtn = document.getElementById("open-settings-modal-btn");
const closeSettingsModalBtn = document.getElementById("close-settings-modal");
const backSettingsModalBtn = document.getElementById("back-settings-modal");
const settingsModalTitle = document.getElementById("settings-modal-title");

// الشاشات الفرعية (تأكد أن الـ IDs موجودة في HTML)
const mainSettingsScreen = document.getElementById("settings-main-menu");
const accountSettingsScreen = document.getElementById(
  "account-settings-screen"
);
const notificationSettingsScreen = document.getElementById(
  "notification-settings-screen"
);
const privacySettingsScreen = document.getElementById(
  "privacy-settings-screen"
);
const languageSettingsScreen = document.getElementById(
  "language-settings-screen"
);
const appearanceSettingsScreen = document.getElementById(
  "appearance-settings-screen"
);

// أزرار فتح الأقسام (إن وجدت)
const openAccountSettingsBtn = document.getElementById("open-account-settings");
const openNotificationSettingsBtn = document.getElementById(
  "open-notification-settings"
);
const openPrivacySettingsBtn = document.getElementById("open-privacy-settings");
const openLanguageSettingsBtn = document.getElementById(
  "open-language-settings"
);
const openAppearanceSettingsBtn = document.getElementById(
  "open-appearance-settings"
);

let currentSettingsView = "main"; // 'main', 'account', 'notifications', 'privacy', 'language', 'appearance'

// خريطة الشاشات والعناوين (استخدمها في showSettingsView)
const settingsScreens = {
  main: mainSettingsScreen,
  account: accountSettingsScreen,
  notifications: notificationSettingsScreen,
  privacy: privacySettingsScreen,
  language: languageSettingsScreen,
  appearance: appearanceSettingsScreen,
};

const settingsTitles = {
  main: "الإعدادات",
  account: "الحساب",
  notifications: "الإشعارات",
  privacy: "الأمان",
  language: "اللغة",
  appearance: "المظهر",
};

function openSettingsModal() {
  if (!settingsModalOverlay || !settingsModal) return;
  settingsModalOverlay.classList.remove("pointer-events-none", "opacity-0");
  settingsModalOverlay.classList.add("opacity-100");
  settingsModal.classList.remove("scale-95");
  settingsModal.classList.add("scale-100");
  closeSidebar();
  isSettingsOpen = true;
  showSettingsView("main");
}

// غلق نافذة الإعدادات
window.closeSettingsModal = function() {
  if (!settingsModalOverlay || !settingsModal) return;
  settingsModalOverlay.classList.add("pointer-events-none", "opacity-0");
  settingsModalOverlay.classList.remove("opacity-100");
  settingsModal.classList.add("scale-95");
  settingsModal.classList.remove("scale-100");
  enableScroll();
  isSettingsOpen = false;
  if (currentPage === "home") {
    history.pushState({ page: 'home' }, "", "/");
  } else {
    history.pushState({ page: currentPage }, "", `/${currentPage}`);
  }
}

let selectedIcon = null;
let uploadedImage = null;
let profileOverlay = null;
let iconsGrid = null;
const icons = [
  'fa-user','fa-user-tie','fa-user-graduate',
  'fa-user-astronaut','fa-user-ninja','fa-user-secret',
  'fa-user-circle','fa-smile','fa-heart'
];
const profilePreview = document.getElementById('profile-preview');
const chooseNewPhotoInput = document.getElementById('photo-upload-input');
document.getElementById('avatar-btn').addEventListener('click', () => {
  if (!profileOverlay) {
    profileOverlay = document.createElement('div');
    profileOverlay.id = 'profile-overlay';
    profileOverlay.className = 'fixed inset-0 flex items-center justify-center z-[100]';
    profileOverlay.innerHTML = `
      <div class="bg-black/50 rounded-2xl p-4 w-[70%] max-w-md"
           style="box-shadow: 0 0 20px 20px rgba(0,0,0,0.5); animation: slideDown 0.3s ease;">
        <div id="icons-grid" class="grid grid-cols-3 gap-3"></div>
      </div>
    `;
    document.body.appendChild(profileOverlay);
    iconsGrid = profileOverlay.querySelector('#icons-grid');
    profileOverlay.addEventListener('click', e => {
      if (e.target === profileOverlay) {
        profileOverlay.remove();
        profileOverlay = null;
      }
    });
    icons.forEach(icon => {
      const div = document.createElement('div');
      div.className =
        'p-4 cursor-pointer flex items-center justify-center hover-opacity';
      div.innerHTML = `<i class="fas ${icon} text-5xl text-gray-200"></i>`;
      div.onclick = () => selectIcon(icon);
      iconsGrid.appendChild(div);
    });
  } else {
    document.body.appendChild(profileOverlay);
  }
});
document.getElementById('upload-btn').addEventListener('click', () => {
  chooseNewPhotoInput.click();
});
chooseNewPhotoInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    uploadedImage = reader.result;
    selectedIcon = null;
    profilePreview.innerHTML = `
      <img src="${uploadedImage}" class="w-full h-full rounded-full object-cover">
    `;
  };
  reader.readAsDataURL(file);
});

function selectIcon(icon) {
  selectedIcon = icon;
  uploadedImage = null;
  chooseNewPhotoInput.value = '';
  profilePreview.innerHTML = `
    <i class="fas ${icon}"></i>
  `;
  profileOverlay.remove();
  profileOverlay = null;
}
document.getElementById('save-profile').addEventListener('click', async () => {
  const avatar = document.querySelector('.user-avatar');
  const nameInput = document.getElementById('change-name');
  const emailInput = document.getElementById('change-email');
  const phoneInput = document.getElementById('change-phone');
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const currentUser = await checkAuth();
  const currentAvatar = currentUser.avatar;
  let avatarChanged = false;
  if (chooseNewPhotoInput.files.length > 0) {
    avatarChanged = true;
  } else if (selectedIcon && selectedIcon !== currentAvatar) {
    avatarChanged = true;
  }
  if ( name === currentUser.name && email === currentUser.email && phone === currentUser.phone && !avatarChanged) {
    showToast("لم تتغير أي بيانات للحفظ");
    return;
  }
  if (!avatar) return;
  if (chooseNewPhotoInput.files.length > 0) {
    const file = chooseNewPhotoInput.files[0];
    const reader = new FileReader();
    reader.onload = e => {
      avatar.innerHTML = `<img src="${e.target.result}" class="w-full h-full rounded-full object-cover">`;
    };
    reader.readAsDataURL(file);
  } else if (selectedIcon) {
    avatar.innerHTML = `<i class="fas ${selectedIcon}"></i>`;
  }
  if (!isValidName(name)) { showToast("الإسم غير صالح"); return; }
  if (email && !isValidEmail(email)) { showToast("البريد الإلكتروني غير صالح"); return; }
  if (phone && !isValidPhone(phone)) { showToast("رقم الهاتف غير صالح"); return; }
  showToast("جاري حفظ التغييرات...");
  const formData = new FormData();
  formData.append('userID', currentUser.user_id);
  formData.append('name', name);
  formData.append('email', email);
  formData.append('phone', phone);
  if (chooseNewPhotoInput.files.length > 0) {
    const file = chooseNewPhotoInput.files[0];
    formData.append('avatar_image', file);
  } else if (selectedIcon && selectedIcon !== currentAvatar) {
    formData.append('avatar_icon', selectedIcon);
  }
  try {
  const response = await fetch('http://localhost:3000/update-user', {
    method: 'POST',
    body: formData
  });
  const data = await response.json();
  if (data.success) {
    showToast("تم تحديث البيانات بنجاح!");
    closeSettingsModal();
    setTimeout(() => location.reload(), 2000);
  } else {
    showToast(data.message || "خطأ غير معروف");
  }
} catch (err) {
  console.error(err);
  showToast("خطأ في الاتصال بالسيرفر");
}
});

async function fillUserInputs() {
  const currentUser = await checkAuth();
  const inputs = document.querySelectorAll("#change-name, #change-email, #change-phone");
  inputs.forEach(s => {
    switch(s.id) {
      case "change-name":
        s.value = currentUser.name || '';
        break;
      case "change-email":
        s.value = currentUser.email || '';
        break;
      case "change-phone":
        s.value = currentUser.phone || '';
        break;
    }
    if (!s.dataset.default) s.dataset.default = s.value;
  });
}

function showSettingsView(view) {
  currentSettingsView = view;
  Object.values(settingsScreens).forEach((screen) => {
    if (screen) screen.classList.add("hidden");
  });
  const target = settingsScreens[view];
  if (!target) return;
  target.classList.remove("hidden");
  if (view === "account") { 
    resetForm(accountSettingsScreen);
    fillUserInputs();
    initPhoneFormatting(accountSettingsScreen);
  };
  if (view === "main") {
    const sidebarBtnText =
      openSettingsModalBtn.querySelector("span").textContent ||
      openSettingsModalBtn.textContent;
    settingsModalTitle.textContent = sidebarBtnText.trim();
    closeSettingsModalBtn.classList.remove("hidden");
    backSettingsModalBtn.classList.add("hidden");
    restoreAppliedLanguage();
    restoreAppliedSettings();
    history.pushState({ auth: 'settings' }, '', 'settings');
  } else {
    const h4 = target.querySelector("h4");
    settingsModalTitle.textContent = h4 ? h4.textContent.trim() : "";
    closeSettingsModalBtn.classList.add("hidden");
    backSettingsModalBtn.classList.remove("hidden");
    history.pushState({ auth: view }, '', `/${view}-settings`);
  }
  settingsModal.scrollTop = 0;
}

function restoreAppliedLanguage() {
  const savedLang = localStorage.getItem("appLanguage") || "ar"; // القيمة المطبقة

  document.querySelectorAll(".language-option").forEach((opt) => {
    const lang = opt.getAttribute("onclick").match(/'(\w+)'/)[1]; // استخراج اللغة من onclick

    // إزالة الحالة النشطة
    opt.classList.remove("border-purple-400");
    opt.classList.add("border-gray-200");
    opt.classList.add("text-gray-700");
    opt.style.color = "";
    const checkmark = opt.querySelector(".checkmark");
    if (checkmark) checkmark.classList.add("hidden");

    // تفعيل الخيار المطبق
    if (lang === savedLang) {
      opt.classList.remove("border-gray-200");
      opt.classList.add("border-purple-400");
      opt.classList.remove("text-gray-700");
      opt.style.color = "var(--primary-color)";
      if (checkmark) checkmark.classList.remove("hidden");
    }
  });
}

function restoreAppliedSettings() {
  // --- Theme ---
  const savedTheme = localStorage.getItem("appTheme") || "light";
  document.querySelectorAll(".theme-option").forEach((opt) => {
    const theme = opt.getAttribute("onclick").match(/'(\w+)'/)[1]; // استخراج theme من onclick

    // إزالة الحالة النشطة
    opt.classList.remove("active");
    opt.classList.remove("border-purple-400");
    const text = opt.querySelector(".theme-text");
    text.style.color = "";
    text.classList.add("text-gray-700");

    // تفعيل الخيار المطبق
    if (theme === savedTheme) {
      opt.classList.add("active");
      opt.classList.remove("border-gray-200");
      opt.classList.add("border-purple-400");
      text.style.color = "var(--primary-color)";
      text.classList.remove("text-gray-700");
    }
    const savedFontSize = localStorage.getItem("appFontSize") || "16";
    const fontSizeInput = document.getElementById("font-size-input");
    if (fontSizeInput) {
      fontSizeInput.value = savedFontSize;
    }
  });
  
  // --- Color ---
  const savedColor = localStorage.getItem("appColor") || "purple";
  document.querySelectorAll(".color-option").forEach((opt) => {
    const color = opt.getAttribute("onclick").match(/'(\w+)'/)[1]; // استخراج اللون من onclick

    // إزالة الحالة النشطة
    opt.classList.remove("active");
    opt.classList.remove(
      "border-purple-400",
      "border-blue-400",
      "border-green-400",
      "border-orange-400",
      "border-pink-400"
    );
    opt.classList.add("border-white");

    // تفعيل الخيار المطبق
    if (color === savedColor) {
      opt.classList.add("active");
      opt.classList.remove("border-white");
      const borderColors = {
        purple: "border-purple-400",
        blue: "border-blue-400",
        green: "border-green-400",
        orange: "border-orange-400",
        pink: "border-pink-400",
      };
      opt.classList.add(borderColors[color]);
    }
  });
}

// ===== Event Listeners ===== //
document.querySelectorAll('.saved').forEach(btn => {
  btn.addEventListener('click', () => {
    showToast(selectedLanguage === "ar" ? "تم حفظ الاعدادات" : getTranslation("settingsSaved"));
  });
});

// فتح النافذة
if (openSettingsModalBtn) {
  openSettingsModalBtn.addEventListener("click", () => {
    openSettingsModal();
    // لو عندك sidebar قابل للطي
    if (
      typeof sidebar !== "undefined" &&
      sidebar.classList &&
      sidebar.classList.contains("open") &&
      typeof toggleSidebar === "function"
    ) {
      toggleSidebar();
    }
  });
} else {
  console.warn("open-settings-modal-btn not found in DOM.");
}

// إغلاق النافذة بزر الإغلاق
if (closeSettingsModalBtn) {
  closeSettingsModalBtn.addEventListener("click", closeSettingsModal);
} else {
  console.warn("close-settings-modal not found in DOM.");
}

// إغلاق بالنقر على الخلفية (overlay)
if (settingsModalOverlay) {
  settingsModalOverlay.addEventListener("click", (e) => {
    if (e.target === settingsModalOverlay) closeSettingsModal();
  });
}

// زر الرجوع -> يعود للـ main
if (backSettingsModalBtn) { backSettingsModalBtn.addEventListener("click", () => {
  showSettingsView("main");
});
}
if (openAccountSettingsBtn) { openAccountSettingsBtn.addEventListener("click", () =>
  showSettingsView("account")
);
}
if (openNotificationSettingsBtn) { openNotificationSettingsBtn.addEventListener("click", () =>
  showSettingsView("notifications")
);
}
if (openPrivacySettingsBtn) { openPrivacySettingsBtn.addEventListener("click", () =>
  showSettingsView("privacy")
);
}
if (openLanguageSettingsBtn) { openLanguageSettingsBtn.addEventListener("click", () =>
  showSettingsView("language")
);
}
if (openAppearanceSettingsBtn) { openAppearanceSettingsBtn.addEventListener("click", () =>
  showSettingsView("appearance")
);
}

// اختصار لوحة المفاتيح: Escape لغلق النافذة (مثل سلوك نافذة الدخول)
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    settingsModalOverlay &&
    settingsModalOverlay.classList.contains("opacity-100")
  ) {
    closeSettingsModal();
  }
});

// ===== تهيئة افتراضية عند تحميل السكربت =====
/* إذا أردت التأكد بدايةً أن الشاشة الرئيسية مخفية أو مرئية يمكن تفعيل السطر التالي */
if (settingsScreens.main) {
  // تأكد أن باقي الشاشات مخفية و main ظاهرة
  Object.entries(settingsScreens).forEach(([k, el]) => {
    if (!el) return;
    if (k === "main") {
      el.classList.remove("hidden");
    } else {
      el.classList.add("hidden");
    }
  });
  settingsModalTitle.textContent = settingsTitles.main;
}

async function changePassword() {
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
    const currentUser = await checkAuth();
    const response = await fetch("http://localhost:3000/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userID: currentUser.user_id, newPassword })
  });
  const data = await response.json();
    if (!data.success) throw new Error(data.message);
      showToast("تم تغيير كلمة السر بنجاح");
    } catch (err) {
      showToast("خطأ في الاتصال بالسيرفر: " + err.message);
    }
}

document.getElementById('change-password-btn').addEventListener("click", () =>
  changePassword()
);

const clearBtn = document.getElementById("clearLocalStorageBtn");
clearBtn.addEventListener("click", () => {
  localStorage.clear();
  showToast('تم حذف جميع البيانات المحلية')
  setTimeout(() => {
    location.reload();
  }, 3000);
});

async function deleteAccount() {
  const res = await showAlert({
    message: "هل أنت متأكد أنك تريد حذف الحساب؟",
    icon: "fa-solid fa-triangle-exclamation",
    confirmText: "تأكيد",
    cancelText: "إلغاء"
  });
  if (!res.ok) return;
  try {
    const currentUser = await checkAuth();
    const response = await fetch('http://localhost:3000/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userID: currentUser.user_id })
    });
    const data = await response.json();
    if (data.success) {
      closeSettingsModal();
      showToast('تم حذف الحساب نهائيًا');
      setTimeout(() => { location.reload(); }, 2000);
    } else {
      showToast('خطأ: ' + data.message);
    }
  } catch (err) {
    showToast('خطأ في الاتصال بالسيرفر');
  }
}

document.getElementById('delete-account-btn').addEventListener("click", () =>
  deleteAccount()
);

openSettingsModal();
showSettingsView(view);
}