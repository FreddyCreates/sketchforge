import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAddReply } from "@/hooks/use-canvas-data";
import type { Comment, ViewTransform } from "@/lib/types";
import { X } from "lucide-react";
/**
 * SketchForge — comment panel popover.
 *
 * Shows a comment's author, text, timestamp, and reply thread. Anchored
 * near the comment pin in screen space (the parent passes the current
 * view transform so we can convert the comment's canvas position to a
 * screen position). Reply input commits via `useAddReply`.
 */
import { useEffect, useRef, useState } from "react";

interface CommentPanelProps {
  comment: Comment;
  view: ViewTransform;
  onClose: () => void;
}

function formatTime(ts: bigint): string {
  const ms = Number(ts);
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentPanel({ comment, view, onClose }: CommentPanelProps) {
  const addReply = useAddReply();
  const [reply, setReply] = useState("");
  const replyRef = useRef<HTMLTextAreaElement>(null);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Convert canvas-space comment position to screen-space panel anchor.
  const screenX = comment.x * view.scale + view.offsetX;
  const screenY = comment.y * view.scale + view.offsetY;

  function submitReply() {
    const text = reply.trim();
    if (!text) return;
    addReply.mutate(
      { commentId: comment.id, reply: { text, author: "You" } },
      {
        onSuccess: () => {
          setReply("");
          replyRef.current?.focus();
        },
      },
    );
  }

  return (
    <div
      // Rendered in screen space (sibling of the transformed layer).
      className="absolute z-30 w-72 sketch-border bg-card p-3 shadow-glow"
      style={{
        left: `${screenX + 18}px`,
        top: `${screenY - 24}px`,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      data-ocid="canvas.comment_panel"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-foreground">
            {comment.author}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {formatTime(comment.createdAt)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 rounded-full"
          onClick={onClose}
          aria-label="Close comment"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <p className="mb-3 text-sm text-foreground">{comment.text}</p>

      {comment.replies.length > 0 && (
        <div className="mb-3 flex flex-col gap-2 border-l-2 border-dashed border-border/70 pl-2">
          {comment.replies.map((r, _i) => (
            <div key={`${r.author}-${r.createdAt}`} className="text-xs">
              <p className="font-semibold text-foreground">{r.author}</p>
              <p className="text-muted-foreground">{r.text}</p>
              <p className="text-[10px] text-muted-foreground/70">
                {formatTime(r.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          ref={replyRef}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Add a reply…"
          className="min-h-12 resize-none rounded-lg border-dashed text-xs"
          aria-label="Reply text"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submitReply();
            }
          }}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={submitReply}
            disabled={!reply.trim() || addReply.isPending}
            className="rounded-full px-4 text-xs"
            data-ocid="canvas.comment_reply.submit"
          >
            {addReply.isPending ? "Sending…" : "Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CommentPanel;
