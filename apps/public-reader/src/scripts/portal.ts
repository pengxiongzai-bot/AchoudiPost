import { createIcons, icons } from "lucide";
import {
  articlePermalinkPath,
  articleReaderPath,
  isCanonicalArticleSlug,
  readArticleSlugFromPath
} from "../lib/article-links.js";

type PostListItem = {
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  commentCount: number;
  excerpt?: string;
};

type SearchDocument = {
  slug: string;
  title: string;
  body: string;
  excerpt: string;
};

type StoreProduct = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  priceCents: number;
  commissionCents: number;
  customerPriceCents?: number;
  compareAtCents: number | null;
  currency: string;
  stock: number;
  soldCount: number;
  coverUrl: string | null;
  status: "published";
};

type CreatorTool = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  url: string;
  coverUrl: string | null;
  status: "published";
};

type AffiliateOrder = {
  id: string;
  orderCode: string;
  productTitle: string;
  priceCents: number;
  commissionCents: number;
  currency: string;
  orderStatus: "pending" | "completed" | "canceled";
  commissionStatus: "not_due" | "pending" | "paid";
  createdAt: string;
};

type AffiliateDashboard = {
  affiliate: { wechatId: string; defaultMarkupPercent?: number };
  totalClicks: number;
  uniqueClicks: number;
  completedOrders: number;
  pendingCommissionCents: number;
  paidCommissionCents: number;
  orders: AffiliateOrder[];
};

type AffiliateProduct = StoreProduct & {
  markupPercent: number;
  customerPriceCents: number;
};

type PortalHistoryState = Record<string, unknown> & {
  portalReturnSource?: "skill-module";
  portalReturnUrl?: string;
  portalReturnScrollY?: number;
  portalRestoreScrollY?: number;
};

type SkillReturnState = {
  url: string;
  scrollY: number | null;
};

type RouteNavigationOptions = {
  state?: PortalHistoryState;
  replace?: boolean;
  restoreScrollY?: number | null;
  scrollBehavior?: ScrollBehavior;
};

const navToggle = document.querySelector<HTMLButtonElement>("#navToggle");
const primaryNav = document.querySelector<HTMLElement>("#primaryNav");
let postGrid = document.querySelector<HTMLElement>("#portalPostGrid");
let searchInput = document.querySelector<HTMLInputElement>("#portalSearchInput");
let searchMeta = document.querySelector<HTMLElement>("#articleSearchMeta");
let emptyState = document.querySelector<HTMLElement>("#emptyArticles");
let routeLoading = false;
let portalToastTimer = 0;
let currentServiceStatus: "checking" | "online" | "offline" = "checking";
let currentServiceLabel = "服务检测中";
let headerSurfaceBound = false;
let headerSurfaceFrame = 0;
let sectionNavigationBound = false;
let sectionNavigationFrame = 0;
let homeHashAlignmentFrame = 0;
let lastSectionNavigationId: string | null = null;
let renderedPortalRoute = portalRouteKey(new URL(location.href));

const homeSectionNavigation = [
  { sectionId: "sf-hero", navId: "home" },
  { sectionId: "sf-achievements", navId: "market" },
  { sectionId: "sf-counter", navId: "business" }
] as const;
type HomeSectionNavId = (typeof homeSectionNavigation)[number]["navId"];
const fullScreenHomeSectionIds = new Set<string>(homeSectionNavigation.slice(1).map((item) => item.sectionId));
const skillReturnStorageKey = "achoudi:skill-return-state";
const desktopEscapeMedia = "(min-width: 901px)";

let posts: PostListItem[] = [];
let searchDocuments: SearchDocument[] = [];

configureBrowserScrollRestoration();
bindNavigation();
bindRouteNavigation();
bindArticleReaderMessages();
bindHeaderSurfaceSync();
bindSectionNavigationSync();
bindPageInteractions();
createPortalIcons();

function configureBrowserScrollRestoration() {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
}

function setPrimaryNavigation(open: boolean) {
  if (!primaryNav || !navToggle) return;
  primaryNav.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  navToggle.innerHTML = `<i data-lucide="${open ? "x" : "menu"}"></i>`;
  createPortalIcons();
}

function bindNavigation() {
  navToggle?.addEventListener("click", () => {
    setPrimaryNavigation(!primaryNav?.classList.contains("open"));
  });

  document.addEventListener("click", (event) => {
    if (!primaryNav?.classList.contains("open")) return;
    const target = event.target as Node;
    if (primaryNav.contains(target) || navToggle?.contains(target)) return;
    setPrimaryNavigation(false);
  });
}

function bindHeaderSurfaceSync() {
  if (headerSurfaceBound) return;
  headerSurfaceBound = true;
  window.addEventListener("scroll", scheduleHeaderSurfaceSync, { passive: true });
  window.addEventListener("resize", scheduleHeaderSurfaceSync);
  scheduleHeaderSurfaceSync();
}

function scheduleHeaderSurfaceSync() {
  if (headerSurfaceFrame) return;
  headerSurfaceFrame = window.requestAnimationFrame(() => {
    headerSurfaceFrame = 0;
    syncHeaderSurface();
  });
}

function syncHeaderSurface() {
  const header = document.querySelector<HTMLElement>(".site-header");
  if (!header) return;

  const isHome = document.body.dataset.page === "home";
  const achievements = document.querySelector<HTMLElement>("#sf-achievements");
  const desktopNav = window.matchMedia("(min-width: 901px)").matches;
  if (!isHome || !achievements || !desktopNav) {
    resetHeaderSurface(header);
    return;
  }

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
  const sectionTop = achievements.getBoundingClientRect().top + window.scrollY;
  const start = sectionTop - Math.max(440, viewportHeight * 0.5);
  const distance = Math.max(360, viewportHeight * 0.42);
  const rawProgress = (window.scrollY - start) / distance;
  const progress = Math.max(0, Math.min(1, rawProgress));

  header.style.setProperty("--portal-header-strip-alpha", String(roundTo(1 - progress * 0.96)));
  header.style.setProperty("--portal-header-strip-border-alpha", String(roundTo(0.08 * (1 - progress))));
  header.style.setProperty("--portal-header-shell-alpha", String(roundTo(progress * 0.96)));
  header.style.setProperty("--portal-header-border-alpha", String(roundTo(progress * 0.1)));
  header.style.setProperty("--portal-header-shadow-alpha", String(roundTo(progress * 0.22)));
  header.style.setProperty("--portal-header-inner-x", `${Math.round(progress * 22)}px`);
  header.style.setProperty("--portal-header-radius", `${Math.round(progress * 999)}px`);
  header.style.setProperty("--portal-header-max", `${Math.round(1260 - progress * 260)}px`);
  header.style.setProperty("--portal-header-y", `${Math.round(progress * 10)}px`);
  header.classList.toggle("site-header-section-mode", progress > 0.08);
}

function resetHeaderSurface(header: HTMLElement) {
  [
    "--portal-header-strip-alpha",
    "--portal-header-strip-border-alpha",
    "--portal-header-shell-alpha",
    "--portal-header-border-alpha",
    "--portal-header-shadow-alpha",
    "--portal-header-inner-x",
    "--portal-header-radius",
    "--portal-header-max",
    "--portal-header-y"
  ].forEach((name) => header.style.removeProperty(name));
  header.classList.remove("site-header-section-mode");
}

function roundTo(value: number, precision = 3) {
  const base = 10 ** precision;
  return Math.round(value * base) / base;
}

function bindSectionNavigationSync() {
  if (sectionNavigationBound) return;
  sectionNavigationBound = true;
  window.addEventListener("scroll", scheduleSectionNavigationSync, { passive: true });
  window.addEventListener("resize", scheduleSectionNavigationSync);
  scheduleSectionNavigationSync();
}

function scheduleSectionNavigationSync() {
  if (sectionNavigationFrame) return;
  sectionNavigationFrame = window.requestAnimationFrame(() => {
    sectionNavigationFrame = 0;
    syncSectionNavigation();
  });
}

function syncSectionNavigation() {
  if (document.body.dataset.page !== "home") {
    lastSectionNavigationId = null;
    return;
  }

  const activeNavId = resolveVisibleHomeSectionNavId();
  if (!activeNavId || activeNavId === lastSectionNavigationId) return;
  lastSectionNavigationId = activeNavId;
  updateActiveNavigation("/", location.hash, activeNavId);
  syncHomeLocationForSection(activeNavId);
}

