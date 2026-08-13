import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: 'primary' | 'outline' | 'white';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export default function Button({ children, href, variant = 'primary', className = '', onClick, type = 'button' }: ButtonProps) {
  const base = 'inline-flex items-center justify-center px-10 py-4 font-sans text-xs font-medium tracking-[0.15em] uppercase transition-all duration-700';
  const styles = {
    primary: `${base} bg-rich-black text-white hover:bg-charcoal ${className}`,
    outline: `${base} border border-rich-black/20 text-rich-black hover:border-magenta hover:text-magenta bg-transparent ${className}`,
    white: `${base} bg-white text-rich-black hover:bg-white/90 ${className}`,
  };

  if (href) return <Link href={href} className={styles[variant]}>{children}</Link>;
  return <button type={type} className={styles[variant]} onClick={onClick}>{children}</button>;
}
