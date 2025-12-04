interface CTAButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "highlight";
  className?: string;
}

export function CTAButton({
  children,
  onClick,
  variant = "primary",
  className = "",
}: CTAButtonProps) {
  const variants = {
    primary:
      "bg-[#3a3a3a] text-[#f5f5f5] hover:bg-[#f5f5f5] hover:text-[#2a2a2a]",
    secondary:
      "bg-[#f5f5f5] text-[#2a2a2a] hover:bg-[#3a3a3a] hover:text-[#f5f5f5]",
    highlight:
      "bg-[#c4ffd9] text-[#2a2a2a] hover:bg-[#3a3a3a] hover:text-[#c4ffd9]",
  };

  return (
    <button
      onClick={onClick}
      className={`${variants[variant]} cursor-pointer px-12 py-5 text-xl font-black uppercase border-8 border-black transition-all duration-75 ${className}`}
    >
      {children}
    </button>
  );
}
