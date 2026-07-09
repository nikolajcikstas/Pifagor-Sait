import { useMemo, useState } from "react";
import "./App.css";
import "./TutorsPage.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { WaveDivider } from "./components/WaveDivider";
import { ReviewsSlider } from "./components/ReviewsSlider";
import { TutorsSlider } from "./components/TutorsSlider";
import { TutorCard } from "./components/TutorCard";
import { BookingForm } from "./components/BookingForm";
import { TutorApplicationForm } from "./components/TutorApplicationForm";
import { BannerBullets } from "./components/BannerBullets";
import { Logo } from "./components/Logo";
import tutorsBannerImg from "./assets/tutors.png";
import arrowIcon from "./assets/Arrow.svg";
import selectSvg from "./assets/select.svg";
import { PRICING_FEATURES } from "./data/site";
import { TUTORS } from "./data/tutors";
import { scrollToBookingForm } from "./utils/scroll";
import { useFaq, usePrices, useSubjects } from "./hooks/usePublicData";
import { mapApiFaq } from "./utils/tutors";
import type { PageKey } from "./types/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FAQ {
  question: string;
  answer: string;
}

// ─── Static fallbacks ─────────────────────────────────────────────────────────

const TUTOR_SUBJECTS = [{ title: "Все" }, ...Array.from(new Set(TUTORS.flatMap(t => t.subjects))).map(t => ({ title: t }))];


const FALLBACK_FAQS: FAQ[] = [
  {
    question: "Сколько длится занятие?",
    answer:
      "Стандартное занятие длится 60 минут, однако мы также предлагаем продленные 90-минутные сессии в зависимости от потребностей студента и целей обучения.",
  },
  {
    question: "Нужны ли мне свои материалы?",
    answer:
      "Нет — все необходимые учебные материалы и рабочие листы предоставляет ваш репетитор. Вам понадобятся только блокнот и желание учиться.",
  },
  {
    question: "Могу ли я поменять репетитора?",
    answer:
      "Да, безусловно. Если вы чувствуете, что стиль преподавания вам не совсем подходит, мы бесплатно подберем вам другого специалиста.",
  },
];

// ─── Helper components ────────────────────────────────────────────────────────



