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

document.querySelectorAll(".journal-membership").forEach((membership) => {
  const marker = membership.previousElementSibling;
  const header = document.querySelector(".journal-header");
  if (!marker || !header) return;

  let stickyOffset = header.getBoundingClientRect().height;
  let isCondensed = membership.classList.contains("is-condensed");
  let frameId = 0;
  const releaseBuffer = 64;

  const updateCondensedState = () => {
    frameId = 0;
    stickyOffset = header.getBoundingClientRect().height;

    const markerTop = marker.getBoundingClientRect().top;
    const hasReachedStickyPosition = markerTop <= stickyOffset;
    const hasClearedStickyPosition = markerTop > stickyOffset + releaseBuffer;

    if (!isCondensed && hasReachedStickyPosition) {
      isCondensed = true;
      membership.classList.add("is-condensed");
    } else if (isCondensed && hasClearedStickyPosition) {
      isCondensed = false;
      membership.classList.remove("is-condensed");
    }
  };

  const scheduleCondensedState = () => {
    if (frameId) return;
    frameId = window.requestAnimationFrame(updateCondensedState);
  };

  window.addEventListener("scroll", scheduleCondensedState, { passive: true });
  window.addEventListener("resize", scheduleCondensedState);
  updateCondensedState();
});

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
        ? "目前無法送出需求，請稍後再試，或直接寄信至 ttf-tech@zohomail.eu。"
        : "L'envoi a échoué. Réessayez plus tard ou écrivez à ttf-tech@zohomail.eu.";
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

