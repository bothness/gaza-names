<script>
	import { onMount } from "svelte";
	import { csvParse, autoType } from "d3";
	import people from "./people";
	import tooltip from "./tooltip";
	
	const sheet = "https://docs.google.com/spreadsheets/d/1PqAxz42cbTNnPijSzAcY83aZzjqKbOXivR4iO9LKGno/gviz/tq?tqx=out:csv&gid=0"

	let data;
	let min, max, lo, hi;
	let w = 500;
	let filterText = "";
	$: h = data && w ? (data.length * 150) / w : 500;

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
		let mx = 0;
		// const dat = csvParse(data_raw, autoType);
		data = dat.map(d => {
			if (!d["Age"]) d["Age"] = 0;
			if (d["Age"] === 1823) d["Age"] = 23;
			mx = Math.max(mx, d["Age"]);
			return {
				...d,
				x: Math.random(), y: Math.random(),
				path: getPath(d["Age"], d["Sex in English"]),
				flip: Math.round(Math.random())
			};
		});
		min = lo = 0;
		max = hi = mx;
	}

	// function filter({items, filterText}) {
	// 	console.debug("Getting items");
	// 	const start = [];
	// 	const end = [];
	// 	for (let i = 0; i < items.length; i ++) {
	// 		const d = items[i];
	// 		if (!filterText || d["Name in English"].match(new RegExp(`^${filterText}`, 'i'))) {
	// 			start.push(d);
	// 		} else if (d["Name in English"].match(new RegExp(`\\b${filterText}`, 'i'))) {
	// 			end.push(d);
	// 		}
	// 	}
	// 	return [...start, ...end];
	// }

	function updateFilter(filterText) {
		if (data) {
			for (let i = 0; i < data.length; i ++) {
				let hidden;
				if (
					(!filterText || data[i]["Name in English"].match(new RegExp(`${filterText}`, 'i'))) &&
					(data[i]["Age"] >= lo && data[i]["Age"] <= hi)
				) hidden = false;
				else hidden = true;
				if (data[i].hidden == null || data[i].hidden !== hidden) data[i].hidden = hidden;
			}
		}
	}
	$: updateFilter(filterText)

	function doAges() {
		if (lo < min) lo = min;
		if (lo > hi) lo = hi;
		if (hi > max) hi = max;
		if (hi < lo) hi = lo;
		updateFilter(filterText);
	}

	function raise(el, options) {
		if (options.visible) el.parentNode.appendChild(el);
	}

	onMount(init);
</script>

<h1>Remember their names</h1>
{#if data}
<p class="subtitle">{data.length.toLocaleString()} people killed in Gaza, 7 Oct - 26 Oct 2023</p>
<input type="text" list="names" min="0" max="100" id="name" name="name" bind:value={filterText} placeholder="Type a name"/>
<datalist id="names">
	{#each data as d}
	<option value="{d["Name in English"]}"/>
	{/each}
</datalist>
Aged
<input type="number" bind:value={lo} min={min} max={hi} on:change={doAges}/>
to
<input type="number" bind:value={hi} min={lo} max={max} on:change={doAges}/>
<div class="container" bind:clientWidth={w}>
	<svg viewBox="0 0 {w || 500} {h || 500}">
		{#each data as d (d["مسلسل"])}
			<path
				d="{people[d.path[0]][d.path[1]]}"
				transform="translate({d.x * w} {d.y * h - 20}) scale({d.flip ? "-" : ""}0.2 0.2)"
				fill={d.hidden === true ? "rgba(0,0,0,0.1)" : "darkred"}
				use:tooltip={{title: `${d["Name in English"]}<br/>${d["Sex in English"]}, ${d["Age"]} ${d["Age"] === 1 ? "year" : "years"} old`}}
				style:pointer-events={d.hidden ? "none" : null}/>
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
		margin-top: 12px;
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
	input[type=number] {
		width: 60px;
	}
</style>