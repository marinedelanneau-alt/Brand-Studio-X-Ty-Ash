export const THEME_STORAGE_KEY = "brand-studio-theme";

// Runs synchronously in <head>, before the first paint. Storage may be blocked.
export const THEME_BOOTSTRAP = `(function(){var t;try{t=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t})();`;
