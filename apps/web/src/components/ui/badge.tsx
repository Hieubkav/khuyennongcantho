import { cn } from "@/lib/utils";

type BadgeProps = React.ComponentProps<"span"> & {
  variant?: "default" | "outline";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
        variant === "outline"
          ? "bg-transparent border"
          : "bg-secondary text-secondary-foreground",
        className,
      )}
      {...props}
    />
  );
}
