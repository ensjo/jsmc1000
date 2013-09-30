function Memory(size, filler, mask) {
	if (size) {
		this.array = new Array(size);
		this.fillWith(isNaN(filler) ? 0 : filler);
	}
	this.mask = mask;
}

Memory.prototype.read = function(address) {
	if (this.array) {
		var maskedAddress = address & this.mask;
		if (maskedAddress < this.array.length) {
			return this.array[maskedAddress];
		}
	}
	return NaN;
};

Memory.prototype.write = function(address, data) {
	if (this.array) {
		var maskedAddress = address & this.mask;
		if (maskedAddress < this.array.length) {
			this.array[maskedAddress] = data;
		}
	}
};

Memory.prototype.fillWith = function(data) {
	if (this.array) {
		for (var i = 0; i < this.array.length; i++) {
			this.array[i] = data;
		}
	}
};

Memory.prototype.setArray = function(array) {
	this.array = array;
};
