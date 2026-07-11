import './Marquee.css';

const ITEMS = [
  'USDA Prime',
  'Dry-Aged 28 Days',
  'Charcoal Fired',
  'Athens, Greece',
  'Estate Wine List',
  'Nose-to-Tail Cuts',
];

export function Marquee() {
  const track = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {track.map((item, i) => (
          <span className="marquee__item" key={i}>
            {item}
            <span className="marquee__dot">&#9670;</span>
          </span>
        ))}
      </div>
    </div>
  );
}
