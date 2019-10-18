function MC1000Keyboard(delegate) {
	this.delegate = delegate;
	this.pcKeys = [];
	this.keysPressed = {};
	this.keySelect = 0xff;
	this.updateNeeded = true;
	this.keyLines = new Array(7);
}

MC1000Keyboard.KEY_RETURN = "\r";
MC1000Keyboard.KEY_SPACE = " ";
MC1000Keyboard.KEY_RUBOUT = "\u007f";
MC1000Keyboard.KEY_SHIFT = "\u00fd";
MC1000Keyboard.KEY_CTRL = "\u00fe";
MC1000Keyboard.KEY_RESET = "\u00ff";

MC1000Keyboard.VALID_KEYS =
	"1234567890-@" + MC1000Keyboard.KEY_RESET +
	"QWERTYUIOP^" + MC1000Keyboard.KEY_RETURN +
	"ASDFGHJKL;:" + MC1000Keyboard.KEY_CTRL +
	MC1000Keyboard.KEY_SHIFT + "ZXCVBNM,./" + MC1000Keyboard.KEY_RUBOUT + MC1000Keyboard.KEY_SPACE;

MC1000Keyboard.ONE_TO_ONE_MAPPING = 0;
MC1000Keyboard.PC_FRIENDLY_MAPPING = 1;
MC1000Keyboard.PC_FRIENDLY_MAPPING_ABNT2 = 2;

MC1000Keyboard.SHIFT_PRESSED = 0;
MC1000Keyboard.SHIFT_NOT_PRESSED = 1;
MC1000Keyboard.ANY_SHIFT = 2;

MC1000Keyboard.COMMON_MAPPING = [
	// false = SHIFT not pressed.
	// true = SHIFT pressed.
	// null = SHIFT pressed or not.
	[ 16 /* Shift */, null, MC1000Keyboard.KEY_SHIFT, null],
	["A".charCodeAt(0), null, "A", null],
	["B".charCodeAt(0), null, "B", null],
	["C".charCodeAt(0), null, "C", null],
	["D".charCodeAt(0), null, "D", null],
	["E".charCodeAt(0), null, "E", null],
	["F".charCodeAt(0), null, "F", null],
	["G".charCodeAt(0), null, "G", null],
	["H".charCodeAt(0), null, "H", null],
	["I".charCodeAt(0), null, "I", null],
	["J".charCodeAt(0), null, "J", null],
	["K".charCodeAt(0), null, "K", null],
	["L".charCodeAt(0), null, "L", null],
	["M".charCodeAt(0), null, "M", null],
	["N".charCodeAt(0), null, "N", null],
	["O".charCodeAt(0), null, "O", null],
	["P".charCodeAt(0), null, "P", null],
	["Q".charCodeAt(0), null, "Q", null],
	["R".charCodeAt(0), null, "R", null],
	["S".charCodeAt(0), null, "S", null],
	["T".charCodeAt(0), null, "T", null],
	["U".charCodeAt(0), null, "U", null],
	["V".charCodeAt(0), null, "V", null],
	["W".charCodeAt(0), null, "W", null],
	["X".charCodeAt(0), null, "X", null],
	["Y".charCodeAt(0), null, "Y", null],
	["Z".charCodeAt(0), null, "Z", null],
	["0".charCodeAt(0), false, "0", false],
	["1".charCodeAt(0), false, "1", false],
	["2".charCodeAt(0), false, "2", false],
	["3".charCodeAt(0), false, "3", false],
	["4".charCodeAt(0), false, "4", false],
	["5".charCodeAt(0), false, "5", false],
	["6".charCodeAt(0), false, "6", false],
	["7".charCodeAt(0), false, "7", false],
	["8".charCodeAt(0), false, "8", false],
	["9".charCodeAt(0), false, "9", false],
	[  8 /* Backspace */, null, MC1000Keyboard.KEY_RUBOUT, null],
	[  9 /* Tab */, null, MC1000Keyboard.KEY_RESET, null],
	[ 13 /* Enter */, null, MC1000Keyboard.KEY_RETURN, null],
	[ 17 /* Control */, null, MC1000Keyboard.KEY_CTRL, null],
	[" ".charCodeAt(0), null, MC1000Keyboard.KEY_SPACE, null],
	[188 /* , */, null, ",", null],
	[190 /* . */, null, ".", null],
	// Joystick A
	[ 38 /* Up arrow */, null, "I", null], // Up
	[ 40 /* Down arrow */, null, "Q", null], // Down
	[ 37 /* Left arrow */, null, "Y", null], // Left
	[ 39 /* Right arrow */, null, "1", null], // Right
	[ 20 /* Caps lock */, null, "9", null], // Button
	// Joystick B
	[104 /* Numpad 8 */, null, "H", null], // Up
	[ 98 /* Numpad 2 */, null, "P", null], // Down
	[100 /* Numpad 4 */, null, "X", null], // Left
	[102 /* Numpad 6 */, null, "0", null], // Right
	[101 /* Numpad 5 */, null, "@", null] // Button
];

