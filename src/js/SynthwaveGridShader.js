import { Color, Vector2 } from 'three';

const SynthwaveGridShader = {

	uniforms: {
		'time': { value: 0.0 },
		'gridSize': { value: 2.25 },
		'lineWidth': { value: 0.5 },
		'gridAntialias': { value: 1.0 },
		'gridSweepLineSpeed': { value: 25.0 },
		'gridSweepLineMaxDist': { value: 200.0 },
		'gridSweepLineWidth': { value: 5.0 },
		'gridHeightFaded': { value: 1.0 },
		'mountainHeightPeak': { value: 0.75 },
		'gridSweepLineColor': { value: new Color(0.7, 2.0, 2.0) },
		'gridColor': { value: new Color(2.0, 0.7, 2.0) },
		'floorColor': { value: new Color(0.075, 0.0, 0.125) },
		'mountainColor': { value: new Color(0.3, 0.0, 0.125) },
		'resolution': { value: new Vector2(256, 256) },
		'corridorWidth': { value: 2.0 },
		'mountainEdgeSmoothness': { value: 1.75 },
		'audioAvgMean': { value: 0.0 },
		'quadScale': { value: 0.75 },
		'freq': { value: 0.07 },
		'amp': { value: 3.0 },
		'minH': { value: 1.0 },
		'maxH': { value: 3.75 }
	},

	vertexShader: /* glsl */`
		uniform float time;
		uniform vec2 resolution;
		uniform float corridorWidth;
		uniform float mountainEdgeSmoothness;
		uniform float audioAvgMean;
		uniform float quadScale;
		uniform float freq;
		uniform float amp;
		uniform float minH;
		uniform float maxH;

		varying vec3 objectPosition;
		varying vec4 worldPosition;

		vec3 permute(vec3 x)
		{
			return mod(((x * 34.0) + 1.0) * x, 289.0);
		}

		// From https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
		float snoise(vec2 v)
		{
			const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
			vec2 i = floor(v + dot(v, C.yy));
			vec2 x0 = v - i + dot(i, C.xx);
			vec2 i1;
			i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
			vec4 x12 = x0.xyxy + C.xxzz;
			x12.xy -= i1;
			i = mod(i, 289.0);
			vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0));
			vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
			m = m * m;
			m = m * m;
			vec3 x = 2.0 * fract(p * C.www) - 1.0;
			vec3 h = abs(x) - 0.5;
			vec3 ox = floor(x + 0.5);
			vec3 a0 = x - ox;
			m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
			vec3 g;
			g.x = a0.x * x0.x + h.x * x0.y;
			g.yz = a0.yz * x12.xz + h.yz * x12.yw;
			return 130.0 * dot(m, g);
		}

		void main() {
			vec3 pos = position;

			float xAbs = abs(pos.x);
			float edgeCorridorSmoothness = mountainEdgeSmoothness * 0.5;
			float halfResX = resolution.x * 0.5 * quadScale;

			float corridor = smoothstep(corridorWidth - edgeCorridorSmoothness, corridorWidth + edgeCorridorSmoothness, xAbs);
			float edge = 1.0 - smoothstep(halfResX - mountainEdgeSmoothness, halfResX, xAbs);

			float corridorEdge = min(corridor, edge);
			float t = pos.z / resolution.y;

			float noise = (snoise(vec2(pos.x * freq, (pos.z + time) * freq)) * 0.5 + 0.5) * amp;
			float power = mix(minH, maxH, t * t);

			pos.y = pow(noise, power) * corridorEdge * audioAvgMean;

			objectPosition = pos;
			worldPosition = modelMatrix * vec4(pos, 1.0);

			gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
		}`,

	fragmentShader: /* glsl */`
		uniform float time;
		uniform float gridSize;
		uniform float lineWidth;
		uniform float gridAntialias;
		uniform float gridSweepLineSpeed;
		uniform float gridSweepLineMaxDist;
		uniform float gridSweepLineWidth;
		uniform float gridHeightFaded;
		uniform float mountainHeightPeak;
		uniform vec3 gridSweepLineColor;
		uniform vec3 gridColor;
		uniform vec3 floorColor;
		uniform vec3 mountainColor;
		uniform vec2 resolution;
		uniform float quadScale;

		varying vec3 objectPosition;
		varying vec4 worldPosition;

		void main() {
			// move the grid
			vec3 osPos = objectPosition;
			float z = osPos.z;
			osPos.z += time;

			// calculate the grid
			vec2 dist0 = fract(osPos.xz / gridSize);
			vec2 dist1 = 1.0 - dist0;
			vec2 grid = min(dist0, dist1);

			vec2 antialias = fwidth(osPos.xz) * gridAntialias;
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

			vec3 mountainColorDistFadeIn = mix(floorColor, mountainColor, z / (resolution.y * quadScale));

			vec3 mountainOrFloorColor = mix(floorColor, mountainColorDistFadeIn, tMountain);
			vec3 color = mix(mountainOrFloorColor, finalGridColor, gridIntensity);

			gl_FragColor = vec4(color, 1.0);
		}`
};

export default SynthwaveGridShader;