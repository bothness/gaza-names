<script>
  import "../app.css";
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";

  let lang = "en";

  onMount(() => {
    lang = navigator.language.split("-")[0];
    goto(`${base}/${lang === "ar" ? "ar" : "en"}.html`);
  });
</script>

<a href="{base}/{lang}.html">Redirecting...</a>