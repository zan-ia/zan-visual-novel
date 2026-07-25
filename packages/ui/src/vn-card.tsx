import type { VisualNovel } from '@zan-vn/shared';

export interface VNCardProps {
  vn: VisualNovel;
  onClick?: (vn: VisualNovel) => void;
  className?: string;
}

/**
 * Card component for displaying a Visual Novel in the library/browse view.
 * Shows cover, title, author, rating, and credit price.
 */
export function VNCard({ vn, onClick, className }: VNCardProps) {
  return (
    <article
      className={`vn-card ${className ?? ''}`}
      onClick={() => onClick?.(vn)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(vn)}
      tabIndex={0}
      role="button"
      aria-label={`${vn.title} por ${vn.creator?.displayName ?? 'Autor desconhecido'}`}
    >
      <div className="vn-card__cover">
        {vn.coverUrl ? (
          <img src={vn.coverUrl} alt={`Capa de ${vn.title}`} loading="lazy" />
        ) : (
          <div className="vn-card__cover-placeholder" aria-hidden="true">
            📖
          </div>
        )}
      </div>
      <div className="vn-card__info">
        <h3 className="vn-card__title">{vn.title}</h3>
        <p className="vn-card__author">{vn.creator?.displayName ?? 'Autor desconhecido'}</p>
        <div className="vn-card__meta">
          {vn.tags && vn.tags.length > 0 && (
            <span className="vn-card__tags">{vn.tags.slice(0, 3).join(' · ')}</span>
          )}
          {vn.priceCredits > 0 ? (
            <span className="vn-card__price">{vn.priceCredits} créditos</span>
          ) : (
            <span className="vn-card__price vn-card__price--free">Grátis</span>
          )}
        </div>
      </div>
    </article>
  );
}