MC1000Keyboard.SPECIFIC_MAPPING = [
	[
		// One-to-one mapping: Each one MC-1000 key
		// corresponds univocally to one PC key.
		// (Shift+'2' = '"' etc.)
		["0".charCodeAt(0), true, "0", true], 
		["1".charCodeAt(0), true, "1", true],
		["2".charCodeAt(0), true, "2", true],
		["3".charCodeAt(0), true, "3", true],
		["4".charCodeAt(0), true, "4", true],
		["5".charCodeAt(0), true, "5", true],
		["6".charCodeAt(0), true, "6", true],
		["7".charCodeAt(0), true, "7", true],
		["8".charCodeAt(0), true, "8", true],
		["9".charCodeAt(0), true, "9", true],
		[189 /* - */, null, "-", null],
		[187 /* = */, null, "@", null],
		[219 /* [ */, null, "^", null],
		[221 /* ] */, null, ":", null],
		[186 /* ; */, null, ";", null],
		[191 /* / */, null, "/", null]
	],
	[
		// "PC friendly" mapping (US keyboard):
		// PC keys (and shift+key combinations) are translated into
		// different MC-1000 keys (and shift+key combinations)
		// in order to produce characters as depicted on the keyboard.
		// (Shift+'2' = '@' etc.)
		["0".charCodeAt(0), true, "9", true], // ) 
		["1".charCodeAt(0), true, "1", true], // !
		["2".charCodeAt(0), true, "@", false], // @
		["3".charCodeAt(0), true, "3", true], // #
		["4".charCodeAt(0), true, "4", true], // $
		["5".charCodeAt(0), true, "5", true], // %
		["6".charCodeAt(0), true, "^", false], // ^
		["7".charCodeAt(0), true, "6", true], // &
		["8".charCodeAt(0), true, ":", true], // *
		["9".charCodeAt(0), true, "8", true], // (
		[189 /* - */, false, "-", false], // -
		[187 /* = */, false, "-", true], // =
		[187 /* = */, true, ";", true], // +
		[222 /* ' */, false, "7", true], // '
		[222 /* ' */, true, "2", true], // "
		[186 /* ; */, false, ";", false], // ;
		[186 /* ; */, true, ":", false], // :
		[191 /* / */, null, "/", null] // /
	],
	[
		// "PC friendly" mapping (ABNT-2 keyboard):
		// PC keys (and shift+key combinations) are translated into
		// different MC-1000 keys (and shift+key combinations)
		// in order to produce characters as depicted on the keyboard.
		// (Shift+'2' = '@' etc.)
		["0".charCodeAt(0), true, "9", true], // ) 
		["1".charCodeAt(0), true, "1", true], // !
		["2".charCodeAt(0), true, "@", false], // @
		["3".charCodeAt(0), true, "3", true], // #
		["4".charCodeAt(0), true, "4", true], // $
		["5".charCodeAt(0), true, "5", true], // %
		["7".charCodeAt(0), true, "6", true], // &
		["8".charCodeAt(0), true, ":", true], // *
		["9".charCodeAt(0), true, "8", true], // (
		[189 /* - */, false, "-", false], // -
		[187 /* = */, false, "-", true], // =
		[187 /* = */, true, ";", true], // +
		[192 /* ' */, false, "7", true], // '
		[192 /* ' */, true, "2", true], // "
		[222 /* ~ */, true, "^", false], // ^
		[191 /* ; */, false, ";", false], // ;
		[191 /* ; */, true, ":", false], // :
		[193 /* / */, null, "/", null] // /
	]
];

