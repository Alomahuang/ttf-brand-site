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
  const submitButton = joinForm.querySelector('button[type="submit"]');

  joinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    formFeedback.classList.remove("is-success", "is-error");
    formFeedback.textContent = "";

    if (!joinForm.checkValidity()) {
      joinForm.reportValidity();
      return;
    }

    const idleLabel = submitButton?.dataset.idleLabel || submitButton?.textContent || "";
    const sendingLabel = submitButton?.dataset.sendingLabel || idleLabel;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      submitButton.textContent = sendingLabel;
    }

    try {
      const response = await fetch(joinForm.action, {
        method: "POST",
        body: new FormData(joinForm),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Formspree request failed with status ${response.status}`);
      }

      formFeedback.textContent = isChinese
        ? "謝謝，我們已收到你的需求，會再以合適的聯絡方式回覆。"
        : "Merci, votre demande a bien été envoyée. Nous vous répondrons avec le bon point de contact.";
      formFeedback.classList.add("is-success");
      joinForm.reset();
    } catch (error) {
      console.error(error);
      formFeedback.textContent = isChinese
        ? "目前無法送出需求，請稍後再試，或直接寄信至 contact@taiwantechfrance.org。"
        : "L'envoi a échoué. Réessayez plus tard ou écrivez à contact@taiwantechfrance.org.";
      formFeedback.classList.add("is-error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitButton.textContent = idleLabel;
      }
    }
  });
}
