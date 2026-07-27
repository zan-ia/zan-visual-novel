import type { Scene, TextBlock, SceneAsset } from '@zan-vn/shared';

export interface SceneRendererProps {
  scene: Scene;
  isLLMGenerated?: boolean;
  className?: string;
  baseAssetUrl?: string;
}

/**
 * Renders a VN scene — visual layers (background, sprites, audio) with
 * text blocks overlaid on top. Falls back to text-only when no assets exist.
 * Uses BEM-style CSS classes: .vn-scene, .vn-scene__background, etc.
 */
export function SceneRenderer({
  scene,
  isLLMGenerated,
  className,
  baseAssetUrl = '',
}: SceneRendererProps) {
  const bgAsset = scene.assets?.find((a: SceneAsset) => a.role === 'background');
  const spriteAssets = scene.assets?.filter((a: SceneAsset) => a.role === 'sprite') ?? [];
  const audioAssets =
    scene.assets?.filter((a: SceneAsset) => a.role === 'music' || a.role === 'sfx') ?? [];
  const hasVisuals = bgAsset || spriteAssets.length > 0;

  return (
    <div className={`vn-scene ${className ?? ''}`} data-scene-type={scene.type}>
      {/* Visual layers */}
      {hasVisuals && (
        <div className="vn-scene__visuals">
          {bgAsset?.asset && (
            <img
              className="vn-scene__background"
              src={`${baseAssetUrl}${bgAsset.asset.storageUrl}`}
              alt=""
            />
          )}
          {bgAsset && <div className="vn-scene__background-overlay" />}
          {spriteAssets.map((sa: SceneAsset) =>
            sa.asset ? (
              <img
                key={sa.id}
                className="vn-scene__sprite"
                src={`${baseAssetUrl}${sa.asset.storageUrl}`}
                alt=""
                style={{
                  left:
                    sa.config?.position?.x !== undefined ? `${sa.config.position.x}%` : undefined,
                  top:
                    sa.config?.position?.y !== undefined ? `${sa.config.position.y}%` : undefined,
                  opacity: sa.config?.opacity,
                  maxHeight: sa.config?.size?.height ? `${sa.config.size.height}px` : undefined,
                }}
              />
            ) : null,
          )}
        </div>
      )}

      {/* Audio layers */}
      {audioAssets.map((sa: SceneAsset) =>
        sa.asset ? (
          <audio
            key={sa.id}
            src={`${baseAssetUrl}${sa.asset.storageUrl}`}
            autoPlay={sa.config?.autoplay !== false}
            loop={sa.role === 'music' && sa.config?.loop !== false}
          />
        ) : null,
      )}

      {/* Text overlay */}
      <div className="vn-scene__text-overlay">
        {isLLMGenerated && (
          <div className="vn-scene__llm-badge" aria-label="Conteúdo gerado por IA">
            ✦ IA
          </div>
        )}
        <div className="vn-scene__content">
          {scene.content.map((block, index) => (
            <TextBlockRenderer key={index} block={block} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TextBlockRenderer({ block }: { block: TextBlock }) {
  const styleClass = block.style && block.style !== 'normal' ? `vn-text--${block.style}` : '';

  switch (block.type) {
    case 'dialogue':
      return (
        <div className={`vn-text vn-text--dialogue ${styleClass}`}>
          {block.speaker && <span className="vn-text__speaker">{block.speaker}</span>}
          <span className="vn-text__body">"{block.text}"</span>
        </div>
      );
    case 'thought':
      return (
        <div className={`vn-text vn-text--thought ${styleClass}`}>
          <span className="vn-text__body">({block.text})</span>
        </div>
      );
    case 'narration':
    default:
      return (
        <div className={`vn-text vn-text--narration ${styleClass}`}>
          <span className="vn-text__body">{block.text}</span>
        </div>
      );
  }
}
