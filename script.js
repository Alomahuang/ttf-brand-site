const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const yearTarget = document.querySelector("#current-year");
const joinForm = document.querySelector(".join-form");
const formFeedback = document.querySelector(".form-feedback");
const pageLanguage = document.documentElement.lang || "fr";
const isChinese = pageLanguage.startsWith("zh");
const themeButtons = document.querySelectorAll("[data-theme-option]");
const themeStorageKey = "ttf-style";

const setTheme = (theme, persist = true) => {
  const nextTheme = theme === "old" ? "old" : "new";
  document.documentElement.dataset.theme = nextTheme;

  themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeOption === nextTheme));
  });

  if (persist) {
    try {
      localStorage.setItem(themeStorageKey, nextTheme);
    } catch (error) {
      // Theme comparison still works when storage is unavailable.
    }
  }
};

setTheme(document.documentElement.dataset.theme, false);

themeButtons.forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.themeOption));
});

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

if (navToggle && siteNav) {
  const setNavState = (isOpen) => {
    siteNav.classList.toggle("is-open", isOpen);
    navToggle.classList.toggle("is-open", isOpen);
    document.documentElement.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute(
      "aria-label",
      isChinese ? (isOpen ? "關閉選單" : "開啟選單") : isOpen ? "Fermer le menu" : "Ouvrir le menu"
    );
  };

  navToggle.addEventListener("click", () => {
    setNavState(navToggle.getAttribute("aria-expanded") !== "true");
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setNavState(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
      setNavState(false);
      navToggle.focus();
    }
  });
}

const tagline = document.querySelector(".tagline-reveal");

if (tagline) {
  const taglineText = tagline.textContent.trim();
  const segments = isChinese ? Array.from(taglineText) : taglineText.split(/(\s+)/);
  let wordIndex = 0;

  tagline.textContent = "";
  tagline.setAttribute("aria-label", taglineText);

  segments.forEach((segment) => {
    if (!segment || /^\s+$/.test(segment)) {
      tagline.append(document.createTextNode(segment));
      return;
    }

    const word = document.createElement("span");
    word.className = "tagline-word";
    word.textContent = segment;
    word.setAttribute("aria-hidden", "true");
    word.style.setProperty("--word-index", wordIndex);
    tagline.append(word);
    wordIndex += 1;
  });
}

const revealTargets = document.querySelectorAll(
  ".opening-statement, .opening-proof, #publics .section-intro, #publics .comparison, " +
    "#fonctionnement .section-grid > div, #fonctionnement .method-list, " +
    "#rejoindre .contact-grid > div:first-child, #rejoindre .join-form, .legal-card"
);

revealTargets.forEach((target) => target.classList.add("new-reveal"));

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));

  if (tagline) {
    const wordObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-active");
            wordObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -18% 0px" }
    );

    tagline.querySelectorAll(".tagline-word").forEach((word) => wordObserver.observe(word));
  }
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
  tagline?.querySelectorAll(".tagline-word").forEach((word) => word.classList.add("is-active"));
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
