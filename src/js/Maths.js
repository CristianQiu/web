import { MathUtils } from 'three';

export default class Maths {
	static fastFloor(x) {
		return x >>> 0;
	}

	static fastMax(a, b) {
		return a > b ? a : b;
	}

	static fastMin(a, b) {
		return a < b ? a : b;
	}

	static remap(a, b, c, d, x) {
		let s = (x - a) / (b - a);
		// s = MathUtils.clamp(s, 0.0, 1.0);
		return MathUtils.lerp(c, d, s);
	}
}