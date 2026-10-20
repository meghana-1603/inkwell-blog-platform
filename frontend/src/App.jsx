
import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen, Search, Plus, Heart, MessageCircle, Clock3,
  UserRound, LogOut, X, ArrowLeft, Send, Pencil,
  Trash2, Menu, Feather, ChevronRight, LoaderCircle
} from 'lucide-react';
import './App.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CATEGORIES = ['All', 'Technology', 'Lifestyle', 'Design', 'Career', 'Stories'];

const PALETTES = [
  'cover-lavender', 'cover-peach', 'cover-mint',
  'cover-blue', 'cover-rose', 'cover-yellow'
];

function readSession() {
  try {
    return {
      token: localStorage.getItem('blog_token') || '',
      user: JSON.parse(localStorage.getItem('blog_user') || 'null')
    };
  } catch {
    return { token: '', user: null };
  }
}

function getExcerpt(post) {
  return post.excerpt?.trim() ||
    post.content?.replace(/\s+/g, ' ').slice(0, 145) || '';
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function readingTime(content = '') {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

function Cover({ post, index = 0, large = false }) {
  return (
    <div className={`post-cover ${PALETTES[index % PALETTES.length]} ${large ? 'cover-large' : ''}`}>
      <span className="cover-category">{post.category || 'Stories'}</span>
      <div className="cover-art">
        <Feather size={large ? 64 : 43} strokeWidth={1.1} />
      </div>
      <span className="cover-number">{String(index + 1).padStart(2, '0')}</span>
    </div>
  );
}

function AuthModal({ mode, onClose, onSuccess, onModeChange }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await request(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <section className="auth-modal">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <div className="brand-mark modal-mark"><Feather size={23} /></div>
        <p className="eyebrow">WELCOME TO INKWELL</p>
        <h2>{mode === 'login' ? 'Good to see you.' : 'Find your voice.'}</h2>
        <p className="muted">
          {mode === 'login'
            ? 'Sign in and continue reading.'
            : 'Create an account and share your perspective.'}
        </p>
        <form onSubmit={submit} className="stack-form">
          {mode === 'register' && (
            <label>
              Full name
              <input value={name} onChange={e => setName(e.target.value)}
                minLength={2} maxLength={60} required placeholder="Your name" />
            </label>
          )}
          <label>
            Email address
            <input type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required placeholder="you@example.com" autoComplete="email" />
          </label>
          <label>
            Password
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8} maxLength={128} required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="At least 8 characters" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button full-button" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? 'New to InkWell?' : 'Already have an account?'}{' '}
          <button className="text-button" onClick={() =>
            onModeChange(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Join us' : 'Sign in'}
          </button>
        </p>
      </section>
    </div>
  );
}

function PostEditor({ post, onClose, onSave, busy }) {
  const [title, setTitle] = useState(post?.title || '');
  const [category, setCategory] = useState(post?.category || 'Stories');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [content, setContent] = useState(post?.content || '');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please enter a title and article content.');
      return;
    }
    onSave({ title, category, excerpt, content }, setError);
  }

  return (
    <div className="modal-backdrop editor-backdrop">
      <section className="editor-modal">
        <div className="editor-heading">
          <div>
            <p className="eyebrow">YOUR WORDS, YOUR WORLD</p>
            <h2>{post ? 'Edit your story' : 'Write a new story'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close editor">
            <X />
          </button>
        </div>
        <form onSubmit={submit} className="stack-form">
          <label>
            Story title
            <input value={title} onChange={e => setTitle(e.target.value)}
              maxLength={160} required placeholder="Give your story a title…" />
          </label>
          <label>
            Category
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.filter(c => c !== 'All').map(c =>
                <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Short introduction <span className="muted">(optional)</span>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
              maxLength={300} rows={2} placeholder="What is your story about?" />
          </label>
          <label>
            Your story
            <textarea className="article-input" value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={20000} rows={10} required
              placeholder="Start writing here…" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="editor-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Saving…' : post ? 'Save changes' : 'Publish story'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(readSession);
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [activePost, setActivePost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [authMode, setAuthMode] = useState('');
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [myPostsOnly, setMyPostsOnly] = useState(false);

  const flash = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  }, []);

  const loadPosts = useCallback(async () => {
    setPageLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set('search', search.trim());
      if (activeCategory !== 'All') query.set('category', activeCategory);
      const data = await request(`/posts?${query.toString()}`);
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setPageLoading(false);
    }
  }, [search, activeCategory]);

  useEffect(() => {
    const timer = window.setTimeout(loadPosts, 250);
    return () => window.clearTimeout(timer);
  }, [loadPosts]);

  const openPost = async (post) => {
    setBusy(true);
    setError('');
    try {
      const data = await request(`/posts/${post._id}`);
      setActivePost(data.post);
      setComments(data.comments || []);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      flash(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onAuthSuccess = (data) => {
    localStorage.setItem('blog_token', data.token);
    localStorage.setItem('blog_user', JSON.stringify(data.user));
    setSession({ token: data.token, user: data.user });
    setAuthMode('');
    flash(data.message || 'Welcome to InkWell!');
  };

  const logout = () => {
    localStorage.removeItem('blog_token');
    localStorage.removeItem('blog_user');
    setSession({ token: '', user: null });
    setMyPostsOnly(false);
    flash('You have signed out.');
  };

  const savePost = async (values, setFormError) => {
    setBusy(true);
    try {
      const isEdit = Boolean(editor?._id);
      const data = await request(
        isEdit ? `/posts/${editor._id}` : '/posts',
        {
          token: session.token,
          method: isEdit ? 'PATCH' : 'POST',
          body: JSON.stringify(values)
        }
      );
      setEditor(null);
      await loadPosts();
      if (isEdit) {
        setActivePost(data.post);
        flash('Your story has been updated.');
      } else {
        setActivePost(null);
        flash('Your story has been published!');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deletePost = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This will also delete its comments.`)) return;
    try {
      await request(`/posts/${post._id}`, {
        token: session.token, method: 'DELETE'
      });
      setActivePost(null);
      await loadPosts();
      flash('Story deleted.');
    } catch (err) {
      flash(err.message);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activePost) return;
    setBusy(true);
    try {
      const data = await request(`/posts/${activePost._id}/comments`, {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ content: commentText })
      });
      setComments(old => [...old, data.comment]);
      setCommentText('');
      flash('Comment added.');
      loadPosts();
    } catch (err) {
      flash(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteComment = async (comment) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await request(`/posts/${activePost._id}/comments/${comment._id}`, {
        token: session.token, method: 'DELETE'
      });
      setComments(old => old.filter(c => c._id !== comment._id));
      loadPosts();
      flash('Comment deleted.');
    } catch (err) {
      flash(err.message);
    }
  };

  const visiblePosts = posts.filter(post =>
    !myPostsOnly || post.author?._id === session.user?.id ||
      post.author?._id === session.user?._id
  );

  const featured = visiblePosts[0];
  const remaining = visiblePosts.slice(1);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={() => {
            setActivePost(null); setMyPostsOnly(false);
          }}>
            <span className="brand-mark"><Feather size={23} /></span>
            <span>inkwell<span className="brand-period">.</span></span>
          </button>

          <nav className={`main-nav ${mobileMenu ? 'nav-open' : ''}`}>
            <button className={!myPostsOnly ? 'nav-link selected' : 'nav-link'}
              onClick={() => { setActivePost(null); setMyPostsOnly(false); setMobileMenu(false); }}>
              Discover
            </button>
            <button className={myPostsOnly ? 'nav-link selected' : 'nav-link'}
              onClick={() => {
                if (!session.token) { setAuthMode('login'); return; }
                setActivePost(null); setMyPostsOnly(true); setMobileMenu(false);
              }}>
              My stories
            </button>
          </nav>

          <div className="header-actions">
            <button className="write-button" onClick={() => {
              if (!session.token) { setAuthMode('login'); return; }
              setEditor({});
            }}>
              <Plus size={17} /> <span>Write a story</span>
            </button>
            {session.user ? (
              <div className="user-menu">
                <span className="avatar">{session.user.name?.charAt(0)?.toUpperCase()}</span>
                <button className="icon-button" title="Sign out" onClick={logout}>
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button className="sign-in-button" onClick={() => setAuthMode('login')}>
                Sign in
              </button>
            )}
            <button className="icon-button mobile-menu-button"
              onClick={() => setMobileMenu(v => !v)} aria-label="Menu">
              <Menu />
            </button>
          </div>
        </div>
      </header>

      {!activePost ? (
        <main>
          <section className="hero-section">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-line" /> A SPACE FOR IDEAS</p>
              <h1>Stories worth<br /><span>staying for.</span></h1>
              <p className="hero-description">
                Thoughtful perspectives, fresh ideas, and little things that make
                us see the world differently. Written by people like you.
              </p>
              <button className="hero-link" onClick={() =>
                document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore the stories <ChevronRight size={18} />
              </button>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="hero-circle circle-one" />
              <div className="hero-circle circle-two" />
              <div className="hero-paper">
                <span className="paper-rule" />
                <span className="paper-rule short" />
                <Feather size={77} strokeWidth={1} />
                <span className="paper-caption">ideas in motion</span>
              </div>
              <span className="art-star star-one">✳</span>
              <span className="art-star star-two">✳</span>
              <span className="art-orbit">EST. 2026</span>
            </div>
          </section>

          <section className="stories-section" id="stories">
            <div className="section-heading">
              <div>
                <p className="eyebrow">THE READING ROOM</p>
                <h2>{myPostsOnly ? 'Your stories' : 'Explore the latest'}</h2>
              </div>
              <p className="section-aside">Curiosity looks good on you.</p>
            </div>

            <div className="filter-bar">
              <div className="category-tabs">
                {CATEGORIES.map(category => (
                  <button key={category}
                    className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category)}>
                    {category}
                  </button>
                ))}
              </div>
              <label className="search-box">
                <Search size={18} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Find a story…" aria-label="Search stories" />
                {search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}
              </label>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {pageLoading ? (
              <div className="loading-state"><LoaderCircle className="spinner" /> Finding good reads…</div>
            ) : visiblePosts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon"><BookOpen size={30} /></span>
                <h3>{myPostsOnly ? 'Your story starts here.' : 'A little quiet in here.'}</h3>
                <p>{myPostsOnly
                  ? 'You have not published any stories yet.'
                  : 'No stories match your search. Try another category or write the first one.'}</p>
                {session.token && <button className="primary-button"
                  onClick={() => setEditor({})}><Plus size={17} /> Write a story</button>}
              </div>
            ) : (
              <>
                {featured && (
                  <article className="featured-card">
                    <button className="cover-button" onClick={() => openPost(featured)}>
                      <Cover post={featured} large />
                    </button>
                    <div className="featured-copy">
                      <div className="post-meta">
                        <span className="category-label">{featured.category}</span>
                        <span>{formatDate(featured.createdAt)}</span>
                      </div>
                      <button className="post-title-button" onClick={() => openPost(featured)}>
                        <h3>{featured.title}</h3>
                      </button>
                      <p className="post-excerpt">{getExcerpt(featured)}</p>
                      <div className="card-bottom">
                        <span className="author-line"><span className="avatar small-avatar">
                          {featured.author?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </span>{featured.author?.name || 'Anonymous'}</span>
                        <span className="read-time"><Clock3 size={14} /> {readingTime(featured.content)} min read</span>
                        <span className="comment-count"><MessageCircle size={15} /> {featured.commentCount || 0}</span>
                      </div>
                    </div>
                  </article>
                )}

                {remaining.length > 0 && (
                  <div className="post-grid">
                    {remaining.map((post, index) => (
                      <article className="post-card" key={post._id}>
                        <button className="cover-button" onClick={() => openPost(post)}>
                          <Cover post={post} index={index + 1} />
                        </button>
                        <div className="post-card-copy">
                          <div className="post-meta">
                            <span className="category-label">{post.category}</span>
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                          <button className="post-title-button" onClick={() => openPost(post)}>
                            <h3>{post.title}</h3>
                          </button>
                          <p className="post-excerpt">{getExcerpt(post)}</p>
                          <div className="card-bottom">
                            <span className="author-line">
                              <span className="avatar small-avatar">
                                {post.author?.name?.charAt(0)?.toUpperCase() || 'A'}
                              </span>
                              {post.author?.name || 'Anonymous'}
                            </span>
                            <span className="comment-count"><MessageCircle size={15} /> {post.commentCount || 0}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="join-banner">
            <div>
              <p className="eyebrow">EVERY VOICE MATTERS</p>
              <h2>Have a thought worth sharing?</h2>
              <p>The best stories are still waiting to be written. Yours could be next.</p>
            </div>
            <button className="banner-button" onClick={() => {
              if (!session.token) { setAuthMode('register'); return; }
              setEditor({});
            }}>Start writing <ChevronRight size={18} /></button>
          </section>
        </main>
      ) : (
        <main className="article-page">
          <button className="back-link" onClick={() => setActivePost(null)}>
            <ArrowLeft size={17} /> Back to all stories
          </button>
          <div className="article-topline">
            <span className="category-label">{activePost.category}</span>
            <span>{formatDate(activePost.createdAt)}</span>
            <span><Clock3 size={14} /> {readingTime(activePost.content)} min read</span>
          </div>
          <h1 className="article-title">{activePost.title}</h1>
          <p className="article-deck">{getExcerpt(activePost)}</p>
          <div className="article-author">
            <span className="avatar">{activePost.author?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
            <div><strong>{activePost.author?.name || 'Anonymous'}</strong><span>Contributor</span></div>
            {(activePost.author?._id === session.user?.id ||
              activePost.author?._id === session.user?._id) && (
              <div className="article-owner-actions">
                <button className="secondary-button" onClick={() => setEditor(activePost)}>
                  <Pencil size={15} /> Edit
                </button>
                <button className="danger-button" onClick={() => deletePost(activePost)}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            )}
          </div>
          <Cover post={activePost} large />
          <article className="article-content">
            {activePost.content.split(/\n{2,}/).map((paragraph, i) =>
              <p key={i}>{paragraph}</p>)}
          </article>

          <section className="comments-section">
            <div className="comments-heading">
              <div><p className="eyebrow">JOIN THE CONVERSATION</p>
                <h2>Thoughts & responses <span>({comments.length})</span></h2></div>
            </div>
            {session.token ? (
              <form className="comment-form" onSubmit={addComment}>
                <span className="avatar">{session.user?.name?.charAt(0)?.toUpperCase()}</span>
                <div className="comment-compose">
                  <textarea value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    maxLength={2000} rows={3}
                    placeholder="Share a thoughtful response…" required />
                  <div className="comment-compose-bottom">
                    <span>{commentText.length}/2000</span>
                    <button className="primary-button" disabled={busy || !commentText.trim()}>
                      <Send size={15} /> Comment
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="comment-signin">
                <p>Join the conversation. Sign in to leave a comment.</p>
                <button className="secondary-button" onClick={() => setAuthMode('login')}>Sign in</button>
              </div>
            )}
            <div className="comment-list">
              {comments.map(comment => (
                <article className="comment-item" key={comment._id}>
                  <span className="avatar">{comment.author?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
                  <div className="comment-body">
                    <div className="comment-author-line">
                      <strong>{comment.author?.name || 'Anonymous'}</strong>
                      <span>{formatDate(comment.createdAt)}</span>
                      {(comment.author?._id === session.user?.id ||
                        comment.author?._id === session.user?._id ||
                        activePost.author?._id === session.user?.id ||
                        activePost.author?._id === session.user?._id) && session.token && (
                        <button className="comment-delete" title="Delete comment"
                          onClick={() => deleteComment(comment)}><Trash2 size={14} /></button>
                      )}
                    </div>
                    <p>{comment.content}</p>
                  </div>
                </article>
              ))}
              {comments.length === 0 && <p className="no-comments">No comments yet. Start the conversation.</p>}
            </div>
          </section>
        </main>
      )}

      <footer className="site-footer">
        <button className="brand footer-brand" onClick={() => {
          setActivePost(null); window.scrollTo({ top: 0, behavior: 'smooth' });
        }}><span className="brand-mark"><Feather size={19} /></span> inkwell.</button>
        <p>A little corner of the internet for thoughtful people.</p>
        <span>© 2026 InkWell · Made for curious minds</span>
      </footer>

      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode('')}
        onSuccess={onAuthSuccess} onModeChange={setAuthMode} />}
      {editor !== null && <PostEditor post={editor?._id ? editor : null}
        onClose={() => setEditor(null)} onSave={savePost} busy={busy} />}
      {notice && <div className="toast"><span>✓</span> {notice}</div>}
    </div>
  );
}
