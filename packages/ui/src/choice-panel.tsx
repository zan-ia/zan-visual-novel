import type { Choice } from '@zan-vn/shared';

export interface ChoicePanelProps {
  choices: Choice[];
  onSelect: (choiceId: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Displays available choices for the player to select.
 * Renders as a list of interactive buttons.
 */
export function ChoicePanel({ choices, onSelect, disabled, className }: ChoicePanelProps) {
  if (choices.length === 0) return null;

  return (
    <div className={`vn-choices ${className ?? ''}`} role="group" aria-label="Escolhas disponíveis">
      {choices.map((choice) => (
        <button
          key={choice.id}
          className="vn-choices__button"
          onClick={() => onSelect(choice.id)}
          disabled={disabled}
          type="button"
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
