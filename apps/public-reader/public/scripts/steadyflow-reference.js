(() => {
  let activeRoot = null;
  let activeCleanup = null;

  const cleanupSteadyflowReference = () => {
    if (typeof activeCleanup === "function") activeCleanup();
    activeCleanup = null;
    activeRoot = null;
  };

  const initSteadyflowReference = () => {
    const root = document.querySelector("[data-steadyflow-reference]");
    if (!root) {
      cleanupSteadyflowReference();
      return;
    }
    if (root === activeRoot && root.dataset.sfReady === "true") return;

    cleanupSteadyflowReference();
    activeRoot = root;
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

    const cleanupTasks = [];
    const addCleanup = (task) => cleanupTasks.push(task);
    const on = (target, type, handler, options) => {
      if (!target?.addEventListener) return;
      target.addEventListener(type, handler, options);
      addCleanup(() => target.removeEventListener(type, handler, options));
    };
    const onMediaChange = (query, handler) => {
      if (query?.addEventListener) {
        query.addEventListener("change", handler);
        addCleanup(() => query.removeEventListener("change", handler));
        return;
      }
      if (query?.addListener) {
        query.addListener(handler);
        addCleanup(() => query.removeListener?.(handler));
      }
    };

    activeCleanup = () => {
      const tasks = cleanupTasks.splice(0).reverse();
      tasks.forEach((task) => {
        try {
          task();
        } catch {
          // Ignore cleanup failures from already-detached DOM nodes.
        }
      });
      document.body.style.overflow = "";
      root.classList.remove("sf-menu-open", "sf-scrolled");
      if (backdrop) backdrop.hidden = true;
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "打开导航");
      }
      if (videoOverlay) videoOverlay.hidden = true;
      if (videoFrame) videoFrame.setAttribute("src", "");
      if (imagePreviewOverlay) imagePreviewOverlay.hidden = true;
      if (imagePreviewImage) {
        imagePreviewImage.removeAttribute("src");
        imagePreviewImage.setAttribute("alt", "");
      }
      if (qrOverlay) qrOverlay.hidden = true;
      delete root.dataset.sfReady;
    };

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

    on(toggle, "click", () => {
      root.classList.contains("sf-menu-open") ? closeMenu() : openMenu();
    });
    on(backdrop, "click", (event) => {
      if (event.target === backdrop) closeMenu();
    });
    backdrop?.querySelectorAll("a").forEach((link) => on(link, "click", closeMenu));

    const closeVideo = () => {
      if (!videoOverlay || !videoFrame) return;
      videoOverlay.hidden = true;
      videoFrame.setAttribute("src", "");
      document.body.style.overflow = "";
    };

    on(videoOpen, "click", () => {
      if (!videoOverlay || !videoFrame) return;
      videoFrame.setAttribute("src", demoUrl);
      videoOverlay.hidden = false;
      document.body.style.overflow = "hidden";
    });
    on(videoClose, "click", closeVideo);
    on(videoOverlay, "click", (event) => {
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

    on(qrOpen, "click", (event) => {
      event.preventDefault();
      openQr();
    });
    qrCloseButtons.forEach((button) => on(button, "click", closeQr));
    on(qrOverlay, "click", (event) => {
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

    imagePreviewCloseButtons.forEach((button) => on(button, "click", closeImagePreview));
    imagePreviewTriggers.forEach((trigger) => {
      on(trigger, "click", (event) => {
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
    on(window, "keydown", handleGlobalKeydown);
    on(document, "keydown", handleGlobalKeydown);

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
    addCleanup(() => revealObserver.disconnect());

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
    addCleanup(() => countObserver.disconnect());

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

      const handleReplayVisibilityChange = () => {
        if (document.hidden) {
          replaySections.forEach((item) => item.pause());
        }
      };

      const handleReplayReducedMotionChange = () => {
        if (reducedMotionQuery.matches) {
          replaySections.forEach((item) => item.leave());
          replayObserver.disconnect();
        }
      };

      const handleReplayPageHide = () => {
        replaySections.forEach((item) => item.leave());
        replayObserver.disconnect();
      };

      on(document, "visibilitychange", handleReplayVisibilityChange);
      onMediaChange(reducedMotionQuery, handleReplayReducedMotionChange);
      on(window, "pagehide", handleReplayPageHide);
      addCleanup(() => {
        replaySections.forEach((item) => item.leave());
        replayObserver.disconnect();
      });
    }

    if (hero && !reducedMotionQuery.matches) {
      let heroReplayTimeoutId = null;
      let heroReadyTimeoutId = null;
      let heroReady = false;
      let heroWasAway = false;
      let heroInReplayZone = false;
      let heroObserver = null;
      let lastHeroReplayAt = 0;

      const heroViewportRatio = () => {
        const rect = hero.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
        return rect.height > 0 ? visibleHeight / Math.max(rect.height, 1) : 0;
      };

      const markHeroReady = () => {
        window.clearTimeout(heroReadyTimeoutId);
        heroReadyTimeoutId = null;
        heroReady = true;
        hero.classList.add("sf-hero-ready");
        if (heroViewportRatio() < (isCompactViewport() ? 0.22 : 0.28)) heroWasAway = true;
      };

      const clearHeroReplay = () => {
        window.clearTimeout(heroReplayTimeoutId);
        heroReplayTimeoutId = null;
        hero.classList.remove("sf-replay-pulse");
      };

      const playHeroReplay = () => {
        const now = performance.now();
        if (!heroReady || document.hidden || now - lastHeroReplayAt < 1800) return;

        lastHeroReplayAt = now;
        heroWasAway = false;
        markHeroReady();
        hero.classList.remove("sf-replay-pulse");
        void hero.offsetWidth;
        hero.classList.add("sf-replay-pulse");
        window.clearTimeout(heroReplayTimeoutId);
        heroReplayTimeoutId = window.setTimeout(clearHeroReplay, 2200);
      };

      const markHeroAway = () => {
        heroInReplayZone = false;
        if (heroReady) heroWasAway = true;
        clearHeroReplay();
      };

      if ("IntersectionObserver" in window) {
        heroObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.target !== hero) return;
              const enterThreshold = isCompactViewport() ? 0.38 : 0.42;
              const leaveThreshold = isCompactViewport() ? 0.08 : 0.1;

              if (entry.isIntersecting && entry.intersectionRatio >= enterThreshold) {
                if (!heroInReplayZone) {
                  heroInReplayZone = true;
                  if (heroWasAway) playHeroReplay();
                }
                return;
              }

              if (!entry.isIntersecting || entry.intersectionRatio <= leaveThreshold) markHeroAway();
            });
          },
          { rootMargin: "-4% 0px -4% 0px", threshold: [0, 0.08, 0.1, 0.18, 0.28, 0.38, 0.42, 0.6] }
        );
        heroObserver.observe(hero);
      }

      heroReadyTimeoutId = window.setTimeout(markHeroReady, 2200);

      const handleHeroVisibilityChange = () => {
        if (document.hidden) clearHeroReplay();
      };
      const handleHeroPageHide = () => {
        window.clearTimeout(heroReadyTimeoutId);
        clearHeroReplay();
        if (heroObserver) heroObserver.disconnect();
      };
      const handleHeroReducedMotionChange = () => {
        if (reducedMotionQuery.matches) {
          clearHeroReplay();
          if (heroObserver) heroObserver.disconnect();
          hero.classList.add("sf-hero-ready");
        }
      };

      on(document, "visibilitychange", handleHeroVisibilityChange);
      on(window, "pagehide", handleHeroPageHide);
      onMediaChange(reducedMotionQuery, handleHeroReducedMotionChange);
      addCleanup(() => {
        window.clearTimeout(heroReadyTimeoutId);
        clearHeroReplay();
        if (heroObserver) heroObserver.disconnect();
        hero.classList.add("sf-hero-ready");
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
      on(window, "resize", syncMarqueeLoop, { passive: true });
      on(window, "load", syncMarqueeLoop, { once: true });
      root.querySelectorAll(".sf-hero-marquee-card img").forEach((image) => {
        if (image.complete) return;
        on(image, "load", syncMarqueeLoop, { once: true });
      });
    }

    setScrolled();
    on(window, "scroll", setScrolled, { passive: true });
  };

  window.cleanupSteadyflowReference = cleanupSteadyflowReference;
  window.initSteadyflowReference = initSteadyflowReference;
  initSteadyflowReference();
})();
