// Looks like the home screen (header, balance card, spend card, tab bar) so the first paint is never blank.
export function AppSkeleton() {
  return (
    <div className="app" aria-busy="true">
      <div className="aurora" aria-hidden="true" />
      <header className="appbar">
        <div className="appbar-brand">
          <span className="sk sk-logo" />
          <span className="sk sk-round" />
        </div>
        <div className="appbar-text">
          <span className="sk sk-line short" />
          <span className="sk sk-line title" />
        </div>
      </header>
      <main className="app-main" aria-label="กำลังโหลด">
        <div className="sk sk-card tall" />
        <div className="sk sk-card" />
        <div className="sk sk-card short-card" />
      </main>
      <nav className="tabbar sk-tabbar" aria-hidden="true">
        <span className="sk sk-tab" /><span className="sk sk-tab" /><span className="sk sk-fab" /><span className="sk sk-tab" /><span className="sk sk-tab" />
      </nav>
    </div>
  );
}
