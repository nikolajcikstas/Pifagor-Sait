import { useState, type ReactNode } from "react";

interface TutorsSliderProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  title?: string;
  itemsPerPage?: number;
}

export function TutorsSlider<T>({
  items,
  renderItem,
  title,
  itemsPerPage = 3,
}: TutorsSliderProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleItems = items.slice(currentIndex, currentIndex + itemsPerPage);
  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex >= items.length - itemsPerPage;

  if (items.length === 0) return null;

  return (
    <div className="tutors-slider" style={{ overflow: "hidden" }}>
      <div className="tutors-slider-header">
        {title && <h2 className="text-h1-unbounded">{title}</h2>}
        <div className="slider-controls">
          <button
            type="button"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - itemsPerPage))}
            className={`slider-btn ${isPrevDisabled ? "disabled" : "active"}`}
            disabled={isPrevDisabled}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() =>
              setCurrentIndex(
                Math.min(items.length - itemsPerPage, currentIndex + itemsPerPage),
              )
            }
            className={`slider-btn ${isNextDisabled ? "disabled" : "active"}`}
            disabled={isNextDisabled}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="tutors-slider-viewport">
        <div className="tutors-slider-list">
          {visibleItems.map((item, index) => (
            <div className="tutors-slider-item" key={currentIndex + index}>
              {renderItem(item, currentIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
