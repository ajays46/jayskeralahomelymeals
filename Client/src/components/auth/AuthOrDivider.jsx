/** Compact "or" divider between auth fields. */
const AuthOrDivider = () => (
  <div className="flex items-center gap-2 -my-1">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="text-[11px] leading-none text-gray-400 uppercase">or</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

export default AuthOrDivider;