function resolveVisibleHomeSectionNavId() {
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
  const headerClearance = readRootPixelVariable("--portal-floating-nav-clearance", 92);
  const decisionLine = Math.min(viewportHeight * 0.48, Math.max(headerClearance + 96, viewportHeight * 0.38));

  for (const item of homeSectionNavigation) {
    const section = document.getElementById(item.sectionId);
    if (!section) continue;
    const rect = section.getBoundingClientRect();
    if (rect.top <= decisionLine && rect.bottom > decisionLine) return item.navId;
  }

  let bestNavId: string | null = null;
  let bestVisibleHeight = 0;
  homeSectionNavigation.forEach((item) => {
    const section = document.getElementById(item.sectionId);
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
    if (visibleHeight > bestVisibleHeight) {
      bestVisibleHeight = visibleHeight;
      bestNavId = item.navId;
    }
  });

  return bestNavId;
}

function homeSectionUrlForNavId(navId: string) {
  const homeNavId = navId as HomeSectionNavId;
  if (homeNavId === "home") return "/";
  if (homeNavId === "market") return "/#sf-achievements";
  if (homeNavId === "business") return "/#sf-counter";
  return null;
}

function syncHomeLocationForSection(navId: string) {
  if (routeLoading || document.body.dataset.page !== "home") return;

  const targetLocation = homeSectionUrlForNavId(navId);
  if (!targetLocation) return;

  const destination = new URL(targetLocation, location.origin);
  const currentLocation = portalLocationString(new URL(location.href));
  const nextLocation = portalLocationString(destination);
  if (currentLocation === nextLocation) return;

  const nextState = portalHistoryStateForDestination(destination, currentPortalHistoryState());
  nextState.portalRestoreScrollY = Math.max(0, Math.round(window.scrollY));
  history.replaceState(nextState, "", nextLocation);
}

function readRootPixelVariable(name: string, fallback: number) {
  const rawValue = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parsedValue = Number.parseFloat(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function bindPageInteractions() {
  window.initSteadyflowReference?.();
  scheduleHeaderSurfaceSync();
  updateActiveNavigation(location.pathname, location.hash);
  scheduleSectionNavigationSync();
  alignCurrentHomeHashToPortalViewport();
  updateServicePulses(currentServiceStatus, currentServiceLabel);
  postGrid = document.querySelector<HTMLElement>("#portalPostGrid");
  searchInput = document.querySelector<HTMLInputElement>("#portalSearchInput");
  searchMeta = document.querySelector<HTMLElement>("#articleSearchMeta");
  emptyState = document.querySelector<HTMLElement>("#emptyArticles");
  syncArticleReader();

  if (searchInput) {
    const requestedQuery = new URLSearchParams(location.search).get("q")?.trim() ?? "";
    searchInput.value = requestedQuery;
    searchInput.addEventListener("input", () => renderPosts(searchInput?.value ?? ""));
  }

  if (postGrid) void hydratePosts();
  void hydrateMarket();
  void hydrateTools();
  bindSkillDetailDialog();
  void hydrateAffiliateDashboard();
  propagateReferralLinks();
  void checkService();
}

function syncArticleReader() {
  const frame = document.querySelector<HTMLIFrameElement>("#articleReaderFrame");
  if (!frame) return;

  const routeSlug = readArticleSlugFromPath(location.pathname);
  const declaredSlug = document.querySelector<HTMLElement>(".reader-route")?.dataset.articleSlug?.trim();
  const requestedPost = new URLSearchParams(location.search).get("post")?.trim() || routeSlug || declaredSlug || null;
  const nextSource = articleReaderPath(requestedPost, lockedReferral(), { embedded: true });
  if (frame.getAttribute("src") !== nextSource) frame.src = nextSource;
}

function bindArticleReaderMessages() {
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) return;
    const frame = document.querySelector<HTMLIFrameElement>("#articleReaderFrame");
    if (!frame?.contentWindow || event.source !== frame.contentWindow) return;
    const data = event.data as { type?: unknown; slug?: unknown; title?: unknown; push?: unknown } | null;
    if (data?.type !== "freedompost:article-change" || !isCanonicalArticleSlug(data.slug)) return;

    const destination = new URL(articlePermalinkPath(data.slug, lockedReferral()), location.origin);
    const nextLocation = `${destination.pathname}${destination.search}`;
    const currentLocation = `${location.pathname}${location.search}`;
    if (nextLocation !== currentLocation) {
      if (data.push === true) history.pushState({}, "", nextLocation);
      else history.replaceState(history.state, "", nextLocation);
    }

    document.body.dataset.page = "articles";
    renderedPortalRoute = portalRouteKey(destination);
    updateActiveNavigation("/articles/");
    updateArticleMetadata(destination, typeof data.title === "string" ? data.title : null);
    propagateReferralLinks();
  });
}

function updateArticleMetadata(destination: URL, title: string | null) {
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = destination.toString();
  const openGraphUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
  if (openGraphUrl) openGraphUrl.content = destination.toString();
  if (!title) return;
  document.title = `${title} - AchoudiPost`;
  const openGraphTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (openGraphTitle) openGraphTitle.content = title;
}

function bindRouteNavigation() {
  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    const link = target?.closest<HTMLAnchorElement>("a[data-portal-route]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin) return;
    addLockedReferral(destination);
    event.preventDefault();

    const skillExitState = resolveSkillExitState(destination);
    if (skillExitState) {
      const skillExitDestination = new URL(skillExitState.url, location.origin);
      const restoreScrollY = validScrollY(skillExitState.scrollY);
      void loadRoute(skillExitDestination, false, {
        replace: true,
        state:
          restoreScrollY === null
            ? currentPortalHistoryState()
            : { ...currentPortalHistoryState(), portalRestoreScrollY: restoreScrollY },
        restoreScrollY,
        scrollBehavior: "auto"
      });
      return;
    }

    const skillEntryState = prepareSkillEntryState(link, destination);
    if (isSameRoute(destination)) {
      navigateWithinCurrentRoute(destination, true, { state: skillEntryState ?? undefined });
      return;
    }
    void loadRoute(destination, true, { state: skillEntryState ?? undefined });
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      if (!searchInput) return;
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
      return;
    }

    if (event.key === "Escape") handleSkillEscape(event);
  });

  window.addEventListener("popstate", (event) => {
    const state = normalizePortalHistoryState(event.state);
    const destination = new URL(location.href);
    const restoreScrollY = validScrollY(state.portalRestoreScrollY);
    if (isSameRoute(destination)) {
      navigateWithinCurrentRoute(destination, false, {
        restoreScrollY,
        scrollBehavior: "auto"
      });
      return;
    }
    void loadRoute(destination, false, {
      restoreScrollY,
      scrollBehavior: "auto"
    });
  });
}

async function loadRoute(destination: URL, push: boolean, options: RouteNavigationOptions = {}) {
  if (routeLoading) return;
  if (push && isSameRoute(destination)) {
    navigateWithinCurrentRoute(destination, true, options);
    return;
  }
  const content = document.querySelector<HTMLElement>("#portalContent");
  if (!content) return;

  routeLoading = true;
  document.body.classList.add("route-loading");
  try {
    const response = await fetch(destination.href, { headers: { Accept: "text/html" } });
    if (!response.ok) throw new Error(`Route request failed: ${response.status}`);
    const documentText = await response.text();
    const nextDocument = new DOMParser().parseFromString(documentText, "text/html");
    const nextContent = nextDocument.querySelector<HTMLElement>("#portalContent");
    const footer = document.querySelector<HTMLElement>("#portalFooter");
    const nextFooter = nextDocument.querySelector<HTMLElement>("#portalFooter");
    if (!nextContent) throw new Error("Route content is missing");

    await ensureRouteStyles(nextDocument, destination.href);
    window.cleanupSteadyflowReference?.();
    content.innerHTML = nextContent.innerHTML;
    if (footer && nextFooter) {
      footer.innerHTML = nextFooter.innerHTML;
      footer.hidden = nextFooter.hidden;
    }
    document.title = nextDocument.title;
    syncRouteBodyState(nextDocument.body);
    lastSectionNavigationId = null;
    renderedPortalRoute = portalRouteKey(destination);
    const nextLocation = portalLocationString(destination);
    const nextHistoryState = portalHistoryStateForDestination(destination, options.state ?? currentPortalHistoryState());
    if (push) history.pushState(nextHistoryState, "", nextLocation);
    else if (options.replace) history.replaceState(nextHistoryState, "", nextLocation);
    updateActiveNavigation(destination.pathname, destination.hash);
    setPrimaryNavigation(false);
    bindPageInteractions();
    createPortalIcons();
    const restoreScrollY = navigationScrollYForDestination(destination, options.restoreScrollY);
    if (restoreScrollY !== null) {
      restoreScrollPosition(restoreScrollY, options.scrollBehavior ?? "auto");
    } else if (destination.hash) {
      scrollToHash(destination.hash, options.scrollBehavior ?? "auto");
    } else {
      window.scrollTo({ top: 0, behavior: options.scrollBehavior ?? "auto" });
      scheduleHeaderSurfaceSync();
      scheduleSectionNavigationSync();
    }
  } catch {
    location.assign(destination.href);
  } finally {
    routeLoading = false;
    document.body.classList.remove("route-loading");
  }
}

