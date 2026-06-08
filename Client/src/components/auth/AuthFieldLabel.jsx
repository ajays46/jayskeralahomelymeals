/** Label with optional required asterisk for auth forms. */
const AuthFieldLabel = ({ htmlFor, children, required, headingColor }) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-semibold mb-1.5"
    style={{ color: headingColor }}
  >
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

export default AuthFieldLabel;
