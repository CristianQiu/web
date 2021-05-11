export default class Maths {
	static fastFloor(x) {
		return x >>> 0;
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

	static fastAbs(x) {
		return x > 0.0 ? x : -x;
	}

	static fastLerp(a, b, t) {
		return (b - a) * t + a;
	}

	static fastRemap(a, b, c, d, x) {
		let s = (x - a) / (b - a);
		return this.fastLerp(c, d, s);
	}
}