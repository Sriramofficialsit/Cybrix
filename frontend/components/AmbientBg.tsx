export function AmbientBg() {
  return (
    <>
      <div className="amb" aria-hidden="true">
        <div className="blob" style={{ width: 600, height: 600, left: -180, top: -140, background: "radial-gradient(circle,#c9b4f6,transparent 68%)", opacity: 0.55 }} />
        <div className="blob" style={{ width: 680, height: 680, right: -220, top: 520, background: "radial-gradient(circle,#a8d6f4,transparent 70%)", opacity: 0.45 }} />
        <div className="blob" style={{ width: 520, height: 520, left: "18%", top: 1900, background: "radial-gradient(circle,#dcc9f8,transparent 70%)", opacity: 0.4 }} />
        <div className="blob" style={{ width: 560, height: 560, right: "8%", bottom: 200, background: "radial-gradient(circle,#c9b4f6,transparent 70%)", opacity: 0.4 }} />
      </div>
      <div className="grid-bg" aria-hidden="true" />
    </>
  );
}