MC1000Keyboard.prototype.setMapping = function(m) {
  this.keyboardMapping = m;
};

MC1000Keyboard.prototype.keyAction = function(event) {
	var i, j;

	// Update list of PC keys pressed.
	if (event.type == "keydown") {
		i = this.pcKeys.indexOf(event.which);
		if (i == -1) {
			this.pcKeys.push(event.which);
		}
	} else {
		i = this.pcKeys.indexOf(event.which);
		if (i != -1) {
			this.pcKeys.splice(i, 1);
		}
	}
	// this.delegate.mc1000KeyboardLog("["+this.pcKeys.join(",")+"]");
	
	// Now let's build the corresponding set of mapped MC-1000 keys.
	
	// No MC-1000 keys pressed.
	this.reset();
	
	// Is Shift pressed in PC keyboard?
	var pcShift = (this.pcKeys.indexOf(16 /* Shift */) != -1);
	// If so, initially assume MC-1000 is also pressed.
	this.setKey(MC1000Keyboard.KEY_SHIFT, pcShift);
	
	var mapping;
	for (i = 0; i < 2; i++) {
		switch (i) {
		case 0:
			mapping = MC1000Keyboard.COMMON_MAPPING;
			break;
		case 1:
			mapping = MC1000Keyboard.SPECIFIC_MAPPING[this.delegate.mc1000KeyboardGetKeyboardMapping()];
			break;
		}
		for (j = 0; j < mapping.length; j++) {
			// If a mapping matched (PC key+Shift combination)...
			if (this.pcKeys.indexOf(mapping[j][0]) != -1) {
				if ((mapping[j][1] == null) || (mapping[j][1] == pcShift)) {
					// Set MC-1000 mapped key.
					this.setKey(mapping[j][2], true);
					// Change MC-1000 SHIFT if needed.
					if (mapping[j][3] != null) {
						this.setKey(MC1000Keyboard.KEY_SHIFT, mapping[j][3]);
					}
				}
			}
		}
	}
};

MC1000Keyboard.prototype.keyPressed = function(event) {
	this.keyAction(event);
};

MC1000Keyboard.prototype.keyReleased = function(event) {
	this.keyAction(event);
};

MC1000Keyboard.prototype.reset = function() {
	this.keysPressed = {};
	this.updateNeeded = true;
};

MC1000Keyboard.prototype.setKey = function(key, value) {
	if (MC1000Keyboard.VALID_KEYS.indexOf(key) != -1) {
		if (value) {
			this.keysPressed[key] = true;
		} else {
			delete this.keysPressed[key];
		}
	}
	if (this.keysPressed[MC1000Keyboard.KEY_SHIFT] && this.keysPressed[MC1000Keyboard.KEY_RESET]) {
		this.delegate.mc1000KeyboardReset();
	}
	
};

MC1000Keyboard.prototype.write = function(a) {
	this.keySelect = a;
};

MC1000Keyboard.prototype.read = function() {
	if (this.keySelect == 0xff) {
		return 0xff;
	}
	if (this.updateNeeded) {
		this.updateLines();
	}
	var value = 0xff;
	if ((this.keySelect & 0x01) == 0) { value &= this.keyLines[0]; }
	if ((this.keySelect & 0x02) == 0) { value &= this.keyLines[1]; }
	if ((this.keySelect & 0x04) == 0) { value &= this.keyLines[2]; }
	if ((this.keySelect & 0x08) == 0) { value &= this.keyLines[3]; }
	if ((this.keySelect & 0x10) == 0) { value &= this.keyLines[4]; }
	if ((this.keySelect & 0x20) == 0) { value &= this.keyLines[5]; }
	if ((this.keySelect & 0x40) == 0) { value &= this.keyLines[6]; }
	if ((this.keySelect & 0x80) == 0) { value &= this.keyLines[7]; }
	return value;
};
	
