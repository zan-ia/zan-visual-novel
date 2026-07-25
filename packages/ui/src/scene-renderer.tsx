import type { Scene, TextBlock } from '@zan-vn/shared';

export interface SceneRendererProps {
  scene: Scene;
  isLLMGenerated?: boolean;
  className?: string;
}

/**
 * Renders a VN scene — text blocks with speaker labels and formatting.
 * Handles narration, dialogue, and thought block types.
 */
export function SceneRenderer({ scene, isLLMGenerated, className }: SceneRendererProps) {
  return (
    <div className={`vn-scene ${className ?? ''}`} data-scene-type={scene.type}>
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
