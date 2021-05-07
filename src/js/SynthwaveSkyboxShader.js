import { Vector3, Vector4, Color } from 'three';

const SynthwaveSkyboxShader = {

	uniforms: {
		'sunPosition': { value: new Vector3(0.0, 0.05, 1.0) },
		'sunDiscSize': { value: 0.2 },
		'sunAntialiasing': { value: 1.5 },
		'sunStripeHeights': { value: new Vector4(-0.26, -0.44, -0.63, -0.82) },
		'sunStripeWidths': { value: new Vector4(0.03, 0.04, 0.05, 0.06) },
		'sunBottomColor': { value: new Color(0.85, 0.4, 0.85) },
		'sunMidColor': { value: new Color(1.0, 0.315, 1.0) },
		'sunTopColor': { value: new Color(0.67, 0.67, 0.11) },
		'sunGradientMidPoint': { value: 0.0 },
		'skyTintsSun': { value: 0.0 },
		'horizonHeight': { value: 0.0 },
		'nadirColor': { value: new Color(0.0, 0.0, 0.0) },
		'horizonColor': { value: new Color(0.5, 0.1, 0.5) },
		'zenithColor': { value: new Color(0.0, 0.1, 1.0) },
		'flareColor': { value: new Color(0.555, 0.555, 2.0) },
		'flarePosition': { value: -0.02 },
		'flareWidth': { value: 0.01 },
		'flareFalloff': { value: 0.0005 }
	},

	vertexShader: /* glsl */`
		varying vec3 objectPosition;

		void main() {
			objectPosition = position;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			gl_Position.z = gl_Position.w; // < sets Z to camera.far
		}`,

	fragmentShader: /* glsl */`
		uniform vec3 sunPosition;
		uniform float sunDiscSize;
		uniform float sunAntialiasing;
		uniform vec4 sunStripeHeights;
		uniform vec4 sunStripeWidths;
		uniform vec3 sunBottomColor;
		uniform vec3 sunMidColor;
		uniform vec3 sunTopColor;
		uniform float sunGradientMidPoint;
		uniform float skyTintsSun;
		uniform float horizonHeight;
		uniform vec3 nadirColor;
		uniform vec3 horizonColor;
		uniform vec3 zenithColor;
		uniform vec3 flareColor;
		uniform float flarePosition;
		uniform float flareWidth;
		uniform float flareFalloff;

		varying vec3 objectPosition;

		float remap(float a, float b, float c, float d, float t) {
			float s = (t - a) / (b - a);
			s = clamp(s, 0.0, 1.0);
			return mix(c, d, s);
		}

		void main() {
			vec3 pos = normalize(objectPosition);

			//sun
			vec4 stripeHeightsNorm = mix(vec4(0.0), vec4(sunStripeHeights), vec4(sunDiscSize));
			vec4 stripeDists = abs(vec4(pos.y) - stripeHeightsNorm - vec4(sunPosition.y));
			vec4 stripeAntialias = fwidth(stripeDists) * sunAntialiasing;
			vec4 stripeWidthsNorm = mix(vec4(0.0), sunStripeWidths, sunDiscSize);
			stripeDists = smoothstep(stripeWidthsNorm - stripeAntialias, stripeWidthsNorm, stripeDists);

			float d = length(pos - sunPosition);
			float sunAntialias = fwidth(d) * sunAntialiasing;
			float sun = 1.0 - smoothstep(sunDiscSize - sunAntialias, sunDiscSize, d);
			sun *= stripeDists.x * stripeDists.y * stripeDists.z * stripeDists.w;

			// [0, 1] sun bottom to sun top
			float tSun = (((pos.y - sunPosition.y) / sunDiscSize) + 1.0) * 0.5;
			tSun = clamp(tSun, 0.0, 1.0);

			float tSunBotMid = remap(0.0, sunGradientMidPoint, 0.0, 1.0, tSun);
			vec3 sunBottomMidColor = mix(sunBottomColor, sunMidColor, tSunBotMid);
			float tSunMidTop = remap(sunGradientMidPoint, 1.0, 0.0, 1.0, tSun);
			vec3 sunMidTopColor = mix(sunMidColor, sunTopColor, tSunMidTop);

			vec3 sunColor = mix(sunBottomMidColor, sunMidTopColor, step(sunGradientMidPoint, tSun));

			// [0, 1] sky nadir to sky zenith
			float sky = 1.0 - sun;
			float yPos01 = (pos.y + 1.0) * 0.5;

			float tSkyNadirHorizon = remap(0.0, horizonHeight, 0.0, 1.0, yPos01);
			vec3 nadirHorizonColor = mix(nadirColor, horizonColor, tSkyNadirHorizon);
			float tSkyHorizonZenith = remap(horizonHeight, 1.0, 0.0, 1.0, yPos01);
			vec3 horizonZenithColor = mix(horizonColor, zenithColor, tSkyHorizonZenith);

			vec3 skyColor = mix(nadirHorizonColor, horizonZenithColor, smoothstep(0.0, 1.0, yPos01));

			// static horizon flare line, which is slightly thickened towards the sides of the view
			float yAbs = abs(pos.y - flarePosition);
			float flareModifier = smoothstep(0.0, 1.0, abs(pos.x)) + 1.0;
			float flare = smoothstep(flareModifier * flareWidth - flareFalloff, flareModifier * flareWidth, yAbs);
			sky = sky * flare;
			flare = 1.0 - flare;

			// make the sun be tinted by the sky behind
			sunColor = mix(sunColor, sunColor * skyColor, smoothstep(0.0, 1.0, skyTintsSun));
			gl_FragColor = vec4(sunColor * vec3(sun) + skyColor * vec3(sky) + flareColor * vec3(flare), 1.0);
	}`
};

export default SynthwaveSkyboxShader;