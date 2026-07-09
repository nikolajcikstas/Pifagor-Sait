interface SuccessPopupProps {
  visible: boolean;
  onClose: () => void;
}

export function SuccessPopup({ visible, onClose }: SuccessPopupProps) {
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
          background: "#fff",
          borderRadius: 24,
          padding: "48px 56px",
          textAlign: "center",
          maxWidth: 480,
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-h1-unbounded"
          style={{
            color: "#1D476D",
            margin: "0 0 16px",
            fontSize: 42,
          }}
        >
          Спасибо!
        </h2>
        <p
          className="text-h3"
          style={{
            color: "#374151",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Наш менеджер свяжется с Вами в ближайшее время!
        </p>
      </div>
    </div>
  );
}
