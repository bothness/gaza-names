export async function load({ parent, params }) {
  const data = await parent();
  const lang = params.lang;

  return {...data, lang};
}