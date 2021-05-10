import { Vector3 } from 'three';

let temp = new Vector3().setScalar(0.0);

export function refract(incidentVec, normal, ior) {
	const ndoti = normal.dot(incidentVec);
	const k = 1.0 - ior * ior * (1.0 - ndoti * ndoti);

	if (k < 0.0) {
		temp.setScalar(0.0);
	}
	else {
		const x = ior * ndoti + Math.sqrt(k);

		normal.multiplyScalar(x);
		incidentVec.multiplyScalar(ior);

		incidentVec.sub(normal);
		temp.copy(incidentVec);
	}

	return temp;
}