function syncRouteBodyState(nextBody: HTMLElement) {
  const shouldKeepRouteLoading = document.body.classList.contains("route-loading");
  document.body.className = nextBody.className;
  if (shouldKeepRouteLoading) document.body.classList.add("route-loading");

  const nextPage = nextBody.dataset.page;
  if (nextPage) document.body.dataset.page = nextPage;
  else delete document.body.dataset.page;
}

async function ensureRouteStyles(nextDocument: Document, routeBaseUrl: string) {
  const existingStyles = currentStylesheetHrefs();
  const routeStyles = Array.from(nextDocument.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'));
  const styleLoads: Promise<void>[] = [];

  routeStyles.forEach((routeStyle) => {
    const href = normalizedStylesheetHref(routeStyle, routeBaseUrl);
    if (!href || existingStyles.has(href)) return;

    const styleLink = routeStyle.cloneNode(true) as HTMLLinkElement;
    styleLink.href = href;
    styleLoads.push(
      new Promise((resolve) => {
        const finish = () => resolve();
        styleLink.addEventListener("load", finish, { once: true });
        styleLink.addEventListener("error", finish, { once: true });
        window.setTimeout(finish, 1200);
      })
    );
    document.head.appendChild(styleLink);
    existingStyles.add(href);
  });

  cloneRouteInlineStyles(nextDocument);

  if (styleLoads.length) await Promise.all(styleLoads);
}

function cloneRouteInlineStyles(nextDocument: Document) {
  const existingInlineStyles = currentInlineStyleKeys();
  const routeInlineStyles = Array.from(nextDocument.querySelectorAll<HTMLStyleElement>("head style"));

  routeInlineStyles.forEach((routeStyle) => {
    const key = inlineStyleKey(routeStyle);
    if (!key || existingInlineStyles.has(key)) return;

    const style = routeStyle.cloneNode(true) as HTMLStyleElement;
    style.dataset.portalRouteStyle = "true";
    style.dataset.portalStyleKey = key;
    document.head.appendChild(style);
    existingInlineStyles.add(key);
  });
}

function currentStylesheetHrefs() {
  return new Set(
    Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'))
      .map((link) => normalizedStylesheetHref(link, location.href))
      .filter((href): href is string => Boolean(href))
  );
}

function normalizedStylesheetHref(link: HTMLLinkElement, baseUrl: string) {
  const href = link.getAttribute("href");
  if (!href) return null;

  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

function currentInlineStyleKeys() {
  const keys = new Set<string>();
  Array.from(document.querySelectorAll<HTMLStyleElement>("head style")).forEach((style) => {
    const key = style.dataset.portalStyleKey || inlineStyleKey(style);
    if (key) keys.add(key);
  });
  return keys;
}

function inlineStyleKey(style: HTMLStyleElement) {
  const viteId = style.getAttribute("data-vite-dev-id");
  if (viteId) return `vite:${viteId}`;

  const astroId = style.getAttribute("data-astro-id");
  if (astroId) return `astro:${astroId}`;

  const text = style.textContent?.trim();
  if (!text) return null;
  return `text:${hashString(text)}`;
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) | 0;
  }
  return `${value.length}:${(hash >>> 0).toString(36)}`;
}

function prepareSkillEntryState(link: HTMLAnchorElement, destination: URL): PortalHistoryState | null {
  if (!isSkillDetailPath(destination.pathname)) return null;

  const returnState = resolveCurrentSkillReturnState(link);
  const returnScrollY = validScrollY(returnState.scrollY) ?? 0;
  persistSkillReturnState(returnState);

  if (shouldAnchorSkillReturnToAchievements(link)) {
    history.replaceState(
      { ...currentPortalHistoryState(), portalRestoreScrollY: returnScrollY },
      "",
      returnState.url
    );
  }

  return {
    ...currentPortalHistoryState(),
    portalReturnSource: "skill-module",
    portalReturnUrl: returnState.url,
    portalReturnScrollY: returnScrollY
  };
}

function resolveCurrentSkillReturnState(link: HTMLAnchorElement): SkillReturnState {
  const shouldReturnToAchievements = shouldAnchorSkillReturnToAchievements(link);

  if (shouldReturnToAchievements) {
    const destination = new URL(location.href);
    destination.pathname = "/";
    destination.hash = "sf-achievements";
    return {
      url: `${destination.pathname}${destination.search}${destination.hash}`,
      scrollY: resolveHomeSectionReturnScrollY("sf-achievements")
    };
  }

  const scrollY = Math.max(0, Math.round(window.scrollY));
  const currentUrl = `${location.pathname}${location.search}${location.hash}`;
  return { url: currentUrl || "/", scrollY };
}

function resolveHomeSectionReturnScrollY(sectionId: string) {
  const section = document.getElementById(sectionId);
  const currentScrollY = Math.max(0, Math.round(window.scrollY));
  if (!section) return currentScrollY;

  const sectionTop = targetTopForHash(section);
  return isScrollYInsideTargetSection(currentScrollY, section, sectionTop) ? currentScrollY : sectionTop;
}

function shouldAnchorSkillReturnToAchievements(link: HTMLAnchorElement) {
  return location.pathname === "/" && Boolean(link.closest("#sf-achievements"));
}

function resolveSkillExitState(destination: URL): SkillReturnState | null {
  if (!isSkillDetailPath(location.pathname)) return null;
  if (destination.pathname !== "/" || destination.hash !== "#sf-achievements") return null;
  return readSkillReturnState() ?? { url: `${destination.pathname}${destination.search}${destination.hash}`, scrollY: null };
}

function handleSkillEscape(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !isSkillDetailPath(location.pathname) ||
    !window.matchMedia(desktopEscapeMedia).matches ||
    document.querySelector("[data-skill-detail-dialog][open]") ||
    isEditableTarget(event.target)
  ) {
    return;
  }

  const returnState = readSkillReturnState() ?? { url: "/#sf-achievements", scrollY: null };
  const destination = new URL(returnState.url, location.origin);
  const restoreScrollY = validScrollY(returnState.scrollY);
  event.preventDefault();
  void loadRoute(destination, false, {
    replace: true,
    state:
      restoreScrollY === null
        ? currentPortalHistoryState()
        : { ...currentPortalHistoryState(), portalRestoreScrollY: restoreScrollY },
    restoreScrollY,
    scrollBehavior: "auto"
  });
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
}

function isSkillDetailPath(pathname: string) {
  return pathname.startsWith("/skills/");
}

function persistSkillReturnState(returnState: SkillReturnState) {
  try {
    sessionStorage.setItem(skillReturnStorageKey, JSON.stringify(returnState));
  } catch {
    // The history state still carries the return target if session storage is unavailable.
  }
}

