import type { Choice } from '@zan-vn/shared';

export interface ChoicePanelProps {
  choices: Choice[];
  onSelect: (choiceId: string) => void;
  disabled?: boolean;
  className?: string;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  width: '100%',
  padding: '8px 0',
};

const buttonBaseStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px 24px',
  minHeight: '56px',
  border: '1px solid rgba(124, 77, 255, 0.4)',
  borderRadius: '12px',
  backgroundColor: 'rgba(124, 77, 255, 0.08)',
  color: '#e8e8f0',
  fontFamily: "'Inter', sans-serif",
  fontSize: '1rem',
  fontWeight: 500,
  lineHeight: 1.5,
  textAlign: 'left' as const,
  cursor: 'pointer',
  transition: 'all 200ms ease',
};

/**
 * Displays available choices for the player to select.
 * Renders as a vertical list of styled interactive buttons
 * with hover, active, and focus states for accessibility.
 */
export function ChoicePanel({ choices, onSelect, disabled, className }: ChoicePanelProps) {
  if (choices.length === 0) return null;

  return (
    <div
      className={`vn-choices ${className ?? ''}`}
      role="group"
      aria-label="Escolhas disponíveis"
      style={containerStyle}
    >
      {choices.map((choice) => (
        <button
          key={choice.id}
          className="vn-choices__button"
          onClick={() => onSelect(choice.id)}
          disabled={disabled}
          type="button"
          style={{
            ...buttonBaseStyle,
            opacity: disabled ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (disabled) return;
            e.currentTarget.style.backgroundColor = 'rgba(124, 77, 255, 0.2)';
            e.currentTarget.style.borderColor = '#7c4dff';
          }}
          onMouseLeave={(e) => {
            if (disabled) return;
            e.currentTarget.style.backgroundColor = buttonBaseStyle.backgroundColor!;
            e.currentTarget.style.borderColor = buttonBaseStyle.borderColor!;
          }}
          onMouseDown={(e) => {
            if (disabled) return;
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            if (disabled) return;
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.backgroundColor = 'rgba(124, 77, 255, 0.2)';
          }}
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
