import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Copy,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload
} from "lucide-react";
import "./styles.css";

type AdminPost = {
  id: string;
  slug: string;
  title: string;
  markdown: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  commentCount: number;
  attachmentCount: number;
};

type Toast = {
  id: number;
  text: string;
};

function App() {
  const [isAuthed, setAuthed] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const activePost = useMemo(() => posts.find((post) => post.id === activeId) ?? posts[0], [posts, activeId]);

  useEffect(() => {
    void fetchSession();
  }, []);

  async function fetchSession() {
    const response = await fetch("/api/admin/session", { credentials: "include" });
    if (response.ok) {
      setAuthed(true);
      await loadPosts();
    }
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      showToast("登录失败");
      return;
    }

    setAuthed(true);
    setPassword("");
    await loadPosts();
    showToast("已登录");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthed(false);
    setPosts([]);
  }

  async function loadPosts() {
    const response = await fetch("/api/admin/posts", { credentials: "include" });
    if (!response.ok) {
      setAuthed(false);
      return;
    }

    const body = (await response.json()) as { items: AdminPost[] };
    setPosts(body.items);
    setActiveId((current) => current ?? body.items[0]?.id ?? null);
  }

  async function createPost() {
    const response = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: "未命名文章",
        markdown: "# 未命名文章\n\n开始写作。"
      })
    });

    if (!response.ok) {
      showToast("创建失败");
      return;
    }

    const created = (await response.json()) as AdminPost;
    setPosts((items) => [created, ...items]);
    setActiveId(created.id);
    showToast("文章已创建");
  }

  async function savePost() {
    if (!activePost) return;
    const response = await fetch(`/api/admin/posts/${activePost.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: activePost.title, markdown: activePost.markdown })
    });

    if (!response.ok) {
      showToast("保存失败");
      return;
    }

    const saved = (await response.json()) as AdminPost;
    setPosts((items) => items.map((item) => (item.id === saved.id ? saved : item)));
    showToast("保存成功，已公开");
  }

  async function deletePost() {
    if (!activePost) return;
    if (!confirm(`确认删除《${activePost.title}》？关联评论会一起删除。`)) return;

    const response = await fetch(`/api/admin/posts/${activePost.id}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!response.ok) {
      showToast("删除失败");
      return;
    }

    setPosts((items) => items.filter((item) => item.id !== activePost.id));
    setActiveId(null);
    showToast("文章已删除");
  }

  function patchActivePost(patch: Partial<AdminPost>) {
    if (!activePost) return;
    setPosts((items) => items.map((item) => (item.id === activePost.id ? { ...item, ...patch } : item)));
  }

  async function copyLink() {
    if (!activePost) return;
    await navigator.clipboard.writeText(`${location.origin}/p/${activePost.slug}`).catch(() => undefined);
    showToast("链接已复制");
  }

  function showToast(text: string) {
    const id = Date.now();
    setToast({ id, text });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 1800);
  }

  if (!isAuthed) {
    return (
      <main className="login-screen">
        <form className="login-box" onSubmit={login}>
          <div>
            <h1>FreedomPost</h1>
            <p>管理员登录</p>
          </div>
          <label>
            <span>账号</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            <span>密码</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              type="password"
            />
          </label>
          <button className="primary" type="submit">
            登录
          </button>
        </form>
        {toast && <div className="toast">{toast.text}</div>}
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="post-rail">
        <div className="rail-head">
          <strong>文章管理</strong>
          <button className="icon-button" type="button" onClick={createPost} title="新建文章">
            <Plus size={17} />
          </button>
        </div>
        <div className="rail-actions">
          <button type="button" onClick={loadPosts}>
            <RefreshCw size={15} />
            刷新
          </button>
          <button type="button" onClick={logout}>
            <LogOut size={15} />
            退出
          </button>
        </div>
        <div className="post-list">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              className={post.id === activePost?.id ? "active" : ""}
              onClick={() => setActiveId(post.id)}
            >
              <span>{post.title}</span>
              <small>
                {formatDate(post.updatedAt)} · {post.viewCount} 访问 · {post.commentCount} 评论
              </small>
            </button>
          ))}
        </div>
      </aside>

      <section className="editor-pane">
        {activePost ? (
          <>
            <header className="editor-topbar">
              <div>
                <strong>{activePost.title}</strong>
                <span>/p/{activePost.slug}</span>
              </div>
              <div className="topbar-actions">
                <button type="button" onClick={copyLink}>
                  <Copy size={15} />
                  复制
                </button>
                <button type="button">
                  <Upload size={15} />
                  附件
                </button>
                <button type="button" onClick={deletePost}>
                  <Trash2 size={15} />
                  删除
                </button>
                <button className="primary" type="button" onClick={savePost}>
                  <Save size={15} />
                  保存
                </button>
              </div>
            </header>
            <div className="editor-workspace">
              <label className="title-field">
                <span>标题</span>
                <input value={activePost.title} onChange={(event) => patchActivePost({ title: event.target.value })} />
              </label>
              <div className="toolbar">
                <button type="button" onClick={() => patchActivePost({ markdown: `${activePost.markdown}\n\n## 新段落` })}>
                  <Pencil size={15} />
                  段落
                </button>
                <button
                  type="button"
                  onClick={() => patchActivePost({ markdown: `${activePost.markdown}\n\n\`\`\`ts\n// code\n\`\`\`` })}
                >
                  代码块
                </button>
                <button
                  type="button"
                  onClick={() => patchActivePost({ markdown: `${activePost.markdown}\n\n[附件: 文件名](https://example.com/file.pdf)` })}
                >
                  附件卡片
                </button>
              </div>
              <textarea
                className="markdown-editor"
                value={activePost.markdown}
                onChange={(event) => patchActivePost({ markdown: event.target.value })}
              />
            </div>
          </>
        ) : (
          <div className="empty-state">暂无文章</div>
        )}
      </section>
      {toast && <div className="toast">{toast.text}</div>}
    </main>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

createRoot(document.getElementById("root")!).render(<App />);