function readSkillReturnState(): SkillReturnState | null {
  const historyState = currentPortalHistoryState();
  const historyReturnUrl = typeof historyState.portalReturnUrl === "string" ? historyState.portalReturnUrl : null;
  const historyReturnScrollY = validScrollY(historyState.portalReturnScrollY);
  if (historyReturnUrl) return { url: historyReturnUrl, scrollY: historyReturnScrollY };

  try {
    const rawValue = sessionStorage.getItem(skillReturnStorageKey);
    if (!rawValue) return null;
    const stored = JSON.parse(rawValue) as Partial<SkillReturnState>;
    if (typeof stored.url !== "string") return null;
    const storedScrollY = validScrollY(stored.scrollY);
    return { url: stored.url, scrollY: storedScrollY };
  } catch {
    return null;
  }
}

function currentPortalHistoryState() {
  return normalizePortalHistoryState(history.state);
}

function normalizePortalHistoryState(state: unknown): PortalHistoryState {
  return state && typeof state === "object" ? (state as PortalHistoryState) : {};
}

function validScrollY(scrollY: unknown) {
  return typeof scrollY === "number" && Number.isFinite(scrollY) && scrollY >= 0 ? scrollY : null;
}

function navigationScrollYForDestination(destination: URL, requestedScrollY: unknown) {
  const requested = validScrollY(requestedScrollY);
  if (!destination.hash || !shouldPreferHashTargetForNavigation(destination)) return requested;

  const target = elementFromHash(destination.hash);
  if (!target) return requested;

  const hashScrollY = targetTopForHash(target);
  if (requested !== null && isScrollYInsideTargetSection(requested, target, hashScrollY)) return requested;
  return hashScrollY;
}

function shouldPreferHashTargetForNavigation(destination: URL) {
  if (destination.pathname !== "/" || document.body.dataset.page !== "home" || !destination.hash) return false;
  const target = elementFromHash(destination.hash);
  return Boolean(target && shouldAlignHomeSectionToViewport(target));
}

