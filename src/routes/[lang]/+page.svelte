<script>
  import "../../app.css";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import people from "$lib/data/people";
  import tooltip from "$lib/ui/tooltip";
  import Icon from "$lib/ui/Icon.svelte";

  export let data;

  let lo = data.min;
  let hi = data.max;
	let w;
	let filterText = "";
	let showNames = false;
	let showFilters = false;

	$: h = w ? (data.people.length * 150) / w : 500;

  $: lang = $page.params.lang;
  $: t = (key) => data.texts?.[key]?.[lang] ? data.texts[key][lang] : key;
  $: nameKey = lang === "en" ? "Name in English" : "الاسم";
  $: sexKey = lang === "en" ? "Sex in English" : "الجنس";

  function updateFilter(filterText) {
    for (let i = 0; i < data.people.length; i ++) {
      let hidden;
      if (
        (!filterText || (data.people[i][nameKey] && data.people[i][nameKey].match(new RegExp(`${filterText}`, 'i')))) &&
        (data.people[i]["Age"] >= lo && data.people[i]["Age"] <= hi)
      ) hidden = false;
      else hidden = true;
      if (data.people[i].hidden == null || data.people[i].hidden !== hidden) data.people[i].hidden = hidden;
    }
	}
	$: updateFilter(filterText)

	function doAges() {
		if (lo < data.min) lo = data.min;
		if (lo > hi) lo = hi;
		if (hi > data.max) hi = data.max;
		if (hi < lo) hi = lo;
		updateFilter(filterText);
	}

	function resetFilters() {
		lo = data.min;
		hi = data.max;
		filterText = "";
	}
</script>

<svelte:head>
  {#if lang === "ar"}
  <style>
    body {
      direction: rtl;
    }
  </style>
  {/if}
</svelte:head>

<header class="header">
	<div>
		<h1>{t("title")}</h1>
		<p class="subtitle">{data.people.length.toLocaleString()} {t("subtitle")}, 7 Oct - 26 Oct 2023</p>
	</div>
	<nav class="nav">
		<div class="buttons">
			<button title="{t("toggle_filters")}" on:click={() => showFilters = !showFilters} use:tooltip><Icon type="filter"/></button>
			<button title="{t("toggle_names")}" style:margin-inline-end="12px" on:click={() => showNames = !showNames} use:tooltip><Icon type="{showNames ? "person" : "abc"}"/></button>
			<button title="{t("about")}" use:tooltip><Icon type="info"/></button>
			<button title="{t("share")}" use:tooltip><Icon type="share"/></button>
			<button title="{t("language")}" on:click={() => goto(`${base}/${lang === "en" ? "ar" : "en"}/`)} use:tooltip><span>{lang === "en" ? "ع" : "en"}</span></button>
		</div>
		{#if showFilters}
		<div class="filters">
			<input type="text" list="names" min="0" max="100" id="name" name="name" bind:value={filterText} placeholder="Type a name"/>
			<datalist id="names">
				{#each data.people as d}
				<option value="{d[nameKey]}"/>
				{/each}
			</datalist>
			Aged
			<input type="number" bind:value={lo} min={data.min} max={hi} on:change={doAges}/>
			to
			<input type="number" bind:value={hi} min={lo} max={data.max} on:change={doAges}/>
			<button on:click={resetFilters}>Reset</button>
		</div>
		{/if}
	</nav>
</header>
<div class="container" bind:clientWidth={w}>
	{#if showNames}
  <div class="columns">
		{#each data.people as d (d["مسلسل"])}
			<span
				style:color={d.hidden === true ? "rgba(0,0,0,0.1)" : "darkred"}
				style:pointer-events={d.hidden ? "none" : null}
				on:click={() => filterText = d[nameKey]}>
				{d[nameKey]}
			</span>
		{/each}
	</div>
	{:else if w}
	<svg viewBox="0 0 {w || 500} {h || 500}">
    {#key lang}
		{#each data.people as d (d["مسلسل"])}
			<path
				d="{people[d.path[0]][d.path[1]]}"
				transform="translate({d.x * w} {d.y * h - 20}) scale({d.flip ? "-" : ""}0.2 0.2)"
				fill={d.hidden === true ? "rgba(0,0,0,0.1)" : "darkred"}
				use:tooltip={{title: `${d[nameKey]}<br/>${d[sexKey]}, ${d["Age"]} ${d["Age"] === 1 ? t("year_old") : t("years_old")}`}}
				style:pointer-events={d.hidden ? "none" : null}
				on:click={() => filterText = d[nameKey]}/>
		{/each}
    {/key}
	</svg>
	{/if}
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		background: #f9f9f9;
		margin: 0;
		padding: 12px;
	}
	.header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		flex-wrap: wrap;
	}
	.header > * {
		min-width: 375px;
	}
	.nav {
		text-align: end;
	}
	.nav > .buttons {
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
	}
	.nav > .buttons > button {
		border: 2px solid #222;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		padding: 0;
		background: none;
	}
	.nav > .buttons > button:hover {
		background: rgba(0, 0, 0, 0.1);
	}
	.nav > .buttons > button + button {
    margin-inline-start: 4px;
	}
	.nav > .buttons > button > span {
		transform: translateY(-2px);
	}
	h1 {
		font-size: 2.5em;
		margin: 0;
		line-height: 0.9;
		text-transform: uppercase;
	}
	.subtitle {
		display: block;
		font-size: 1.2em;
		margin: 4px 0 12px;
	}
	.container {
		width: 100%;
		margin-top: 12px;
	}
	.columns {
		column-width: 140px;
		font-size: .8em;
	}
	.columns > span {
		display: block;
		color: darkred;
		line-height: 1;
		margin-bottom: 4px;
		break-inside: avoid;
	}
	.columns > span:hover {
		color: black;
		-webkit-text-stroke: 1px black;
		/* font-weight: bold; */
	}
	svg {
		width: 100%;
		overflow: visible;
	}
	svg > path {
		opacity: 0.5;
	}
	svg > path:hover {
		fill: black;
		opacity: 1;
	}
	input[type=text] {
		width: 150px;
	}
	input[type=number] {
		width: 55px;
	}
</style>