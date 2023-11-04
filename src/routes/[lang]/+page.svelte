<script>
	import '../../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { domain, texts } from '$lib/data/config';
	import getData from '$lib/js/get-data';
	import people from '$lib/data/people';
	import tooltip from '$lib/ui/tooltip';
	import Icon from '$lib/ui/Icon.svelte';
	import Logo from '$lib/ui/Logo.svelte';
	import License from '$lib/ui/License.svelte';

	let data = {texts: {...texts}};
	onMount(async () => {
		data = Object.assign(data, await getData());
		lo = data.min;
		hi = data.max;
	});

	let lo;
	let hi;
	let w, width, nav, navLeft;
	let filterText = '';
	let showNames = false;
	let showFilters = false;
	let showModal = false;
	let showShare = false;

	$: h = w && data?.people ? (data.people.length * 400) / w : 500;
	$: lang = $page ? $page?.params?.lang : "en";
	$: t = (key) => (data?.texts?.[key]?.[lang] ? data.texts[key][lang] : key);
	$: nameKey = lang === 'en' ? 'Name in English' : 'الاسم';
	$: sexKey = lang === 'en' ? 'Sex in English' : 'الجنس';

	const formatParagraphs = (text) =>
		text
			.split('\n\n')
			.map((t) => `<p>${t}</p>`)
			.join('');

	function updateFilter(filterText) {
		let count = 0;
		for (let i = 0; i < data.people.length; i++) {
			let hidden;
			if (
				(!filterText ||
					(data.people[i][nameKey] &&
						data.people[i][nameKey].match(new RegExp(`${filterText}`, 'i')))) &&
				data.people[i]['Age'] >= lo &&
				data.people[i]['Age'] <= hi
			) {
				hidden = false;
				count += 1;
			} else hidden = true;
			if (data.people[i].hidden !== hidden)
				data.people[i].hidden = hidden;
		}
		if (count === 1) {
			const person = data.people.find(d => d[nameKey] === filterText);
			if (person) lo = hi = person['Age'];
		}
	}
	$: data.people && updateFilter(filterText, lo, hi);

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
		filterText = '';
	}

	function doSelect(d) {
		filterText = d[nameKey];
		lo = hi = d['Age'];
		showFilters = true;
	}

	function makeDateRange(meta, lang) {
		const makeDate = (date) =>  [
			date.getDate(),
			date.toLocaleDateString(lang === "ar" ? "ar-PS" : lang, {month: 'short'}),
			date.getFullYear()
		];
		const start = makeDate(meta.start_date);
		const end = makeDate(meta.end_date);
		if (start[2] === end[2]) start.pop();
		return `${start.join(" ")} - ${end.join(" ")}`;
	}

	const checkNavLeft = (el) => {
		if (el.target) el = nav;
		const rect = el.getBoundingClientRect();
		navLeft = lang === "en" ? rect.left < 50 :
			rect.right > width - 50;
	};
</script>

<svelte:window on:resize={checkNavLeft} bind:innerWidth={width}/>

