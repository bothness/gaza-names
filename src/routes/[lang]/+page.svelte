<script>
	import '../../app.css';
	import { onMount } from 'svelte';
	import { goto, afterNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import config from '$lib/data/config.js';
	import { getData, FIGURE_WIDTH, FIGURE_HEIGHT } from '$lib/js/get-data';
	import tooltip from '$lib/ui/tooltip';
	import Tooltip from '$lib/ui/Tooltip.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import Logo from '$lib/ui/Logo.svelte';
	import License from '$lib/ui/License.svelte';
	import debounce from 'debounce';

	const domain = config.domain

	const FIGURE_DRAW_WIDTH = 20
	const FIGURE_DRAW_HEIGHT = 40
	const COUNT_PER_PAGE = 1000

	let data = {...config}
	let figureImages = null
	let canvasElement
	let ctx
	let canvasTooltip
	let ctxTooltip
	let maxX, maxY
	let lo;
	let hi;
	let w, width, nav, navLeft;
	let filterText = '';
	let showNames = false;
	let showFilters = false;
	let showModal = false;
	let showShare = false;
	let hovered, selected;
	let tooltipPerson, tooltipX, tooltipY;
	let isSelected = false
	let currentPage = 0
	let selectedNameIndex = -1

	onMount(async () => {
		Promise.all([
			new Promise(resolve => {
				return getData()
					.then(r => data = Object.assign(data, r))
					.then(() => resolve())
			}),
			new Promise(resolve => {
				loadFiguresImg()
					.then(r => figureImages = r)
					.then(() => resolve())
			})
		]).then(() => {
			lo = data.min;
			hi = data.max;
			loadCanvas(data, figureImages)
		})
	});

	function getLang(page) {
		const param = page?.params?.lang;
		if (typeof param === "string") return param.slice(0, 2);
		return "en";
	}

	$: h = w && data?.people ? (data.people.length * 400) / w : 500;
	$: lang = getLang($page);
	$: t = (key) => (data?.texts?.[key]?.[lang] ? data.texts[key][lang] : key);
	$: nameKey = lang === 'en' ? 'name' : 'name_ar';

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
				data.people[i]['age'] >= lo &&
				data.people[i]['age'] <= hi
			) {
				hidden = false;
				count += 1;
			} else hidden = true;
			if (data.people[i].hidden !== hidden)
				data.people[i].hidden = hidden;
		}
		if (count === 1) {
			const person = data.people.find(d => d[nameKey] === filterText);
			if (person) lo = hi = person['age'];
		}
		// Re-draw if the canvas is visible
		if (ctx) {
			loadCanvas(data, figureImages)
		}
	}
	$: data?.people && updateFilter(filterText, lo, hi);

	function doages() {
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
		lo = hi = d['age'];
		showFilters = true;
	}

	const makeDate = (date) =>  [
		date.getDate(),
		date.toLocaleDateString(lang === "ar" ? "ar-PS" : lang, {month: 'short'}),
		date.getFullYear()
	].join(" ");

	function makeDateRange(meta, lang) {
		const start = makeDate(meta.start_date);
		const end = makeDate(meta.end_date);
		return `${start}—${end}`;
	}

	const onResize = debounce((el) => {
		checkNavLeft(el)
		loadCanvas(data, figureImages)
	}, 1000)

	const checkNavLeft = (el) => {
		if (el.target) el = nav;
		const rect = el.getBoundingClientRect();
		navLeft = lang === "en" ? rect.left < 50 :
			rect.right > width - 50;
	};

	afterNavigate(() => {
		document.documentElement.setAttribute('lang', lang);
		document.documentElement.setAttribute('dir', lang === "ar" ? "rtl" : "ltr");
	});

	const loadFiguresImg = async () => {

		const figure = new Image()
		figure.src = `./img/figures.png`

		const selected = new Image()
		selected.src = `./img/figures-selected.png`

		await Promise.all(
			Array.from(document.images).map(
				(image) =>
					new Promise((resolve) => image.addEventListener("load", resolve)),
			),
		);

		return {
			figure,
			selected
		}
	}

	const loadCanvas = async (data, figureImages) => {

		if (!canvasElement) {
			return
		}

		ctx = canvasElement.getContext('2d')
		ctxTooltip = canvasTooltip.getContext('2d')
		ctx.reset()

		maxX = w - FIGURE_DRAW_WIDTH
		maxY = h - FIGURE_DRAW_HEIGHT


		data.people.forEach((person, i) => {
			if (person.hidden) {
				return
			}
			person.canvasX = Math.floor(person.x * maxX);
			person.canvasY = Math.floor(person.y * maxY);
			ctx.drawImage(
				figureImages.figure,
				person.imageXY.x,
				person.imageXY.y,
				FIGURE_WIDTH,
				FIGURE_HEIGHT,
				person.canvasX,
				person.canvasY,
				FIGURE_DRAW_WIDTH,
				FIGURE_DRAW_HEIGHT
			)
		})

		const getTooltipPerson = (x, y) => {
			const halfDistanceW = FIGURE_DRAW_WIDTH * 0.5
			const halfDistanceH = FIGURE_DRAW_HEIGHT * 0.5
			const persons = data.people
				.filter(person => {
					const xDistance = Math.abs(person.canvasX - x + halfDistanceW)
					const yDistance = Math.abs(person.canvasY - y + halfDistanceH)
					person.xDistance = xDistance
					person.yDistance = yDistance
					return xDistance <= halfDistanceW || yDistance < halfDistanceH
				})
				.map(person => {
					person.distance = person.xDistance + person.yDistance
					return person
				})
				.sort((a, b) => a.distance - b.distance)

			if (persons.length) {
				return persons[0]
			}
		}

		const trackHover = debounce((e) => {
			if (isSelected || !canvasElement) {
				return
			}
			const rect = canvasElement.getBoundingClientRect()
			const x = e.clientX - rect.left
			const y = e.clientY - rect.top
			const width = rect.right - rect.left
			const height = rect.bottom - rect.top
			if (x < 0 | x > width || y > height || y < 0) {
				drawTooltip()
				return
			}
			const person = getTooltipPerson(x, y)
			if (person) {
				drawTooltip(person)
			}
		}, 100)

		const onClick = e => {
			const person = getTooltipPerson(e.offsetX, e.offsetY)
			if (person) {
				drawTooltip(person)
				isSelected = true
			}
		}

		document.addEventListener('mousemove', trackHover)
		canvasTooltip.addEventListener('click', onClick)
	}

	const drawTooltip = (person) => {
		ctxTooltip.reset()
		tooltipPerson = person
		if (!person) {
			return
		}
		person.canvasX = Math.floor(person.x * maxX);
		person.canvasY = Math.floor(person.y * maxY);
		tooltipX = person.canvasX + (FIGURE_DRAW_WIDTH * 0.5)
		tooltipY = person.canvasY + FIGURE_DRAW_HEIGHT
		ctxTooltip.drawImage(
			figureImages.selected,
			person.imageXY.x,
			person.imageXY.y,
			FIGURE_WIDTH,
			FIGURE_HEIGHT,
			person.canvasX,
			person.canvasY,
			FIGURE_DRAW_WIDTH,
			FIGURE_DRAW_HEIGHT
		)
	}

	const onCloseTooltip = () => {
		drawTooltip()
		isSelected = false
	}

	/**
	 * Re-draw the canvas when toggling between names/figures
	 */
	const toggleView = () => {
		showNames = !showNames;
		selected = null
		if (!showNames) {
			// Make sure canvas is mounted onto site
			setTimeout(() => {
				loadCanvas(data, figureImages)
			}, 1)
		}
	}

	/** Toggle tooltip on the names display */
	const selectName = index => {
		selectedNameIndex = index
	}


