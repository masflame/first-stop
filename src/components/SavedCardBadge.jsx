import { CreditCard, X, RotateCcw } from "lucide-react";
import "./SavedCardBadge.css";

export default function SavedCardBadge({ card, onRemove, onUseNew }) {
  const label = card?.card_type
    ? `${card.card_type}${card.card_last_four ? ` ending in ${card.card_last_four}` : ""}`
    : card?.card_last_four
    ? `Card ending in ${card.card_last_four}`
    : "Saved card";

  return (
    <div className="saved-card-badge">
      <div className="saved-card-badge__main">
        <CreditCard size={16} className="saved-card-badge__icon" />
        <span className="saved-card-badge__label">{label}</span>
        <span className="saved-card-badge__pill">Saved</span>
      </div>
      <div className="saved-card-badge__actions">
        <button
          type="button"
          className="saved-card-badge__btn"
          onClick={onUseNew}
          title="Use a different card"
        >
          <RotateCcw size={12} />
          Use different card
        </button>
        <button
          type="button"
          className="saved-card-badge__remove"
          onClick={onRemove}
          title="Remove saved card"
        >
          <X size={12} />
          Remove
        </button>
      </div>
    </div>
  );
}