<svelte:head>
	<title>{t("title")}</title>
	<meta name="description" content="{t("description")}">
	<meta property="og:description" content="{t("description")}">
	<meta property="og:type" content="website"><link rel="canonical" href="{domain}{base}/{lang}/">
	<meta property="og:url" content="{domain}{base}/{lang}/"><meta name="twitter:card" content="summary_large_image">
	<meta property="og:image" content="{domain}{base}/img/og.png">
	<meta property="og:title" content="{t("title")}">
	{#if lang === 'ar'}
		<style>
			body {
				direction: rtl;
			}
		</style>
	{/if}
</svelte:head>

{#if data?.people}
{#if showModal}
	<div class="mask">
		<div class="modal-outer">
			<div class="modal-inner">
				<button on:click={() => (showModal = false)} class="button-close" title="Close this"
					><Icon type="close" /></button
				>
				<h2>{t('about')}</h2>
				<p>{@html formatParagraphs(t('about_text'))}</p>
			</div>
		</div>
	</div>
{/if}

<header class="header">
	<div>
		<h1>{t('title')}</h1>
		<p class="subtitle">
			{data.people.length.toLocaleString()}
			{t('subtitle')}, <span style:white-space="nowrap">{makeDateRange(data.meta, lang)}</span>
		</p>
	</div>
	<nav class="nav" bind:this={nav} use:checkNavLeft>
		<div class="buttons">
			{#key showFilters}<button
					title={showFilters ? t('reset_filters') : t('show_filters')}
					on:click={() => {
						showFilters = !showFilters;
						showShare = false;
						if (!showFilters) resetFilters();
					}}
					class:button-active={showFilters}
					use:tooltip><Icon type="{showFilters ? "close" : "filter"}" /></button
				>{/key}
			{#key showNames}<button
					title={showNames ? t('show_people') : t('show_names')}
					on:click={() => (showNames = !showNames)}
					use:tooltip><Icon type={showNames ? 'person' : 'abc'} /></button
				>{/key}
			<button title={t('about')} on:click={() => (showModal = true)} use:tooltip
				><Icon type="info" /></button
			>
			<button title={t('share')}
			on:click={() => { showShare = !showShare; showFilters = false; }} class:button-active={showShare} use:tooltip
				><Icon type={showShare ? 'close' : 'share'} /></button
			>
			{#key lang}<button
					title={t('language')}
					on:click={() => goto(`${base}/${lang === 'en' ? 'ar' : 'en'}/`)}
					use:tooltip><span>{lang === 'en' ? 'ع' : 'en'}</span></button
				>{/key}
		</div>
		{#if showFilters}
			<div class="tray" class:tray-left={navLeft}>
				<input
					type="text"
					list="names"
					id="name"
					name="name"
					bind:value={filterText}
					placeholder="{t("type_name")}"
				/>
				<datalist id="names">
					{#each data.people as d}
						<option value={d[nameKey]} />
					{/each}
				</datalist>
				<span>{t("aged")}</span>
				<input type="number" bind:value={lo} min={data.min} max={hi} on:change={doAges} />
				<span>{t("to")}</span>
				<input type="number" bind:value={hi} min={lo} max={data.max} on:change={doAges} />
				<!-- <button on:click={resetFilters}>{t("reset")}</button> -->
			</div>
		{:else if showShare}
			<div class="tray buttons" class:tray-left={navLeft}>
				<a href="https://twitter.com/intent/tweet?text={t('title')}/&url={domain}{base}/{lang}" title="{t("twitter")}"><Icon type="twitter"/></a>
				<a href="https://www.facebook.com/sharer/sharer.php?u={domain}{base}/{lang}/" title="{t("facebook")}"><Icon type="facebook"/></a>
				<a href="whatsapp://send?text={t('title')} {domain}{base}/{lang}/" title="{t("whatsapp")}"><Icon type="whatsapp"/></a>
				<a href="https://reddit.com/submit?title={t('title')}&url={domain}{base}/{lang}/" title="{t("reddit")}"><Icon type="reddit"/></a>
				<a href="mailto:?subject={t('title')}&body={t('title')} {domain}{base}/{lang}/" title="{t("email")}"><Icon type="email"/></a>
			</div>
		{/if}
	</nav>
</header>
<div class="container" bind:clientWidth={w}>
	{#if showNames}
		<div class="columns">
			{#each data.people as d (d['مسلسل'])}
				<span
					style:color={d.hidden === true ? 'rgba(0,0,0,0.1)' : 'darkred'}
					on:click={() => doSelect(d)}
				>
					{d[nameKey]}
				</span>
			{/each}
		</div>
	{:else if w}
		<svg viewBox="0 0 {w || 500} {h || 500}">
			{#key lang}
				{#each data.people as d (d['مسلسل'])}
					<path
						d={people[d.path[0]][d.path[1]]}
						transform="translate({d.x * w - 35} {d.y * h - 71}) scale({d.flip ? '-' : ''}0.3 0.3)"
						transform-origin="35 71"
						fill={d.hidden === true ? 'rgba(0,0,0,0.1)' : 'darkred'}
						use:tooltip={{
							title: `${d[nameKey]}<br/>${d[sexKey]}, ${d['Age']} ${
								d['Age'] === 1 ? t('year_old') : t('years_old')
							}`,
							ignore: d.hidden
						}}
						on:click={() => doSelect(d)}
					/>
				{/each}
			{/key}
		</svg>
	{/if}
</div>

<footer class="footer">
	<a href="{domain}" title="{t("vp")}"><Logo/></a>
	<a href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.{lang}" title="{t("license")}" target="_blank"><License/></a>
</footer>
{:else}
<div class="mask">
	<div class="spinner-border"/>
</div>
{/if}

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		background: #f9f9f9;
		margin: 0;
		padding: 12px;
	}
	button {
		cursor: pointer;
	}
	.mask {
		z-index: 20;
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.7);
	}
	.modal-outer {
		position: relative;
		max-width: 624px;
		margin: 50px auto 0;
	}
	.modal-inner {
		position: relative;
		margin: 0 12px;
		padding: 12px;
		background: white;
		border: 2px solid #222;
	}
	.header, .footer {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		flex-wrap: wrap;
	}
	.header {
		margin-top: 4px
	}
	.footer {
		margin-top: 36px;
		padding-bottom: 4px;
	}
	.footer > a {
		margin-bottom: 4px;
	}
	.header > div {
		min-width: 350px;
		flex-grow: 1;
	}
	.nav {
		position: relative;
		text-align: end;
		flex-shrink: 1;
	}
	.nav > .buttons {
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
	}
	.nav > .buttons > button, .nav > .buttons > a {
		color: #222;
		background: white;
		border: 2px solid #222;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		padding: 0;
	}
	.nav > .buttons > button.button-active {
		color: white;
		background: #222;
	}
	.nav > .buttons > button:hover, .nav > .buttons > a:hover {
		background: #ccc;
	}
	.nav > .buttons > button.button-active:hover {
		background: #333;
	}
	.nav > .buttons > button + button, .nav > .buttons > a + a {
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
		column-width: 180px;
		font-size: 0.8em;
	}
	.columns > span {
		display: block;
		color: darkred;
		line-height: 1;
		margin-bottom: 4px;
		break-inside: avoid;
	}
	.columns > span:hover {
		color: #222;
		-webkit-text-stroke: 1px #222;
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
		fill: #222;
		opacity: 1;
	}
	input[type='text'] {
		width: auto;
		min-width: 150px;
	}
	input[type='number'] {
		width: 55px;
	}
	.modal-inner button.button-close {
		position: absolute;
		right: 12px;
		top: 12px;
		width: 32px;
		height: 32px;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		border: none;
		background: none;
		margin: 0;
		font-size: 2em;
	}
	.tray {
		z-index: 1;
		position: absolute;
		top: 36px;
		inset-inline-end: 0;
		background: #222;
		padding: 8px;
		border-radius: 24px;
		line-height: 1;
		display: flex;
		flex-direction: row;
		align-items: center;
		color: white;
		max-width: calc(100vw - 24px);
	}
	.tray-left {
		inset-inline-end: auto;
		inset-inline-start: 0;
	}
	.tray > input {
		height: 32px;
		border-radius: 16px;
		margin: 0;
	}
	.tray > input[type=number], .tray > span {
		display: inline-block;
		margin-inline-start: 4px;
	}
</style>
