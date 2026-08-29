export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
  className = '',
}) {
  const base =
    'w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-primary text-white hover:bg-[#00305e] disabled:opacity-50',
    secondary:
      'bg-white text-primary border border-gray-300 hover:bg-gray-50 disabled:opacity-50',
    link: 'text-secondary hover:underline p-0 w-auto',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}