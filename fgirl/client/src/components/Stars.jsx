export default function Stars({ value = 0, count, onRate }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" title={value ? `${value} / 5` : 'Pas encore noté'}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= rounded ? 'star on' : 'star'}
          onClick={onRate ? () => onRate(n) : undefined}
          style={onRate ? { cursor: 'pointer' } : undefined}
        >
          ★
        </span>
      ))}
      {count !== undefined && <span className="stars-count">({count})</span>}
    </span>
  );
}
