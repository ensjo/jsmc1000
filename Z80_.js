/**
 * jsMC1000 - MC-1000 emulator in JavaScript.
 * Emerson Jose Silveira da Costa <emerson.costa@gmail.com>
 */

/**
 * Z80_ class.
 * 2012-06-06.
 *
 * "Z80_" (with underline) class is a wrapper to the "Z80" class from jsMSX
 * (MSX emulation in JavaScript).
 * http://sourceforge.net/projects/jsmsx/
 * http://jsmsx.sourceforge.net/
 * 
 * In jsMSX, the machine class ("MSX") extends the "Z80" class.
 * 
 * I wanted my Z80 class to interact with the machine class via delegation,
 * so I created this wrapper to implement delegation capabilities to the
 * original "Z80" class.
 */
function Z80_(delegate) {
	this.IM0 = 0;
	this.IM1 = 1;
	this.IM2 = 2;
	this.F_C = 1;
	this.F_N = 2;
	this.F_PV = 4;
	this.F_3 = 8;
	this.F_H = 16;
	this.F_5 = 32;
	this.F_Z = 64;
	this.F_S = 128;
	this.PF = 4;
	this.p_ = 0;
	this.parity = new Array(256);
	this._A = 0;
	this._B = 0;
	this._C = 0;
	this._D = 0;
	this._E = 0;
	this._H = 0;
	this._L = 0;
	this._DE = 0;
	this._HL = 0;
	this.fS = false;
	this.fZ = false;
	this.f5 = false;
	this.fH = false;
	this.f3 = false;
	this.fPV = false;
	this.fN = false;
	this.fC = false;
	this._AF_ = 0;
	this._HL_ = 0;
	this._BC_ = 0;
	this._DE_ = 0;
	this._IX = 0;
	this._IY = 0;
	this._ID = 0;
	this._SP = 0;
	this._PC = 0;
	this._I = 0;
	this._R = 0;
	this._R7 = 0;
	this._IFF1 = true;
	this._IFF2 = true;
	this._IM = 2;
	
	//static 
	for (var i = 0; i < 256; i++) {
		bool = true;
		for (var i_0_ = 0; i_0_ < 8; i_0_++) {
		if ((i & 1 << i_0_) != 0)
			bool ^= true;
		}
		this.parity[i] = bool;
	}

	// My changes...	
	this.delegate = delegate; // Who will send and receive signals from Z80.
}
Z80_.prototype = new Z80(3.58);
Z80_.prototype.constructor = Z80_;

Z80_.prototype.setDelegate = function(delegate) {
	this.delegate = delegate;
};

Z80_.prototype.reset = function() {
	/*
	 * RESET initializes the CPU as follows: it resets
	 * the interrupt enable flip-flop, clears the PC and registers I and R, and sets the
	 * interrupt status to Mode 0. During reset time, the address and data bus go to
	 * a high-impedance state, and all control output signals go to the inactive
	 * state.
	 */
	this.setIFF1(false);
	this.setIFF2(false);
	this._PC = (0);
	this.setR(0);
	this.setI(0);
	this.setIM(0);
};

Z80_.prototype.inb = function(address) {
	return this.delegate.z80ReadIo(address);
};

Z80_.prototype.outb = function(address, data, i) {
	this.delegate.z80WriteIo(address, data);
};

Z80_.prototype.peekb = function(address) {
	return this.delegate.z80ReadMemory(address);
}

Z80_.prototype.peekw = function(address) {
	return this.peekb(address) | (this.peekb(address + 1) << 8);
};

Z80_.prototype.pokeb = function(address, data, i) {
	this.delegate.z80WriteMemory(address, data);
};

Z80_.prototype.pokew = function(address, word) {
	this.pokeb(address, word & 0xff);
	this.pokeb(address + 1, (word >> 8) & 0xff);
};

Z80_.prototype.interrupt = function() {
	this.interruptCounter++;
	return this.z80_interrupt();
};