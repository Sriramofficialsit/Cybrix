export function Icon({
  name,
  size = 20,
  className = "ic",
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg className={className} viewBox="0 0 24 24" style={{ width: size, height: size, ...style }} aria-hidden="true">
      <use href={`#${name}`} />
    </svg>
  );
}
