/** Typed Penny Flow wordmark. A small lime mark is the only decoration. */
const PennyFlowLogo = ({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) => {
  return (
    <span className={`pennyflow-logo pennyflow-logo-${size} ${className}`}>
      Penny Flow
      <i aria-hidden="true" />
    </span>
  );
};

export default PennyFlowLogo;
