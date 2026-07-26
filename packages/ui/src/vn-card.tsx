import { Chip } from '@mui/material';
import type { VisualNovel } from '@zan-vn/shared';

export interface VNCardProps {
  vn: VisualNovel;
  onClick?: (vn: VisualNovel) => void;
  className?: string;
  /**
   * When true, the card is rendered as an "Em breve" (coming soon) state
   * to signal the VN has no published chapters. The parent decides whether
   * the click is allowed; the card remains keyboard-focusable for a11y.
   */
  empty?: boolean;
}

/**
 * Card component for displaying a Visual Novel in the library/browse view.
 * Shows cover, title, author, rating, and credit price.
 */
export function VNCard({ vn, onClick, className, empty = false }: VNCardProps) {
  return (
    <article
      className={`vn-card ${className ?? ''}`.trim()}
      onClick={() => onClick?.(vn)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(vn)}
      tabIndex={0}
      role="button"
      style={empty ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
      aria-label={`${vn.title} por ${vn.creator?.displayName ?? 'Autor desconhecido'}${
        empty ? ' — Em breve, sem capítulos publicados' : ''
      }`}
    >
      <div className="vn-card__cover" style={{ position: 'relative' }}>
        {vn.coverUrl ? (
          <img src={vn.coverUrl} alt={`Capa de ${vn.title}`} loading="lazy" />
        ) : (
          <div className="vn-card__cover-placeholder" aria-hidden="true">
            📖
          </div>
        )}
        {empty && (
          <Chip
            label="Em breve"
            color="warning"
            size="small"
            aria-label="Em breve — sem capítulos publicados"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontWeight: 600,
              boxShadow: 1,
            }}
          />
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
