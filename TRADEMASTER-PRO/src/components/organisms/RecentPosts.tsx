"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { PostCard } from "./PostCard";
import type { Post } from "@/lib/types";

export function RecentPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Post[]>("/api/posts/home-feed")
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Hide the whole section when there is nothing to show.
  if (!loading && posts.length === 0) return null;

  return (
    <section className="relative z-10 mx-auto max-w-2xl px-6 py-16">
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-white md:text-5xl flex items-center justify-center gap-3">
          <FileText className="w-8 h-8 text-primary" /> Recent <span className="text-gradient">Posts</span>
        </h2>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          Latest market analysis and insights from our teachers.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : (
        <div className="flex flex-col gap-5">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}

      {/* Explore More Posts → /posts */}
      <div className="text-center mt-10">
        <Link href="/posts"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/30 bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors group">
          Explore More Posts
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
