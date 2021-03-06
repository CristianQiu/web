import { Color, Vector2 } from 'three';

export const SynthwaveGridShader = {

	uniforms: {
		'time': { value: 0.0 },
		'gridSize': { value: 2.25 },
		'lineWidth': { value: 0.5 },
		'gridAntialias': { value: 1.0 },
		'gridSweepLineSpeed': { value: 25.0 },
		'gridSweepLineMaxDist': { value: 300.0 },
		'gridSweepLineWidth': { value: 75.0 },
		'gridHeightFaded': { value: 0.5 },
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
		'minH': { value: 0.5 },
		'maxH': { value: 3.0 }
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

		// From https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
		vec3 random3(vec3 c) {
			float j = 4096.0 * sin(dot(c, vec3(17.0, 59.4, 15.0)));

			float x = fract(64.0 * j);
			float y = fract(8.0 * j);
			float z = fract(512.0 * j);

			return vec3(x, y, z) - 0.5;
		}

		float snoise(vec3 p) {
			const vec3 F3 = vec3(0.3333333);
			const float G3 = 0.1666667;

			vec3 s = floor(p + dot(p, F3));
			vec3 x = p - s + dot(s, vec3(G3));

			vec3 e = step(vec3(0.0), x - x.yzx);
			vec3 i1 = e * (1.0 - e.zxy);
			vec3 i2 = 1.0 - e.zxy * (1.0 - e);

			vec3 x1 = x - i1 + G3;
			vec3 x2 = x - i2 + 2.0 * G3;
			vec3 x3 = x - 1.0 + 3.0 * G3;

			vec4 w;
			vec4 d;

			w.x = dot(x, x);
			w.y = dot(x1, x1);
			w.z = dot(x2, x2);
			w.w = dot(x3, x3);

			w = max(0.6 - w, 0.0);

			d.x = dot(random3(s), x);
			d.y = dot(random3(s + i1), x1);
			d.z = dot(random3(s + i2), x2);
			d.w = dot(random3(s + 1.0), x3);

			w *= w;
			w *= w;
			d *= w;

			return dot(d, vec4(52.0));
		}

		float gridHeight(vec3 pos)
		{
			float audioMean = audioAvgMean * 0.006;

			float halfResX = resolution.x * 0.5 * quadScale;
			float xAbs = abs(pos.x);
			float tz = pos.z / (resolution.y * quadScale);

			float endCorridorWidth = corridorWidth * 1.75;
			float edgeCorridorSmoothness = mountainEdgeSmoothness * 0.5;

			float mappedCorridorWidth = mix(corridorWidth, endCorridorWidth, tz * tz);

			float corridor = smoothstep(mappedCorridorWidth - edgeCorridorSmoothness, mappedCorridorWidth + edgeCorridorSmoothness, xAbs);
			float edge = 1.0 - smoothstep(halfResX - mountainEdgeSmoothness, halfResX, xAbs);
			float corridorEdge = min(corridor, edge);

			float noise = (snoise(vec3(pos.x * freq, (pos.z + time) * freq, audioMean)) * 0.5 + 0.5) * amp;
			float power = mix(minH, maxH, tz * tz);

			return pow(noise, power) * corridorEdge * audioMean;
		}

		void main() {
			vec3 pos = position;
			pos.y = gridHeight(pos);

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

		float grid(vec3 pos)
		{
			vec2 dist0 = fract(pos.xz / gridSize);
			vec2 dist1 = 1.0 - dist0;
			vec2 grid = min(dist0, dist1);

			vec2 antialias = fwidth(pos.xz) * gridAntialias;
			grid = smoothstep(vec2(0.0), vec2(lineWidth) * antialias, grid);

			return 1.0 - min(grid.x, grid.y);
		}

		vec3 gridCol(float posx, float posz)
		{
			const float initialOffset = 150.0;

			// sweep line
			float tz = mod(initialOffset + time * gridSweepLineSpeed, gridSweepLineMaxDist + gridSweepLineWidth) - gridSweepLineWidth;
			float sweepLine = abs(tz - posz);
			sweepLine = step(gridSweepLineWidth, sweepLine);

			// middle line
			const float epsilon = 0.025;
			float centerDist = abs(posx);
			float middleLine = step(gridSize + epsilon, centerDist);

			float middleSweepLine = max(sweepLine, middleLine);

			return mix(gridSweepLineColor, gridColor, middleSweepLine);
		}

		float tMountain(vec3 pos)
		{
			float tMountain = mix(0.0, mountainHeightPeak, sign(pos.y) * (pos.y * pos.y));

			return clamp(tMountain, 0.0, 1.0);
		}

		void main() {
			// move the grid
			vec3 osPos = objectPosition;
			float z = osPos.z;
			osPos.z += time;

			float grid = grid(osPos);
			vec3 gridCol = gridCol(osPos.x, z);

			// make the grid be faded at a certain height and color floor and mountains where there's no grid
			float gridHeightFade = 1.0 - smoothstep(0.0, gridHeightFaded, osPos.y);
			float gridIntensity = grid * gridHeightFade;

			vec3 mountainColorDistFadeIn = mix(floorColor, mountainColor, z / (resolution.y * quadScale));
			float tMountain = tMountain(osPos);

			vec3 mountainOrFloorColor = mix(floorColor, mountainColorDistFadeIn, tMountain);
			vec3 color = mix(mountainOrFloorColor, gridCol, gridIntensity);

			gl_FragColor = vec4(color, 1.0);
		}`
};