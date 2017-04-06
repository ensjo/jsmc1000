/**
 * jsMC1000 - MC-1000 emulator in JavaScript.
 * Emerson Jose Silveira da Costa <emerson.costa@gmail.com>, alias "Ensjo".
 * http://ensjo.net/mc-1000/jsmc1000
 */

/**
 * MC1000Core class.
 * 2012-06-01.
 * 
 * Implements MC-1000's basic functionality, without expansion port enhancements
 * (printer, external RAM pack, 80-column card, etc.)
 * These should be provided via the delegate class.
 */

function MC1000Core(delegate) {
	this.delegate = delegate;
	this.init();
};

MC1000Core.prototype.init = function() {
	this.z80 = this.delegate.mc1000CoreGetZ80(this);
	this.vdg = this.delegate.mc1000CoreGetVdg(this);
	this.psg = this.delegate.mc1000CoreGetPsg(this);
	this.keyboard = this.delegate.mc1000CoreGetKeyboard(this);
	this.rom = this.delegate.mc1000CoreGetRom();
	this.ram = this.delegate.mc1000CoreGetRam();
	this.vram = this.delegate.mc1000CoreGetVram();
	
	// Memory selection circuitry.
	
	this.romAt0000 = true;
	this.romAccess = false;
	this.vramAccess = false;
	this.ramAccess = false;
	
	// Circuitry for MC6847 (VDG).
	
	this.vdgAddress = 0;
	this.vdgData = 0;
	this.vdgLatch = 0;
	
	// Calculated from vdgLatch:
	this.vdgAg = 0; // �A/G (Alphanumerics/Graphics).
	this.vdgAs = 0; // �A/S (Alphanumerics/Semigraphics).
	this.vdgIntext = 0; // �INT/EXT (Internal/External).
	this.vdgInv = 0; // INV (Invert).
	this.vdgGm = 0; // GM0~GM2 (Graphic Mode).
	this.vdgCss = 0; // CSS (Color Select).
	this.bank = 0; // VRAM enabled.
	
	this.resetAtNextInterrupt = false;
};

MC1000Core.prototype.calculateMemoryBuses = function(address) {
	this.ramAccess = false;
	this.vramAccess = false;
	this.romAccess = false;
	
	// Standard address ranges.
	switch (address & 0xc000) {
	case 0xc000:
		// 0xc000~0xffff
		this.romAccess = true;
		break;
	case 0x0000:
		// 0x0000~0x3fff
		this.ramAccess = true;
		break;
	default:
		// 0x8000~0x9fff
		this.vramAccess = ((address & 0xe000) == 0x8000);
	}
	
	if (this.romAccess) {
		// If at ROM range, disable the temporary reading of ROM at 0x000 (after reset).
		this.romAt0000 = false;
	} else {
		// Temporarily reading ROM at 0x000 (after reset)?
		this.romAccess = this.romAt0000;
	}
	// ROM access may be disabled by expansion port.
	if (this.romAccess) {
		this.romAccess = this.delegate.mc1000CoreGetRomCs();
	}
	// Inform expansion port if ROM will be accessed after all.
	this.delegate.mc1000CoreSetRomCe(this.romAccess);
	
	// If at VRAM range and bit 0 of VDG latch = 0, do access VRAM.
	if (this.vramAccess) {
		this.vramAccess = this.bank;
	}
	
	if (this.romAccess || this.vramAccess || this.delegate.mc1000CoreGetDsb64()) {
		// Access to ROM, VRAM or outer 64KB RAM expansion?
		// Disable access to inner RAM.
		this.ramAccess = false;
	} else {
		// Finally, access RAM even outside the standard range,
		// if inner 64KB RAM installed.
		this.ramAccess = this.ramAccess || this.delegate.mc1000CoreGetBuiltIn64kbRam();
	}
};

MC1000Core.prototype.setVdgLatch = function(value) {
	this.vdgLatch = value;
	this.vdgAg = (value & 0x80) ? 1 : 0;
	this.vdgAs = (value & 0x40) ? 1 : 0;
	this.vdgIntext = (value & 0x20) ? 1 : 0;
	this.vdgGm = (value >> 2) & 0x07;
	this.vdgCss = (value & 0x02) ? 1 : 0;
	this.bank = (value & 0x01) == 0;
};

// Z80 delegate methods.

MC1000Core.prototype.z80ReadMemory = function(address) {
	this.calculateMemoryBuses(address);
	var data = this.delegate.mc1000CoreReadMemory(address);
	if (this.romAccess) {
		return data & this.rom.read(address & 0x3fff);
	} else if (this.ramAccess) {
		return data & this.ram.read(address);
	} else if (this.vramAccess) {
		return data & this.vram.read(address & 0x1fff);
	} else {
		return data;
	}
};

