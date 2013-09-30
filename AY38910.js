/**
 * jsMC1000 - MC-1000 emulator in JavaScript.
 * Emerson Jose Silveira da Costa <emerson.costa@gmail.com>, alias "Ensjo".
 * http://ensjo.net/mc-1000/jsmc1000
 */

/**
 * AY38910 class.
 * 2012-06-19.
 *
 * "AY38910" class extends the "PsgDeviceChannel" class from
 * Takashi Toyoshima's T'SoundSystem -- http://code.google.com/p/tss/
 * adding functionality corresponding to ports IOA and IOB of AY-3-8910,
 * currently absent in "PsgDeviceChannel".
 * 
 * "Log", "AudioLooper", "BiquadFilterChannel" and "MasterChannel"
 * classes from TSS are also required.
 */
function AY38910(delegate) {
	PsgDeviceChannel.call(this); // Superclass' constructor.
	
	this.delegate = delegate;
	
	this.ioa = 0;
	this.iob = 0;
	this.selectedRegister = 0;
}
AY38910.prototype = new PsgDeviceChannel();
AY38910.prototype.constructor = AY38910;

AY38910.prototype.selectRegister = function(data) {
	if (data < 16) {
		this.selectedRegister = data;
	}
};

AY38910.prototype.getRegister = function() {
	switch (this.selectedRegister) {
	case 14:
		return this.ioa = this.delegate.ay38910GetIoa();
		break;
	case 15:
		return this.iob = this.delegate.ay38910GetIob();
		break;
	default: 
		return this.readRegister(this.selectedRegister); // from PsgDeviceChannel class.
	}
};

AY38910.prototype.setRegister = function(data) {
	switch (this.selectedRegister) {
	case 14:
		this.delegate.ay38910SetIoa(this.ioa = data);
		break;
	case 15:
		this.delegate.ay38910SetIob(this.iob = data);
		break;
	default:
		this.writeRegister(this.selectedRegister, data); // from PsgDeviceChannel class.
	}
};

AY38910.prototype.getIoa = function() {
	return this.ioa;
};

AY38910.prototype.setIoa = function(data) {
	this.ioa = data;
};

AY38910.prototype.getIob = function() {
	return this.iob;
};

AY38910.prototype.setIob = function(data) {
	this.iob = data;
};
