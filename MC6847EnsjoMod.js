/**
 * jsMC1000 - MC-1000 emulator in JavaScript.
 * Emerson Jose Silveira da Costa <emerson.costa@gmail.com>, alias "Ensjo".
 * http://ensjo.net/mc-1000/jsmc1000
 */

/**
 * MC6847EnsjoMod class.
 * 2013-08-16.
 * 
 * Implements Ensjo's mod circuitry around MC6847,
 * allowing for MC-1000 to have Alphanumeric characters
 * combined with Semigraphic 4 blocks on the same screen.
 * 
 * http://ensjo.blogspot.com/2012/08/ideia-de-mod-para-mc-1000-blocos.html
 *
 * Conditions:                      Changes:
 * AG = 0, AS = 0, DD = 000----- => AS = 1, DD = 000-----
 * AG = 0, AS = 0, DD = 011----- => AS = 1, DD = 001-----
 * AG = 0, AS = 0, DD = 100----- => AS = 1, DD = 110-----
 * AG = 0, AS = 0, DD = 111----- => AS = 1, DD = 111-----
 */

function MC6847EnsjoMod(delegate) {
	this.delegate = delegate;
	this.mc6847 = new MC6847(this);
}

MC6847EnsjoMod.prototype.drawLine = function() {
	this.mc6847.drawLine();
};

// MC6847 (VDG) delegate methods.

MC6847EnsjoMod.prototype.mc6847GetCanvas = function() {
	return this.delegate.mc6847GetCanvas();
};

MC6847EnsjoMod.prototype.mc6847GetAg = function() {
	return this.delegate.mc6847GetAg();
};

MC6847EnsjoMod.prototype.mc6847GetAs = function() {
	var as = this.delegate.mc6847GetAs();
	if (as == 0) {
		var ag = this.delegate.mc6847GetAg();
		if (ag == 0) {
			var dd = this.delegate.mc6847GetData();
			switch (dd & 0xe0) {
			case 0x00: // 000-----
			case 0x60: // 011-----
			case 0x80: // 100-----
			case 0xe0: // 111-----
 				as = 1;
 				break;
			}
		}
	}
	return as;
};

MC6847EnsjoMod.prototype.mc6847GetIntext = function() {
	return this.delegate.mc6847GetIntext();
};

MC6847EnsjoMod.prototype.mc6847GetInv = function() {
	return this.delegate.mc6847GetInv();
};

MC6847EnsjoMod.prototype.mc6847GetGm = function() {
	return this.delegate.mc6847GetGm();
};

MC6847EnsjoMod.prototype.mc6847GetCss = function() {
	return this.delegate.mc6847GetCss();
};

MC6847EnsjoMod.prototype.mc6847SetAddress = function(address) {
	this.delegate.mc6847SetAddress(address);
};

MC6847EnsjoMod.prototype.mc6847GetData = function() {
	var dd = this.delegate.mc6847GetData();
	var as = this.delegate.mc6847GetAs();
	if (as == 0) {
		var ag = this.delegate.mc6847GetAg();
		if (ag == 0) {
			switch (dd & 0xe0) {
			case 0x00: // 000----- => 000-----
				break;
			case 0x60: // 011----- => 001-----
				dd = 0x20 | (dd & 0x1f);
				break;
			case 0x80: // 100----- => 110-----
				dd = 0xc0 | (dd & 0x1f);
				break;
			case 0xe0: // 111----- => 111-----
				break;
			}
		}
	}
	return dd;
};

MC6847EnsjoMod.prototype.mc6847SetFs = function(fs) {
	this.delegate.mc6847SetFs(fs);
};

MC6847EnsjoMod.prototype.mc6847SetRp = function(rp) {
	this.delegate.mc6847SetRp(rp);
};
