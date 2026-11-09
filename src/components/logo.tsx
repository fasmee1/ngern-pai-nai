// Logo: a rounded tile in the app's sky-to-lavender gradient with a donut, the same shape as the summary chart.

export function LogoMark({ size = 36, id = "logo-grad" }: { size?: number; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="เงินไปไหน" className="logo-mark">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2c78fc" />
          <stop offset="1" stopColor="#918df6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill={`url(#${id})`} />
      <circle cx="24" cy="24" r="11" fill="none" stroke="#ffffff" strokeWidth="6" strokeDasharray="44 25" transform="rotate(-90 24 24)" strokeLinecap="round" />
      <circle cx="24" cy="24" r="11" fill="none" stroke="#33c758" strokeWidth="6" strokeDasharray="9 60" strokeDashoffset="-50" transform="rotate(-90 24 24)" strokeLinecap="round" />
    </svg>
  );
}

// Mark plus the app name, for headers and the sign-in page.
export function LogoLockup({ size = 36, id }: { size?: number; id?: string }) {
  return (
    <span className="logo-lockup">
      <LogoMark size={size} id={id} />
      <span className="logo-word">เงินไปไหน</span>
    </span>
  );
}