function portalLocationString(destination: URL) {
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

function portalRouteKey(destination: URL) {
  return `${destination.pathname}${destination.search}`;
}

function portalHistoryStateForDestination(destination: URL, fallbackState: PortalHistoryState = {}) {
  const nextState: PortalHistoryState = { ...fallbackState };
  if (!isSkillDetailPath(destination.pathname)) {
    delete nextState.portalReturnSource;
    delete nextState.portalReturnUrl;
    delete nextState.portalReturnScrollY;
  }
  const requestedScrollY = validScrollY(nextState.portalRestoreScrollY);
  const target = destination.hash ? elementFromHash(destination.hash) : null;
  if (target) {
    const targetScrollY = targetTopForHash(target);
    nextState.portalRestoreScrollY =
      requestedScrollY !== null && isScrollYInsideTargetSection(requestedScrollY, target, targetScrollY)
        ? requestedScrollY
        : targetScrollY;
  } else {
    delete nextState.portalRestoreScrollY;
  }
  return nextState;
}

function elementFromHash(hash: string) {
  try {
    const targetId = decodeURIComponent(hash.replace(/^#/, ""));
    return targetId ? document.getElementById(targetId) : null;
  } catch {
    return null;
  }
}

function targetScrollYForHash(hash: string) {
  const target = elementFromHash(hash);
  return target ? targetTopForHash(target) : null;
}

function alignCurrentHomeHashToPortalViewport() {
  if (document.body.dataset.page !== "home" || !location.hash) return;
  const target = elementFromHash(location.hash);
  if (!target || !shouldAlignHomeSectionToViewport(target)) return;
  if (homeHashAlignmentFrame) window.cancelAnimationFrame(homeHashAlignmentFrame);
  homeHashAlignmentFrame = window.requestAnimationFrame(() => {
    homeHashAlignmentFrame = 0;
    const targetTop = targetScrollYForHash(location.hash);
    if (targetTop === null) return;
    restoreScrollPosition(targetTop, "auto");
    updateActiveNavigation("/", location.hash);
  });
}

function restoreScrollPosition(scrollY: number, behavior: ScrollBehavior = "auto") {
  const top = Math.max(0, Math.round(scrollY));
  const restore = (restoreBehavior: ScrollBehavior = "auto") => {
    window.scrollTo({ top, behavior: restoreBehavior });
    scheduleHeaderSurfaceSync();
    scheduleSectionNavigationSync();
  };

  restore(behavior);
  requestAnimationFrame(() => {
    restore("auto");
    window.setTimeout(() => restore("auto"), 80);
    window.setTimeout(() => restore("auto"), 260);
  });
}

function isSameRoute(destination: URL) {
  return portalRouteKey(destination) === renderedPortalRoute;
}

function navigateWithinCurrentRoute(destination: URL, push: boolean, options: RouteNavigationOptions = {}) {
  const nextLocation = portalLocationString(destination);
  const currentLocation = portalLocationString(new URL(location.href));
  const nextHistoryState = portalHistoryStateForDestination(destination, options.state ?? currentPortalHistoryState());
  if (nextLocation !== currentLocation) {
    if (push) history.pushState(nextHistoryState, "", nextLocation);
    else history.replaceState(nextHistoryState, "", nextLocation);
  } else if (options.replace) {
    history.replaceState(nextHistoryState, "", nextLocation);
  }
  lastSectionNavigationId = null;
  updateActiveNavigation(destination.pathname, destination.hash);
  setPrimaryNavigation(false);
  const restoreScrollY = navigationScrollYForDestination(destination, options.restoreScrollY);
  const scrollBehavior = options.scrollBehavior ?? (push ? "smooth" : "auto");
  if (restoreScrollY !== null) {
    restoreScrollPosition(restoreScrollY, scrollBehavior);
  } else if (destination.hash) {
    scrollToHash(destination.hash, scrollBehavior);
  } else {
    window.scrollTo({ top: 0, behavior: scrollBehavior });
    scheduleHeaderSurfaceSync();
    scheduleSectionNavigationSync();
  }
}

function scrollToHash(hash: string, behavior: ScrollBehavior = "smooth") {
  const targetTop = targetScrollYForHash(hash);
  if (targetTop === null) return;
  if (behavior === "smooth") {
    window.scrollTo({ top: targetTop, behavior });
  } else {
    restoreScrollPosition(targetTop, behavior);
  }
  scheduleHeaderSurfaceSync();
  scheduleSectionNavigationSync();
  window.setTimeout(scheduleHeaderSurfaceSync, 420);
  window.setTimeout(scheduleSectionNavigationSync, 420);
}

function targetTopForHash(target: HTMLElement) {
  const absoluteTop = target.getBoundingClientRect().top + window.scrollY;
  if (shouldAlignHomeSectionToViewport(target)) {
    return Math.max(0, Math.ceil(absoluteTop) + 4);
  }

  const offset = routeScrollOffset();
  return Math.max(0, Math.round(absoluteTop - offset));
}

function shouldAlignHomeSectionToViewport(target: HTMLElement) {
  return document.body.dataset.page === "home" && fullScreenHomeSectionIds.has(target.id);
}

function isScrollYInsideTargetSection(scrollY: number, target: HTMLElement, targetTop: number) {
  const sectionHeight = Math.max(target.getBoundingClientRect().height, target.offsetHeight, window.innerHeight || 0);
  const tolerance = Math.max(24, Math.round(routeScrollOffset() * 0.5));
  return scrollY >= targetTop - tolerance && scrollY <= targetTop + sectionHeight - tolerance;
}

function routeScrollOffset() {
  const header = document.querySelector<HTMLElement>(".site-header");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const headerClearance = readRootPixelVariable("--portal-floating-nav-clearance", 92);
  return Math.max(headerHeight + 16, headerClearance);
}

function updateActiveNavigation(pathname: string, hash = location.hash, forcedNavId: string | null = null) {
  const activePath = pathname.startsWith("/p/") ? "/articles/" : pathname;
  const activeNavId = forcedNavId ?? resolveActiveNavigationId(activePath, hash);
  document.querySelectorAll<HTMLAnchorElement>(".nav-link").forEach((link) => {
    const linkPath = new URL(link.href, location.href).pathname;
    const active = activeNavId ? link.dataset.navId === activeNavId : linkPath === activePath;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function resolveActiveNavigationId(pathname: string, hash: string) {
  if (pathname === "/" && hash === "#sf-counter") return "business";
  if (pathname === "/" && hash === "#sf-achievements") return "market";
  if (pathname.startsWith("/skills/") || pathname.startsWith("/market/")) return "market";
  if (pathname.startsWith("/articles/")) return "articles";
  if (pathname.startsWith("/tools/")) return "tools";
  if (pathname.startsWith("/about/")) return "about";
  if (pathname === "/") return "home";
  return null;
}

async function checkService() {
  if (!document.querySelector("[data-service-pulse]")) return;
  try {
    const response = await fetch("/health", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("health check failed");
    updateServicePulses("online", "服务正常");
  } catch {
    updateServicePulses("offline", "服务暂不可用");
  }
}

function updateServicePulses(status: "checking" | "online" | "offline", label: string) {
  currentServiceStatus = status;
  currentServiceLabel = label;
  document.querySelectorAll<HTMLElement>("[data-service-pulse]").forEach((servicePulse) => {
    servicePulse.dataset.status = status;
    servicePulse.setAttribute("aria-label", label);
    const labelElement = servicePulse.querySelector("b");
    if (labelElement) labelElement.textContent = label;
  });
}

async function hydratePosts() {
  if (!postGrid) return;

  try {
    const [postResponse, searchResponse] = await Promise.all([
      fetch("/api/posts", { headers: { Accept: "application/json" } }),
      fetch("/api/search-index", { headers: { Accept: "application/json" } })
    ]);
    if (!postResponse.ok) throw new Error("posts unavailable");

    const postPayload = (await postResponse.json()) as { items: PostListItem[] };
    posts = postPayload.items;

    if (searchResponse.ok) {
      const searchPayload = (await searchResponse.json()) as { documents: SearchDocument[] };
      searchDocuments = searchPayload.documents;
    }

    renderPosts(searchInput?.value ?? "");
    updateHomeStats();
  } catch {
    // Static seed cards remain readable when the API is unavailable.
  }
}

async function hydrateMarket() {
  const grid = document.querySelector<HTMLElement>("#marketProductGrid");
  const filters = document.querySelector<HTMLElement>("#marketFilters");
  const count = document.querySelector<HTMLElement>("#marketCount");
  const empty = document.querySelector<HTMLElement>("#marketEmpty");
  const dialog = document.querySelector<HTMLDialogElement>("#productDialog");
  const dialogContent = document.querySelector<HTMLElement>("#productDialogContent");
  const closeDialog = document.querySelector<HTMLButtonElement>("#productDialogClose");
  const orderDialog = document.querySelector<HTMLDialogElement>("#orderDialog");
  const orderDialogContent = document.querySelector<HTMLElement>("#orderDialogContent");
  const closeOrderDialog = document.querySelector<HTMLButtonElement>("#orderDialogClose");
  if (!grid || !filters || !count || !empty || !dialog || !dialogContent || !closeDialog || !orderDialog || !orderDialogContent || !closeOrderDialog) return;

  let products: StoreProduct[] = [];
  let category = "all";

  const render = () => {
    const visible = products.filter((product) => category === "all" || product.category === category);
    grid.innerHTML = visible.map(renderMarketProduct).join("");
    empty.hidden = visible.length > 0;
    count.textContent = `${visible.length} 个在售Skill`;
    grid.querySelectorAll<HTMLButtonElement>("[data-product-slug]").forEach((button) => {
      button.addEventListener("click", () => {
        const product = products.find((item) => item.slug === button.dataset.productSlug);
        if (!product) return;
        dialogContent.innerHTML = renderProductDialog(product);
        dialog.showModal();
        bindProductDialogActions(product, dialog, orderDialog, orderDialogContent);
        createPortalIcons();
      });
    });
    createPortalIcons();
  };

  filters.querySelectorAll<HTMLButtonElement>("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      category = button.dataset.category ?? "all";
      filters.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
      render();
    });
  });

  closeDialog.addEventListener("click", () => dialog.close());
  closeOrderDialog.addEventListener("click", () => orderDialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  orderDialog.addEventListener("click", (event) => {
    if (event.target === orderDialog) orderDialog.close();
  });

  try {
    const productUrl = new URL("/api/products", location.origin);
    const ref = lockedReferral();
    if (ref) productUrl.searchParams.set("ref", ref);
    const response = await fetch(productUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("products unavailable");
    products = ((await response.json()) as { items: StoreProduct[] }).items;
    render();
    const requestedProduct = new URLSearchParams(location.search).get("product");
    const product = products.find((item) => item.slug === requestedProduct);
    if (product) {
      dialogContent.innerHTML = renderProductDialog(product);
      dialog.showModal();
      bindProductDialogActions(product, dialog, orderDialog, orderDialogContent);
      createPortalIcons();
    }
  } catch {
    count.textContent = "Skill加载失败";
    empty.hidden = false;
  }
}

async function hydrateTools() {
  const grid = document.querySelector<HTMLElement>("#toolsGrid");
  const filters = document.querySelector<HTMLElement>("#toolsCategoryFilters");
  const count = document.querySelector<HTMLElement>("#toolsCount");
  const empty = document.querySelector<HTMLElement>("#toolsEmpty");
  if (!grid || !filters || !count || !empty) return;
  let tools: CreatorTool[] = [];
  let category = "all";
  const render = () => {
    const visible = tools.filter((tool) => category === "all" || tool.category === category);
    grid.innerHTML = visible.map(renderToolCard).join("");
    count.textContent = `${visible.length} 个工具`;
    empty.hidden = visible.length > 0;
    grid.querySelectorAll<HTMLButtonElement>("[data-share-tool]").forEach((button) => {
      button.addEventListener("click", () => {
        const tool = tools.find((item) => item.slug === button.dataset.shareTool);
        if (tool) void shareTool(tool);
      });
    });
    createPortalIcons();
  };
  filters.querySelectorAll<HTMLButtonElement>("[data-tool-category]").forEach((button) => {
    button.addEventListener("click", () => {
      category = button.dataset.toolCategory ?? "all";
      filters.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
      render();
    });
  });
  try {
    const response = await fetch("/api/tools", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("tools unavailable");
    tools = ((await response.json()) as { items: CreatorTool[] }).items;
    render();
  } catch {
    count.textContent = "工具加载失败";
    empty.hidden = false;
  }
}

function renderToolCard(tool: CreatorTool) {
  const cover = tool.coverUrl
    ? `<img src="${escapeAttribute(tool.coverUrl)}" alt="${escapeAttribute(tool.title)}" />`
    : `<span class="tool-card-mark"><i data-lucide="wrench"></i></span>`;
  return `<article class="tool-card"><div class="tool-card-cover">${cover}</div><div class="tool-card-body"><div class="tool-card-topline"><span>${escapeHtml(toolCategoryLabel(tool.category))}</span><button class="tool-share-button" type="button" data-share-tool="${escapeAttribute(tool.slug)}" aria-label="分享 ${escapeAttribute(tool.title)}" title="分享"><i data-lucide="share-2"></i></button></div><h2>${escapeHtml(tool.title)}</h2><p>${escapeHtml(tool.summary)}</p><div class="tool-card-footer"><a class="button primary" href="${escapeAttribute(tool.url)}" target="_blank" rel="noopener noreferrer">访问工具 <i data-lucide="arrow-up-right"></i></a></div></div></article>`;
}

async function shareTool(tool: CreatorTool) {
  const shareData = { title: tool.title, text: tool.summary, url: tool.url };
  const canShare = typeof navigator.share === "function";
  try {
    if (canShare) await navigator.share(shareData);
    else await navigator.clipboard.writeText(tool.url);
    showPortalToast(canShare ? "分享面板已打开" : "工具链接已复制");
  } catch {
    // A dismissed native share sheet is not an error to show the visitor.
  }
}

function renderMarketProduct(product: StoreProduct) {
  const displayPrice = product.customerPriceCents ?? product.priceCents;
  const availability = product.stock === 0 ? `已售出 ${product.soldCount} · 暂时售罄` : product.stock < 0 ? `已售出 ${product.soldCount} · 不限量` : `已售出 ${product.soldCount} · 库存 ${product.stock}`;
  const cover = product.coverUrl
    ? `<img src="${escapeAttribute(product.coverUrl)}" alt="${escapeAttribute(product.title)}" />`
    : `<span class="market-product-placeholder"><i data-lucide="package"></i></span>`;
  const compareAt = product.compareAtCents ? `<del>${formatCurrency(product.compareAtCents, product.currency)}</del>` : "";
  return `<article class="market-product-card">
    <div class="market-product-cover">${cover}</div>
    <div class="market-product-body">
      <span class="market-product-category">${escapeHtml(productCategoryLabel(product.category))}</span>
      <h2>${escapeHtml(product.title)}</h2>
      <p>${escapeHtml(product.summary)}</p>
    <div class="market-product-bottom"><div class="market-product-price"><strong>${formatCurrency(displayPrice, product.currency)}</strong>${compareAt}</div><span>${availability}</span></div>
      <button type="button" data-product-slug="${escapeAttribute(product.slug)}">查看详情 <i data-lucide="arrow-up-right"></i></button>
    </div>
  </article>`;
}

function renderProductDialog(product: StoreProduct) {
  const displayPrice = product.customerPriceCents ?? product.priceCents;
  const cover = product.coverUrl ? `<img src="${escapeAttribute(product.coverUrl)}" alt="${escapeAttribute(product.title)}" />` : "";
  const availability = product.stock === 0 ? `已售出 ${product.soldCount} · 暂时售罄` : product.stock < 0 ? `已售出 ${product.soldCount} · 不限量供应` : `已售出 ${product.soldCount} · 当前库存 ${product.stock}`;
  return `<div class="product-dialog-cover">${cover}</div><p class="section-kicker">${escapeHtml(productCategoryLabel(product.category))}</p><h2>${escapeHtml(product.title)}</h2><p class="product-dialog-summary">${escapeHtml(product.summary)}</p><div class="product-dialog-price">${formatCurrency(displayPrice, product.currency)} <span>${availability}</span></div><div class="product-dialog-description">${escapeHtml(product.description).replace(/\n/g, "<br>")}</div><div class="product-dialog-actions"><button class="button primary" type="button" data-order-product ${product.stock === 0 ? "disabled" : ""}>立即下单</button></div>`;
}

function bindProductDialogActions(product: StoreProduct, productDialog: HTMLDialogElement, orderDialog: HTMLDialogElement, content: HTMLElement) {
  productDialog.querySelector<HTMLButtonElement>("[data-order-product]")?.addEventListener("click", () => {
    content.innerHTML = renderPrivateContactPanel(product);
    productDialog.close();
    orderDialog.showModal();
    createPortalIcons();
  });
}

function renderPrivateContactPanel(product: StoreProduct) {
  const displayPrice = product.customerPriceCents ?? product.priceCents;
  return `<p class="section-kicker">Wechat</p><h2>添加微信了解这个Skill</h2><p class="product-dialog-summary">${escapeHtml(product.title)} · ${formatCurrency(displayPrice, product.currency)}</p><div class="private-contact-card"><div class="wechat-qr-placeholder"><i data-lucide="scan-line"></i><strong>微信二维码待放置</strong><span>后续上传二维码后，这里会展示扫码入口。</span></div><div><strong>添加时请备注想了解的Skill名称</strong><p>我会在微信里确认具体内容、购买方式，并在确认后发送对应飞书知识库和视频入口。</p></div></div><p class="settlement-note">知识库会按框架和场景持续整理，购买后可查看对应内容的后续更新。</p>`;
}

function bindSkillDetailDialog() {
  const dialog = document.querySelector<HTMLDialogElement>("[data-skill-detail-dialog]");
  if (!dialog || dialog.dataset.skillDialogReady === "true") return;

  const triggers = document.querySelectorAll<HTMLElement>("[data-skill-detail-open]");
  if (!triggers.length) return;

  dialog.dataset.skillDialogReady = "true";
  const versionButtons = dialog.querySelectorAll<HTMLButtonElement>("[data-skill-version-button]");
  const versionPanels = dialog.querySelectorAll<HTMLElement>("[data-skill-version-panel]");
  const caseTriggers = dialog.querySelectorAll<HTMLButtonElement>("[data-skill-case-trigger]");
  const stagePreviewTriggers = dialog.querySelectorAll<HTMLButtonElement>("[data-skill-stage-preview]");
  const beforeStageImage = dialog.querySelector<HTMLImageElement>('[data-skill-stage-image="before"]');
  const afterStageImage = dialog.querySelector<HTMLImageElement>('[data-skill-stage-image="after"]');
  const imagePreview = dialog.querySelector<HTMLElement>("[data-skill-image-preview]");
  const imagePreviewGrid = dialog.querySelector<HTMLElement>("[data-skill-image-preview-grid]");
  const imagePreviewTriggers = dialog.querySelectorAll<HTMLElement>("[data-skill-image-preview-trigger]");
  const imagePreviewCloseButtons = dialog.querySelectorAll<HTMLButtonElement>("[data-skill-image-preview-close]");
  const qrPreview = dialog.querySelector<HTMLElement>("[data-skill-qr-preview]");
  const qrPreviewOpenButtons = dialog.querySelectorAll<HTMLButtonElement>("[data-skill-qr-open]");
  const qrPreviewPrimaryCloseButton = dialog.querySelector<HTMLButtonElement>(".skill-qr-preview-close");
  let lastFocusedImagePreviewTrigger: HTMLElement | null = null;
  let lastFocusedQrTrigger: HTMLElement | null = null;

  const selectCase = (trigger: HTMLButtonElement) => {
    const beforeSrc = trigger.dataset.skillCaseBefore;
    const afterSrc = trigger.dataset.skillCaseAfter;
    if (!beforeSrc || !afterSrc || !beforeStageImage || !afterStageImage) return;

    const beforeLabel = trigger.dataset.skillCaseBeforeLabel ?? "替换前示例";
    const afterLabel = trigger.dataset.skillCaseAfterLabel ?? "替换后示例";
    const previewSources = JSON.stringify([beforeSrc, afterSrc]);

    beforeStageImage.src = beforeSrc;
    beforeStageImage.alt = beforeLabel;
    afterStageImage.src = afterSrc;
    afterStageImage.alt = afterLabel;

    stagePreviewTriggers.forEach((button) => {
      const isAfter = button.dataset.skillStagePreview === "after";
      const previewSrc = isAfter ? afterSrc : beforeSrc;
      const previewLabel = isAfter ? afterLabel : beforeLabel;
      button.setAttribute("data-skill-preview-src", previewSrc);
      button.setAttribute("data-skill-preview-srcs", previewSources);
      button.setAttribute("aria-label", `放大预览 ${previewLabel}`);
    });

    caseTriggers.forEach((button) => {
      const isSelected = button === trigger;
      button.classList.toggle("active", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  };

  const selectVersion = (versionId: string) => {
    versionButtons.forEach((button) => {
      const isSelected = button.dataset.skillVersionButton === versionId;
      button.classList.toggle("active", isSelected);
      button.setAttribute("aria-selected", String(isSelected));
      button.tabIndex = isSelected ? 0 : -1;
    });

    versionPanels.forEach((panel) => {
      panel.hidden = panel.dataset.skillVersionPanel !== versionId;
    });

    const defaultCase = Array.from(caseTriggers).find((button) => button.dataset.skillCaseVersion === versionId);
    if (defaultCase) selectCase(defaultCase);
  };

  const isImagePreviewOpen = () => imagePreview ? !imagePreview.hidden : false;
  const isQrPreviewOpen = () => qrPreview ? !qrPreview.hidden : false;

  const previewSourcesForTrigger = (trigger: HTMLElement) => {
    const groupedSources = trigger.getAttribute("data-skill-preview-srcs");
    if (groupedSources) {
      try {
        const parsed = JSON.parse(groupedSources);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
        }
      } catch {
        // Fall through to the single-image source when JSON is malformed.
      }
    }

    const singleSource = trigger.getAttribute("data-skill-preview-src");
    return singleSource ? [singleSource] : [];
  };

  const closeImagePreview = (options: { restoreFocus?: boolean } = {}) => {
    if (!imagePreview || !imagePreviewGrid) return;
    imagePreview.hidden = true;
    imagePreviewGrid.replaceChildren();
    imagePreviewGrid.removeAttribute("data-preview-count");

    if (options.restoreFocus !== false && lastFocusedImagePreviewTrigger) {
      lastFocusedImagePreviewTrigger.focus({ preventScroll: true });
    }
    lastFocusedImagePreviewTrigger = null;
  };

  const closeQrPreview = (options: { restoreFocus?: boolean } = {}) => {
    if (!qrPreview) return;
    qrPreview.hidden = true;
    delete dialog.dataset.skillQrActive;

    if (options.restoreFocus !== false && lastFocusedQrTrigger) {
      lastFocusedQrTrigger.focus({ preventScroll: true });
    }
    lastFocusedQrTrigger = null;
  };

  const openImagePreview = (trigger: HTMLElement) => {
    if (!imagePreview || !imagePreviewGrid) return;
    const sources = previewSourcesForTrigger(trigger);
    if (!sources.length) return;

    closeQrPreview({ restoreFocus: false });
    lastFocusedImagePreviewTrigger = trigger;
    imagePreviewGrid.replaceChildren();
    imagePreviewGrid.dataset.previewCount = String(Math.min(sources.length, 2));
    sources.slice(0, 2).forEach((src, index) => {
      const image = document.createElement("img");
      image.src = src;
      image.alt = `${trigger.getAttribute("aria-label") ?? "图片放大预览"} ${index + 1}`;
      imagePreviewGrid.appendChild(image);
    });
    imagePreview.hidden = false;
    imagePreviewCloseButtons[0]?.focus({ preventScroll: true });
  };

  const openQrPreview = (trigger: HTMLElement) => {
    if (!qrPreview) return;
    closeImagePreview({ restoreFocus: false });
    lastFocusedQrTrigger = trigger;
    qrPreview.hidden = false;
    dialog.dataset.skillQrActive = "true";
    qrPreviewPrimaryCloseButton?.focus({ preventScroll: true });
  };

  const openDialog = () => {
    if (dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    document.body.style.overflow = "hidden";
  };

  const closeDialog = () => {
    closeImagePreview({ restoreFocus: false });
    closeQrPreview({ restoreFocus: false });
    if (dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      if ((event.target as Element | null)?.closest("a, button")) return;
      openDialog();
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openDialog();
    });
  });

  dialog.querySelectorAll<HTMLButtonElement>("[data-skill-detail-close]").forEach((button) => {
    button.addEventListener("click", closeDialog);
  });

  dialog.querySelectorAll<HTMLAnchorElement>("a[data-portal-route]").forEach((link) => {
    link.addEventListener("click", () => closeDialog());
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (isQrPreviewOpen()) {
      event.preventDefault();
      event.stopPropagation();
      closeQrPreview();
      return;
    }

    if (!isImagePreviewOpen()) return;
    event.preventDefault();
    event.stopPropagation();
    closeImagePreview();
  });

  dialog.addEventListener("close", () => {
    closeImagePreview({ restoreFocus: false });
    closeQrPreview({ restoreFocus: false });
    document.body.style.overflow = "";
  });

  dialog.addEventListener("cancel", (event) => {
    if (isQrPreviewOpen()) {
      event.preventDefault();
      closeQrPreview();
      return;
    }

    if (isImagePreviewOpen()) {
      event.preventDefault();
      closeImagePreview();
      return;
    }
    document.body.style.overflow = "";
  });

  imagePreviewTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openImagePreview(trigger));
  });

  qrPreviewOpenButtons.forEach((button) => {
    button.addEventListener("click", () => openQrPreview(button));
  });

  qrPreview?.addEventListener("click", (event) => {
    if (!(event.target as Element | null)?.closest("[data-skill-qr-close]")) return;
    closeQrPreview();
  });

  caseTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const versionId = trigger.dataset.skillCaseVersion;
      if (versionId) selectVersion(versionId);
      else selectCase(trigger);
    });
  });

  imagePreviewCloseButtons.forEach((button) => {
    button.addEventListener("click", () => closeImagePreview());
  });

  versionButtons.forEach((button, index) => {
    button.tabIndex = button.classList.contains("active") ? 0 : -1;

    button.addEventListener("click", () => {
      const versionId = button.dataset.skillVersionButton;
      if (versionId) selectVersion(versionId);
    });

    button.addEventListener("keydown", (event) => {
      const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!offset) return;

      event.preventDefault();
      const nextIndex = (index + offset + versionButtons.length) % versionButtons.length;
      const nextButton = versionButtons[nextIndex];
      const versionId = nextButton?.dataset.skillVersionButton;
      if (!nextButton || !versionId) return;
      selectVersion(versionId);
      nextButton.focus({ preventScroll: true });
    });
  });
}

