const UberPostFxShader = {

	uniforms: {
		'tDiffuse': { value: null },
		'time': { value: 0.0 },
		'saturationIntensity': { value: 1.0 },
		'noiseWeight': { value: 0.4 },
		'scanLineCount': { value: 1024.0 },
		'scanLineIntensity': { value: 0.1 },
		'vignetteFallOffIntensity': { value: 0.15 },
		'vignetteFocusIntensity': { value: 15.0 },
		'exposure': { value: 1.25 },
		'turnOnIntensity': { value: 1.0 }
	},

	vertexShader: /* glsl */`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}`,

	fragmentShader: /* glsl */`
		#include <common>

		uniform sampler2D tDiffuse;
		uniform float time;
		uniform float saturationIntensity;
		uniform float noiseWeight;
		uniform float scanLineCount;
		uniform float scanLineIntensity;
		uniform float vignetteFallOffIntensity;
		uniform float vignetteFocusIntensity;
		uniform float exposure;
		uniform float turnOnIntensity;

		varying vec2 vUv;

		// From https://godotshaders.com/shader/vhs-and-crt-monitor-effect/
		vec2 curveUv(vec2 uv)
		{
			// TODO: expose this?
			const float warpIntensity = 0.025;

			vec2 delta = uv - 0.5;
			float deltaSq = dot(delta, delta);
			float deltaSqSq = deltaSq * deltaSq;
			float offset = deltaSqSq * warpIntensity;

			return uv + delta * offset;
		}

		// From https://github.com/gkjohnson/threejs-sandbox/blob/beb92e4a84456304a800e27b26f6d521f8b8360e/lens-effects/src/LensDistortionShader.js
		vec3 chromaticAberration(vec2 uv, sampler2D tDiffuse)
		{
			// TODO: expose this?
			const float bandOffset = -0.001;
			const float baseIor = 0.9;
			const vec3 back = vec3(0.0, 0.0, -1.0);

			vec3 normal = vec3((2.0 * uv - vec2(1.0)), 1.0);
			normal = normalize(normal);

			float r_ior = 1.0 + bandOffset * 0.0;
			float g_ior = 1.0 + bandOffset * 2.0;
			float b_ior = 1.0 + bandOffset * 4.0;

			vec3 r_refracted = refract(back, normal, baseIor / r_ior);
			vec3 g_refracted = refract(back, normal, baseIor / g_ior);
			vec3 b_refracted = refract(back, normal, baseIor / b_ior);

			float r = texture2D(tDiffuse, uv + r_refracted.xy).r;
			float g = texture2D(tDiffuse, uv + g_refracted.xy).g;
			float b = texture2D(tDiffuse, uv + b_refracted.xy).b;

			return vec3(r, g, b);
		}

		// From https://docs.unity3d.com/Packages/com.unity.shadergraph@6.9/manual/Saturation-Node.html
		vec3 saturation(vec3 mainTexColor, float intensity)
		{
			const vec3 dotWith = vec3(0.2126729, 0.7151522, 0.0721750);
			float luma = dot(mainTexColor, dotWith);

			return vec3(luma) + vec3(saturationIntensity) * (mainTexColor - vec3(luma));
		}

		// From three.js source
		vec3 RRTAndODTFit(vec3 v) {
			vec3 a = v * (v + 0.0245786) - 0.000090537;
			vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
			return a / b;
		}

		// Also from https://discourse.threejs.org/t/effect-composer-gamma-output-difference/12039/4
		vec3 ACESFilmicToneMapping(vec3 color) {
			color *= exposure / 0.6;

			// sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
			const mat3 ACESInputMat = mat3(
				vec3(0.59719, 0.07600, 0.02840), // transposed from source
				vec3(0.35458, 0.90834, 0.13383),
				vec3(0.04823, 0.01566, 0.83777)
			);

			// ODT_SAT => XYZ => D60_2_D65 => sRGB
			const mat3 ACESOutputMat = mat3(
				vec3(1.60475, -0.10208, -0.00327), // transposed from source
				vec3(-0.53108, 1.10813, -0.07276),
				vec3(-0.07367, -0.00605, 1.07602)
			);

			color = ACESInputMat * color;
			color = RRTAndODTFit(color);
			color = ACESOutputMat * color;

			return clamp(color, 0.0, 1.0);
		}

		// From https://godotshaders.com/shader/vhs-and-crt-monitor-effect/
		float vignette(vec2 uv)
		{
			uv *= 1.0 - uv.yx;
			float vignette = uv.x * uv.y * vignetteFocusIntensity;
			return pow(vignette, vignetteFallOffIntensity);
		}

		// From https://godotshaders.com/shader/vhs-and-crt-monitor-effect/
		float crtVignette(vec2 uv){
			const float radius = 0.015;

			vec2 absUv = abs(uv * 2.0 - 1.0) - vec2(1.0, 1.0) + radius;
			float dist = length(max(vec2(0.0), absUv)) / radius;
			float square = smoothstep(0.4, 1.0, dist);

			return clamp(1.0 - square, 0.0, 1.0);
		}

		// From three.js source
		vec3 noiseScanLines(vec2 uv, vec3 mainTexColor)
		{
			float oneMinusNoiseWeight = 1.0 - noiseWeight;
			float noise = rand(uv + mod(time, 4.0)) + 1.0 * 0.5;
			vec3 color = (mainTexColor * oneMinusNoiseWeight) + (mainTexColor * noise * noiseWeight);

			float s = uv.y * scanLineCount;
			vec2 scanLine = vec2(sin(s), cos(s));
			color += mainTexColor * vec3(scanLine, scanLine.x) * scanLineIntensity;

			return mainTexColor + 1.0 * (color - mainTexColor);
		}

		void main() {
			const vec3 offColor = vec3(0.2, 0.225, 0.25);

			vec2 curvedUv = curveUv(vUv);

			float crtVig = crtVignette(curvedUv);
			float vig = vignette(curvedUv);

			vec3 color = chromaticAberration(curvedUv, tDiffuse);
			color = mix(offColor, color, turnOnIntensity);
			color = saturation(color, saturationIntensity);
			color = ACESFilmicToneMapping(color);
			color = noiseScanLines(curvedUv, color);

			gl_FragColor = vec4(color * crtVig * vig, 1.0);
		}`,
};

export default UberPostFxShader;
