import { Color } from 'three';

const SynthwaveGridShader = {

	uniforms: {
		'time': { value: 0.0 },
		'invGridSize': { value: 2.25 },
		'lineWidth': { value: 0.5 },
		'gridAntialias': { value: 1.0 },
		'gridSweepLineSpeed': { value: 25.0 },
		'gridSweepLineMaxDist': { value: 200.0 },
		'gridSweepLineWidth': { value: 5.0 },
		'gridHeightFaded': { value: 0.5 },
		'mountainHeightPeak': { value: 0.05 },
		'gridSweepLineColor': { value: new Color(0.7, 2.0, 2.0) },
		'gridColor': { value: new Color(2.0, 0.7, 2.0) },
		'floorColor': { value: new Color(0.075, 0.0, 0.125) },
		'mountainColor': { value: new Color(0.3, 0.0, 0.125) },
	},

	vertexShader: /* glsl */`
		varying vec3 objectPosition;
		varying vec4 worldPosition;

		vec3 permute(vec3 x)
		{
			return mod(((x * 34.0) + 1.0) * x, 289.0);
		}

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

			const float freq = 0.05;
			const float amp = 2.0;
			float height = snoise(vec2(position.x, position.z) * vec2(freq)) * amp;

			vec3 pos = position;
			pos.y = height;

			float col = mod(1.0, pos.z);
			float x = mix(col, 0.0, pos.z);
			float xAbs = abs(x);

			float corr = xAbs - 8.0;
			corr = max(0.0, corr);
			corr = log(corr + 1.0);
			corr = smoothstep(corr, 0.0, 1.75);

			float edge = xAbs - 8.0;
			edge = max(0.0, corr);
			edge = log(edge + 1.0);
			edge = smoothstep(edge, 0.0, 1.75);

			float t = pos.z / 128.0;

			float finalcorredge = min(corr, edge);
			float noise = pow(t, 6.12312311);
			noise = pow(pow(t, 6.123), 1.01);
			noise = pow(pow(t, 6.123), 1.02);
			noise = pow(pow(t, 6.123), 1.03);
			noise = pow(pow(t, 6.123), 1.04);

			float power = pow(noise, mix(1.5, 2.5, t * t));
			power *= 0.000001;


			objectPosition = pos;
			worldPosition = modelMatrix * vec4(pos, 1.0);

			gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
		}`,

	fragmentShader: /* glsl */`
		uniform float time;
		uniform float invGridSize;
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

		varying vec3 objectPosition;
		varying vec4 worldPosition;

		void main() {
			// move the grid
			vec3 osPos = objectPosition;
			float z = osPos.z;
			osPos.z += time;

			// calculate the grid
			vec2 dist0 = fract(osPos.xz / invGridSize);
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

			vec3 mountainOrFloorColor = mix(floorColor, mountainColor, tMountain);
			vec3 color = mix(mountainOrFloorColor, finalGridColor, gridIntensity);

			gl_FragColor = vec4(color, 1.0);
		}`
};

export default SynthwaveGridShader;