</script>

<svelte:window on:resize={onResize} bind:innerWidth={width}/>

<svelte:head>
	<title>{t("title")}</title>
	<meta name="description" content="{t("description")}">
	<meta property="og:description" content="{t("description")}">
	<meta property="og:type" content="website"><link rel="canonical" href="{domain}{base}/{lang}/">
	<meta property="og:url" content="{domain}{base}/{lang}/">
	<meta name="twitter:card" content="summary_large_image">
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
				<button on:click={() => (showModal = false)} class="button-close" title="{t('close')}"
					><Icon type="close" /></button
				>
				<h2>{t('about')}</h2>
				<p>{@html
					formatParagraphs(
						t('about_text')
							.replaceAll('{count}', data?.people.length.toLocaleString() ?? '...')
							.replaceAll('{start_date}', makeDate(data.meta.start_date))
							.replaceAll('{end_date}', makeDate(data.meta.end_date))
					)
				}</p>
			</div>
		</div>
	</div>
{/if}

<header class="header">
	<div>
		<h1>{t('title')}</h1>
		<p class="subtitle">
			{data.people.length.toLocaleString()}
			{#if data.people.length < data.meta.total_killed}{t('out_of')} {data.meta.total_killed.toLocaleString()}{/if}
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
					on:click={toggleView}
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
					lang={lang === 'en' ? 'ar' : 'en'}
					on:click={() => goto(`${base}/${lang === 'en' ? 'ar' : 'en'}.html`)}
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
				<input type="number" bind:value={lo} min={data.min} max={hi} on:change={doages} />
				<span>{t("to")}</span>
				<input type="number" bind:value={hi} min={lo} max={data.max} on:change={doages} />
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
			{#each data.people.slice(currentPage * COUNT_PER_PAGE, (currentPage * COUNT_PER_PAGE) + COUNT_PER_PAGE - 1) as d (d['index'])}
				<div class="name-wrapper" class:name-selected-wrapper={d['index'] === selectedNameIndex}>
					<button class="name" class:name-unselected={d.hidden} on:click={() => selectName(d['index'])}>
						{d[nameKey]}
					</button>
					<span class="name-tooltip">
						<strong>{d[nameKey]}</strong><button on:click={() => selectName()} class="modal-close" title="{t('close')}"><Icon type="close"/></button><br/>
						{d['sex'] === 'm' ? t('male') : t('female')}, {d['age']} {d['age'] === 1 ? t('year_old') : t('years_old')}
					</span>
				</div>
			{/each}
		</div>
		<div class="names-pagination">
			<div class="names-pagination-description">
				Showing {currentPage * COUNT_PER_PAGE + 1}—{Math.min(data.people.length, currentPage * COUNT_PER_PAGE + COUNT_PER_PAGE)} of {data.people.length} names
			</div>
			<nav class="names-pagination-buttons">
				{#each {length: Math.ceil(data.people.length / COUNT_PER_PAGE)} as _, i}
					<button on:click={() => currentPage = i}>{i+1}</button>
				{/each}
			</nav>
		</div>
	{:else if w}
		<canvas bind:this={canvasElement} id="names-canvas" width="{w || 500}" height="{h || 500}"></canvas>
		<canvas bind:this={canvasTooltip} id="names-canvas-tooltip" width="{w || 500}" height="{h || 500}"></canvas>
		{#if tooltipPerson}
		<Tooltip width={w + 24} x={tooltipX} y={tooltipY} pos="bottom">
			<strong>{tooltipPerson[nameKey]}</strong><button on:click={onCloseTooltip} class="modal-close" title="{t('close')}"><Icon type="close"/></button><br/>
			{tooltipPerson['sex'] === 'm' ? t('male') : t('female')}, {tooltipPerson['age']} {tooltipPerson['age'] === 1 ? t('year_old') : t('years_old')}
		</Tooltip>
		{/if}
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
		padding: 0;
	}
	.header,
	.footer {
		padding: 0.75rem;
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
		position: relative;
		width: 100%;
		margin-top: 12px;
	}
	.columns {
		column-width: 180px;
		font-size: 0.8rem;
		line-height: 1;
		break-inside: avoid;
		padding-left: 0.75rem;
		padding-right: 0.75rem;
	}
	.name-wrapper {
		position: relative;
	}
	.name {
		padding: 0;
		border: none;
		background: transparent;
		margin: 0;
		text-align: initial;
		break-inside: avoid;
		color: darkred;
	}
	.name-unselected {
		opacity: 0.25;
	}
	.name-tooltip {
		display: none;
		position: absolute;
		top: 100%;
		left: 0;
		width: 100%;
		padding: 0.25rem;
		background: #222;
		color: white;
		z-index: 9999;
	}
	.name-selected-wrapper .name-tooltip {
		display: block;
	}
	.names-pagination {
		margin: 2rem 0.75rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}
	.names-pagination-buttons {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.125rem;
	}
	.names-pagination-buttons button {
		color: darkred;
		border: 1px solid darkred;
		background: transparent;
		margin: 0;
		width: 2rem;
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
	button.modal-close {
		float: inline-end;
		background: none;
		border: none;
		margin-inline-start: 6px;
		padding: 0;
		font-size: larger;
		color: white;
	}
	button.modal-close:hover {
		color: #ccc;
	}
	#names-canvas-tooltip {
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