MC1000Core.prototype.z80WriteMemory = function(address, data) {
	this.calculateMemoryBuses(address);
	if (this.ramAccess) {
		this.ram.write(address, data);
	} else if (this.vramAccess) {
		this.vram.write(address & 0x1fff, data);
	}
	this.delegate.mc1000CoreWriteMemory(address, data);
};

MC1000Core.prototype.z80ReadIo = function(address) {
	var data = this.delegate.mc1000CoreReadIo(address);
	switch (address & 0xe0) {
	case 0x40:
		return data & this.psg.getRegister();
		break;
	case 0x80:
		this.vdgLatch = data;
		return data;
		break;
	default:
		return data;
	}
};

MC1000Core.prototype.z80WriteIo = function(address, data) {
	switch (address & 0xe0) {
	case 0x20:
		this.psg.selectRegister(data);
		break;
	case 0x60:
		this.psg.setRegister(data);
		break;
	case 0x80:
		this.setVdgLatch(data);
		break;
	}
	this.delegate.mc1000CoreWriteIo(address, data);
};

// MC6847 (VDG) delegate methods.
	
MC1000Core.prototype.mc6847GetCanvas = function() {
	return this.delegate.mc1000CoreGetCanvas();
};

MC1000Core.prototype.mc6847GetAg = function() {
	return this.vdgAg;
};

MC1000Core.prototype.mc6847GetAs = function() {
	return this.vdgAs;
};

MC1000Core.prototype.mc6847GetIntext = function() {
	return this.vdgIntext;
};

MC1000Core.prototype.mc6847GetInv = function() {
	return (this.vdgData & 0x80) ? 1 : 0;
};

MC1000Core.prototype.mc6847GetGm = function() {
	return this.vdgGm;
};

MC1000Core.prototype.mc6847GetCss = function() {
	return this.vdgCss;
};

MC1000Core.prototype.mc6847SetAddress = function(address) {
	this.vdgData = this.vram.read(this.vdgAddress = address);
};

MC1000Core.prototype.mc6847GetData = function() {
	return this.vdgData;
};

MC1000Core.prototype.mc6847SetFs = function (fs) {};

MC1000Core.prototype.mc6847SetRp = function (rp) {};

// AY-3-8910 (PSG) delegate methods.

MC1000Core.prototype.ay38910GetIoa = function() {
	return 0xff;
};

MC1000Core.prototype.ay38910SetIoa = function(data) {
	this.keyboard.write(data);
};

MC1000Core.prototype.ay38910GetIob = function() {
	return this.keyboard.read();
};

MC1000Core.prototype.ay38910SetIob = function(iob) {};

// MC-1000 Keyboard delegate methods.

MC1000Core.prototype.mc1000KeyboardGetKeyboardMapping = function() {
	return this.delegate.mc1000CoreGetKeyboardMapping();
};

MC1000Core.prototype.mc1000KeyboardReset = function() {
	this.resetAtNextInterrupt = true;
};

MC1000Core.prototype.mc1000KeyboardLog = function(str) {
	this.delegate.mc1000CoreLog(str);
};

// Other...

/*
MC1000Core.prototype.interruptStart = function() {
	var self = this;
	this.interval = setInterval(self.interrupt,17); //60 intervals/sec
};

MC1000Core.prototype.interruptStop = function() {
	clearInterval(this.interval);
};
*/

MC1000Core.prototype.execute = function() {
	if (this.resetAtNextInterrupt) {
		this.resetAtNextInterrupt = false;
		this.reset();
	}
	this.z80.execute();
	var linesToDraw = this.delegate.mc1000CoreGetScreenLinesPerInterrupt();
	for (var i = 0; i < linesToDraw; i++) {
		this.vdg.drawLine();
	}
};

MC1000Core.prototype.executeStart = function() {
	var self = this;
	this.execInterval = setInterval(function(){ self.execute(); },17); //60 intervals/sec
};

MC1000Core.prototype.executeStop = function() {
	clearInterval(this.execInterval);
};

MC1000Core.prototype.reset = function() {
	this.delegate.mc1000CoreLog("[RESET]");
	this.z80.reset();
	this.romAt0000 = true;
};

MC1000Core.prototype.FLOAT = function(address) {
	if (typeof address == "undefined") {
		address = 0x3bf;
	}
	var e = this.ram.array[address + 3];
	if (e == 0) { return 0; }
	e -= 129;
	var s = (this.ram.array[address + 2] & 0x80) ? -1 : 1;
	var m =
		((this.ram.array[address + 2] | 0x80) << 16) |
		(this.ram.array[address + 1] << 8) | (this.ram.array[address]);
	return (s * m / 0x800000) * Math.pow(2, e);
};
