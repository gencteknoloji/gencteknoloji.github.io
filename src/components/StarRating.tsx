import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

export function StarRating({ rating, size = 16, showValue = false }: StarRatingProps) {
  const clamped = Math.min(5, Math.max(0, rating));

  return (
    <div className="star-rating" aria-label={`${clamped.toFixed(1)} / 5 yıldız`}>
      <div className="star-rating-row">
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const filled = clamped >= starValue;
          const partial = !filled && clamped > index;

          return (
            <span key={starValue} className="star-rating-item">
              <Star size={size} className="star-rating-empty" aria-hidden="true" />
              {(filled || partial) && (
                <span
                  className="star-rating-fill"
                  style={{ width: filled ? "100%" : `${(clamped - index) * 100}%` }}
                >
                  <Star size={size} className="star-rating-full" aria-hidden="true" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showValue && <span className="star-rating-value">{clamped.toFixed(1)}</span>}
    </div>
  );
}
