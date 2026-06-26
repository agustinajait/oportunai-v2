import Link from 'next/link';
import s from './landing.module.css';

export default function AlfaExpandable({ ctaHref }: { ctaHref: string }) {
  return (
    <Link href={ctaHref} className={s.alfaStripBtn}>
      Hacer el test →
    </Link>
  );
}
