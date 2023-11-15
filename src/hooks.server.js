/** @type {import('@sveltejs/kit').Handle} */
export function handle({ event, resolve }) {
  const lang = event.url.pathname.startsWith('/ar') ? 'ar' : 'en';
  const dir = event.url.pathname.startsWith('/ar') ? 'rtl' : 'ltr';
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang).replace('%dir%', dir)
	});
}