function FaqItem({ faq, accentColor }: { faq: FAQ; accentColor?: string }) {
  const [open, setOpen] = useState(false);

  // 1. Определение цветов фона и текста в зависимости от предмета
  let bgColor = "#F4FAFC";    // Математика / Физика (Дефолт)
  let titleColor = "#1A547E";
  let textColor = "#5A738E";
  let iconColor = "#7994A6";

  if (accentColor === "#F9AB01") { // Английский
    bgColor = "#FFFDF5";
    titleColor = "#8A5400";
    textColor = "#8C765C";
    iconColor = "#B38F54";
  } else if (accentColor === "#23E2AF") { // Химия
    bgColor = "#F2FAF7";
    titleColor = "#167A60";
    textColor = "#5A857A";
    iconColor = "#63A391";
  }

  return (
    <div
      style={{
        backgroundColor: bgColor,
        borderRadius: "12px",
        marginBottom: "12px",
        overflow: "hidden",
        width: "100%",
        display: "block",
        boxSizing: "border-box"
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          maxWidth: "100%",
          minWidth: "100%",
          height: "auto",
          minHeight: "unset",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 32px",
          background: "none",
          border: "none",
          outline: "none",
          textAlign: "left",
          cursor: "pointer",
          boxSizing: "border-box"
        }}
      >
        <span
          className="text-h2"
          style={{
            color: titleColor,
            fontWeight: 400,
            display: "inline-block",
            width: "auto"
          }}
        >
          {faq.question.endsWith('?') ? <>{faq.question.slice(0, -1)}<span className="banner-form-punct">?</span></> : faq.question}
        </span>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          style={{
            width: "20px",
            height: "20px",
            minWidth: "20px",
            minHeight: "20px",
            maxWidth: "20px",
            maxHeight: "20px",
            color: iconColor,
            display: "block",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
            boxSizing: "border-box"
          }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="text-h3"
          style={{
            padding: "0 32px 24px 32px",
            lineHeight: "1.5",
            color: textColor,
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          {faq.answer}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TutorsPageProps {
  onBack: () => void;
  onNavigate: (page: PageKey) => void;
}

export default function TutorsPage({ onBack, onNavigate }: TutorsPageProps) {
  const [selectedSubject, setSelectedSubject] = useState("Все");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: subjects } = useSubjects();
  const { data: apiFaqs } = useFaq();
  const { lessonPrice } = usePrices();

 const tutors = useMemo(() => {
  return TUTORS.filter(tutor =>
    selectedSubject === "Все" || tutor.subjects.some(s => s.toLowerCase() === selectedSubject.toLowerCase())
  );
}, [selectedSubject]);

  const faqs = useMemo(() => {
    if (!apiFaqs.length) return FALLBACK_FAQS;
    return mapApiFaq(apiFaqs);
  }, [apiFaqs]);


  return (
    <div className="app">
      <Header currentPage="tutors" onHome={onBack} onNavigate={onNavigate} />

      <div className="tutors-banner-wrap">
        <section className="banner tutors-banner">
          <div className="banner-inner">
            <div className="banner-content">
              <h1 className="banner-title text-display-unbounded">Репетиторы</h1>
              <BannerBullets
                style={{ marginTop: 8, fontSize: 42 }}
                items={[
                  "Опытные репетиторы из лучших ВУЗов страны",
                  "Обратная связь после каждого занятия",
                  "Прогресс на лицо"
                ]}
              />
            </div>

            <img src={tutorsBannerImg} alt="" className="banner-image banner-image--tutors" />
          </div>

          <BookingForm subjects={subjects.length ? subjects : undefined} />
        </section>

        <WaveDivider variant="banner" />
      </div>

      {/* ── Tutors grid ── */}
      <div className="container" style={{ paddingTop: 0 }}>
        <div className="tutors-page-header">
          <h2 className="section-title text-h1-unbounded">Наши репетиторы</h2>

          <div className="tutors-page-filter-wrapper">
            <button
              type="button"
              className={`tutors-page-filter-btn text-h3 ${isDropdownOpen ? "is-open" : ""}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
            >
              <span>{selectedSubject}</span>
              <img src={selectSvg} alt="" className="filter-arrow-icon" />
            </button>

            {isDropdownOpen && (
              <div className="tutors-page-filter-dropdown" role="listbox">
                {TUTOR_SUBJECTS.map((subj) => (
                  <button
                    key={subj.title}
                    type="button"
                    role="option"
                    aria-selected={selectedSubject === subj.title}
                    className={`tutors-page-filter-option text-h3 ${
                      selectedSubject === subj.title ? "selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedSubject(subj.title);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {subj.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {tutors.length === 0 ? (
          <p className="tutors-page-empty text-h3">
            По предмету «{selectedSubject}» репетиторы не найдены
          </p>
        ) : (
          <TutorsSlider
            key={selectedSubject}
            items={tutors}
            renderItem={(tutor) => <TutorCard tutor={tutor} />}
          />
        )}
      </div>

      {/* ── Reviews ── */}
      <div id="reviews" style={{ marginTop: 48 }}>
        <ReviewsSlider />
      </div>

      {/* ── Pricing ── */}
      <div className="container">
        <h2
          className="section-title section-title--compact text-h1-unbounded"
          style={{ marginBottom: -40, paddingTop: 40 }}
        >
          Цены
        </h2>
      </div>

      <div id="prices" className="price-section container">
        <div className="price-box">
          <div className="price-left">
            <h2 className="text-h1-futura">Стоимость одного занятия</h2>
            <div className="price-value text-h1-unbounded">{lessonPrice} BYN</div>
            <div className="price-features">
              {PRICING_FEATURES.map(f => (
                <div key={f.text} className="price-feature-item">
                  <div className="price-feature-icon">
                    <img src={f.icon} alt="" />
                  </div>
                  <span className="price-feature text-body-lg">{f.text}</span>
                </div>
              ))}
            </div>
            <div className="price-buttons">
              <button
                type="button"
                className="price-btn price-btn--primary"
                style={{ background: "#1D809F" }}
                onClick={scrollToBookingForm}
              >
                Оставить заявку
              </button>
              <button type="button" className="price-btn price-btn--outline" onClick={scrollToBookingForm}>
                Хочу дешевле!
              </button>
            </div>
          </div>

          <div className="price-right">
            <div className="price-right-inner">
              <Logo variant="footer" />
              <div className="price-right-tagline text-h1-futura">
                Понимай, за<br />что платишь.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="container" style={{ paddingBottom: 64 }}>
        <h2 className="section-title text-h1-unbounded" style={{ marginBottom: 24 }}>
          Часто задаваемые вопросы
        </h2>
        <div className="faq-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => (
            <FaqItem key={i} faq={faq} />
          ))}
        </div>
      </div>

      <section className="tutors-page-cta">
        <div className="tutors-page-cta__header">
          <h2 className="text-h1-unbounded">
            Хотите
            <br />
            присоединиться
            <br />
            в команду?
          </h2>

          <div className="tutors-page-cta__arrow-wrap">
            <img src={arrowIcon} alt="Стрелка" />
          </div>

          <div className="text-h1-unbounded tutors-page-cta__action-label">Делайте!</div>
        </div>

        <TutorApplicationForm subjects={subjects.length ? subjects : undefined} />
      </section>

      <WaveDivider variant="footer" />
      <Footer onHome={onBack} onNavigate={onNavigate} />
    </div>
  );
}
