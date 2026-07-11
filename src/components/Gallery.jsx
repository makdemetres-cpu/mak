import { RevealGroup, RevealItem, Reveal } from './Reveal';
import { GalleryTile } from './GalleryTile';
import './Gallery.css';

const TILES = [
  { label: 'The Grill Room', tone: 'ember', size: 'tall' },
  { label: 'Dry-Age Cellar', tone: 'oxblood', size: 'wide' },
  { label: 'Marble Dining Hall', tone: 'gold', size: 'square' },
  { label: 'Rooftop Terrace', tone: 'oxblood', size: 'square' },
  { label: 'The Wine Wall', tone: 'gold', size: 'tall' },
  { label: 'Private Room', tone: 'ember', size: 'wide' },
];

export function Gallery() {
  return (
    <section className="section gallery" id="gallery">
      <div className="container">
        <div className="section-head">
          <Reveal type="up">
            <p className="eyebrow">Ambiance</p>
          </Reveal>
          <Reveal type="up" delay={0.08}>
            <h2 className="section-title">
              Marble, brass &amp; <em>open flame</em>
            </h2>
          </Reveal>
        </div>

        <RevealGroup as="div" className="gallery__grid" stagger={0.08}>
          {TILES.map((tile) => (
            <RevealItem as="div" key={tile.label} type="scale" className={`gallery__cell gallery__cell--${tile.size}`}>
              <GalleryTile {...tile} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
