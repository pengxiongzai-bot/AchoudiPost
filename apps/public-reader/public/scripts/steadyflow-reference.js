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
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        closeVideo();
      }
    });

    if (avatarCount) {
      const counts = avatarCount.dataset.sfCounts?.split(",").map((count) => count.trim()).filter(Boolean) ?? ["51+", "52+", "53+", "54+"];
      let index = 0;
      window.setInterval(() => {
        index = (index + 1) % counts.length;
        avatarCount.textContent = counts[index];
        avatarCount.animate(
          [{ opacity: 0, transform: "scale(.65)" }, { opacity: 1, transform: "scale(1)" }],
          { duration: 450, easing: "cubic-bezier(.25,.46,.45,.94)" }
        );
      }, 2000);
    }

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

    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  };

  window.initSteadyflowReference = initSteadyflowReference;
  initSteadyflowReference();
})();