async function hydrateAffiliateDashboard() {
  const form = document.querySelector<HTMLFormElement>("#affiliateAccessForm");
  const dashboard = document.querySelector<HTMLElement>("#affiliateDashboard");
  if (!form || !dashboard) return;
  form.addEventListener("submit", (event) => void accessAffiliateDashboard(event, form, dashboard));
  document.querySelector<HTMLButtonElement>("#copyAffiliateLink")?.addEventListener("click", () => void copyAffiliateShareLink());
  document.querySelector<HTMLButtonElement>("#affiliateLogout")?.addEventListener("click", async () => {
    await fetch("/api/affiliate/logout", { method: "POST" });
    dashboard.hidden = true;
    form.hidden = false;
  });
  try {
    const response = await fetch("/api/affiliate/dashboard", { headers: { Accept: "application/json" } });
    if (response.ok) {
      renderAffiliateDashboard(await response.json() as { shareUrl: string; dashboard: AffiliateDashboard }, form, dashboard);
      void hydrateAffiliatePricing();
    }
  } catch {
    // Anonymous visitors stay on the access form.
  }
}

async function accessAffiliateDashboard(event: SubmitEvent, form: HTMLFormElement, dashboard: HTMLElement) {
  event.preventDefault();
  const data = new FormData(form);
  const error = document.querySelector<HTMLElement>("#affiliateAccessError");
  const submit = form.querySelector<HTMLButtonElement>("button[type=submit]");
  if (error) error.hidden = true;
  if (submit) submit.disabled = true;
  try {
    const response = await fetch("/api/affiliate/access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ wechatId: data.get("wechatId"), password: data.get("password") })
    });
    const result = await response.json() as { shareUrl?: string; dashboard?: AffiliateDashboard; generatedPassword?: string; error?: { message?: string } };
    if (!response.ok || !result.dashboard || !result.shareUrl) throw new Error(result.error?.message || "查询失败");
    renderAffiliateDashboard({ shareUrl: productShareUrl(result.shareUrl), dashboard: result.dashboard, generatedPassword: result.generatedPassword }, form, dashboard);
    void hydrateAffiliatePricing();
  } catch (reason) {
    if (error) {
      error.textContent = reason instanceof Error ? reason.message : "查询失败，请稍后再试";
      error.hidden = false;
    }
  } finally {
    if (submit) submit.disabled = false;
  }
}

