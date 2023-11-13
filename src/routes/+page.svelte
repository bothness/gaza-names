<script>
  import "../app.css";
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";

  onMount(() => {
    const lang = navigator.language.split("-")[0];
    goto(`${base}/${lang === "ar" ? "ar" : "en"}.html`);
  });
</script>

<a href="{base}/en/">Redirecting...</a>