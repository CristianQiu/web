const UberPostFxShader = {

	uniforms: {
		'tDiffuse': { value: null },
		'time': { value: 0.0 },
		'scanLineCount': { value: 2048 },
		'scanLineIntensity': { value: 1.0 },
		'grayScaleIntensity': { value: 1.0 }
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
		uniform float scanLineCount;
		uniform float scanLineIntensity;
		uniform float grayScaleIntensity;

		varying vec2 vUv;

		// From https://github.com/gkjohnson/threejs-sandbox/blob/beb92e4a84456304a800e27b26f6d521f8b8360e/lens-effects/src/LensDistortionShader.js
		vec3 chromaticAberration(vec2 vUv, sampler2D tDiffuse)
		{
			// TODO: maybe expose this...
			const float bandOffset = -0.001;
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
			float noise = rand(vUv + mod(time, 16.0)) + 1.0 * 0.5;
			vec3 color = (mainTexColor + (mainTexColor * noise)) * 0.5; // < average it

			vec2 scanLine = vec2(sin(vUv.y * scanLineCount), cos(vUv.y * scanLineCount));
			color += mainTexColor * vec3(scanLine.x, scanLine.y, scanLine.x) * scanLineIntensity;
			color = mainTexColor + 1.0 * (color - mainTexColor);

			return color;
		}

		vec3 grayScaled(vec3 mainTexColor, float intensity)
		{
			vec3 gray = vec3(mainTexColor.r * 0.3 + mainTexColor.g * 0.59 + mainTexColor.b * 0.11);

			return mix(mainTexColor, gray, intensity);
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

		void main() {
			vec3 color = chromaticAberration(vUv, tDiffuse);
			color = noiseScanLines(vUv, color);
			color = grayScaled(color, grayScaleIntensity);
			color = vignette(vUv, color);

			gl_FragColor = vec4(color, 1.0);
		}`,
};

export default UberPostFxShader;
