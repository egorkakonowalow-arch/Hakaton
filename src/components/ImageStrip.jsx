/**
 * Все изображения из папки img (корень репозитория) — явные импорты для стабильной сборки Vite.
 */
import img564561 from '../../img/564561-1.png';
import imgConfused from '../../img/confused-shocked-guy-raising-eyebrows-standing-stupor_176420-19590.jpg';
import imgDddc from '../../img/dddc81d71c1dc1d9d1597b32ed0ed053.jpg';
import imgFace from '../../img/face-young-handsome-man_251136-17557.jpg';
import imgIstock from '../../img/istockphoto-501775317-170667a.jpg';
import imgLogo from '../../img/Pervye_logotip_tsvetnoy_Montazhnaya_oblast_1.png';
import imgPortrait from '../../img/portrait-charming-young-lady-looking-confidently-camera-showing-her-natural-beauty-against_680097-1094.jpg';
import imgExtra from '../../img/extra-avatar.png';

const ALL_IMAGES = [
  imgLogo,
  img564561,
  imgConfused,
  imgDddc,
  imgFace,
  imgIstock,
  imgPortrait,
  imgExtra,
];

export default function ImageStrip() {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: '1.5rem',
        opacity: 0.95,
      }}
      aria-hidden
    >
      {ALL_IMAGES.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          style={{
            width: 64,
            height: 64,
            objectFit: 'cover',
            borderRadius: 12,
            border: '1px solid #eee',
          }}
        />
      ))}
    </div>
  );
}
