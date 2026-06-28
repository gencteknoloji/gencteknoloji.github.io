import { ExternalLink, MapPin, MessageSquareQuote, Star } from "lucide-react";
import { googleBusiness } from "@/lib/content/google-business";
import { StarRating } from "./StarRating";

export function GoogleReviewsSection() {
  const mapsEmbedSrc = `https://maps.google.com/maps?q=${googleBusiness.mapsEmbedQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <section className="google-reviews-section" aria-labelledby="google-reviews-title">
      <div className="google-reviews-inner">
        <div className="google-reviews-header">
          <div className="google-reviews-badge">
            <Star size={14} fill="currentColor" />
            Google İşletme
          </div>
          <h2 id="google-reviews-title" className="google-reviews-title">
            Müşteri Yorumları
          </h2>
          <p className="google-reviews-desc">
            Google İşletme profilimizdeki değerlendirmeler ve puan ortalamamız.
          </p>
        </div>

        <div className="google-reviews-summary">
          <div className="google-reviews-score">
            <span className="google-reviews-score-value">{googleBusiness.rating.toFixed(1)}</span>
            <StarRating rating={googleBusiness.rating} size={20} />
            <span className="google-reviews-count">
              {googleBusiness.reviewCount} Google yorumu
            </span>
          </div>
          <div className="google-reviews-actions">
            <a
              href={googleBusiness.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-landing btn-landing-primary google-reviews-btn"
            >
              <MessageSquareQuote size={15} />
              Tüm Yorumları Gör
            </a>
            <a
              href={googleBusiness.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-landing btn-landing-secondary google-reviews-btn"
            >
              <MapPin size={15} className="text-yellow-400" />
              Google Haritalar
            </a>
          </div>
        </div>

        <div className="google-reviews-grid">
          {googleBusiness.reviews.map((review) => (
            <article key={`${review.author}-${review.relativeTime}`} className="google-review-card">
              <div className="google-review-card-top">
                <div className="google-review-avatar" aria-hidden="true">
                  {review.author.charAt(0)}
                </div>
                <div>
                  <h3 className="google-review-author">{review.author}</h3>
                  <div className="google-review-meta">
                    <StarRating rating={review.rating} size={14} />
                    {review.relativeTime && (
                      <span className="google-review-time">{review.relativeTime}</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="google-review-text">{review.text}</p>
            </article>
          ))}
        </div>

        <div className="google-reviews-map-wrap">
          <iframe
            title="Genç Teknoloji Google Haritalar konumu"
            src={mapsEmbedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="google-reviews-map"
          />
          <a
            href={googleBusiness.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="google-reviews-map-link"
          >
            <ExternalLink size={14} />
            Google İşletme profilinde aç
          </a>
        </div>
      </div>
    </section>
  );
}
