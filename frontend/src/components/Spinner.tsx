const Spinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="relative w-14 h-14">
        {/* base ring */}
        <div className="absolute inset-0 rounded-full border border-slate-300"></div>

        {/* active rotation */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-700 border-r-amber-400 animate-spin"></div>
      </div>
    </div>
  );
};

export default Spinner;