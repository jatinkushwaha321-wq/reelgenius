import * as React from "react";
import { cn } from "@/lib/utils";

export const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 hover:opacity-90 active:scale-95 cursor-pointer",
        variant === "secondary" && "bg-secondary text-secondary-foreground border border-white/5 hover:bg-white/5",
        variant === "ghost" && "hover:bg-white/5 text-muted-foreground hover:text-white",
        !variant && "bg-primary text-white hover:opacity-95",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";
