import { Color } from 'three';

const SynthwaveGridShader = {

	uniforms: {
		'time': { value: 0.0 },
		'invGridSize': { value: 2.25 },
		'lineWidth': { value: 0.6 },
		'gridSweepLineSpeed': { value: 30.0 },
		'gridSweepLineMaxDist': { value: 100.0 },
		'gridSweepLineWidth': { value: 15.0 },
		'gridHeightFaded': { value: 0.5 },
		'mountainHeightPeak': { value: 0.05 },
		'gridSweepLineColor': { value: new Color(0.95, 0.95, 10.0) },
		'gridColor': { value: new Color(5.0, 0.6, 5.0) },
		'floorColor': { value: new Color(0.075, 0.0, 0.125) },
		'mountainColor': { value: new Color(0.3, 0.0, 0.125) }
	},

	vertexShader: /* glsl */`
		varying vec3 objectPosition;

		void main() {
			objectPosition = position;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}`,

	fragmentShader: /* glsl */`
		uniform float time;
		uniform float invGridSize;
		uniform float lineWidth;
		uniform float gridSweepLineSpeed;
		uniform float gridSweepLineMaxDist;
		uniform float gridSweepLineWidth;
		uniform float gridHeightFaded;
		uniform float mountainHeightPeak;
		uniform vec3 gridSweepLineColor;
		uniform vec3 gridColor;
		uniform vec3 floorColor;
		uniform vec3 mountainColor;

		varying vec3 objectPosition;

		void main() {
			// move the grid
			vec3 osPos = objectPosition;
			float z = osPos.z;
			osPos.z += time;

			// calculate the grid
			vec2 dist0 = fract(osPos.xz / invGridSize);
			vec2 dist1 = 1.0 - dist0;
			vec2 grid = min(dist0, dist1);

			vec2 antialias = fwidth(osPos.xz);
			grid = smoothstep(vec2(0.0), vec2(lineWidth) * antialias, grid);

			// grid sweep line
			float tz = mod(time * gridSweepLineSpeed, gridSweepLineMaxDist + gridSweepLineWidth) - gridSweepLineWidth;
			float sweepLine = abs(tz - z);

			vec3 finalGridColor = mix(gridSweepLineColor, gridColor, step(gridSweepLineWidth, sweepLine));

			// make the grid be faded at a certain height and color floor and mountains where there's no grid
			float gridHeightFade = smoothstep(0.0, gridHeightFaded, osPos.y);
			float gridIntensity = (1.0 - min(grid.x, grid.y)) * (1.0 - gridHeightFade);

			float tMountain = mix(0.0, mountainHeightPeak, sign(osPos.y) * pow(osPos.y, 2.0));
			tMountain = clamp(tMountain, 0.0, 1.0);

			vec3 mountainOrFloorColor = mix(floorColor, mountainColor, tMountain);
			vec3 color = mix(mountainOrFloorColor, finalGridColor, gridIntensity);

			gl_FragColor = vec4(color, 1.0);
		}`
};

export default SynthwaveGridShader;