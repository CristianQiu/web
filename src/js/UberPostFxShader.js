const UberPostFxShader = {

	uniforms: {
		'tDiffuse': { value: null },
		'time': { value: 0.0 },
		'saturationIntensity': { value: 1.0 },
		'scanLineCount': { value: 2048 },
		'scanLineIntensity': { value: 1.0 },
		'exposure': { value: 1.0 }
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
		uniform float scanLineCount;
		uniform float scanLineIntensity;
		uniform float exposure;

		varying vec2 vUv;

		// From https://github.com/gkjohnson/threejs-sandbox/blob/beb92e4a84456304a800e27b26f6d521f8b8360e/lens-effects/src/LensDistortionShader.js
		vec3 chromaticAberration(vec2 vUv, sampler2D tDiffuse)
		{
			// TODO: maybe expose this...
			const float bandOffset = -0.00075;
			const float baseIor = 0.9;

			const vec3 back = vec3(0.0, 0.0, -1.0);

			vec3 normal = vec3((2.0 * vUv - vec2(1.0)), 1.0);
			normal = normalize(normal);

			float r_ior = 1.0 + bandOffset * 0.0;
			float g_ior = 1.0 + bandOffset * 2.0;
			float b_ior = 1.0 + bandOffset * 4.0;

			vec3 r_refracted = refract(back, normal, baseIor / r_ior);
			vec3 g_refracted = refract(back, normal, baseIor / g_ior);
			vec3 b_refracted = refract(back, normal, baseIor / b_ior);

			float r = texture2D(tDiffuse, vUv + r_refracted.xy).r;
			float g = texture2D(tDiffuse, vUv + g_refracted.xy).g;
			float b = texture2D(tDiffuse, vUv + b_refracted.xy).b;

			return vec3(r, g, b);
		}

		vec3 noiseScanLines(vec2 vUv, vec3 mainTexColor)
		{
			// TODO: maybe expose this...
			const float noiseWeight = 0.5;
			const float oneMinusNoiseWeight = 1.0 - noiseWeight;

			float noise = rand(vUv + mod(time, 16.0)) + 1.0 * 0.5;
			vec3 color = (mainTexColor * oneMinusNoiseWeight) + (mainTexColor * noise * noiseWeight);

			vec2 scanLine = vec2(sin(vUv.y * scanLineCount), cos(vUv.y * scanLineCount));
			color += mainTexColor * vec3(scanLine.x, scanLine.y, scanLine.x) * scanLineIntensity;
			color = mainTexColor + 1.0 * (color - mainTexColor);

			return color;
		}

		// From https://docs.unity3d.com/Packages/com.unity.shadergraph@6.9/manual/Saturation-Node.html
		vec3 saturation(vec3 mainTexColor, float intensity)
		{
			float luma = dot(mainTexColor, vec3(0.2126729, 0.7151522, 0.0721750));

			return vec3(luma) + vec3(saturationIntensity) * (mainTexColor - vec3(luma));
		}

		vec3 vignette(vec2 vUv, vec3 mainTexColor)
		{
			// TODO: maybe expose this...
			const float enlarge = 0.5;

			float distToMid = 1.0 - length(abs(vec2(0.5) - vUv));
			distToMid = clamp(distToMid + enlarge, 0.0, 1.0);
			mainTexColor *= distToMid;

			return mainTexColor;
		}

		vec3 RRTAndODTFit(vec3 v) {
			vec3 a = v * (v + 0.0245786) - 0.000090537;
			vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
			return a / b;
		}

		// Also https://discourse.threejs.org/t/effect-composer-gamma-output-difference/12039/4
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

		void main() {
			vec3 color = chromaticAberration(vUv, tDiffuse);
			color = saturation(color, saturationIntensity);
			color = ACESFilmicToneMapping(color);
			color = vignette(vUv, color);
			color = noiseScanLines(vUv, color);

			gl_FragColor = vec4(color, 1.0);
		}`,
};

export default UberPostFxShader;
