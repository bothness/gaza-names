export default function makePoints(count, numCandidates = 5) {
	let points = [[Math.random(), Math.random()]];
	while (points.length < count) {
		points.push(sample(points, numCandidates));
	}
	return points;
}

function sample(samples, numCandidates) {
  var bestCandidate, bestDistance = 0;
  for (var i = 0; i < numCandidates; ++i) {
    var c = [Math.random(), Math.random()],
        d = distance(findClosest(samples, c), c);
    if (d > bestDistance) {
      bestDistance = d;
      bestCandidate = c;
    }
  }
  return bestCandidate;
}

function distance(a, b) {
  var dx = a[0] - b[0],
      dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function findClosest(samples, point) {
	let closest = samples[0];
	for (const s of samples) {
		if (distance(point, s) < distance(point, closest)) closest = s;
	}
	return closest;
}