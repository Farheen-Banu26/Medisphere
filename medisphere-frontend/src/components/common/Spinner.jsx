// src/components/common/Spinner.jsx
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10', xl: 'w-16 h-16' };
  return (
    <div className={`${sizes[size]} ${className} border-2 border-white/10 border-t-primary-600 rounded-full animate-spin`} />
  );
};

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-400 font-medium">Loading...</p>
    </div>
  </div>
);

export default Spinner;
