// Accès au serveur de fichiers de l'entreprise (WD My Cloud EX2 Ultra).
// On ne peut pas parcourir les fichiers du NAS directement dans l'app
// (sécurité navigateur : HTTPS + CORS), mais on peut ouvrir le portail WD.
const KEY = 'sp_wd_url'

// Portail d'accès à distance WD My Cloud OS5 par défaut.
export const WD_DEFAULT = 'https://os5.mycloud.com'

export function getWdUrl(): string {
  return localStorage.getItem(KEY) || WD_DEFAULT
}
export function setWdUrl(url: string) {
  const clean = url.trim()
  if (clean) localStorage.setItem(KEY, clean)
  else localStorage.removeItem(KEY)
}
