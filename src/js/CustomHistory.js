class CustomHistory {

	constructor(firstEntry) {
		this._stack = [];
		this._entryIndex = 0;

		this.push(firstEntry);
	}

	push(entry) {
		this._stack.push(entry);
	}

	pop() {
		return this._stack.pop();
	}
}