function renderAffiliateDashboard(result: { shareUrl: string; dashboard: AffiliateDashboard; generatedPassword?: string }, form: HTMLFormElement, panel: HTMLElement) {
  form.hidden = true;
  panel.hidden = false;
  const shareInput = document.querySelector<HTMLInputElement>("#affiliateShareUrl");
  if (shareInput) shareInput.value = productShareUrl(result.shareUrl);
  const passwordNotice = document.querySelector<HTMLElement>("#generatedPasswordNotice");
  if (passwordNotice) {
    passwordNotice.hidden = !result.generatedPassword;
    passwordNotice.innerHTML = result.generatedPassword ? `<strong>请立即保存查询密码</strong><code>${escapeHtml(result.generatedPassword)}</code><span>密码仅展示这一次，之后查询推广数据需要使用。</span>` : "";
  }
  const stats = document.querySelector<HTMLElement>("#affiliateStats");
  if (stats) stats.innerHTML = [
    ["总点击", result.dashboard.totalClicks],
    ["独立访客", result.dashboard.uniqueClicks],
    ["成交订单", result.dashboard.completedOrders],
    ["待结算", formatCurrency(result.dashboard.pendingCommissionCents, "CNY")],
    ["已结算", formatCurrency(result.dashboard.paidCommissionCents, "CNY")]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
  const orders = document.querySelector<HTMLElement>("#affiliateOrders");
  if (orders) orders.innerHTML = result.dashboard.orders.length
    ? result.dashboard.orders.map(renderAffiliateOrder).join("")
    : `<p class="affiliate-no-orders">暂无订单记录</p>`;
  const defaultMarkup = document.querySelector<HTMLInputElement>("#affiliateDefaultMarkup");
  if (defaultMarkup && result.dashboard.affiliate.defaultMarkupPercent !== undefined) defaultMarkup.value = String(result.dashboard.affiliate.defaultMarkupPercent);
  createPortalIcons();
}

async function hydrateAffiliatePricing() {
  const list = document.querySelector<HTMLElement>("#affiliateProductPricing");
  if (!list) return;
  const response = await fetch("/api/affiliate/catalog", { headers: { Accept: "application/json" } });
  if (!response.ok) return;
  const items = ((await response.json()) as { items: AffiliateProduct[] }).items;
  list.innerHTML = items.length
    ? items.map((item) => `<label class="affiliate-product-price-row"><input type="checkbox" data-pricing-product="${escapeAttribute(item.id)}" /><span><strong>${escapeHtml(item.title)}</strong><small>管理员价 ${formatCurrency(item.priceCents, item.currency)} · 专属价 ${formatCurrency(item.customerPriceCents, item.currency)}</small></span><b>${item.markupPercent}%</b></label>`).join("")
    : `<p class="affiliate-no-orders">暂无已发布商品</p>`;
  document.querySelector<HTMLButtonElement>("#applyAffiliateDefault")?.addEventListener("click", () => void applyAffiliateMarkup(null));
  document.querySelector<HTMLButtonElement>("#applyAffiliateSelected")?.addEventListener("click", () => {
    const ids = [...list.querySelectorAll<HTMLInputElement>("[data-pricing-product]:checked")].map((input) => input.dataset.pricingProduct).filter((id): id is string => Boolean(id));
    void applyAffiliateMarkup(ids);
  });
}

async function applyAffiliateMarkup(productIds: string[] | null) {
  const input = document.querySelector<HTMLInputElement>(productIds === null ? "#affiliateDefaultMarkup" : "#affiliateSelectedMarkup");
  const markupPercent = Number(input?.value ?? 0);
  if (!Number.isInteger(markupPercent) || markupPercent < 0 || markupPercent > 1000) {
    showPortalToast("加价比例需在 0% 到 1000% 之间");
    return;
  }
  const response = await fetch("/api/affiliate/markups", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ markupPercent, productIds }) });
  if (!response.ok) {
    showPortalToast("专属价格保存失败");
    return;
  }
  showPortalToast("专属价格已更新");
  await hydrateAffiliatePricing();
}

