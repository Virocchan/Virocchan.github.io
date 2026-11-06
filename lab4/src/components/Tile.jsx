export default function Tile({ value, pop, spawn }) {
  const cls = `tile t${value > 2048 ? 'super' : value}${spawn ? ' spawn' : ''}${pop ? ' merge' : ''}`;
  return <div className={cls} aria-label={`Tile ${value}`}>{value}</div>;
}
