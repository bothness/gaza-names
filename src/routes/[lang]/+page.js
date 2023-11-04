const texts = {
  title: {en: "Remember their names", ar:	"تذكر أسمائهم"},
  description: {en: "Naming the Palestinians who have been killed in Gaza", ar: "تسمية الفلسطينيين الذين قتلوا في غزة"},
}

export async function load({ params }) {
  const lang = params.lang;

  return {lang, texts};
}