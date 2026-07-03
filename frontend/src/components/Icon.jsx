export default function Icon({ name, fill = false, className = '', size }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined,
        fontSize: size,
      }}
    >
      {name}
    </span>
  );
}
