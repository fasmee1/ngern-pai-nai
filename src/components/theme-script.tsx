// Runs before first paint so the page never flashes the wrong theme.
// The code is a constant string, never user input.
const CODE = `(function(){try{var t=localStorage.getItem('jarvis-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: CODE }} />;
}