function renderAffiliateOrder(order: AffiliateOrder) {
  return `<article><div><strong>${escapeHtml(order.productTitle)}</strong><span>${escapeHtml(order.orderCode)} · ${formatDate(order.createdAt)}</span></div><div><strong>${formatCurrency(order.priceCents, order.currency)}</strong><span>佣金 ${formatCurrency(order.commissionCents, order.currency)}</span></div><div><span>${orderStatusLabel(order.orderStatus)}</span><b>${commissionStatusLabel(order.commissionStatus)}</b></div></article>`;
}

async function copyAffiliateShareLink() {
  const input = document.querySelector<HTMLInputElement>("#affiliateShareUrl");
  if (!input) return;
  await navigator.clipboard.writeText(input.value);
  showPortalToast("专属链接已复制");
}

function productShareUrl(shareUrl: string) {
  const product = new URLSearchParams(location.search).get("product");
  if (!product) return shareUrl;
  const url = new URL(shareUrl);
  url.searchParams.set("product", product);
  return url.toString();
}

function renderPosts(rawQuery: string) {
  if (!postGrid || posts.length === 0) return;
  const query = rawQuery.trim().toLocaleLowerCase("zh-CN");
  const searchBySlug = new Map(searchDocuments.map((document) => [document.slug, document]));
  let filtered = posts.filter((post) => {
    if (!query) return true;
    const document = searchBySlug.get(post.slug);
    return [post.title, post.excerpt, document?.title, document?.excerpt, document?.body]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("zh-CN").includes(query));
  });

  const limit = Number(postGrid.dataset.limit || 0);
  if (limit > 0) filtered = filtered.slice(0, limit);

  postGrid.innerHTML = filtered.map((post, index) => renderPostCard(post, index, Boolean(limit))).join("");
  emptyState?.toggleAttribute("hidden", filtered.length > 0);
  const count = document.querySelector<HTMLElement>("#articleCount");
  if (count) count.textContent = String(filtered.length);
  if (searchMeta) searchMeta.textContent = query ? `找到 ${filtered.length} 篇匹配内容` : "按最新发布排序";
  createPortalIcons();
}

function renderPostCard(post: PostListItem, index: number, home: boolean) {
  const featured = home && index === 0 ? " featured" : "";
  const href = articlePermalinkPath(post.slug, lockedReferral());
  return `<article class="post-card${featured}">
    <a href="${escapeAttribute(href)}" data-portal-route aria-label="阅读 ${escapeHtml(post.title)}">
      <div class="post-card-topline"><span>${featured ? "最新文章" : "文章"}</span><time datetime="${escapeHtml(post.createdAt)}">${formatDate(post.createdAt)}</time></div>
      <h${home ? "3" : "2"}>${escapeHtml(post.title)}</h${home ? "3" : "2"}>
      <p>${escapeHtml(post.excerpt || "打开文章，继续阅读完整内容。")}</p>
      <div class="post-card-meta"><span>${post.viewCount} 阅读</span><span>${post.commentCount} 评论</span><i data-lucide="arrow-up-right"></i></div>
    </a>
  </article>`;
}

function updateHomeStats() {
  const postCount = document.querySelector<HTMLElement>("#heroPostCount");
  const viewCount = document.querySelector<HTMLElement>("#heroViewCount");
  const commentCount = document.querySelector<HTMLElement>("#heroCommentCount");
  const latestLink = document.querySelector<HTMLAnchorElement>("#latestArticleLink");
  if (postCount) postCount.textContent = String(posts.length);
  if (viewCount) viewCount.textContent = formatNumber(posts.reduce((sum, post) => sum + post.viewCount, 0));
  if (commentCount) commentCount.textContent = formatNumber(posts.reduce((sum, post) => sum + post.commentCount, 0));
  if (latestLink && posts[0]) latestLink.href = articlePermalinkPath(posts[0].slug, lockedReferral());
}

function lockedReferral(): string | null {
  return null;
}

function addLockedReferral(url: URL) {
  const ref = lockedReferral();
  if (ref) url.searchParams.set("ref", ref);
}

function propagateReferralLinks() {
  const ref = lockedReferral();
  document.querySelectorAll<HTMLAnchorElement>("a[data-portal-route]").forEach((link) => {
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (ref) url.searchParams.set("ref", ref);
    else url.searchParams.delete("ref");
    link.href = url.toString();
  });
}

function orderStatusLabel(status: AffiliateOrder["orderStatus"]) {
  return ({ pending: "待联系", completed: "已成交", canceled: "已取消" } as const)[status];
}

function commissionStatusLabel(status: AffiliateOrder["commissionStatus"]) {
  return ({ not_due: "无需结算", pending: "待支付", paid: "已支付" } as const)[status];
}

function showPortalToast(message: string, options: { center?: boolean; success?: boolean; duration?: number } = {}) {
  const toast = document.querySelector<HTMLElement>("#portalToast");
  if (!toast) return;
  window.clearTimeout(portalToastTimer);
  toast.textContent = message;
  toast.classList.toggle("portal-toast-center", options.center === true);
  toast.classList.toggle("portal-toast-success", options.success === true);
  toast.classList.add("is-visible");
  portalToastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, options.duration ?? 1800);
}

function createPortalIcons() {
  createIcons({ icons });
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", { notation: value >= 10000 ? "compact" : "standard" }).format(value);
}

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: currency || "CNY", minimumFractionDigits: 2 }).format(cents / 100);
}

function productCategoryLabel(category: string) {
  return ({ service: "商业实战Skill", digital: "飞书知识库", software: "AI工具", other: "其它" } as Record<string, string>)[category] ?? "其它";
}

function toolCategoryLabel(category: string) {
  return ({ writing: "文案", design: "图片视频", productivity: "运营效率", other: "其它" } as Record<string, string>)[category] ?? "其它";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character] ?? character);
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}
