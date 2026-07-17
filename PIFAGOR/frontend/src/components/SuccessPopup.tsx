import { useEffect } from "react";

interface SuccessPopupProps {
  visible: boolean;
  onClose: () => void;
}

export function SuccessPopup({ visible, onClose }: SuccessPopupProps) {
  useEffect(() => {
    if (!visible) return;
    const timeoutId = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.15)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: 24,
          padding: "48px 56px",
          textAlign: "center",
          maxWidth: 520,
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Закрыть уведомление"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            width: 34,
            height: 34,
            border: "none",
            borderRadius: "50%",
            background: "transparent",
            color: "#6B7280",
            cursor: "pointer",
            fontSize: 28,
            lineHeight: "30px",
            fontFamily: "Arial, sans-serif",
          }}
        >
          ×
        </button>
        <h2
          className="text-h1-unbounded"
          style={{
            color: "#1D476D",
            margin: "0 0 16px",
            fontSize: 38,
          }}
        >
          Заявка отправлена!
        </h2>
        <p
          className="text-h3"
          style={{
            color: "#374151",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Наш менеджер скоро с Вами свяжется
        </p>
      </div>
    </div>
  );
}
