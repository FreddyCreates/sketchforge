import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePresence } from "@/hooks/use-canvas-data";
import type { Presence } from "@/lib/types";
/**
 * SketchForge — live collaboration presence roster.
 *
 * Renders color-coded avatar chips in the header for each online
 * collaborator. Each chip uses the `.avatar-chip` class tinted with the
 * collaborator's assigned presence color, shows their initials, and carries
 * an `.avatar-online` status dot. A tooltip surfaces the display name and
 * the tool they are currently using.
 *
 * Presence data comes from `usePresence`, which polls the backend every 3s.
 */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function AvatarChip({
  presence,
  index,
}: { presence: Presence; index: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="avatar-chip avatar-online"
          style={
            {
              "--presence": presence.color,
            } as React.CSSProperties
          }
          data-ocid={`presence.avatar.${index}`}
          aria-label={`${presence.displayName} — using ${presence.activeTool}`}
        >
          {initials(presence.displayName)}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="font-body">
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">
            {presence.displayName}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {presence.activeTool}
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function PresenceRoster() {
  const { data: presence } = usePresence();
  const collaborators = presence ?? [];
  const count = collaborators.length;
  const visible = collaborators.slice(0, 3);
  const overflow = count - visible.length;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="flex items-center gap-1.5"
        data-ocid="presence.roster"
        aria-label={`${count} collaborator${count === 1 ? "" : "s"} online`}
      >
        {count > 0 ? (
          <>
            {visible.map((p, i) => (
              <AvatarChip key={p.principal} presence={p} index={i} />
            ))}
            {overflow > 0 && (
              <span
                className="avatar-chip"
                style={
                  {
                    "--presence": "0.5 0.01 280",
                  } as React.CSSProperties
                }
                aria-label={`${overflow} more collaborator${overflow === 1 ? "" : "s"} online`}
                title={`+${overflow} more`}
              >
                +{overflow}
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Solo</span>
        )}
      </div>
    </TooltipProvider>
  );
}

export default PresenceRoster;
