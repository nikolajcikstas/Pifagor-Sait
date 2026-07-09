import { useMemo, useState } from "react";
import { submitLeadRequest } from "../api/public";
import type { ApiSubject } from "../api/types";
import { findSubjectId } from "../utils/tutors";
import { filterAllowedSubjects, getSubjectOptionNames } from "../utils/subjects";
import { formatPhone, isPhoneValid } from "../utils/phone";
import { SuccessPopup } from "./SuccessPopup";

interface TutorApplicationFormProps {
  subjects?: ApiSubject[];
}

export function TutorApplicationForm({ subjects }: TutorApplicationFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+375");
  const [subject, setSubject] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidationError, setIsValidationError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const allowedSubjects = useMemo(
    () => (subjects?.length ? filterAllowedSubjects(subjects) : undefined),
    [subjects],
  );

  const subjectOptions = useMemo(
    () => getSubjectOptionNames(allowedSubjects),
    [allowedSubjects],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    // ВАЖНО: preventDefault должен быть САМОЙ первой строчкой,
    // чтобы страница не перезагрузилась, даже если код ниже упадет с ошибкой!
        e.preventDefault();
    if (setFeedback) setFeedback(null);

    // Проверяем заполнение полей
    if (!name.trim()) {
      setIsValidationError(true);
      setTimeout(() => setIsValidationError(false), 2000);
      return;
    }

    if (!isPhoneValid(phone)) {
      setIsValidationError(true);
      setTimeout(() => setIsValidationError(false), 2000);
      return;
    }


    setSubmitting(true);
    try {
      await submitLeadRequest({
        name: name.trim(),
        phone: phone.trim(),
        subject_id: allowedSubjects ? findSubjectId(allowedSubjects, subject) : undefined,
        message: "Заявка репетитора",
      });

      setShowSuccess(true);
      setIsSuccess(true);

      setName("");
      setPhone("+375");
      setSubject("");

      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      // Чтобы код не падал, выводим ошибку в alert, если feedback не настроен
      const errorMessage = err instanceof Error ? err.message : "Не удалось отправить заявку";
      if (setFeedback) {
        setFeedback({ type: "error", text: errorMessage });
      } else {
        alert(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="tutors-page-cta__card-form" onSubmit={handleSubmit}>
      <div className="tutors-page-cta__form-info">
        <div className="tutors-page-cta__form-small">
          Уверены в своих знаниях<span className="banner-form-punct">?</span>
        </div>
        <div className="tutors-page-cta__form-big">Мы ждем именно Вас!</div>
      </div>

      <input
        type="text"
        placeholder="Ваше имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="tutors-page-cta__input"
        disabled={submitting}
      />

      <input
        type="tel"
        placeholder="+375 (XX) XXX-XX-XX"
        value={phone}
        onChange={(e) => setPhone(formatPhone(e.target.value))}
        className="tutors-page-cta__input"
        disabled={submitting}
      />

      <div className="tutors-page-cta__select-wrapper">
        <div
          className={`tutors-page-cta__select-trigger ${!subject ? "placeholder" : ""}`}
          onClick={() => !submitting && setIsOpen(!isOpen)}
        >
          <span>{subject || "Предмет"}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`select-arrow-icon ${isOpen ? "is-open" : ""}`}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {isOpen && (
          <div className="tutors-page-cta__select-dropdown">
            {subjectOptions.map((title) => (
              <div
                key={title}
                className={`tutors-page-cta__select-option ${subject === title ? "selected" : ""}`}
                onClick={() => {
                  setSubject(title);
                  setIsOpen(false);
                }}
              >
                {title}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
          type="submit"
          className="tutors-page-cta__btn"
          disabled={submitting || isSuccess || isValidationError}
          style={{
            background: isValidationError ? "#D32F2F" : isSuccess ? "#4CAF50" : undefined,
            color: isValidationError || isSuccess ? "#ffffff" : undefined,
            transition: "background 0.3s ease, color 0.3s ease"
          }}
        >
          {submitting && "Отправка…"}
          {!submitting && isValidationError && "Заполните поля! ⚠"}
          {!submitting && !isValidationError && isSuccess && "Отправлено! ✓"}
          {!submitting && !isValidationError && !isSuccess && "Отправить"}
      </button>

      <SuccessPopup visible={showSuccess} onClose={() => setShowSuccess(false)} />
    </form>
  );
}
