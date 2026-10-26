/** A person or company: their photograph when there is one, otherwise their initial on navy. */
export function Avatar({
  name,
  src,
  size = 44,
}: {
  name: string;
  src?: string | null | undefined;
  size?: 44 | 48 | 96;
}) {
  const box = { width: size, height: size };
  if (src)
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="rounded-pill bg-paper-sunken shrink-0 object-cover"
        style={box}
      />
    );
  return (
    <span
      aria-hidden="true"
      className="rounded-pill bg-navy text-on-navy grid shrink-0 place-items-center font-semibold"
      style={{ ...box, fontSize: Math.round(size * 0.4) }}
    >
      {(name.trim().charAt(0) || "O").toUpperCase()}
    </span>
  );
}
