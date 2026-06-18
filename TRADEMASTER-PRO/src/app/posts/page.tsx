"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "@/components/organisms/Navbar";
import { TickerTape } from "@/components/organisms/TickerTape";
import { PostCard } from "@/components/organisms/PostCard";
import { Loader2, AlertCircle, FileText, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Post, PagedResult } from "@/lib/types";

const PAGE_SIZE = 6;

export default function ExplorePostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async (pageToLoad: number, searchTerm: string, replace: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(pageToLoad), pageSize: String(PAGE_SIZE) });
      if (searchTerm) qs.set("search", searchTerm);
      const res = await api.get<PagedResult<Post>>(`/api/posts/explore?${qs.toString()}`);
      setPosts((prev) => (replace ? res.items : [...prev, ...res.items]));
      setHasMore(res.hasMore);
      setPage(res.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial + on search change
  useEffect(() => {
    loadPage(1, query, true);
  }, [query, loadPage]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadPage(page + 1, query, false);
      }
    }, { rootMargin: "300px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, hasMore, loading, query, loadPage]);

  return (
    <div className="min-h-screen overflow-x-hidden pb-24">
      <Navbar />
      <div className="pt-[72px]"><TickerTape /></div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Community</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-primary" /> Explore Posts
            </h1>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }} className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts…"
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground/30 outline-none border border-white/10 bg-white/[0.04] focus:border-primary/50" />
          </form>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <div className="flex flex-col gap-5">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>

        {/* Loading / empty / sentinel */}
        {loading && (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        )}
        {!loading && posts.length === 0 && (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-muted-foreground">{query ? "No posts match your search." : "No posts yet."}</p>
          </div>
        )}
        <div ref={sentinelRef} className="h-1" />
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-xs text-muted-foreground/50 py-6">You&apos;re all caught up.</p>
        )}
      </main>
    </div>
  );
}
