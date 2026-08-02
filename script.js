const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const yearTarget = document.querySelector("#current-year");
const joinForm = document.querySelector(".join-form");
const formFeedback = document.querySelector(".form-feedback");
const pageLanguage = document.documentElement.lang || "fr";
const isChinese = pageLanguage.startsWith("zh");

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute(
      "aria-label",
      isChinese ? (isOpen ? "關閉選單" : "開啟選單") : isOpen ? "Fermer le menu" : "Ouvrir le menu"
    );
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", isChinese ? "開啟選單" : "Ouvrir le menu");
    });
  });
}

if (joinForm && formFeedback) {
  joinForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(joinForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const audience = String(formData.get("audience") || "").trim();
    const message = String(formData.get("message") || "").trim();

    formFeedback.classList.remove("is-success", "is-error");

    if (!name || !email || !audience || !message) {
      formFeedback.textContent = isChinese
        ? "請先填寫必填欄位，再送出訊息。"
        : "Merci de remplir les champs obligatoires avant d'envoyer votre message.";
      formFeedback.classList.add("is-error");
      return;
    }

    formFeedback.textContent = isChinese
      ? "謝謝，我們已收到你的需求，會再以合適的聯絡方式回覆。"
      : "Merci, votre demande a bien été prise en compte. Nous vous recontacterons avec le bon point d'entrée.";
    formFeedback.classList.add("is-success");
    joinForm.reset();
  });
}
