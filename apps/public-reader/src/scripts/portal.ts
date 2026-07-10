import { createIcons, icons } from "lucide";

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
  compareAtCents: number | null;
  currency: string;
  stock: number;
  coverUrl: string | null;
  status: "published";
};

const themeKey = "fp_theme_v1";
const root = document.documentElement;
const navToggle = document.querySelector<HTMLButtonElement>("#navToggle");
const primaryNav = document.querySelector<HTMLElement>("#primaryNav");
const themeButton = document.querySelector<HTMLButtonElement>("#portalThemeBtn");
const servicePulse = document.querySelector<HTMLElement>("#servicePulse");
let postGrid = document.querySelector<HTMLElement>("#portalPostGrid");
let searchInput = document.querySelector<HTMLInputElement>("#portalSearchInput");
let searchMeta = document.querySelector<HTMLElement>("#articleSearchMeta");
let emptyState = document.querySelector<HTMLElement>("#emptyArticles");
let routeLoading = false;

let posts: PostListItem[] = [];
let searchDocuments: SearchDocument[] = [];

initTheme();
bindNavigation();
bindRouteNavigation();
bindPageInteractions();
createPortalIcons();
void checkService();

function initTheme() {
  const saved = localStorage.getItem(themeKey);
  root.dataset.theme = saved === "light" ? "light" : "dark";
  updateThemeIcon();

  themeButton?.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(themeKey, root.dataset.theme);
    updateThemeIcon();
  });
}

function updateThemeIcon() {
  if (!themeButton) return;
  themeButton.innerHTML = `<i data-lucide="${root.dataset.theme === "dark" ? "sun" : "moon"}"></i>`;
  createPortalIcons();
}

