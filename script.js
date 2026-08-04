const yearTargets = document.querySelectorAll("#current-year, [data-current-year]");
const pageLanguage = document.documentElement.lang || "fr";
const isChinese = pageLanguage.startsWith("zh");

yearTargets.forEach((target) => {
  target.textContent = new Date().getFullYear();
});

const navPairs = [
  [document.querySelector(".nav-toggle"), document.querySelector(".site-nav")],
  [document.querySelector(".journal-menu-toggle"), document.querySelector(".journal-nav")],
].filter(([toggle, nav]) => toggle && nav);

const setNavState = (toggle, nav, isOpen) => {
  nav.classList.toggle("is-open", isOpen);
  toggle.classList.toggle("is-open", isOpen);
  document.documentElement.classList.toggle("nav-open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.setAttribute(
    "aria-label",
    isChinese ? (isOpen ? "關閉選單" : "開啟選單") : isOpen ? "Fermer le menu" : "Ouvrir le menu"
  );
};

navPairs.forEach(([toggle, nav]) => {
  toggle.addEventListener("click", () => {
    const willOpen = toggle.getAttribute("aria-expanded") !== "true";
    navPairs.forEach(([otherToggle, otherNav]) => setNavState(otherToggle, otherNav, false));
    setNavState(toggle, nav, willOpen);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setNavState(toggle, nav, false));
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  navPairs.forEach(([toggle, nav]) => {
    if (toggle.getAttribute("aria-expanded") === "true") {
      setNavState(toggle, nav, false);
      toggle.focus();
    }
  });
});

const taglines = document.querySelectorAll(".tagline-reveal");

taglines.forEach((tagline) => {
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
});

const revealTargets = document.querySelectorAll(
  ".legal-card, .journal-reveal"
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

  if (taglines.length) {
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

    taglines.forEach((tagline) => {
      tagline.querySelectorAll(".tagline-word").forEach((word) => wordObserver.observe(word));
    });
  }
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
  taglines.forEach((tagline) => {
    tagline.querySelectorAll(".tagline-word").forEach((word) => word.classList.add("is-active"));
  });
}

document.querySelectorAll(".journal-form").forEach((joinForm) => {
  const formFeedback = joinForm.querySelector(".form-feedback");
  if (!formFeedback) return;
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
        ? "目前無法送出需求，請稍後再試，或直接寄信至 tess.hsu@gmail.com。"
        : "L'envoi a échoué. Réessayez plus tard ou écrivez à tess.hsu@gmail.com.";
      formFeedback.classList.add("is-error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitButton.textContent = idleLabel;
      }
    }
  });
});
