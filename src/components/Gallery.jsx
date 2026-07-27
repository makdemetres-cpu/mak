import { RevealGroup, RevealItem, Reveal } from './Reveal';
import { GalleryTile } from './GalleryTile';
import grillRoomImage from '../assets/grill-room.jpg';
import dryAgeCellarImage from '../assets/dry-age-cellar.jpg';
import marbleDiningHallImage from '../assets/marble-dining-hall.jpg';
import rooftopTerraceImage from '../assets/rooftop-terrace.jpg';
import theWineWallImage from '../assets/the-wine-wall.jpg';
import privateRoomImage from '../assets/private-room.jpg';
import './Gallery.css';

const TILES = [
  { label: 'The Grill Room', tone: 'ember', size: 'tall', image: grillRoomImage },
  { label: 'Dry-Age Cellar', tone: 'oxblood', size: 'wide', image: dryAgeCellarImage },
  { label: 'Marble Dining Hall', tone: 'gold', size: 'square', image: marbleDiningHallImage },
  { label: 'Rooftop Terrace', tone: 'oxblood', size: 'square', image: rooftopTerraceImage },
  { label: 'The Wine Wall', tone: 'gold', size: 'tall', image: theWineWallImage },
  { label: 'Private Room', tone: 'ember', size: 'wide', image: privateRoomImage },
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