MC1000Keyboard.prototype.updateLines = function() {
	for (var line = 0; line < 8; line++) {
		var value = 0xff;
		switch (line) {
		case 0:
			if (this.keysPressed["@"]) { value &= 0xfe; }
			if (this.keysPressed["H"]) { value &= 0xfd; }
			if (this.keysPressed["P"]) { value &= 0xfb; }
			if (this.keysPressed["X"]) { value &= 0xf7; }
			if (this.keysPressed["0"]) { value &= 0xef; }
			if (this.keysPressed["8"]) { value &= 0xdf; }
			break;
		case 1:
			if (this.keysPressed["A"]) { value &= 0xfe; }
			if (this.keysPressed["I"]) { value &= 0xfd; }
			if (this.keysPressed["Q"]) { value &= 0xfb; }
			if (this.keysPressed["Y"]) { value &= 0xf7; }
			if (this.keysPressed["1"]) { value &= 0xef; }
			if (this.keysPressed["9"]) { value &= 0xdf; }
			break;
		case 2:
			if (this.keysPressed["B"]) { value &= 0xfe; }
			if (this.keysPressed["J"]) { value &= 0xfd; }
			if (this.keysPressed["R"]) { value &= 0xfb; }
			if (this.keysPressed["Z"]) { value &= 0xf7; }
			if (this.keysPressed["2"]) { value &= 0xef; }
			if (this.keysPressed[":"]) { value &= 0xdf; }
			break;
		case 3:
			if (this.keysPressed["C"]) { value &= 0xfe; }
			if (this.keysPressed["K"]) { value &= 0xfd; }
			if (this.keysPressed["S"]) { value &= 0xfb; }
			if (this.keysPressed[MC1000Keyboard.KEY_RETURN]) { value &= 0xf7; }
			if (this.keysPressed["3"]) { value &= 0xef; }
			if (this.keysPressed[";"]) { value &= 0xdf; }
			break;
		case 4:
			if (this.keysPressed["D"]) { value &= 0xfe; }
			if (this.keysPressed["L"]) { value &= 0xfd; }
			if (this.keysPressed["T"]) { value &= 0xfb; }
			if (this.keysPressed[MC1000Keyboard.KEY_SPACE]) { value &= 0xf7; }
			if (this.keysPressed["4"]) { value &= 0xef; }
			if (this.keysPressed[","]) { value &= 0xdf; }
			break;
		case 5:
			if (this.keysPressed["E"]) { value &= 0xfe; }
			if (this.keysPressed["M"]) { value &= 0xfd; }
			if (this.keysPressed["U"]) { value &= 0xfb; }
			if (this.keysPressed[MC1000Keyboard.KEY_RUBOUT]) { value &= 0xf7; }
			if (this.keysPressed["5"]) { value &= 0xef; }
			if (this.keysPressed["-"]) { value &= 0xdf; }
			break;
		case 6:
			if (this.keysPressed["F"]) { value &= 0xfe; }
			if (this.keysPressed["N"]) { value &= 0xfd; }
			if (this.keysPressed["V"]) { value &= 0xfb; }
			if (this.keysPressed["^"]) { value &= 0xf7; }
			if (this.keysPressed["6"]) { value &= 0xef; }
			if (this.keysPressed["."]) { value &= 0xdf; }
			break;
		case 7:
			if (this.keysPressed["G"]) { value &= 0xfe; }
			if (this.keysPressed["O"]) { value &= 0xfd; }
			if (this.keysPressed["W"]) { value &= 0xfb; }
			// No key for 0xf7
			if (this.keysPressed["7"]) { value &= 0xef; }
			if (this.keysPressed["/"]) { value &= 0xdf; }
			break;
		}
		
		// SHIFT and CTRL affect all lines.
		if (this.keysPressed[MC1000Keyboard.KEY_CTRL]) { value &= 0x7f; }
		if (this.keysPressed[MC1000Keyboard.KEY_SHIFT]) { value &= 0xbf; }
		
		this.keyLines[line] = value;
	}
	this.updateNeeded = false;
};