function bindNavigation() {
  navToggle?.addEventListener("click", () => {
    const open = primaryNav?.classList.toggle("open") ?? false;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
    navToggle.innerHTML = `<i data-lucide="${open ? "x" : "menu"}"></i>`;
    createPortalIcons();
  });

  document.addEventListener("click", (event) => {
    if (!primaryNav?.classList.contains("open")) return;
    const target = event.target as Node;
    if (primaryNav.contains(target) || navToggle?.contains(target)) return;
    primaryNav.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
}

function bindPageInteractions() {
  postGrid = document.querySelector<HTMLElement>("#portalPostGrid");
  searchInput = document.querySelector<HTMLInputElement>("#portalSearchInput");
  searchMeta = document.querySelector<HTMLElement>("#articleSearchMeta");
  emptyState = document.querySelector<HTMLElement>("#emptyArticles");

  if (searchInput) {
    const requestedQuery = new URLSearchParams(location.search).get("q")?.trim() ?? "";
    searchInput.value = requestedQuery;
    searchInput.addEventListener("input", () => renderPosts(searchInput?.value ?? ""));
  }

  if (postGrid) void hydratePosts();
  void hydrateMarket();
}

function bindRouteNavigation() {
  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    const link = target?.closest<HTMLAnchorElement>("a[data-portal-route]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin) return;
    event.preventDefault();
    void loadRoute(destination, true);
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      if (!searchInput) return;
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  window.addEventListener("popstate", () => {
    void loadRoute(new URL(location.href), false);
  });
}

async function loadRoute(destination: URL, push: boolean) {
  if (routeLoading || (push && destination.pathname === location.pathname && destination.search === location.search)) return;
  const content = document.querySelector<HTMLElement>("#portalContent");
  if (!content) return;

  routeLoading = true;
  document.body.classList.add("route-loading");
  try {
    const response = await fetch(destination.href, { headers: { "X-FreedomPost-Route": "1" } });
    if (!response.ok) throw new Error(`Route request failed: ${response.status}`);
    const documentText = await response.text();
    const nextDocument = new DOMParser().parseFromString(documentText, "text/html");
    const nextContent = nextDocument.querySelector<HTMLElement>("#portalContent");
    const footer = document.querySelector<HTMLElement>("#portalFooter");
    const nextFooter = nextDocument.querySelector<HTMLElement>("#portalFooter");
    if (!nextContent) throw new Error("Route content is missing");

    content.innerHTML = nextContent.innerHTML;
    if (footer && nextFooter) {
      footer.innerHTML = nextFooter.innerHTML;
      footer.hidden = nextFooter.hidden;
    }
    document.title = nextDocument.title;
    document.body.dataset.page = nextDocument.body.dataset.page ?? "";
    if (push) history.pushState({}, "", `${destination.pathname}${destination.search}${destination.hash}`);
    updateActiveNavigation(destination.pathname);
    primaryNav?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    bindPageInteractions();
    createPortalIcons();
  } catch {
    location.assign(destination.href);
  } finally {
    routeLoading = false;
    document.body.classList.remove("route-loading");
  }
}

function updateActiveNavigation(pathname: string) {
  document.querySelectorAll<HTMLAnchorElement>(".nav-link").forEach((link) => {
    const linkPath = new URL(link.href, location.href).pathname;
    const active = linkPath === pathname;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

async function checkService() {
  if (!servicePulse) return;
  try {
    const response = await fetch("/health", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("health check failed");
    servicePulse.dataset.status = "online";
    const label = servicePulse.querySelector("b");
    if (label) label.textContent = "服务正常";
  } catch {
    servicePulse.dataset.status = "offline";
    const label = servicePulse.querySelector("b");
    if (label) label.textContent = "服务暂不可用";
  }
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
  if (!grid || !filters || !count || !empty || !dialog || !dialogContent || !closeDialog) return;

  let products: StoreProduct[] = [];
  let category = "all";

  const render = () => {
    const visible = products.filter((product) => category === "all" || product.category === category);
    grid.innerHTML = visible.map(renderMarketProduct).join("");
    empty.hidden = visible.length > 0;
    count.textContent = `${visible.length} 件在售商品`;
    grid.querySelectorAll<HTMLButtonElement>("[data-product-slug]").forEach((button) => {
      button.addEventListener("click", () => {
        const product = products.find((item) => item.slug === button.dataset.productSlug);
        if (!product) return;
        dialogContent.innerHTML = renderProductDialog(product);
        dialog.showModal();
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
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  try {
    const response = await fetch("/api/products", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("products unavailable");
    products = ((await response.json()) as { items: StoreProduct[] }).items;
    render();
  } catch {
    count.textContent = "商品加载失败";
    empty.hidden = false;
  }
}

function renderMarketProduct(product: StoreProduct) {
  const availability = product.stock === 0 ? "暂时售罄" : product.stock < 0 ? "不限量" : `库存 ${product.stock}`;
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
      <div class="market-product-bottom"><div class="market-product-price"><strong>${formatCurrency(product.priceCents, product.currency)}</strong>${compareAt}</div><span>${availability}</span></div>
      <button type="button" data-product-slug="${escapeAttribute(product.slug)}">查看详情 <i data-lucide="arrow-up-right"></i></button>
    </div>
  </article>`;
}

function renderProductDialog(product: StoreProduct) {
  const cover = product.coverUrl ? `<img src="${escapeAttribute(product.coverUrl)}" alt="${escapeAttribute(product.title)}" />` : "";
  const availability = product.stock === 0 ? "暂时售罄" : product.stock < 0 ? "不限量供应" : `当前库存 ${product.stock}`;
  return `<div class="product-dialog-cover">${cover}</div><p class="section-kicker">${escapeHtml(productCategoryLabel(product.category))}</p><h2>${escapeHtml(product.title)}</h2><p class="product-dialog-summary">${escapeHtml(product.summary)}</p><div class="product-dialog-price">${formatCurrency(product.priceCents, product.currency)} <span>${availability}</span></div><div class="product-dialog-description">${escapeHtml(product.description).replace(/\n/g, "<br>")}</div><button class="button primary" type="button" disabled>订单功能准备中</button>`;
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
  return `<article class="post-card${featured}">
    <a href="/articles/?post=${encodeURIComponent(post.slug)}" data-portal-route aria-label="阅读 ${escapeHtml(post.title)}">
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
  if (latestLink && posts[0]) latestLink.href = `/articles/?post=${encodeURIComponent(posts[0].slug)}`;
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
  return ({ service: "服务", digital: "数字内容", software: "软件工具", other: "其它" } as Record<string, string>)[category] ?? "其它";
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
