"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageSquare, Share2, ShieldCheck, Clock, Send, Loader2, CornerDownRight,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { Post, PostCommentNode, PostDetails } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  General: "General",
  MarketAnalysis: "Market Analysis",
  TradingInsight: "Trading Insight",
  Educational: "Educational",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function PostCard({ post: initial }: { post: Post }) {
  const router = useRouter();
  const [post, setPost] = useState<Post>(initial);
  const [busyLike, setBusyLike] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostCommentNode[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  function requireAuth(): boolean {
    if (!isAuthenticated()) { router.push("/auth/login"); return false; }
    return true;
  }

  async function toggleLike() {
    if (!requireAuth() || busyLike) return;
    setBusyLike(true);
    try {
      const res = await api.post<{ liked: boolean; likesCount: number }>(`/api/posts/${post.id}/like`);
      setPost((p) => ({ ...p, isLikedByCurrentUser: res.liked, likesCount: res.likesCount }));
    } catch { /* ignore */ } finally { setBusyLike(false); }
  }

  async function share() {
    try {
      const res = await api.post<{ sharesCount: number; deepLink: string }>(`/api/posts/${post.id}/share`);
      setPost((p) => ({ ...p, sharesCount: res.sharesCount }));
      const url = `${window.location.origin}${res.deepLink}`;
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
      toast.success("Post link copied to clipboard");
    } catch {
      toast.error("Could not share right now");
    }
  }

  async function loadComments() {
    setLoadingComments(true);
    try {
      const data = await api.get<PostDetails>(`/api/posts/${post.id}`);
      setComments(data.comments);
    } catch { /* ignore */ } finally { setLoadingComments(false); }
  }

  function openComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) loadComments();
  }

  async function addComment() {
    if (!requireAuth() || !commentText.trim() || posting) return;
    setPosting(true);
    try {
      await api.post(`/api/posts/${post.id}/comment`, { text: commentText.trim() });
      setCommentText("");
      setPost((p) => ({ ...p, commentsCount: p.commentsCount + 1 }));
      await loadComments();
    } catch { /* ignore */ } finally { setPosting(false); }
  }

  async function addReply(commentId: number) {
    if (!requireAuth() || !replyText.trim() || posting) return;
    setPosting(true);
    try {
      await api.post(`/api/posts/comments/${commentId}/reply`, { text: replyText.trim() });
      setReplyText("");
      setReplyTo(null);
      setPost((p) => ({ ...p, commentsCount: p.commentsCount + 1 }));
      await loadComments();
    } catch { /* ignore */ } finally { setPosting(false); }
  }

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Link href={`/teachers/${post.userId}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-sm font-bold">
            {post.teacherName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white text-sm flex items-center gap-1.5 group-hover:text-primary transition-colors">
              {post.teacherName}
              {post.teacherTier === "Pro" && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
            </p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(post.createdAt)}
            </p>
          </div>
        </Link>
        <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary">
          {TYPE_LABELS[post.postType] ?? post.postType}
        </span>
      </div>

      {/* Body */}
      <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      {post.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image} alt="" className="mt-3 rounded-xl max-h-80 w-full object-cover border border-white/10" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 mt-4 pt-3 border-t border-white/5 text-sm">
        <button onClick={toggleLike} disabled={busyLike}
          className={`flex items-center gap-1.5 transition-colors ${post.isLikedByCurrentUser ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}>
          <Heart className={`w-4 h-4 ${post.isLikedByCurrentUser ? "fill-red-400" : ""}`} /> {post.likesCount}
        </button>
        <button onClick={openComments} className="flex items-center gap-1.5 text-muted-foreground hover:text-white transition-colors">
          <MessageSquare className="w-4 h-4" /> {post.commentsCount}
        </button>
        <button onClick={share} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
          <Share2 className="w-4 h-4" /> {post.sharesCount}
        </button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/5">
              {/* Add comment */}
              <div className="flex items-center gap-2 mb-4">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  placeholder="Write a comment…"
                  className="flex-1 rounded-lg py-2 px-3 text-sm text-white placeholder:text-white/20 outline-none border border-white/10 bg-black/30 focus:border-primary/50" />
                <button onClick={addComment} disabled={posting || !commentText.trim()}
                  className="p-2 rounded-lg bg-primary hover:bg-blue-600 text-white disabled:opacity-50">
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>

              {loadingComments ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {comments.map((c) => (
                    <div key={c.id}>
                      <CommentRow c={c} onReply={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyText(""); }} />
                      {replyTo === c.id && (
                        <div className="flex items-center gap-2 mt-2 ml-9">
                          <input value={replyText} onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addReply(c.id)}
                            placeholder="Write a reply…" autoFocus
                            className="flex-1 rounded-lg py-1.5 px-3 text-xs text-white placeholder:text-white/20 outline-none border border-white/10 bg-black/30 focus:border-primary/50" />
                          <button onClick={() => addReply(c.id)} disabled={posting || !replyText.trim()}
                            className="p-1.5 rounded-lg bg-primary hover:bg-blue-600 text-white disabled:opacity-50">
                            {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                      {c.replies.length > 0 && (
                        <div className="ml-9 mt-2 flex flex-col gap-2 border-l border-white/10 pl-3">
                          {c.replies.map((r) => <CommentRow key={r.id} c={r} isReply />)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommentRow({ c, onReply, isReply }: { c: PostCommentNode; onReply?: () => void; isReply?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className={`rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white/70 shrink-0 ${isReply ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-xs"}`}>
        {c.userName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2">
          <p className="text-xs font-bold text-white">{c.userName}</p>
          <p className="text-sm text-white/80 break-words">{c.text}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-1 text-[10px] text-muted-foreground">
          <span>{timeAgo(c.createdAt)}</span>
          {onReply && (
            <button onClick={onReply} className="flex items-center gap-1 hover:text-white transition-colors">
              <CornerDownRight className="w-3 h-3" /> Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
