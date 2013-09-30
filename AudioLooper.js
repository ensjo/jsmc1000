/**
 * T'SoundSystem for JavaScript (Web Audio API)
 */

/**
 * AudioPlayback prototype
 *
 * This prototype provides an audio output stream for real time sound
 * rendering.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 *
 */
function AudioLooper (bufferSize) {
    this.bufferSize = 4096;  // 92msec
    if (arguments.length > 0)
        this.bufferSize = bufferSize;
    // Initialize variables.
    this.channel = null;
    this.initialized = true;

    // Web Audio API on Chrome and Safari.
    if (window.webkitAudioContext != undefined) {
        Log.getLog().info("use Web Audio API");
        this.audioContext = new webkitAudioContext();
        if (this.audioContext == null) {
            Log.getLog().fatal("could not use webkitAudioContext");
            this.initialized = false;
            return;
        }

        // Allocate JavaScript synthesis node.
        this.jsNode = this.audioContext.createJavaScriptNode(this.bufferSize);

        // Connect to output audio device.
        this.jsNode.connect(this.audioContext.destination);

        // Register callback
        this.jsNode.owner = this;
        this.jsNode.onaudioprocess = function (event) {
            this.owner.onAudioProcess(event);
        };

        return;
    }

    // Audio Data API on Firefox.
    if (window.Audio != undefined) {
        Log.getLog().info("use Audio Data API");
        this.audio = new Audio();
        if ((this.audio == null) || (this.audio.mozSetup == undefined)) {
            Log.getLog().fatal("could not use Audio Data API");
            this.initialized = false;
            return;
        }

        // Set up playback configuration.
        this.audioChannel = 2;
        this.audioFrequency = 44100;
        this.audio.mozSetup(this.audioChannel, this.audioFrequency);

        // Set up output buffer.
        this.bufferId = 0;
        this.bufferPage = 4;
        this.bufferWritten = 0;
        this.buffer = new Array(this.bufferPage);
        var arraySize = this.bufferSize * this.audioChannel;
        for (var i = 0; i < this.bufferPage; i++) {
            this.buffer[i] = new Float32Array(arraySize);
            this.bufferWritten += this.audio.mozWriteAudio(this.buffer[i]);
        }

        // Register callback with 50msec interval.
        this.audio.owner = this;

        // Set half time of buffer playback time.
        var interval = this.bufferSize * 1000 / 44100 / 2;
        setInterval(function (object) { object.onAudioInterval() }, interval,
            this);

        return;
    }
    Log.getLog().error("Audio API unavailable");
    this.initialized = false;
}

/**
 * Register sound generator.
 * @param newChannel sound generator
 */
AudioLooper.prototype.setChannel = function (newChannel) {
    if (null != newChannel) {
        newChannel.setBufferLength(this.bufferSize * 2);
    }
    this.channel = newChannel;
};

/**
 * Audio processing event handler for Web Audio API.
 * @param event AudioProcessingEvent
 */
AudioLooper.prototype.onAudioProcess = function (event) {
    // Logged event contents at the first event.
    if (null == this.firstAudioEvent) {
        this.firstAudioEvent = true;
        Log.getLog().info(event);
    }

    // Get Float32Array output buffer.
    var lOut = event.outputBuffer.getChannelData(0);
    var rOut = event.outputBuffer.getChannelData(1);

    // Process no input channel.
    var i;
    if (null == this.channel) {
        for (i = 0; i < this.bufferSize; i++) {
            lOut[i] = 0.0;
            rOut[i] = 0.0;
        }
        return;
    }

    // Get Int32Array input buffer.
    this.channel.generate(this.bufferSize * 2);
    var lrIn = this.channel.getBuffer();

    // Process buffer conversion.
    for (i = 0; i < this.bufferSize; i++) {
        lOut[i] = lrIn[i * 2 + 0] / 32768.0;
        rOut[i] = lrIn[i * 2 + 1] / 32768.0;
    }
};

/**
 * Audio interval callback handler for Audio Data API.
 */
AudioLooper.prototype.onAudioInterval = function () {
    // Logged event contents at the first event.
    if (null == this.firstAudioEvent) {
        this.firstAudioEvent = true;
        Log.getLog().info("onAudioInterval");
        Log.getLog().info(this);
    }

    // Check buffer status.
    var audioRead = this.audio.mozCurrentSampleOffset();
    var pageSize = this.bufferSize * this.audioChannel;
    var pageOffset = audioRead % (pageSize * this.bufferPage);
    var playingPage = ~~(pageOffset / pageSize);
    if (this.bufferId == playingPage &&
            this.bufferWritten != audioRead) {
        // Buffers are busy.
        return;
    }

    // Update buffer tracking variables.
    var lrOut = this.buffer[this.bufferId];
    this.bufferId = (this.bufferId + 1) % this.bufferPage;

    // Process next buffer.
    var i;
    if (null == this.channel) {
        // Process no input channel.
        for (i = 0; i < this.bufferSize; i++) {
            lrOut[i * 2 + 0] = 0.0;
            lrOut[i * 2 + 1] = 0.0;
        }
    } else {
        // Process buffer conversion.
        this.channel.generate(this.bufferSize * this.audioChannel);
        var lrIn = this.channel.getBuffer();
        for (i = 0; i < this.bufferSize; i++) {
            lrOut[i * 2 + 0] = lrIn[i * 2 + 0] / 32768.0;
            lrOut[i * 2 + 1] = lrIn[i * 2 + 1] / 32768.0;
        }
    }

    // Play next buffer.
    this.bufferWritten += this.audio.mozWriteAudio(lrOut);
};