// From https://gist.github.com/imbcmdth/6338194
const a = new ArrayBuffer(4);
const i = new Int32Array(a);
const f = new Float32Array(a);

export default class Maths {
	static fastFloor(x) {
		return x >>> 0;
	}

	static fastAbs(x) {
		return x > 0.0 ? x : -x;
	}

	static fastMin(a, b) {
		return a < b ? a : b;
	}

	static fastMax(a, b) {
		return a > b ? a : b;
	}

	static fastClamp(val, min, max) {
		return this.fastMax(min, this.fastMin(max, val));
	}

	static fastLerp(a, b, t) {
		return (b - a) * t + a;
	}

	static fastRemap(a, b, c, d, x) {
		let s = (x - a) / (b - a);
		return this.fastLerp(c, d, s);
	}

	static smoothstep(x, min, max) {
		if (x <= min)
			return 0.0;
		if (x >= max)
			return 1.0;
		x = (x - min) / (max - min);
		return x * x * (3.0 - 2.0 * x);
	}

	static fastLog2(x) {
		f[0] = x;
		const t = i[0] * 1.1920928955078125e-7;
		return t - 126.94269504;
	}

	static fastLog(x) {
		return 0.6931471805599453 * this.fastLog2(x);
	}

	static calcArrayAvg(array) {
		let avgMean = 0.0;
		const l = array.length;
		for (let i = 0; i < l; ++i)
			avgMean += array[i];
		return avgMean /= array.length;
	}
}