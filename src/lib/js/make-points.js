import { quadtree } from "d3-quadtree";

export default function makePoints(count, numCandidates = 10) {
	const pt = [Math.random(), Math.random()];
	const points = [pt];
	const qt = quadtree().extent([[0, 0], [1, 1]]).add(pt);
	
	while (points.length < count) {
		points.push(sample(qt, numCandidates));
	}
	return points;
}

function sample(qt, numCandidates) {
  var bestCandidate, bestDistance = 0;
  for (var i = 0; i < numCandidates; ++i) {
    var c = [Math.random(), Math.random()],
        d = distance(qt.find(...c), c);
    if (d > bestDistance) {
      bestDistance = d;
      bestCandidate = c;
    }
  }
	qt.add(bestCandidate);
  return bestCandidate;
}

function distance(a, b) {
  var dx = a[0] - b[0],
      dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}