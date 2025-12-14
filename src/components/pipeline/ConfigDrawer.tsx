import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  color: string;
  children: React.ReactNode;
}

export function ConfigDrawer({
  isOpen,
  onClose,
  title,
  description,
  color,
  children,
}: ConfigDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-background/50 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-md glass-card border-l border-border z-50 transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className={cn("p-6 border-b border-border", color)}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
              <p className="text-sm text-foreground/70 mt-1">{description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-background/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-120px)]">{children}</div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card/80 backdrop-blur">
          <Button onClick={onClose} className="w-full gradient-output text-foreground font-medium">
            Done
          </Button>
        </div>
      </div>
    </>
  );
}
