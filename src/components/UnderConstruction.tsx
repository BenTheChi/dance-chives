import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface UnderConstructionProps {
  message?: ReactNode;
  title?: string;
  /**
   * "full" (default) renders the centered full-screen page treatment.
   * "banner" renders a compact horizontal notice meant to sit at the top
   * of an otherwise-populated page.
   */
  variant?: "full" | "banner";
  className?: string;
}

export function UnderConstruction({
  message = "We're working on something amazing! Check back soon.",
  title = "Under Construction",
  variant = "full",
  className,
}: UnderConstructionProps) {
  if (variant === "banner") {
    return (
      <div
        className={cn(
          "bg-secondary-dark rounded-sm p-6 md:p-8 border-4 border-primary-light w-full relative",
          className,
        )}
      >
        {/* Decorative corner elements */}
        <div className="absolute top-2 left-2 w-4 h-4 border-2 border-black bg-mint rotate-45"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-2 border-black bg-pulse-green rotate-45"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-2 border-black bg-periwinkle rotate-45"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-2 border-black bg-primary rotate-45"></div>

        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <h2 className="!font-rubik-mono-one !text-3xl sm:!text-4xl text-outline">
            {title}
          </h2>
          <div className="text-base max-w-3xl">{message}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[60vh] px-4 py-12",
        className,
      )}
    >
      <div className="bg-charcoal/20 rounded-sm p-8 md:p-12 border-2 border-black max-w-2xl w-full text-center relative">
        {/* Main content */}
        <div className="relative z-10">
          <h1 className="!font-rubik-mono-one mb-6">{title}</h1>

          <div className="mb-8">
            <span className="text-white font-semibold text-[200px]">🚧</span>
          </div>

          <p className="text-base mb-6">{message}</p>
        </div>
      </div>
    </div>
  );
}
