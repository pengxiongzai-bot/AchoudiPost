(() => {
  const initSteadyflowReference = () => {
    const root = document.querySelector("[data-steadyflow-reference]");
    if (!root || root.dataset.sfReady === "true") return;
    root.dataset.sfReady = "true";

    const toggle = root.querySelector("[data-sf-menu-toggle]");
    const backdrop = root.querySelector("[data-sf-menu-backdrop]");
    const avatarCount = root.querySelector("[data-sf-avatar-count]");
    const videoOverlay = root.querySelector("[data-sf-video-overlay]");
    const videoFrame = root.querySelector("[data-sf-video-frame]");
    const videoOpen = root.querySelector("[data-sf-video-open]");
    const videoClose = root.querySelector("[data-sf-video-close]");
    const demoUrl = "https://www.youtube.com/embed/b-jRHsYdomY?autoplay=0&mute=1";
    const hero = root.querySelector(".sf-hero");
    const marqueeTrack = root.querySelector("[data-sf-hero-marquee-track]");
    const imagePreviewOverlay = root.querySelector("[data-sf-image-preview-overlay]");
    const imagePreviewImage = root.querySelector("[data-sf-image-preview-image]");
    const imagePreviewClose = root.querySelector(".sf-image-preview-close");
    const imagePreviewCloseButtons = root.querySelectorAll("[data-sf-image-preview-close]");
    const imagePreviewTriggers = root.querySelectorAll("[data-sf-image-preview-trigger]");
    const qrOverlay = root.querySelector("[data-sf-qr-overlay]");
    const qrOpen = root.querySelector("[data-sf-qr-open]");
    const qrClose = root.querySelector(".sf-qr-close");
    const qrCloseButtons = root.querySelectorAll("[data-sf-qr-close]");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastFocusedPreviewTrigger = null;
    let lastFocusedQrTrigger = null;

    const setScrolled = () => {
      const top = root.getBoundingClientRect().top + window.scrollY;
      root.classList.toggle("sf-scrolled", window.scrollY > top + 50);
    };

    const closeMenu = () => {
      if (!toggle || !backdrop) return;
      root.classList.remove("sf-menu-open");
      backdrop.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "打开导航");
      document.body.style.overflow = "";
    };

    const openMenu = () => {
      if (!toggle || !backdrop) return;
      root.classList.add("sf-menu-open");
      backdrop.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "关闭导航");
      document.body.style.overflow = "hidden";
    };

    toggle?.addEventListener("click", () => {
      root.classList.contains("sf-menu-open") ? closeMenu() : openMenu();
    });
    backdrop?.addEventListener("click", (event) => {
      if (event.target === backdrop) closeMenu();
    });
    backdrop?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

    const closeVideo = () => {
      if (!videoOverlay || !videoFrame) return;
      videoOverlay.hidden = true;
      videoFrame.setAttribute("src", "");
      document.body.style.overflow = "";
    };

    videoOpen?.addEventListener("click", () => {
      if (!videoOverlay || !videoFrame) return;
      videoFrame.setAttribute("src", demoUrl);
      videoOverlay.hidden = false;
      document.body.style.overflow = "hidden";
    });
    videoClose?.addEventListener("click", closeVideo);
    videoOverlay?.addEventListener("click", (event) => {
      if (event.target === videoOverlay) closeVideo();
    });

    const closeQr = () => {
      if (!qrOverlay) return;
      qrOverlay.hidden = true;
      document.body.style.overflow = "";

      if (lastFocusedQrTrigger instanceof HTMLElement) {
        lastFocusedQrTrigger.focus({ preventScroll: true });
      }
      lastFocusedQrTrigger = null;
    };

    const openQr = () => {
      if (!qrOverlay || !(qrOpen instanceof HTMLElement)) return;
      lastFocusedQrTrigger = qrOpen;
      qrOverlay.hidden = false;
      document.body.style.overflow = "hidden";
      qrClose?.focus({ preventScroll: true });
    };

    qrOpen?.addEventListener("click", (event) => {
      event.preventDefault();
      openQr();
    });
    qrCloseButtons.forEach((button) => button.addEventListener("click", closeQr));
    qrOverlay?.addEventListener("click", (event) => {
      if (event.target instanceof HTMLElement && event.target.closest("[data-sf-qr-close]")) {
        event.preventDefault();
        closeQr();
      }
    });

    const closeImagePreview = () => {
      if (!imagePreviewOverlay || !imagePreviewImage) return;
      imagePreviewOverlay.hidden = true;
      imagePreviewImage.removeAttribute("src");
      imagePreviewImage.setAttribute("alt", "");
      document.body.style.overflow = "";

      if (
        lastFocusedPreviewTrigger instanceof HTMLElement &&
        lastFocusedPreviewTrigger.getAttribute("aria-hidden") !== "true"
      ) {
        lastFocusedPreviewTrigger.focus({ preventScroll: true });
      }
      lastFocusedPreviewTrigger = null;
    };

    const openImagePreview = (trigger, options = {}) => {
      if (!imagePreviewOverlay || !imagePreviewImage || !(trigger instanceof HTMLElement)) return;
      const src = trigger.getAttribute("data-sf-preview-src");
      if (!src) return;

      lastFocusedPreviewTrigger = trigger;
      imagePreviewImage.setAttribute("src", src);
      imagePreviewImage.setAttribute("alt", trigger.getAttribute("aria-label") || "图片预览");
      imagePreviewOverlay.hidden = false;
      document.body.style.overflow = "hidden";
      if (options.focusClose) imagePreviewClose?.focus({ preventScroll: true });
    };

    imagePreviewCloseButtons.forEach((button) => button.addEventListener("click", closeImagePreview));
    imagePreviewTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        openImagePreview(trigger, { focusClose: true });
      });
    });

    const handleGlobalKeydown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
        closeVideo();
        closeImagePreview();
        closeQr();
      }
    };
    window.addEventListener("keydown", handleGlobalKeydown);
    document.addEventListener("keydown", handleGlobalKeydown);

    if (avatarCount) avatarCount.textContent = avatarCount.dataset.sfCounts?.split(",")[0]?.trim() || avatarCount.textContent;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sf-in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -100px 0px", threshold: 0.1 }
    );
    root.querySelectorAll(".sf-reveal").forEach((item) => revealObserver.observe(item));

    const counter = root.querySelector(".sf-counter");
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          root.querySelectorAll("[data-sf-count]").forEach((node) => {
            const target = Number(node.getAttribute("data-sf-count") || 0);
            const suffix = node.getAttribute("data-sf-suffix") || "";
            const start = performance.now();
            const tick = (now) => {
              const progress = Math.min(1, (now - start) / 1000);
              const eased = 1 - Math.pow(1 - progress, 3);
              node.textContent = `${Math.round(target * eased)}${suffix}`;
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
          countObserver.disconnect();
        });
      },
      { threshold: 0.35 }
    );
    if (counter) countObserver.observe(counter);

    const isCompactViewport = () => window.matchMedia("(max-width: 640px)").matches;
    const replaySections = [
      { element: root.querySelector(".sf-achievements"), duration: 2600, threshold: () => (isCompactViewport() ? 0.18 : 0.34) },
      { element: root.querySelector(".sf-counter"), duration: 3000, threshold: () => (isCompactViewport() ? 0.2 : 0.34) }
    ]
      .filter((item) => item.element)
      .map((item) => {
        let isActive = false;
        let timeoutId = null;

        const removePulse = () => {
          window.clearTimeout(timeoutId);
          timeoutId = null;
          item.element.classList.add("sf-replay-ready");
          item.element.classList.remove("sf-replay-pulse");
        };

        const play = () => {
          if (!isActive || document.hidden || reducedMotionQuery.matches) return;

          item.element.classList.add("sf-replay-ready");
          item.element.classList.remove("sf-replay-pulse");
          void item.element.offsetWidth;
          item.element.classList.add("sf-replay-pulse");
          window.clearTimeout(timeoutId);
          timeoutId = window.setTimeout(removePulse, item.duration);
        };

        const enter = () => {
          if (isActive) return;
          isActive = true;
          play();
        };

        const leave = () => {
          isActive = false;
          removePulse();
        };

        const pause = () => {
          removePulse();
        };

        return { ...item, enter, leave, pause };
      });

    if (replaySections.length && !reducedMotionQuery.matches) {
      const replayObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const replayItem = replaySections.find((item) => item.element === entry.target);
            if (!replayItem) return;

            const threshold = typeof replayItem.threshold === "function" ? replayItem.threshold() : replayItem.threshold;

            if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
              replayItem.enter();
            } else {
              replayItem.leave();
            }
          });
        },
        { rootMargin: "-8% 0px -8% 0px", threshold: [0, 0.12, 0.18, 0.25, 0.34, 0.45, 0.6] }
      );

      replaySections.forEach((item) => replayObserver.observe(item.element));

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          replaySections.forEach((item) => item.pause());
        }
      });

      reducedMotionQuery.addEventListener?.("change", () => {
        if (reducedMotionQuery.matches) {
          replaySections.forEach((item) => item.leave());
          replayObserver.disconnect();
        }
      });

      window.addEventListener("pagehide", () => {
        replaySections.forEach((item) => item.leave());
        replayObserver.disconnect();
      });
    }

    if (hero && !reducedMotionQuery.matches) {
      let heroReplayArmed = false;
      let heroReplayTicking = false;
      let heroReplayTimeoutId = null;
      let heroReadyTimeoutId = null;
      let lastHeroReplayAt = 0;

      const markHeroReady = () => {
        window.clearTimeout(heroReadyTimeoutId);
        heroReadyTimeoutId = null;
        hero.classList.add("sf-hero-ready");
      };

      const clearHeroReplay = () => {
        window.clearTimeout(heroReplayTimeoutId);
        heroReplayTimeoutId = null;
        hero.classList.remove("sf-replay-pulse");
      };

      const playHeroReplay = () => {
        const now = performance.now();
        if (document.hidden || now - lastHeroReplayAt < 1400) return;

        lastHeroReplayAt = now;
        heroReplayArmed = false;
        markHeroReady();
        hero.classList.remove("sf-replay-pulse");
        void hero.offsetWidth;
        hero.classList.add("sf-replay-pulse");
        window.clearTimeout(heroReplayTimeoutId);
        heroReplayTimeoutId = window.setTimeout(clearHeroReplay, 2200);
      };

      const updateHeroReplay = () => {
        heroReplayTicking = false;

        const heroTop = hero.getBoundingClientRect().top + window.scrollY;
        const heroHeight = Math.max(hero.offsetHeight, window.innerHeight || document.documentElement.clientHeight);
        const progress = window.scrollY - heroTop;
        const leaveDistance = heroHeight * (isCompactViewport() ? 0.5 : 0.58);
        const returnDistance = heroHeight * (isCompactViewport() ? 0.14 : 0.12);

        if (progress > leaveDistance) {
          heroReplayArmed = true;
          clearHeroReplay();
          return;
        }

        if (heroReplayArmed && progress <= returnDistance) {
          playHeroReplay();
        }
      };

      const requestHeroReplayUpdate = () => {
        if (heroReplayTicking) return;
        heroReplayTicking = true;
        window.requestAnimationFrame(updateHeroReplay);
      };

      updateHeroReplay();
      heroReadyTimeoutId = window.setTimeout(markHeroReady, 2200);
      window.addEventListener("scroll", requestHeroReplayUpdate, { passive: true });
      window.addEventListener("resize", requestHeroReplayUpdate, { passive: true });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) clearHeroReplay();
      });
      window.addEventListener("pagehide", () => {
        window.clearTimeout(heroReadyTimeoutId);
        clearHeroReplay();
      });

      reducedMotionQuery.addEventListener?.("change", () => {
        if (reducedMotionQuery.matches) clearHeroReplay();
      });
    }

    if (marqueeTrack) {
      const syncMarqueeLoop = () => {
        const cards = [...marqueeTrack.querySelectorAll("[data-sf-image-preview-trigger]")];
        const firstCard = cards[0];
        const firstDuplicateCard = cards.find((card, index) => index > 0 && card.getAttribute("aria-hidden") === "true") || cards[Math.floor(cards.length / 2)];

        if (firstCard && firstDuplicateCard) {
          const loopWidth = firstDuplicateCard.offsetLeft - firstCard.offsetLeft;
          if (loopWidth > 0) {
            const duration = Math.min(54, Math.max(34, loopWidth / 42));
            marqueeTrack.style.setProperty("--sf-hero-marquee-loop-distance", `-${loopWidth}px`);
            marqueeTrack.style.setProperty("--sf-hero-marquee-duration", `${duration.toFixed(2)}s`);
          }
        }
      };

      syncMarqueeLoop();
      window.addEventListener("resize", syncMarqueeLoop, { passive: true });
      window.addEventListener("load", syncMarqueeLoop, { once: true });
      root.querySelectorAll(".sf-hero-marquee-card img").forEach((image) => {
        if (image.complete) return;
        image.addEventListener("load", syncMarqueeLoop, { once: true });
      });
    }

    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  };

  window.initSteadyflowReference = initSteadyflowReference;
  initSteadyflowReference();
})();
