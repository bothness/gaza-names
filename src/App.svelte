<script>
	import { onMount } from "svelte";
	import { csvParse, autoType } from "d3";
	import people from "./people";
	import tooltip from "./tooltip";
	
	const sheet = "https://docs.google.com/spreadsheets/d/1PqAxz42cbTNnPijSzAcY83aZzjqKbOXivR4iO9LKGno/gviz/tq?tqx=out:csv&amp;gid=0"

	let data;
	let w;
	$: h = data && w ? (data.length * 150) / w : 500;

	function rand() {
	  let u = 0, v = 0;
	  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
	  while(v === 0) v = Math.random();
	  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
	  num = num / 10.0 + 0.5; // Translate to 0 -> 1
	  if (num > 1 || num < 0) return randn_bm() // resample between 0 and 1
	  return num
	}

	function getPath(age, sex) {
		const i = Math.floor(Math.random() * 6);
		if (age < 4) return ["baby", i];
		if (age < 13) return ["child", i];
		if (age < 20 && sex === "Female") return ["fteen", i];
		if (age < 20) return ["mteen", i];
		if (sex === "Female") return ["fadult", i];
		return ["madult", i];
	}

	async function init() {
		const res = await fetch(sheet);
		const dat = csvParse(await res.text(), autoType);
		// const dat = csvParse(data_raw, autoType);
		data = dat.map(d => ({
			...d,
			x: Math.random(), y: Math.random(),
			path: getPath(d["Age"], d["Sex in English"])
		}));
	}

	onMount(init);
</script>

<h1>Remember their names</h1>
{#if data}
<p class="subtitle">{data.length.toLocaleString()} people killed in Gaza, 7 Oct - 26 Oct 2023</p>
<div class="container" bind:clientWidth={w}>
	<svg viewBox="0 0 {w || 500} {h || 500}">
		{#each data as d (d["مسلسل"])}
			<path
				d="{people[d.path[0]][d.path[1]]}"
				transform="translate({d.x * w} {d.y * h - 20}) scale({Math.floor(Math.random() * 2) === 0 ? "-" : ""}0.2 0.2)"
				title="{d["Name in English"]}<br/>{d["Sex in English"]}, {d["Age"]} {d["Age"] === 1 ? "year" : "years"} old"
				use:tooltip/>
		{/each}
	</svg>
</div>
{/if}

<style>
	:global(body) {
		/* background: darkred;
		color: white; */
		box-sizing: border-box;
	}
	h1 {
		font-size: 3em;
		margin: 0;
		line-height: 0.9;
	}
	.subtitle {
		display: block;
		font-size: 1.3em;
		margin: 4px 0 12px;
	}
	.container {
		width: 100%;
	}
	svg {
		width: 100%;
		overflow: visible;
	}
	svg > path {
		fill: darkred;
		opacity: 0.5;
	}
	svg > path:hover {
		fill: black;
		opacity: 1;
	}
</style>