document.querySelectorAll("[data-partners-carousel]").forEach((carousel) => {
  const carouselFrame = carousel.parentElement;
  const track = carousel.querySelector(".journal-partners-track");
  const originalCards = Array.from(carousel.querySelectorAll(".journal-partner-card"));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (!track || originalCards.length < 2) return;

  const originalCardCount = originalCards.length;
  const interactionRegion = carouselFrame || carousel;
  const pauseReasons = new Set();
  let cycleWidth = 0;

  const pauseAutoScroll = (reason) => pauseReasons.add(reason);
  const resumeAutoScroll = (reason) => pauseReasons.delete(reason);
  const isAutoScrollPaused = () => pauseReasons.size > 0;

  carousel.querySelectorAll("a, img").forEach((element) => {
    element.setAttribute("draggable", "false");
  });

  originalCards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("a, button").forEach((element) => {
      element.setAttribute("tabindex", "-1");
    });
    track.appendChild(clone);
  });

  originalCards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("a, button").forEach((element) => {
      element.setAttribute("tabindex", "-1");
    });
    track.appendChild(clone);
  });

  const dragState = {
    active: false,
    axis: null,
    hasMoved: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
  };
  let suppressClickUntil = 0;
  let autoScrollRemainder = 0;
  let touchResumeTimer = 0;

  const getCycleWidth = () => {
    const firstCard = track.children[0];
    const secondSetCard = track.children[originalCardCount];
    if (!firstCard || !secondSetCard) return 0;
    return secondSetCard.offsetLeft - firstCard.offsetLeft;
  };

  const normalizeScrollPosition = () => {
    if (!cycleWidth) return;

    if (carousel.scrollLeft <= 0) {
      carousel.scrollLeft += cycleWidth;
    }
    if (carousel.scrollLeft >= cycleWidth * 2) {
      carousel.scrollLeft -= cycleWidth;
    }
  };

  const refreshCycleWidth = () => {
    const previousCycleWidth = cycleWidth;
    const positionWithinCycle = previousCycleWidth
      ? ((carousel.scrollLeft - previousCycleWidth) % previousCycleWidth + previousCycleWidth) % previousCycleWidth
      : 0;

    cycleWidth = getCycleWidth();
    if (!cycleWidth) return;

    carousel.scrollLeft = cycleWidth + positionWithinCycle;
  };

  const getScrollDistance = () => Math.max(carousel.clientWidth * 0.72, 160);

  const moveCarousel = (direction) => {
    const distance = getScrollDistance() * direction;
    if (typeof carousel.scrollTo === "function") {
      carousel.scrollTo({
        left: carousel.scrollLeft + distance,
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      });
    } else {
      carousel.scrollLeft += distance;
      normalizeScrollPosition();
    }
  };

  const endDrag = (event) => {
    if (!dragState.active) return;
    if (event?.pointerId !== undefined && event.pointerId !== dragState.pointerId) return;

    const wasDragged = dragState.hasMoved;
    const pointerId = dragState.pointerId;

    dragState.active = false;
    dragState.axis = null;
    dragState.hasMoved = false;
    dragState.pointerId = null;
    carousel.classList.remove("is-dragging");
    interactionRegion.classList.remove("is-dragging");

    if (pointerId !== null && interactionRegion.hasPointerCapture?.(pointerId)) {
      interactionRegion.releasePointerCapture(pointerId);
    }

    if (wasDragged) {
      suppressClickUntil = window.performance.now() + 200;
    }
  };

  interactionRegion.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (dragState.active) return;

    dragState.active = true;
    dragState.pointerId = event.pointerId;
    dragState.startX = event.clientX;
    dragState.startY = event.clientY;
    dragState.lastX = event.clientX;
    dragState.axis = null;
    dragState.hasMoved = false;
    carousel.classList.add("is-dragging");
    interactionRegion.classList.add("is-dragging");
  });

  interactionRegion.addEventListener("pointermove", (event) => {
    if (!dragState.active || event.pointerId !== dragState.pointerId) return;

    const totalDeltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!dragState.axis) {
      if (Math.max(Math.abs(totalDeltaX), Math.abs(deltaY)) < 6) return;
      if (event.pointerType !== "mouse" && Math.abs(deltaY) > Math.abs(totalDeltaX)) {
        endDrag();
        return;
      }
      dragState.axis = "horizontal";
    }

    if (dragState.axis !== "horizontal") return;
    const deltaX = event.clientX - dragState.lastX;
    dragState.hasMoved = true;
    interactionRegion.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    carousel.scrollLeft -= deltaX;
    dragState.lastX = event.clientX;
    normalizeScrollPosition();
  });

  interactionRegion.addEventListener("click", (event) => {
    if (window.performance.now() >= suppressClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickUntil = 0;
  }, true);

  carousel.addEventListener("keydown", (event) => {
    if (event.target !== carousel) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveCarousel(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveCarousel(1);
    }
  });

  interactionRegion.addEventListener("pointerup", endDrag);
  interactionRegion.addEventListener("pointercancel", endDrag);
  interactionRegion.addEventListener("lostpointercapture", endDrag);
  interactionRegion.addEventListener("dragstart", (event) => event.preventDefault());
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  carousel.addEventListener("touchstart", () => {
    window.clearTimeout(touchResumeTimer);
    pauseAutoScroll("touch");
  }, { passive: true });

  const resumeAfterTouch = () => {
    window.clearTimeout(touchResumeTimer);
    touchResumeTimer = window.setTimeout(() => resumeAutoScroll("touch"), 900);
  };

  carousel.addEventListener("touchend", resumeAfterTouch, { passive: true });
  carousel.addEventListener("touchcancel", resumeAfterTouch, { passive: true });

  if (supportsHover.matches) {
    interactionRegion.addEventListener("mouseenter", () => pauseAutoScroll("hover"));
    interactionRegion.addEventListener("mouseleave", () => resumeAutoScroll("hover"));
  }

  const autoScroll = (timestamp) => {
    if (!autoScroll.lastTimestamp) autoScroll.lastTimestamp = timestamp;
    const elapsed = Math.min(timestamp - autoScroll.lastTimestamp, 50);
    autoScroll.lastTimestamp = timestamp;

    if (
      cycleWidth &&
      !prefersReducedMotion.matches &&
      !document.hidden &&
      !dragState.active &&
      !isAutoScrollPaused()
    ) {
      autoScrollRemainder += (elapsed * 20) / 1000;
      const pixelStep = Math.floor(autoScrollRemainder);

      if (pixelStep > 0) {
        carousel.scrollLeft += pixelStep;
        autoScrollRemainder -= pixelStep;
        normalizeScrollPosition();
      }
    }

    window.requestAnimationFrame(autoScroll);
  };

  carousel.addEventListener("scroll", normalizeScrollPosition, { passive: true });
  window.addEventListener("resize", refreshCycleWidth);
  window.addEventListener("load", refreshCycleWidth, { once: true });
  refreshCycleWidth();
  window.requestAnimationFrame(autoScroll);
});
