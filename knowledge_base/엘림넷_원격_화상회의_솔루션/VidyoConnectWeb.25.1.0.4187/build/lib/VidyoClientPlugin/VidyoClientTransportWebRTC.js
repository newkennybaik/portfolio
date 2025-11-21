/////////// VidyoConfig.js start ///////////////
let VidyoTranscodingContext = {};
VidyoTranscodingContext.MAX_REMOTE_AUDIO_STREAMS = 4;
VidyoTranscodingContext.SHOW_AUDIO_METERS = true;
VidyoTranscodingContext.LOGGEDIN_INACTIVITY_TIMEOUT = -1; // this kind of timeout is disabled for now
VidyoTranscodingContext.LOGGEDOUT_TIMEOUT = 10 * 60 * 1000;
VidyoTranscodingContext.TRANSPORT_REQUEST_TIMEOUT = 15 * 1000; // 15 seconds
VidyoTranscodingContext.EVENTS_REQUEST_TIMEOUT = 20 * 1000; // 10 seconds for long-polling + 10 seconds

/////////// VidyoConfig.js end /////////////////

VidyoTranscodingContext.platform = VCUtils.vidyoPlatform;
console.log('%cVidyoTranscoding Platform: ' + VidyoTranscodingContext.platform, 'color: darkviolet');

/////////////////// VidyoClientTransportWebRTC.js start //////////////////////
(function(w) {

    // TODO - refactor all cases - use OOP
    function isNeo() {
        return VidyoTranscodingContext.platform === 'VidyoConnect';
    }


    class VLogger {

      static disableLog(bool) {
        if (typeof bool !== 'boolean') {
          return new Error('Argument type: ' + typeof bool + '. Please use a boolean.');
        }
        VLogger.logDisabled_ = bool;
        return (bool) ? 'VLogger logging disabled' : 'VLogger logging enabled';
      }

        static GetTimeForLogging() {
            return new Date().toLocaleTimeString();
        }

        static LogInfo(msg) {
        if ((VLogger.logLevel === "info" || VLogger.logLevel === 0) && VLogger.logDisabled_ !== true) {
                console.log(VLogger.GetTimeForLogging() + " " + msg);
            }
        }
        static LogErr(msg) {
            if (VLogger.logLevel === "info" || VLogger.logLevel === "error" || VLogger.logLevel === 0) {
                console.error(VLogger.GetTimeForLogging() + " " + msg);
            }
        }

        constructor(prefix, logLevel) {
            this.prefix = prefix;
            this.logLevel = logLevel | ((VCUtils.params && VCUtils.params.webrtcLogLevel) ? VCUtils.params.webrtcLogLevel : "info");
        }

        LogInfo(msg) {
        if ((this.logLevel === "info" || this.logLevel === 0) && VLogger.logDisabled_ !== true) {
                console.log(VLogger.GetTimeForLogging() + " " + this.prefix + " " + msg);
            }
        }

        LogErr(msg) {
            if (this.logLevel === "info" || this.logLevel === "error" || this.logLevel === 0) {
                console.error(VLogger.GetTimeForLogging() + " " + this.prefix + " " + msg);
            }
        }
    }

    VLogger.logDisabled_ = false;
    VLogger.logLevel = (VCUtils.params && VCUtils.params.webrtcLogLevel) ? VCUtils.params.webrtcLogLevel : "info";
    window.VLogger = VLogger;

// Utility methods.
    var utils = {
        /**
         * Extract browser version out of the provided user agent string.
         *
         * @param {!string} uastring userAgent string.
         * @param {!string} expr Regular expression used as match criteria.
         * @param {!number} pos position in the version string to be returned.
         * @return {!number} browser version.
         */
        extractVersion: function(uastring, expr, pos) {
            var match = uastring.match(expr);
            return match && match.length >= pos && parseInt(match[pos], 10);
        },

        /**
         * Browser detector.
         *
         * @return {object} result containing browser and version
         *     properties.
         */
        detectBrowser: function(window) {
            var navigator = window && window.navigator;

            // Returned result object.
            var result = {};
            result.browser = null;
            result.version = null;

            // Fail early if it's not a browser
            if (typeof window === 'undefined' || !window.navigator) {
                result.browser = 'Not a browser.';
                return result;
            }

            // Firefox.
            if (navigator.mozGetUserMedia) {
                result.browser = 'firefox';
                result.version = this.extractVersion(navigator.userAgent,
                    /Firefox\/(\d+)\./, 1);
            } else if (navigator.webkitGetUserMedia) {
                // Chrome, Chromium, Webview, Opera, all use the chrome shim for now
                if (window.webkitRTCPeerConnection) {
                    result.browser = 'chrome';
                    result.version = this.extractVersion(navigator.userAgent,
                        /Chrom(e|ium)\/(\d+)\./, 2);
                } else { // Safari (in an unpublished version) or unknown webkit-based.
                    if (navigator.userAgent.match(/Version\/(\d+).(\d+)/)) {
                        result.browser = 'safari';
                        result.version = this.extractVersion(navigator.userAgent,
                            /AppleWebKit\/(\d+)\./, 1);
                    } else { // unknown webkit-based browser.
                        result.browser = 'Unsupported webkit-based browser ' +
                            'with GUM support but no WebRTC support.';
                        return result;
                    }
                }
            } else if (navigator.mediaDevices &&
                navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) { // Edge.
                result.browser = 'edge';
                result.version = this.extractVersion(navigator.userAgent,
                    /Edge\/(\d+).(\d+)$/, 2);
            } else if (navigator.mediaDevices &&
                navigator.userAgent.match(/AppleWebKit\/(\d+)\./)) {
                // Safari, with webkitGetUserMedia removed.
                result.browser = 'safari';
                result.version = this.extractVersion(navigator.userAgent,
                    /AppleWebKit\/(\d+)\./, 1);
            } else { // Default fallthrough: not supported.
                result.browser = 'Not a supported browser.';
                return result;
            }

            return result;
        }
    };

    /**
     @name suppressFilePaths
     @description Replace interim folders in the file path with the '...'.
     The purpose of the function is to hide sensitive information in the path. E.g. to print into logs.

     @param  {string}   path    Path to process.

     @return {string}   Result string with interim folders in the path replaced with the '...'.
     */
    function suppressFilePaths(path) {
        let localStr = "" + path;
        let re = /(:)?(\/+|\\+)(\S+)(\/|\\)/g;
        return localStr.replace(re,"$1$2...$4");
    }

    // Export to the adapter global object visible in the browser.
    var adapter = {
        browserDetails: utils.detectBrowser(window)
    };
    window.adapter = adapter;

if(isNeo() !== true){

var vidyoApp = { // empty (for VidyoIO) functionality which is naturally Neo-specific feature
    pushToLog: () => {},
    createLogFileArchive: () => {}
};
window.vidyoApp = vidyoApp;

////////////////// VCLmiLayout.js start //////////////////
// Converted from MAX_CROP_PCT from VidyoClient/VidyoLocalRenderer.h
const MIN_VISIBLE_PCT_WIDTH = 60;
const MIN_VISIBLE_PCT_HEIGHT = 75;

var layoutMaker = {
    aspectW: 16,
    aspectH: 9,
    minVisiblePctX: MIN_VISIBLE_PCT_WIDTH,
    minVisiblePctY: MIN_VISIBLE_PCT_HEIGHT,
    equalSizes: true,
    strict: true,
    fill: true
};


/*  1 Participant                N xd yd #             0     */
const subRect_01_01_01_0 = [{ x:0,  y:0,  s:1}];

const layout1 =
[
    { xd:1,  yd:1, full:true,  lovely:true,  flipped: true,  w:subRect_01_01_01_0}
];

/*  2 Participants               N xd yd #             0             1     */
const subRect_02_02_01_0 = [{ x:0,  y:0,  s:1}, { x:1,  y:0,  s:1}];

const layout2 =
[
    { xd:2,  yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_02_02_01_0}
];

/*  3 Participants               N xd yd #             0             1             2     */
const subRect_03_04_04_0 = [{ x:1,  y:0,  s:2}, { x:0,  y:2,  s:2}, { x:2,  y:2,  s:2}];
const subRect_03_03_02_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:1}, { x:2,  y:1,  s:1}];
const subRect_03_03_01_0 = [{ x:0,  y:0,  s:1}, { x:1,  y:0,  s:1}, { x:2,  y:0,  s:1}];

const layout3 =
[
    { xd:4,  yd:4, full:false, lovely:true,  flipped:false, w:subRect_03_04_04_0},
    { xd:3,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_03_03_02_0},
    { xd:3,  yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_03_03_01_0}
];

/*  4 Participants               N xd yd #             0             1             2             3     */
const subRect_04_02_02_0 = [{ x:0,  y:0,  s:1}, { x:1,  y:0,  s:1}, { x:0,  y:1,  s:1}, { x:1,  y:1,  s:1}];
const subRect_04_04_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:1}, { x:3,  y:1,  s:1}, { x:3,  y:2,  s:1}];
const subRect_04_05_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:2}, { x:3,  y:2,  s:1}, { x:4,  y:2,  s:1}];
const subRect_04_05_02_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:2}, { x:4,  y:0,  s:1}, { x:4,  y:1,  s:1}];
const subRect_04_04_01_0 = [{ x:0,  y:0,  s:1}, { x:1,  y:0,  s:1}, { x:2,  y:0,  s:1}, { x:3,  y:0,  s:1}];

const layout4 =
[
    { xd:2,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_04_02_02_0},
    { xd:4,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_04_04_03_0},
    { xd:5,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_04_05_03_0},
    { xd:5,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_04_05_02_0},
    { xd:4,  yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_04_04_01_0}
];

/*  5 Participants               N xd yd #             0             1             2             3             4     */
const subRect_05_07_06_0 = [{ x:0,  y:0,  s:4}, { x:4,  y:0,  s:3}, { x:4,  y:3,  s:3}, { x:0,  y:4,  s:2}, { x:2,  y:4,  s:2}];
const subRect_05_06_05_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:0,  y:3,  s:2}, { x:2,  y:3,  s:2}, { x:4,  y:3,  s:2}];
const subRect_05_05_04_0 = [{ x:0,  y:0,  s:4}, { x:4,  y:0,  s:1}, { x:4,  y:1,  s:1}, { x:4,  y:2,  s:1}, { x:4,  y:3,  s:1}];
const subRect_05_07_05_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:2}, { x:5,  y:2,  s:2}, { x:5,  y:4,  s:1}, { x:6,  y:4,  s:1}];
const subRect_05_06_04_0 = [{ x:1,  y:0,  s:2}, { x:3,  y:0,  s:2}, { x:0,  y:2,  s:2}, { x:2,  y:2,  s:2}, { x:4,  y:2,  s:2}];
const subRect_05_08_05_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:3}, { x:5,  y:3,  s:2}, { x:7,  y:3,  s:1}, { x:7,  y:4,  s:1}];
const subRect_05_07_04_0 = [{ x:0,  y:0,  s:4}, { x:4,  y:0,  s:3}, { x:4,  y:3,  s:1}, { x:5,  y:3,  s:1}, { x:6,  y:3,  s:1}];
const subRect_05_04_02_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:1}, { x:2,  y:1,  s:1}, { x:3,  y:0,  s:1}, { x:3,  y:1,  s:1}];
const subRect_05_07_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:6,  y:0,  s:1}, { x:6,  y:1,  s:1}, { x:6,  y:2,  s:1}];
const subRect_05_08_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:6,  y:0,  s:2}, { x:6,  y:2,  s:1}, { x:7,  y:2,  s:1}];
const subRect_05_07_02_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:2}, { x:4,  y:0,  s:2}, { x:6,  y:0,  s:1}, { x:6,  y:1,  s:1}];
const subRect_05_05_01_0 = [{ x:0,  y:0,  s:1}, { x:1,  y:0,  s:1}, { x:2,  y:0,  s:1}, { x:3,  y:0,  s:1}, { x:4,  y:0,  s:1}];

const layout5 =
[
    { xd:7,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_05_07_06_0},
    { xd:6,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_05_06_05_0},
    { xd:5,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_05_05_04_0},
    { xd:7,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_05_07_05_0},
    { xd:6,  yd:4, full:false, lovely:true,  flipped:false, w:subRect_05_06_04_0},
    { xd:8,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_05_08_05_0},
    { xd:7,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_05_07_04_0},
    { xd:4,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_05_04_02_0},
    { xd:7,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_05_07_03_0},
    { xd:8,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_05_08_03_0},
    { xd:7,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_05_07_02_0},
    { xd:5,  yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_05_05_01_0}
];

/*  6 Participants               N xd yd #             0             1             2             3             4             5     */
const subRect_06_03_03_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:1}, { x:2,  y:1,  s:1}, { x:0,  y:2,  s:1}, { x:1,  y:2,  s:1}, { x:2,  y:2,  s:1}];
const subRect_06_11_10_0 = [{ x:0,  y:0,  s:6}, { x:6,  y:0,  s:5}, { x:6,  y:5,  s:5}, { x:0,  y:6,  s:4}, { x:4,  y:6,  s:2}, { x:4,  y:8,  s:2}];
const subRect_06_10_09_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:5}, { x:0,  y:5,  s:4}, { x:6,  y:5,  s:4}, { x:4,  y:5,  s:2}, { x:4,  y:7,  s:2}];
const subRect_06_06_05_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:1}, { x:5,  y:1,  s:1}, { x:5,  y:2,  s:1}, { x:5,  y:3,  s:1}, { x:5,  y:4,  s:1}];
const subRect_06_05_04_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:2}, { x:3,  y:2,  s:2}, { x:0,  y:3,  s:1}, { x:1,  y:3,  s:1}, { x:2,  y:3,  s:1}];
const subRect_06_04_03_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:2}, { x:0,  y:2,  s:1}, { x:1,  y:2,  s:1}, { x:2,  y:2,  s:1}, { x:3,  y:2,  s:1}];
const subRect_06_03_02_0 = [{ x:0,  y:0,  s:1}, { x:1,  y:0,  s:1}, { x:2,  y:0,  s:1}, { x:0,  y:1,  s:1}, { x:1,  y:1,  s:1}, { x:2,  y:1,  s:1}];
const subRect_06_06_04_0 = [{ x:0,  y:0,  s:4}, { x:4,  y:0,  s:2}, { x:4,  y:2,  s:1}, { x:5,  y:2,  s:1}, { x:4,  y:3,  s:1}, { x:5,  y:3,  s:1}];
const subRect_06_09_05_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:4}, { x:5,  y:4,  s:1}, { x:6,  y:4,  s:1}, { x:7,  y:4,  s:1}, { x:8,  y:4,  s:1}];
const subRect_06_11_06_0 = [{ x:0,  y:0,  s:6}, { x:6,  y:0,  s:3}, { x:6,  y:3,  s:3}, { x:9,  y:0,  s:2}, { x:9,  y:2,  s:2}, { x:9,  y:4,  s:2}];
const subRect_06_13_07_0 = [{ x:0,  y:0,  s:7}, { x:7,  y:0,  s:4}, { x:7,  y:4,  s:3}, {x:10,  y:4,  s:3}, {x:11,  y:0,  s:2}, {x:11,  y:2,  s:2}];
const subRect_06_13_06_0 = [{ x:0,  y:0,  s:6}, { x:6,  y:0,  s:4}, {x:10,  y:0,  s:3}, {x:10,  y:3,  s:3}, { x:6,  y:4,  s:2}, { x:8,  y:4,  s:2}];
const subRect_06_11_05_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:3}, { x:8,  y:0,  s:3}, { x:5,  y:3,  s:2}, { x:7,  y:3,  s:2}, { x:9,  y:3,  s:2}];
const subRect_06_09_04_0 = [{ x:0,  y:0,  s:4}, { x:4,  y:0,  s:4}, { x:8,  y:0,  s:1}, { x:8,  y:1,  s:1}, { x:8,  y:2,  s:1}, { x:8,  y:3,  s:1}];
const subRect_06_12_05_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:5}, {x:10,  y:0,  s:2}, {x:10,  y:2,  s:2}, {x:10,  y:4,  s:1}, {x:11,  y:4,  s:1}];
const subRect_06_13_05_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:5}, {x:10,  y:0,  s:3}, {x:10,  y:3,  s:2}, {x:12,  y:3,  s:1}, {x:12,  y:4,  s:1}];
const subRect_06_11_04_0 = [{ x:0,  y:0,  s:4}, { x:4,  y:0,  s:4}, { x:8,  y:0,  s:3}, { x:8,  y:3,  s:1}, { x:9,  y:3,  s:1}, {x:10,  y:3,  s:1}];
const subRect_06_06_02_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:2}, { x:4,  y:0,  s:1}, { x:5,  y:0,  s:1}, { x:4,  y:1,  s:1}, { x:5,  y:1,  s:1}];
const subRect_06_10_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:6,  y:0,  s:3}, { x:9,  y:0,  s:1}, { x:9,  y:1,  s:1}, { x:9,  y:2,  s:1}];
const subRect_06_11_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:6,  y:0,  s:3}, { x:9,  y:0,  s:2}, { x:9,  y:2,  s:1}, {x:10,  y:2,  s:1}];
const subRect_06_09_02_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:2}, { x:4,  y:0,  s:2}, { x:6,  y:0,  s:2}, { x:8,  y:0,  s:1}, { x:8,  y:1,  s:1}];
const subRect_06_06_01_0 = [{ x:0,  y:0,  s:1}, { x:1,  y:0,  s:1}, { x:2,  y:0,  s:1}, { x:3,  y:0,  s:1}, { x:4,  y:0,  s:1}, { x:5,  y:0,  s:1}];

const layout6 =
[
    { xd:3,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_06_03_03_0},
    {xd:11, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_06_11_10_0},
    {xd:10,  yd:9, full:true,  lovely:true,  flipped:true,  w:subRect_06_10_09_0},
    { xd:6,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_06_06_05_0},
    { xd:5,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_06_05_04_0},
    { xd:4,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_06_04_03_0},
    { xd:3,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_06_03_02_0},
    { xd:6,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_06_06_04_0},
    { xd:9,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_06_09_05_0},
    {xd:11,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_06_11_06_0},
    {xd:13,  yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_06_13_07_0},
    {xd:13,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_06_13_06_0},
    {xd:11,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_06_11_05_0},
    { xd:9,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_06_09_04_0},
    {xd:12,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_06_12_05_0},
    {xd:13,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_06_13_05_0},
    {xd:11,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_06_11_04_0},
    { xd:6,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_06_06_02_0},
    {xd:10,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_06_10_03_0},
    {xd:11,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_06_11_03_0},
    { xd:9,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_06_09_02_0},
    { xd:6,  yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_06_06_01_0}
];

/*  7 Participants               N xd yd #             0             1             2             3             4             5             6     */
const subRect_07_04_04_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:2}, { x:0,  y:2,  s:2}, { x:2,  y:2,  s:1}, { x:3,  y:2,  s:1}, { x:2,  y:3,  s:1}, { x:3,  y:3,  s:1}];
const subRect_07_06_06_0 = [{ x:1,  y:0,  s:2}, { x:3,  y:0,  s:2}, { x:0,  y:2,  s:2}, { x:2,  y:2,  s:2}, { x:4,  y:2,  s:2}, { x:1,  y:4,  s:2}, { x:3,  y:4,  s:2}];
const subRect_07_15_14_0 = [{ x:0,  y:0,  s:9}, { x:9,  y:3,  s:6}, { x:0,  y:9,  s:5}, { x:5,  y:9,  s:5}, {x:10,  y:9,  s:5}, { x:9,  y:0,  s:3}, {x:12,  y:0,  s:3}];
const subRect_07_14_13_0 = [{ x:0,  y:0,  s:7}, { x:7,  y:0,  s:7}, { x:0,  y:7,  s:6}, { x:8,  y:7,  s:6}, { x:6,  y:7,  s:2}, { x:6,  y:9,  s:2}, { x:6,  y:11, s:2}];
const subRect_07_13_12_0 = [{ x:0,  y:0,  s:9}, { x:9,  y:0,  s:4}, { x:9,  y:4,  s:4}, { x:9,  y:8,  s:4}, { x:0,  y:9,  s:3}, { x:3,  y:9,  s:3}, { x:6,  y:9,  s:3}];
const subRect_07_12_11_0 = [{ x:0,  y:0,  s:8}, { x:8,  y:0,  s:4}, { x:8,  y:4,  s:4}, { x:0,  y:8,  s:3}, { x:3,  y:8,  s:3}, { x:6,  y:8,  s:3}, { x:9,  y:8,  s:3}];
const subRect_07_08_06_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:0,  y:3,  s:3}, { x:3,  y:3,  s:3}, { x:6,  y:0,  s:2}, { x:6,  y:2,  s:2}, { x:6,  y:4,  s:2}];
const subRect_07_15_11_0 = [{ x:0,  y:0,  s:6}, { x:9,  y:0,  s:6}, { x:0,  y:6,  s:5}, { x:5,  y:6,  s:5}, {x:10,  y:6,  s:5}, { x:6,  y:0,  s:3}, { x:6,  y:3,  s:3}];
const subRect_07_07_05_0 = [{ x:0,  y:0,  s:3}, { x:4,  y:2,  s:3}, { x:3,  y:0,  s:2}, { x:5,  y:0,  s:2}, { x:0,  y:3,  s:2}, { x:2,  y:3,  s:2}, { x:3,  y:2,  s:1}];
const subRect_07_10_07_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:5}, { x:0,  y:5,  s:2}, { x:2,  y:5,  s:2}, { x:4,  y:5,  s:2}, { x:6,  y:5,  s:2}, { x:8,  y:5,  s:2}];
const subRect_07_05_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:1}, { x:4,  y:0,  s:1}, { x:3,  y:1,  s:1}, { x:4,  y:1,  s:1}, { x:3,  y:2,  s:1}, { x:4,  y:2,  s:1}];
const subRect_07_10_06_0 = [{ x:0,  y:0,  s:4}, { x:4,  y:0,  s:3}, { x:7,  y:0,  s:3}, { x:4,  y:3,  s:3}, { x:7,  y:3,  s:3}, { x:0,  y:4,  s:2}, { x:2,  y:4,  s:2}];
const subRect_07_17_10_0 = [{ x:0,  y:0,  s:6}, { x:6,  y:0,  s:6}, {x:12,  y:0,  s:5}, {x:12,  y:5,  s:5}, { x:0,  y:6,  s:4}, { x:4,  y:6,  s:4}, { x:8,  y:6,  s:4}];
const subRect_07_12_07_0 = [{ x:0,  y:0,  s:4}, { x:4,  y:0,  s:4}, { x:8,  y:0,  s:4}, { x:0,  y:4,  s:3}, { x:3,  y:4,  s:3}, { x:6,  y:4,  s:3}, { x:9,  y:4,  s:3}];
const subRect_07_07_04_0 = [{ x:0,  y:0,  s:4}, { x:4,  y:0,  s:2}, { x:4,  y:2,  s:2}, { x:6,  y:0,  s:1}, { x:6,  y:1,  s:1}, { x:6,  y:2,  s:1}, { x:6,  y:3,  s:1}];
const subRect_07_06_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:2}, { x:5,  y:0,  s:1}, { x:5,  y:1,  s:1}, { x:3,  y:2,  s:1}, { x:4,  y:2,  s:1}, { x:5,  y:2,  s:1}];
const subRect_07_08_04_0 = [{ x:1,  y:0,  s:2}, { x:3,  y:0,  s:2}, { x:5,  y:0,  s:2}, { x:0,  y:2,  s:2}, { x:2,  y:2,  s:2}, { x:4,  y:2,  s:2}, { x:6,  y:2,  s:2}];
const subRect_07_07_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:2}, { x:5,  y:0,  s:2}, { x:3,  y:2,  s:1}, { x:4,  y:2,  s:1}, { x:5,  y:2,  s:1}, { x:6,  y:2,  s:1}];
const subRect_07_05_02_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:1}, { x:3,  y:0,  s:1}, { x:4,  y:0,  s:1}, { x:2,  y:1,  s:1}, { x:3,  y:1,  s:1}, { x:4,  y:1,  s:1}];
const subRect_07_17_06_0 = [{ x:0,  y:0,  s:6}, { x:6,  y:0,  s:6}, {x:12,  y:0,  s:3}, {x:12,  y:3,  s:3}, {x:15,  y:0,  s:2}, {x:15,  y:2,  s:2}, {x:15,  y:4,  s:2}];
const subRect_07_19_06_0 = [{ x:0,  y:0,  s:6}, { x:6,  y:0,  s:6}, {x:12,  y:0,  s:4}, {x:16,  y:0,  s:3}, {x:16,  y:3,  s:3}, {x:12,  y:4,  s:2}, {x:14,  y:4,  s:2}];
const subRect_07_16_05_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:5}, {x:10,  y:0,  s:3}, {x:13,  y:0,  s:3}, {x:10,  y:3,  s:2}, {x:12,  y:3,  s:2}, {x:14,  y:3,  s:2}];
const subRect_07_13_04_0 = [{ x:0,  y:0,  s:4}, { x:4,  y:0,  s:4}, { x:8,  y:0,  s:4}, {x:12,  y:0,  s:1}, {x:12,  y:1,  s:1}, {x:12,  y:2,  s:1}, {x:12,  y:3,  s:1}];
const subRect_07_15_04_0 = [{ x:0,  y:0,  s:4}, { x:4,  y:0,  s:4}, { x:8,  y:0,  s:4}, {x:12,  y:0,  s:3}, {x:12,  y:3,  s:1}, {x:13,  y:3,  s:1}, {x:14,  y:3,  s:1}];
const subRect_07_08_02_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:2}, { x:4,  y:0,  s:2}, { x:6,  y:0,  s:1}, { x:7,  y:0,  s:1}, { x:6,  y:1,  s:1}, { x:7,  y:1,  s:1}];
const subRect_07_13_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:6,  y:0,  s:3}, { x:9,  y:0,  s:3}, {x:12,  y:0,  s:1}, {x:12,  y:1,  s:1}, {x:12,  y:2,  s:1}];
const subRect_07_14_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:6,  y:0,  s:3}, { x:9,  y:0,  s:3}, {x:12,  y:0,  s:2}, {x:12,  y:2,  s:1}, {x:13,  y:2,  s:1}];
const subRect_07_11_02_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:2}, { x:4,  y:0,  s:2}, { x:6,  y:0,  s:2}, { x:8,  y:0,  s:2}, {x:10,  y:0,  s:1}, {x:10,  y:1,  s:1}];
const subRect_07_07_01_0 = [{ x:0,  y:0,  s:1}, { x:1,  y:0,  s:1}, { x:2,  y:0,  s:1}, { x:3,  y:0,  s:1}, { x:4,  y:0,  s:1}, { x:5,  y:0,  s:1}, { x:6,  y:0,  s:1}];

const layout7 =
[
    { xd:4,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_07_04_04_0},
    { xd:6,  yd:6, full:false, lovely:true,  flipped:false, w:subRect_07_06_06_0},
    {xd:15, yd:14, full:true,  lovely:true,  flipped:true,  w:subRect_07_15_14_0},
    {xd:14, yd:13, full:true,  lovely:true,  flipped:true,  w:subRect_07_14_13_0},
    {xd:13, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_07_13_12_0},
    {xd:12, yd:11, full:true,  lovely:true,  flipped:true,  w:subRect_07_12_11_0},
    { xd:8,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_07_08_06_0},
    {xd:15, yd:11, full:true,  lovely:true,  flipped:true,  w:subRect_07_15_11_0},
    { xd:7,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_07_07_05_0},
    {xd:10,  yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_07_10_07_0},
    { xd:5,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_07_05_03_0},
    {xd:10,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_07_10_06_0},
    {xd:17, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_07_17_10_0},
    {xd:12,  yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_07_12_07_0},
    { xd:7,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_07_07_04_0},
    { xd:6,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_07_06_03_0},
    { xd:8,  yd:4, full:false, lovely:true,  flipped:false, w:subRect_07_08_04_0},
    { xd:7,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_07_07_03_0},
    { xd:5,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_07_05_02_0},
    {xd:17,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_07_17_06_0},
    {xd:19,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_07_19_06_0},
    {xd:16,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_07_16_05_0},
    {xd:13,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_07_13_04_0},
    {xd:15,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_07_15_04_0},
    { xd:8,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_07_08_02_0},
    {xd:13,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_07_13_03_0},
    {xd:14,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_07_14_03_0},
    {xd:11,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_07_11_02_0},
    { xd:7,  yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_07_07_01_0}
];

/*  8 Participants               N xd yd #             0             1             2             3             4             5             6             7     */
const subRect_08_04_04_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:1}, { x:3,  y:1,  s:1}, { x:3,  y:2,  s:1}, { x:0,  y:3,  s:1}, { x:1,  y:3,  s:1}, { x:2,  y:3,  s:1}, { x:3,  y:3,  s:1}];
const subRect_08_05_05_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:2}, { x:0,  y:3,  s:2}, { x:3,  y:3,  s:2}, { x:3,  y:2,  s:1}, { x:4,  y:2,  s:1}, { x:2,  y:3,  s:1}, { x:2,  y:4,  s:1}];
const subRect_08_06_06_0 = [{ x:1,  y:0,  s:2}, { x:3,  y:0,  s:2}, { x:0,  y:2,  s:2}, { x:2,  y:2,  s:2}, { x:4,  y:2,  s:2}, { x:0,  y:4,  s:2}, { x:2,  y:4,  s:2}, { x:4,  y:4,  s:2}];
const subRect_08_07_06_0 = [{ x:0,  y:0,  s:3}, { x:0,  y:3,  s:3}, { x:3,  y:0,  s:2}, { x:3,  y:2,  s:2}, { x:3,  y:4,  s:2}, { x:5,  y:0,  s:2}, { x:5,  y:2,  s:2}, { x:5,  y:4,  s:2}];
const subRect_08_25_21_0 = [{ x:0,  y:0, s:12}, { x:0, y:12,  s:9}, { x:9, y:12,  s:9}, {x:18,  y:0,  s:7}, {x:18,  y:7,  s:7}, {x:18, y:14,  s:7}, {x:12,  y:0,  s:6}, {x:12,  y:6,  s:6}];
const subRect_08_06_05_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:1,  y:3,  s:2}, { x:3,  y:3,  s:2}, { x:0,  y:3,  s:1}, { x:0,  y:4,  s:1}, { x:5,  y:3,  s:1}, { x:5,  y:4,  s:1}];
const subRect_08_12_10_0 = [{ x:3,  y:0,  s:6}, { x:0,  y:6,  s:4}, { x:4,  y:6,  s:4}, { x:8,  y:6,  s:4}, { x:0,  y:0,  s:3}, { x:0,  y:3,  s:3}, { x:9,  y:0,  s:3}, { x:9,  y:3,  s:3}];
const subRect_08_05_04_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:2}, { x:0,  y:2,  s:2}, { x:2,  y:2,  s:2}, { x:4,  y:0,  s:1}, { x:4,  y:1,  s:1}, { x:4,  y:2,  s:1}, { x:4,  y:3,  s:1}];
const subRect_08_14_10_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:5}, { x:0,  y:5,  s:5}, { x:5,  y:5,  s:5}, {x:10,  y:0,  s:4}, {x:10,  y:4,  s:4}, {x:10,  y:8,  s:2}, {x:12,  y:8,  s:2}];
const subRect_08_06_04_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:0,  y:3,  s:1}, { x:1,  y:3,  s:1}, { x:2,  y:3,  s:1}, { x:3,  y:3,  s:1}, { x:4,  y:3,  s:1}, { x:5,  y:3,  s:1}];
const subRect_08_09_06_0 = [{ x:3,  y:0,  s:4}, { x:0,  y:0,  s:3}, { x:0,  y:3,  s:3}, { x:7,  y:0,  s:2}, { x:7,  y:2,  s:2}, { x:3,  y:4,  s:2}, { x:5,  y:4,  s:2}, { x:7,  y:4,  s:2}];
const subRect_08_23_15_0 = [{ x:0,  y:0,  s:9}, { x:9,  y:0,  s:9}, { x:0,  y:9,  s:6}, { x:6,  y:9,  s:6}, {x:12,  y:9,  s:6}, {x:18,  y:0,  s:5}, {x:18,  y:5,  s:5}, {x:18, y:10,  s:5}];
const subRect_08_20_13_0 = [{ x:0,  y:0,  s:8}, {x:12,  y:0,  s:8}, { x:0,  y:8,  s:5}, { x:5,  y:8,  s:5}, {x:10,  y:8,  s:5}, {x:15,  y:8,  s:5}, { x:8,  y:0,  s:4}, { x:8,  y:4,  s:4}];
const subRect_08_16_10_0 = [{ x:0,  y:0,  s:6}, { x:6,  y:0,  s:5}, {x:11,  y:0,  s:5}, { x:6,  y:5,  s:5}, {x:11,  y:5,  s:5}, { x:0,  y:6,  s:4}, { x:4,  y:6,  s:2}, { x:4,  y:8,  s:2}];
const subRect_08_21_13_0 = [{ x:0,  y:0,  s:7}, { x:7,  y:0,  s:7}, {x:14,  y:0,  s:7}, { x:0,  y:7,  s:6}, { x:6,  y:7,  s:6}, {x:12,  y:7,  s:6}, {x:18,  y:7,  s:3}, {x:18, y:10,  s:3}];
const subRect_08_07_04_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:2}, { x:5,  y:0,  s:2}, { x:3,  y:2,  s:2}, { x:5,  y:2,  s:2}, { x:0,  y:3,  s:1}, { x:1,  y:3,  s:1}, { x:2,  y:3,  s:1}];
const subRect_08_11_06_0 = [{ x:0,  y:0,  s:4}, { x:4,  y:0,  s:4}, { x:8,  y:0,  s:3}, { x:8,  y:3,  s:3}, { x:0,  y:4,  s:2}, { x:2,  y:4,  s:2}, { x:4,  y:4,  s:2}, { x:6,  y:4,  s:2}];
const subRect_08_28_15_0 = [{ x:0,  y:0, s:10}, {x:10,  y:0,  s:9}, {x:19,  y:0,  s:9}, {x:10,  y:9,  s:6}, {x:16,  y:9,  s:6}, {x:22,  y:9,  s:6}, { x:0, y:10,  s:5}, { x:5, y:10,  s:5}];
const subRect_08_15_08_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:5}, {x:10,  y:0,  s:5}, { x:0,  y:5,  s:3}, { x:3,  y:5,  s:3}, { x:6,  y:5,  s:3}, { x:9,  y:5,  s:3}, {x:12,  y:5,  s:3}];
const subRect_08_04_02_0 = [{ x:0,  y:0,  s:1}, { x:1,  y:0,  s:1}, { x:2,  y:0,  s:1}, { x:3,  y:0,  s:1}, { x:0,  y:1,  s:1}, { x:1,  y:1,  s:1}, { x:2,  y:1,  s:1}, { x:3,  y:1,  s:1}];
const subRect_08_14_06_0 = [{ x:0,  y:0,  s:6}, { x:6,  y:0,  s:3}, { x:9,  y:0,  s:3}, { x:6,  y:3,  s:3}, { x:9,  y:3,  s:3}, {x:12,  y:0,  s:2}, {x:12,  y:2,  s:2}, {x:12,  y:4,  s:2}];
const subRect_08_08_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:6,  y:0,  s:1}, { x:7,  y:0,  s:1}, { x:6,  y:1,  s:1}, { x:7,  y:1,  s:1}, { x:6,  y:2,  s:1}, { x:7,  y:2,  s:1}];
const subRect_08_16_06_0 = [{ x:0,  y:0,  s:6}, { x:6,  y:0,  s:4}, {x:10,  y:0,  s:3}, {x:13,  y:0,  s:3}, {x:10,  y:3,  s:3}, {x:13,  y:3,  s:3}, { x:6,  y:4,  s:2}, { x:8,  y:4,  s:2}];
const subRect_08_27_10_0 = [{ x:0,  y:0, s:10}, {x:10,  y:0,  s:6}, {x:16,  y:0,  s:6}, {x:22,  y:0,  s:5}, {x:22,  y:5,  s:5}, {x:10,  y:6,  s:4}, {x:14,  y:6,  s:4}, {x:18,  y:6,  s:4}];
const subRect_08_19_07_0 = [{ x:0,  y:0,  s:7}, { x:7,  y:0,  s:4}, {x:11,  y:0,  s:4}, {x:15,  y:0,  s:4}, { x:7,  y:4,  s:3}, {x:10,  y:4,  s:3}, {x:13,  y:4,  s:3}, {x:16,  y:4,  s:3}];
const subRect_08_09_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:6,  y:0,  s:2}, { x:8,  y:0,  s:1}, { x:8,  y:1,  s:1}, { x:6,  y:2,  s:1}, { x:7,  y:2,  s:1}, { x:8,  y:2,  s:1}];
const subRect_08_10_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:6,  y:0,  s:2}, { x:8,  y:0,  s:2}, { x:6,  y:2,  s:1}, { x:7,  y:2,  s:1}, { x:8,  y:2,  s:1}, { x:9,  y:2,  s:1}];
const subRect_08_07_02_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:2}, { x:4,  y:0,  s:1}, { x:5,  y:0,  s:1}, { x:6,  y:0,  s:1}, { x:4,  y:1,  s:1}, { x:5,  y:1,  s:1}, { x:6,  y:1,  s:1}];
const subRect_08_23_06_0 = [{ x:0,  y:0,  s:6}, { x:6,  y:0,  s:6}, {x:12,  y:0,  s:6}, {x:18,  y:0,  s:3}, {x:18,  y:3,  s:3}, {x:21,  y:0,  s:2}, {x:21,  y:2,  s:2}, {x:21,  y:4,  s:2}];
const subRect_08_21_05_0 = [{ x:0,  y:0,  s:5}, { x:5,  y:0,  s:5}, {x:10,  y:0,  s:5}, {x:15,  y:0,  s:3}, {x:18,  y:0,  s:3}, {x:15,  y:3,  s:2}, {x:17,  y:3,  s:2}, {x:19,  y:3,  s:2}];
const subRect_08_10_02_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:2}, { x:4,  y:0,  s:2}, { x:6,  y:0,  s:2}, { x:8,  y:0,  s:1}, { x:9,  y:0,  s:1}, { x:8,  y:1,  s:1}, { x:9,  y:1,  s:1}];
const subRect_08_16_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:6,  y:0,  s:3}, { x:9,  y:0,  s:3}, {x:12,  y:0,  s:3}, {x:15,  y:0,  s:1}, {x:15,  y:1,  s:1}, {x:15,  y:2,  s:1}];
const subRect_08_17_03_0 = [{ x:0,  y:0,  s:3}, { x:3,  y:0,  s:3}, { x:6,  y:0,  s:3}, { x:9,  y:0,  s:3}, {x:12,  y:0,  s:3}, {x:15,  y:0,  s:2}, {x:15,  y:2,  s:1}, {x:16,  y:2,  s:1}];
const subRect_08_13_02_0 = [{ x:0,  y:0,  s:2}, { x:2,  y:0,  s:2}, { x:4,  y:0,  s:2}, { x:6,  y:0,  s:2}, { x:8,  y:0,  s:2}, {x:10,  y:0,  s:2}, {x:12,  y:0,  s:1}, {x:12,  y:1,  s:1}];
const subRect_08_08_01_0 = [{ x:0,  y:0,  s:1}, { x:1,  y:0,  s:1}, { x:2,  y:0,  s:1}, { x:3,  y:0,  s:1}, { x:4,  y:0,  s:1}, { x:5,  y:0,  s:1}, { x:6,  y:0,  s:1}, { x:7,  y:0,  s:1}];

const layout8 =
[
    { xd:4,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_08_04_04_0},
    { xd:5,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_08_05_05_0},
    { xd:6,  yd:6, full:false, lovely:true,  flipped:false, w:subRect_08_06_06_0},
    { xd:7,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_08_07_06_0},
    {xd:25, yd:21, full:true,  lovely:true,  flipped:true,  w:subRect_08_25_21_0},
    { xd:6,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_08_06_05_0},
    {xd:12, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_08_12_10_0},
    { xd:5,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_08_05_04_0},
    {xd:14, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_08_14_10_0},
    { xd:6,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_08_06_04_0},
    { xd:9,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_08_09_06_0},
    {xd:23, yd:15, full:true,  lovely:true,  flipped:true,  w:subRect_08_23_15_0},
    {xd:20, yd:13, full:true,  lovely:true,  flipped:true,  w:subRect_08_20_13_0},
    {xd:16, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_08_16_10_0},
    {xd:21, yd:13, full:true,  lovely:true,  flipped:true,  w:subRect_08_21_13_0},
    { xd:7,  yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_08_07_04_0},
    {xd:11,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_08_11_06_0},
    {xd:28, yd:15, full:true,  lovely:true,  flipped:true,  w:subRect_08_28_15_0},
    {xd:15,  yd:8, full:true,  lovely:true,  flipped:true,  w:subRect_08_15_08_0},
    { xd:4,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_08_04_02_0},
    {xd:14,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_08_14_06_0},
    { xd:8,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_08_08_03_0},
    {xd:16,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_08_16_06_0},
    {xd:27, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_08_27_10_0},
    {xd:19,  yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_08_19_07_0},
    { xd:9,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_08_09_03_0},
    {xd:10,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_08_10_03_0},
    { xd:7,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_08_07_02_0},
    {xd:23,  yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_08_23_06_0},
    {xd:21,  yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_08_21_05_0},
    {xd:10,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_08_10_02_0},
    {xd:16,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_08_16_03_0},
    {xd:17,  yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_08_17_03_0},
    {xd:13,  yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_08_13_02_0},
    { xd:8,  yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_08_08_01_0}
];

/*  9 Participants               N xd yd #             0             1             2             3             4             5             6             7             8     */
const subRect_09_03_03_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:0, y:1, s:1}, {x:1, y:1, s:1}, {x:2, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}];
const subRect_09_06_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:2}, {x:5, y:3, s:1}, {x:5, y:4, s:1}, {x:3, y:5, s:1}, {x:4, y:5, s:1}, {x:5, y:5, s:1}];
const subRect_09_13_12_0 = [{x:0, y:0, s:6}, {x:0, y:6, s:6}, {x:6, y:0, s:4}, {x:6, y:4, s:4}, {x:6, y:8, s:4}, {x:10, y:0, s:3}, {x:10, y:3, s:3}, {x:10, y:6, s:3}, {x:10, y:9, s:3}];
const subRect_09_10_09_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:0, y:5, s:4}, {x:4, y:5, s:2}, {x:6, y:5, s:2}, {x:8, y:5, s:2}, {x:4, y:7, s:2}, {x:6, y:7, s:2}, {x:8, y:7, s:2}];
const subRect_09_05_04_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:2}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:0, y:3, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}];
const subRect_09_10_08_0 = [{x:0, y:0, s:4}, {x:0, y:4, s:4}, {x:4, y:0, s:3}, {x:7, y:0, s:3}, {x:4, y:3, s:3}, {x:7, y:3, s:3}, {x:4, y:6, s:2}, {x:6, y:6, s:2}, {x:8, y:6, s:2}];
const subRect_09_04_03_0 = [{x:1, y:0, s:2}, {x:0, y:0, s:1}, {x:0, y:1, s:1}, {x:3, y:0, s:1}, {x:3, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}];
const subRect_09_06_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}];
const subRect_09_06_04_1 = [{x:0, y:0, s:4}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}];
const subRect_09_08_05_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:1, s:2}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:4, y:3, s:2}, {x:6, y:3, s:2}, {x:6, y:0, s:1}, {x:7, y:0, s:1}];
const subRect_09_05_03_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:1}, {x:4, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}];
const subRect_09_09_05_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:4, y:3, s:2}, {x:6, y:3, s:2}, {x:8, y:3, s:1}, {x:8, y:4, s:1}];
const subRect_09_11_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:3, s:3}, {x:9, y:0, s:2}, {x:9, y:2, s:2}, {x:9, y:4, s:2}];
const subRect_09_26_14_0 = [{x:14, y:0, s:8}, {x:0, y:0, s:7}, {x:7, y:0, s:7}, {x:0, y:7, s:7}, {x:7, y:7, s:7}, {x:14, y:8, s:6}, {x:20, y:8, s:6}, {x:22, y:0, s:4}, {x:22, y:4, s:4}];
const subRect_09_28_15_0 = [{x:0, y:0, s:8}, {x:8, y:0, s:8}, {x:16, y:0, s:8}, {x:0, y:8, s:7}, {x:7, y:8, s:7}, {x:14, y:8, s:7}, {x:21, y:8, s:7}, {x:24, y:0, s:4}, {x:24, y:4, s:4}];
const subRect_09_06_03_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}];
const subRect_09_13_06_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:3}, {x:7, y:0, s:3}, {x:10, y:0, s:3}, {x:4, y:3, s:3}, {x:7, y:3, s:3}, {x:10, y:3, s:3}, {x:0, y:4, s:2}, {x:2, y:4, s:2}];
const subRect_09_22_10_0 = [{x:0, y:0, s:6}, {x:6, y:0, s:6}, {x:12, y:0, s:5}, {x:17, y:0, s:5}, {x:12, y:5, s:5}, {x:17, y:5, s:5}, {x:0, y:6, s:4}, {x:4, y:6, s:4}, {x:8, y:6, s:4}];
const subRect_09_31_14_0 = [{x:0, y:0, s:8}, {x:8, y:0, s:8}, {x:16, y:0, s:8}, {x:24, y:0, s:7}, {x:24, y:7, s:7}, {x:0, y:8, s:6}, {x:6, y:8, s:6}, {x:12, y:8, s:6}, {x:18, y:8, s:6}];
const subRect_09_20_09_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:10, y:0, s:5}, {x:15, y:0, s:5}, {x:0, y:5, s:4}, {x:4, y:5, s:4}, {x:8, y:5, s:4}, {x:12, y:5, s:4}, {x:16, y:5, s:4}];
const subRect_09_06_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}];
const subRect_09_11_03_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:9, y:1, s:1}, {x:10, y:1, s:1}, {x:9, y:2, s:1}, {x:10, y:2, s:1}];
const subRect_09_09_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}, {x:8, y:1, s:1}];
const subRect_09_21_04_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:8, y:0, s:4}, {x:12, y:0, s:4}, {x:16, y:0, s:4}, {x:20, y:0, s:1}, {x:20, y:1, s:1}, {x:20, y:2, s:1}, {x:20, y:3, s:1}];
const subRect_09_12_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:1}, {x:11, y:0, s:1}, {x:10, y:1, s:1}, {x:11, y:1, s:1}];
const subRect_09_19_03_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:12, y:0, s:3}, {x:15, y:0, s:3}, {x:18, y:0, s:1}, {x:18, y:1, s:1}, {x:18, y:2, s:1}];
const subRect_09_15_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:1}, {x:14, y:1, s:1}];
const subRect_09_09_01_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}];

const layout9 =
[
    {xd:3, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_09_03_03_0},
    {xd:6, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_09_06_06_0},
    {xd:13, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_09_13_12_0},
    {xd:10, yd:9, full:true,  lovely:true,  flipped:true,  w:subRect_09_10_09_0},
    {xd:5, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_09_05_04_0},
    {xd:10, yd:8, full:true,  lovely:true,  flipped:true,  w:subRect_09_10_08_0},
    {xd:4, yd:3, full:true,  lovely:true,  flipped:false, w:subRect_09_04_03_0},
    {xd:6, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_09_06_04_0},
    {xd:6, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_09_06_04_1},
    {xd:8, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_09_08_05_0},
    {xd:5, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_09_05_03_0},
    {xd:9, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_09_09_05_0},
    {xd:11, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_09_11_06_0},
    {xd:26, yd:14, full:true,  lovely:true,  flipped:true,  w:subRect_09_26_14_0},
    {xd:28, yd:15, full:true,  lovely:true,  flipped:true,  w:subRect_09_28_15_0},
    {xd:6, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_09_06_03_0},
    {xd:13, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_09_13_06_0},
    {xd:22, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_09_22_10_0},
    {xd:31, yd:14, full:true,  lovely:true,  flipped:true,  w:subRect_09_31_14_0},
    {xd:20, yd:9, full:true,  lovely:true,  flipped:true,  w:subRect_09_20_09_0},
    {xd:6, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_09_06_02_0},
    {xd:11, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_09_11_03_0},
    {xd:9, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_09_09_02_0},
    {xd:21, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_09_21_04_0},
    {xd:12, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_09_12_02_0},
    {xd:19, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_09_19_03_0},
    {xd:15, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_09_15_02_0},
    {xd:9, yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_09_09_01_0}
];

/* 10 Participants               N xd yd #              0             1             2             3             4             5             6             7             8             9     */
const subRect_10_04_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:0, y:3, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}];
const subRect_10_05_05_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:1}, {x:4, y:1, s:1}, {x:4, y:2, s:1}, {x:4, y:3, s:1}, {x:0, y:4, s:1}, {x:1, y:4, s:1}, {x:2, y:4, s:1}, {x:3, y:4, s:1}, {x:4, y:4, s:1}];
const subRect_10_16_15_0 = [{x:5, y:0, s:6}, {x:5, y:9, s:6}, {x:0, y:0, s:5}, {x:0, y:5, s:5}, {x:0, y:10, s:5}, {x:11, y:0, s:5}, {x:11, y:5, s:5}, {x:11, y:10, s:5}, {x:5, y:6, s:3}, {x:8, y:6, s:3}];
const subRect_10_15_14_0 = [{x:3, y:0, s:9}, {x:0, y:9, s:5}, {x:5, y:9, s:5}, {x:10, y:9, s:5}, {x:0, y:0, s:3}, {x:0, y:3, s:3}, {x:0, y:6, s:3}, {x:12, y:0, s:3}, {x:12, y:3, s:3}, {x:12, y:6, s:3}];
const subRect_10_14_13_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:4, y:8, s:5}, {x:9, y:8, s:5}, {x:10, y:0, s:4}, {x:10, y:4, s:4}, {x:0, y:5, s:4}, {x:0, y:9, s:4}, {x:4, y:5, s:3}, {x:7, y:5, s:3}];
const subRect_10_26_24_0 = [{x:0, y:0, s:9}, {x:9, y:0, s:9}, {x:0, y:9, s:9}, {x:9, y:9, s:9}, {x:18, y:0, s:8}, {x:18, y:8, s:8}, {x:18, y:16, s:8}, {x:0, y:18, s:6}, {x:6, y:18, s:6}, {x:12, y:18, s:6}];
const subRect_10_12_11_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:8, y:0, s:4}, {x:0, y:4, s:4}, {x:4, y:4, s:4}, {x:8, y:4, s:4}, {x:0, y:8, s:3}, {x:3, y:8, s:3}, {x:6, y:8, s:3}, {x:9, y:8, s:3}];
const subRect_10_07_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:0, s:1}, {x:6, y:1, s:1}, {x:6, y:2, s:1}, {x:6, y:3, s:1}, {x:6, y:4, s:1}, {x:6, y:5, s:1}];
const subRect_10_15_12_0 = [{x:0, y:0, s:8}, {x:8, y:0, s:4}, {x:8, y:4, s:4}, {x:0, y:8, s:4}, {x:4, y:8, s:4}, {x:8, y:8, s:4}, {x:12, y:0, s:3}, {x:12, y:3, s:3}, {x:12, y:6, s:3}, {x:12, y:9, s:3}];
const subRect_10_08_06_0 = [{x:1, y:0, s:2}, {x:3, y:0, s:2}, {x:5, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:2}, {x:1, y:4, s:2}, {x:3, y:4, s:2}, {x:5, y:4, s:2}];
const subRect_10_16_12_0 = [{x:0, y:0, s:6}, {x:6, y:0, s:6}, {x:0, y:6, s:6}, {x:12, y:0, s:4}, {x:12, y:4, s:4}, {x:12, y:8, s:4}, {x:6, y:6, s:3}, {x:9, y:6, s:3}, {x:6, y:9, s:3}, {x:9, y:9, s:3}];
const subRect_10_19_14_0 = [{x:0, y:0, s:7}, {x:0, y:7, s:7}, {x:7, y:0, s:6}, {x:13, y:0, s:6}, {x:7, y:6, s:4}, {x:11, y:6, s:4}, {x:15, y:6, s:4}, {x:7, y:10, s:4}, {x:11, y:10, s:4}, {x:15, y:10, s:4}];
const subRect_10_07_05_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:4, y:3, s:2}, {x:6, y:0, s:1}, {x:6, y:1, s:1}, {x:6, y:2, s:1}, {x:6, y:3, s:1}, {x:6, y:4, s:1}];
const subRect_10_17_12_0 = [{x:0, y:0, s:9}, {x:9, y:0, s:4}, {x:13, y:0, s:4}, {x:9, y:4, s:4}, {x:13, y:4, s:4}, {x:9, y:8, s:4}, {x:13, y:8, s:4}, {x:0, y:9, s:3}, {x:3, y:9, s:3}, {x:6, y:9, s:3}];
const subRect_10_20_14_0 = [{x:5, y:0,s:10}, {x:0, y:0, s:5}, {x:0, y:5, s:5}, {x:15, y:0, s:5}, {x:15, y:5, s:5}, {x:0, y:10, s:4}, {x:4, y:10, s:4}, {x:8, y:10, s:4}, {x:12, y:10, s:4}, {x:16, y:10, s:4}];
const subRect_10_06_04_0 = [{x:2, y:0, s:3}, {x:0, y:0, s:2}, {x:0, y:2, s:2}, {x:5, y:0, s:1}, {x:5, y:1, s:1}, {x:5, y:2, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}];
const subRect_10_10_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:6, y:2, s:2}, {x:8, y:2, s:2}, {x:6, y:4, s:2}, {x:8, y:4, s:2}];
const subRect_10_17_10_0 = [{x:5, y:0, s:6}, {x:0, y:0, s:5}, {x:0, y:5, s:5}, {x:5, y:6, s:4}, {x:9, y:6, s:4}, {x:13, y:6, s:4}, {x:11, y:0, s:3}, {x:14, y:0, s:3}, {x:11, y:3, s:3}, {x:14, y:3, s:3}];
const subRect_10_17_10_1 = [{x:0, y:0, s:6}, {x:11, y:0, s:6}, {x:6, y:0, s:5}, {x:6, y:5, s:5}, {x:0, y:6, s:4}, {x:13, y:6, s:4}, {x:4, y:6, s:2}, {x:4, y:8, s:2}, {x:11, y:6, s:2}, {x:11, y:8, s:2}];
const subRect_10_12_07_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:0, y:4, s:3}, {x:3, y:4, s:3}, {x:6, y:4, s:3}, {x:9, y:4, s:3}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:8, y:2, s:2}, {x:10, y:2, s:2}];
const subRect_10_07_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:0, s:1}, {x:6, y:1, s:1}, {x:6, y:2, s:1}, {x:6, y:3, s:1}];
const subRect_10_06_03_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}];
const subRect_10_08_04_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:2}, {x:6, y:2, s:2}, {x:0, y:3, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}];
const subRect_10_12_06_0 = [{x:0, y:0, s:4}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:6, y:3, s:3}, {x:9, y:3, s:3}, {x:4, y:0, s:2}, {x:4, y:2, s:2}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:4, y:4, s:2}];
const subRect_10_09_04_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:2}, {x:5, y:0, s:2}, {x:7, y:0, s:2}, {x:3, y:2, s:2}, {x:5, y:2, s:2}, {x:7, y:2, s:2}, {x:0, y:3, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}];
const subRect_10_07_03_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:2}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:6, y:2, s:1}];
const subRect_10_14_06_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:8, y:0, s:3}, {x:11, y:0, s:3}, {x:8, y:3, s:3}, {x:11, y:3, s:3}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:4, y:4, s:2}, {x:6, y:4, s:2}];
const subRect_10_19_08_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:10, y:0, s:5}, {x:15, y:0, s:4}, {x:15, y:4, s:4}, {x:0, y:5, s:3}, {x:3, y:5, s:3}, {x:6, y:5, s:3}, {x:9, y:5, s:3}, {x:12, y:5, s:3}];
const subRect_10_12_05_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:4, y:3, s:2}, {x:6, y:3, s:2}, {x:8, y:3, s:2}, {x:10, y:3, s:2}];
const subRect_10_05_02_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:0, y:1, s:1}, {x:1, y:1, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}];
const subRect_10_08_03_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:2}, {x:5, y:0, s:2}, {x:7, y:0, s:1}, {x:7, y:1, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:6, y:2, s:1}, {x:7, y:2, s:1}];
const subRect_10_09_03_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:2}, {x:5, y:0, s:2}, {x:7, y:0, s:2}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:6, y:2, s:1}, {x:7, y:2, s:1}, {x:8, y:2, s:1}];
const subRect_10_08_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}];
const subRect_10_11_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:8, y:1, s:1}, {x:9, y:1, s:1}, {x:10, y:1, s:1}];
const subRect_10_14_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:1}, {x:13, y:0, s:1}, {x:12, y:1, s:1}, {x:13, y:1, s:1}];
const subRect_10_17_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:1}, {x:16, y:1, s:1}];
const subRect_10_10_01_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}];

const layout10 =
[
    {xd:4, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_10_04_04_0},
    {xd:5, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_10_05_05_0},
    {xd:16, yd:15, full:true,  lovely:true,  flipped:true,  w:subRect_10_16_15_0},
    {xd:15, yd:14, full:true,  lovely:true,  flipped:true,  w:subRect_10_15_14_0},
    {xd:14, yd:13, full:true,  lovely:true,  flipped:true,  w:subRect_10_14_13_0},
    {xd:26, yd:24, full:true,  lovely:true,  flipped:true,  w:subRect_10_26_24_0},
    {xd:12, yd:11, full:true,  lovely:true,  flipped:true,  w:subRect_10_12_11_0},
    {xd:7, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_10_07_06_0},
    {xd:15, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_10_15_12_0},
    {xd:8, yd:6, full:false, lovely:true,  flipped:false, w:subRect_10_08_06_0},
    {xd:16, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_10_16_12_0},
    {xd:19, yd:14, full:true,  lovely:true,  flipped:true,  w:subRect_10_19_14_0},
    {xd:7, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_10_07_05_0},
    {xd:17, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_10_17_12_0},
    {xd:20, yd:14, full:true,  lovely:true,  flipped:true,  w:subRect_10_20_14_0},
    {xd:6, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_10_06_04_0},
    {xd:10, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_10_10_06_0},
    {xd:17, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_10_17_10_0},
    {xd:17, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_10_17_10_1},
    {xd:12, yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_10_12_07_0},
    {xd:7, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_10_07_04_0},
    {xd:6, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_10_06_03_0},
    {xd:8, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_10_08_04_0},
    {xd:12, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_10_12_06_0},
    {xd:9, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_10_09_04_0},
    {xd:7, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_10_07_03_0},
    {xd:14, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_10_14_06_0},
    {xd:19, yd:8, full:true,  lovely:true,  flipped:true,  w:subRect_10_19_08_0},
    {xd:12, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_10_12_05_0},
    {xd:5, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_10_05_02_0},
    {xd:8, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_10_08_03_0},
    {xd:9, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_10_09_03_0},
    {xd:8, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_10_08_02_0},
    {xd:11, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_10_11_02_0},
    {xd:14, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_10_14_02_0},
    {xd:17, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_10_17_02_0},
    {xd:10, yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_10_10_01_0}
];

/* 11 Participants               N xd yd #              0             1             2             3             4             5             6             7             8             9            10     */
const subRect_11_05_05_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:2}, {x:0, y:3, s:2}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}, {x:2, y:4, s:1}, {x:3, y:4, s:1}, {x:4, y:4, s:1}];
const subRect_11_06_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:4, y:3, s:2}, {x:0, y:5, s:1}, {x:1, y:5, s:1}, {x:2, y:5, s:1}, {x:3, y:5, s:1}, {x:4, y:5, s:1}, {x:5, y:5, s:1}];
const subRect_11_08_08_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:0, s:2}, {x:6, y:2, s:2}, {x:6, y:4, s:2}, {x:0, y:6, s:2}, {x:2, y:6, s:2}, {x:4, y:6, s:2}, {x:6, y:6, s:2}];
const subRect_11_08_08_1 = [{x:2, y:2, s:4}, {x:1, y:0, s:2}, {x:3, y:0, s:2}, {x:5, y:0, s:2}, {x:0, y:2, s:2}, {x:0, y:4, s:2}, {x:6, y:2, s:2}, {x:6, y:4, s:2}, {x:1, y:6, s:2}, {x:3, y:6, s:2}, {x:5, y:6, s:2}];
const subRect_11_09_09_0 = [{x:0, y:0, s:4}, {x:6, y:0, s:3}, {x:6, y:3, s:3}, {x:0, y:6, s:3}, {x:3, y:6, s:3}, {x:6, y:6, s:3}, {x:4, y:0, s:2}, {x:4, y:2, s:2}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:4, y:4, s:2}];
const subRect_11_10_10_0 = [{x:0, y:0, s:4}, {x:6, y:0, s:4}, {x:0, y:6, s:4}, {x:4, y:4, s:3}, {x:7, y:4, s:3}, {x:4, y:7, s:3}, {x:7, y:7, s:3}, {x:4, y:0, s:2}, {x:4, y:2, s:2}, {x:0, y:4, s:2}, {x:2, y:4, s:2}];
const subRect_11_17_15_0 = [{x:0, y:0, s:6}, {x:6, y:0, s:6}, {x:0, y:6, s:6}, {x:6, y:6, s:6}, {x:12, y:0, s:5}, {x:12, y:5, s:5}, {x:12, y:10, s:5}, {x:0, y:12, s:3}, {x:3, y:12, s:3}, {x:6, y:12, s:3}, {x:9, y:12, s:3}];
const subRect_11_15_13_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:10, y:0, s:5}, {x:0, y:5, s:5}, {x:5, y:5, s:5}, {x:10, y:5, s:5}, {x:0, y:10, s:3}, {x:3, y:10, s:3}, {x:6, y:10, s:3}, {x:9, y:10, s:3}, {x:12, y:10, s:3}];
const subRect_11_14_12_0 = [{x:0, y:3, s:6}, {x:6, y:0, s:4}, {x:10, y:0, s:4}, {x:6, y:4, s:4}, {x:10, y:4, s:4}, {x:6, y:8, s:4}, {x:10, y:8, s:4}, {x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:0, y:9, s:3}, {x:3, y:9, s:3}];
const subRect_11_25_21_0 = [{x:0, y:6, s:9}, {x:9, y:6, s:9}, {x:18, y:0, s:7}, {x:18, y:7, s:7}, {x:18, y:14, s:7}, {x:0, y:0, s:6}, {x:6, y:0, s:6}, {x:12, y:0, s:6}, {x:0, y:15, s:6}, {x:6, y:15, s:6}, {x:12, y:15, s:6}];
const subRect_11_06_05_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:2, y:3, s:2}, {x:0, y:3, s:1}, {x:1, y:3, s:1}, {x:0, y:4, s:1}, {x:1, y:4, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}, {x:4, y:4, s:1}, {x:5, y:4, s:1}];
const subRect_11_12_10_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:8, y:0, s:4}, {x:0, y:4, s:3}, {x:3, y:4, s:3}, {x:6, y:4, s:3}, {x:9, y:4, s:3}, {x:0, y:7, s:3}, {x:3, y:7, s:3}, {x:6, y:7, s:3}, {x:9, y:7, s:3}];
const subRect_11_05_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:0, y:2, s:2}, {x:4, y:0, s:1}, {x:4, y:1, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}];
const subRect_11_08_06_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:1, y:2, s:2}, {x:3, y:2, s:2}, {x:5, y:2, s:2}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:4, y:4, s:2}, {x:6, y:4, s:2}];
const subRect_11_09_06_0 = [{x:0, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:0, s:2}, {x:5, y:0, s:2}, {x:7, y:0, s:2}, {x:3, y:2, s:2}, {x:5, y:2, s:2}, {x:7, y:2, s:2}, {x:3, y:4, s:2}, {x:5, y:4, s:2}, {x:7, y:4, s:2}];
const subRect_11_19_12_0 = [{x:0, y:0, s:6}, {x:6, y:0, s:6}, {x:0, y:6, s:6}, {x:6, y:6, s:6}, {x:12, y:0, s:4}, {x:12, y:4, s:4}, {x:12, y:8, s:4}, {x:16, y:0, s:3}, {x:16, y:3, s:3}, {x:16, y:6, s:3}, {x:16, y:9, s:3}];
const subRect_11_14_08_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:0, y:4, s:4}, {x:4, y:4, s:4}, {x:8, y:0, s:3}, {x:11, y:0, s:3}, {x:8, y:5, s:3}, {x:11, y:5, s:3}, {x:8, y:3, s:2}, {x:10, y:3, s:2}, {x:12, y:3, s:2}];
const subRect_11_11_06_0 = [{x:3, y:0, s:4}, {x:0, y:0, s:3}, {x:0, y:3, s:3}, {x:7, y:0, s:2}, {x:9, y:0, s:2}, {x:7, y:2, s:2}, {x:9, y:2, s:2}, {x:3, y:4, s:2}, {x:5, y:4, s:2}, {x:7, y:4, s:2}, {x:9, y:4, s:2}];
const subRect_11_28_15_0 = [{x:0, y:0, s:9}, {x:9, y:0, s:9}, {x:0, y:9, s:6}, {x:6, y:9, s:6}, {x:12, y:9, s:6}, {x:18, y:0, s:5}, {x:23, y:0, s:5}, {x:18, y:5, s:5}, {x:23, y:5, s:5}, {x:18, y:10, s:5}, {x:23, y:10, s:5}];
const subRect_11_08_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:1}, {x:7, y:2, s:1}, {x:6, y:3, s:1}, {x:7, y:3, s:1}];
const subRect_11_13_06_0 = [{x:3, y:0, s:4}, {x:7, y:0, s:4}, {x:0, y:0, s:3}, {x:0, y:3, s:3}, {x:11, y:0, s:2}, {x:11, y:2, s:2}, {x:3, y:4, s:2}, {x:5, y:4, s:2}, {x:7, y:4, s:2}, {x:9, y:4, s:2}, {x:11, y:4, s:2}];
const subRect_11_14_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:3, s:3}, {x:9, y:3, s:3}, {x:12, y:0, s:2}, {x:12, y:2, s:2}, {x:12, y:4, s:2}];
const subRect_11_15_06_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:8, y:0, s:4}, {x:12, y:0, s:3}, {x:12, y:3, s:3}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:4, y:4, s:2}, {x:6, y:4, s:2}, {x:8, y:4, s:2}, {x:10, y:4, s:2}];
const subRect_11_28_11_0 = [{x:0, y:0, s:7}, {x:7, y:0, s:7}, {x:14, y:0, s:7}, {x:21, y:0, s:7}, {x:0, y:7, s:4}, {x:4, y:7, s:4}, {x:8, y:7, s:4}, {x:12, y:7, s:4}, {x:16, y:7, s:4}, {x:20, y:7, s:4}, {x:24, y:7, s:4}];
const subRect_11_16_06_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:3}, {x:7, y:0, s:3}, {x:10, y:0, s:3}, {x:13, y:0, s:3}, {x:4, y:3, s:3}, {x:7, y:3, s:3}, {x:10, y:3, s:3}, {x:13, y:3, s:3}, {x:0, y:4, s:2}, {x:2, y:4, s:2}];
const subRect_11_16_06_1 = [{x:0, y:0, s:6}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:6, y:3, s:3}, {x:9, y:3, s:3}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:12, y:2, s:2}, {x:14, y:2, s:2}, {x:12, y:4, s:2}, {x:14, y:4, s:2}];
const subRect_11_27_10_0 = [{x:0, y:0, s:6}, {x:6, y:0, s:6}, {x:12, y:0, s:5}, {x:17, y:0, s:5}, {x:22, y:0, s:5}, {x:12, y:5, s:5}, {x:17, y:5, s:5}, {x:22, y:5, s:5}, {x:0, y:6, s:4}, {x:4, y:6, s:4}, {x:8, y:6, s:4}];
const subRect_11_30_11_0 = [{x:0, y:0, s:6}, {x:6, y:0, s:6}, {x:12, y:0, s:6}, {x:18, y:0, s:6}, {x:24, y:0, s:6}, {x:0, y:6, s:5}, {x:5, y:6, s:5}, {x:10, y:6, s:5}, {x:15, y:6, s:5}, {x:20, y:6, s:5}, {x:25, y:6, s:5}];
const subRect_11_09_03_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}, {x:8, y:1, s:1}, {x:6, y:2, s:1}, {x:7, y:2, s:1}, {x:8, y:2, s:1}];
const subRect_11_07_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}];
const subRect_11_10_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}, {x:8, y:1, s:1}, {x:9, y:1, s:1}];
const subRect_11_13_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:1}, {x:11, y:0, s:1}, {x:12, y:0, s:1}, {x:10, y:1, s:1}, {x:11, y:1, s:1}, {x:12, y:1, s:1}];
const subRect_11_16_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:1}, {x:15, y:0, s:1}, {x:14, y:1, s:1}, {x:15, y:1, s:1}];
const subRect_11_19_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:2}, {x:18, y:0, s:1}, {x:18, y:1, s:1}];
const subRect_11_11_01_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}];

const layout11 =
[
    {xd:5, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_11_05_05_0},
    {xd:6, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_11_06_06_0},
    {xd:8, yd:8, full:true,  lovely:true,  flipped:true,  w:subRect_11_08_08_0},
    {xd:8, yd:8, full:false, lovely:true,  flipped:true,  w:subRect_11_08_08_1},
    {xd:9, yd:9, full:true,  lovely:true,  flipped:true,  w:subRect_11_09_09_0},
    {xd:10, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_11_10_10_0},
    {xd:17, yd:15, full:true,  lovely:true,  flipped:true,  w:subRect_11_17_15_0},
    {xd:15, yd:13, full:true,  lovely:true,  flipped:true,  w:subRect_11_15_13_0},
    {xd:14, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_11_14_12_0},
    {xd:25, yd:21, full:true,  lovely:true,  flipped:true,  w:subRect_11_25_21_0},
    {xd:6, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_11_06_05_0},
    {xd:12, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_11_12_10_0},
    {xd:5, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_11_05_04_0},
    {xd:8, yd:6, full:false, lovely:true,  flipped:false, w:subRect_11_08_06_0},
    {xd:9, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_11_09_06_0},
    {xd:19, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_11_19_12_0},
    {xd:14, yd:8, full:true,  lovely:true,  flipped:true,  w:subRect_11_14_08_0},
    {xd:11, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_11_11_06_0},
    {xd:28, yd:15, full:true,  lovely:true,  flipped:true,  w:subRect_11_28_15_0},
    {xd:8, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_11_08_04_0},
    {xd:13, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_11_13_06_0},
    {xd:14, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_11_14_06_0},
    {xd:15, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_11_15_06_0},
    {xd:28, yd:11, full:true,  lovely:true,  flipped:true,  w:subRect_11_28_11_0},
    {xd:16, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_11_16_06_0},
    {xd:16, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_11_16_06_1},
    {xd:27, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_11_27_10_0},
    {xd:30, yd:11, full:true,  lovely:true,  flipped:true,  w:subRect_11_30_11_0},
    {xd:9, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_11_09_03_0},
    {xd:7, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_11_07_02_0},
    {xd:10, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_11_10_02_0},
    {xd:13, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_11_13_02_0},
    {xd:16, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_11_16_02_0},
    {xd:19, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_11_19_02_0},
    {xd:11, yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_11_11_01_0}
];

/* 12 Participants               N xd yd #              0             1             2             3             4             5             6             7             8             9            10            11     */
const subRect_12_04_04_0 = [{x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:0, y:1, s:1}, {x:1, y:1, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}];
const subRect_12_06_06_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:0, y:2, s:2}, {x:4, y:2, s:2}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:4, y:4, s:2}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}];
const subRect_12_06_06_1 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}, {x:3, y:4, s:1}, {x:4, y:4, s:1}, {x:5, y:4, s:1}, {x:3, y:5, s:1}, {x:4, y:5, s:1}, {x:5, y:5, s:1}];
const subRect_12_07_07_0 = [{x:0, y:0, s:3}, {x:4, y:4, s:3}, {x:3, y:0, s:2}, {x:5, y:0, s:2}, {x:5, y:2, s:2}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:0, y:5, s:2}, {x:2, y:5, s:2}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:4, y:3, s:1}];
const subRect_12_21_20_0 = [{x:0, y:0, s:8}, {x:8, y:0, s:8}, {x:0, y:8, s:8}, {x:8, y:8, s:8}, {x:16, y:0, s:5}, {x:16, y:5, s:5}, {x:16, y:10, s:5}, {x:16, y:15, s:5}, {x:0, y:16, s:4}, {x:4, y:16, s:4}, {x:8, y:16, s:4}, {x:12, y:16, s:4}];
const subRect_12_15_14_0 = [{x:0, y:5, s:6}, {x:6, y:5, s:6}, {x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:10, y:0, s:5}, {x:12, y:5, s:3}, {x:12, y:8, s:3}, {x:0, y:11, s:3}, {x:3, y:11, s:3}, {x:6, y:11, s:3}, {x:9, y:11, s:3}, {x:12, y:11, s:3}];
const subRect_12_13_12_0 = [{x:4, y:3, s:6}, {x:0, y:0, s:4}, {x:0, y:4, s:4}, {x:0, y:8, s:4}, {x:4, y:0, s:3}, {x:7, y:0, s:3}, {x:10, y:0, s:3}, {x:10, y:3, s:3}, {x:10, y:6, s:3}, {x:4, y:9, s:3}, {x:7, y:9, s:3}, {x:10, y:9, s:3}];
const subRect_12_31_28_0 = [{x:0, y:8,s:12}, {x:12, y:8,s:12}, {x:0, y:0, s:8}, {x:8, y:0, s:8}, {x:16, y:0, s:8}, {x:0, y:20, s:8}, {x:8, y:20, s:8}, {x:16, y:20, s:8}, {x:24, y:0, s:7}, {x:24, y:7, s:7}, {x:24, y:14, s:7}, {x:24, y:21, s:7}];
const subRect_12_10_09_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:0, y:5, s:2}, {x:2, y:5, s:2}, {x:4, y:5, s:2}, {x:6, y:5, s:2}, {x:8, y:5, s:2}, {x:0, y:7, s:2}, {x:2, y:7, s:2}, {x:4, y:7, s:2}, {x:6, y:7, s:2}, {x:8, y:7, s:2}];
const subRect_12_20_18_0 = [{x:0, y:0, s:8}, {x:12, y:0, s:8}, {x:0, y:8, s:5}, {x:5, y:8, s:5}, {x:10, y:8, s:5}, {x:15, y:8, s:5}, {x:0, y:13, s:5}, {x:5, y:13, s:5}, {x:10, y:13, s:5}, {x:15, y:13, s:5}, {x:8, y:0, s:4}, {x:8, y:4, s:4}];
const subRect_12_08_07_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:2, y:4, s:3}, {x:5, y:4, s:3}, {x:6, y:0, s:2}, {x:6, y:2, s:2}, {x:0, y:3, s:2}, {x:0, y:5, s:2}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}];
const subRect_12_06_05_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:0, y:4, s:1}, {x:1, y:4, s:1}, {x:2, y:4, s:1}, {x:3, y:4, s:1}, {x:4, y:4, s:1}, {x:5, y:4, s:1}];
const subRect_12_05_04_0 = [{x:1, y:0, s:3}, {x:0, y:0, s:1}, {x:0, y:1, s:1}, {x:0, y:2, s:1}, {x:4, y:0, s:1}, {x:4, y:1, s:1}, {x:4, y:2, s:1}, {x:0, y:3, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}];
const subRect_12_10_08_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:3}, {x:7, y:0, s:3}, {x:4, y:3, s:3}, {x:7, y:3, s:3}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:0, y:6, s:2}, {x:2, y:6, s:2}, {x:4, y:6, s:2}, {x:6, y:6, s:2}, {x:8, y:6, s:2}];
const subRect_12_04_03_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:0, y:1, s:1}, {x:1, y:1, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}];
const subRect_12_17_12_0 = [{x:0, y:0, s:6}, {x:0, y:6, s:6}, {x:6, y:0, s:4}, {x:10, y:0, s:4}, {x:6, y:4, s:4}, {x:10, y:4, s:4}, {x:6, y:8, s:4}, {x:10, y:8, s:4}, {x:14, y:0, s:3}, {x:14, y:3, s:3}, {x:14, y:6, s:3}, {x:14, y:9, s:3}];
const subRect_12_06_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}];
const subRect_12_35_22_0 = [{x:0, y:0,s:11}, {x:0, y:11,s:11}, {x:11, y:0, s:8}, {x:19, y:0, s:8}, {x:27, y:0, s:8}, {x:11, y:14, s:8}, {x:19, y:14, s:8}, {x:27, y:14, s:8}, {x:11, y:8, s:6}, {x:17, y:8, s:6}, {x:23, y:8, s:6}, {x:29, y:8, s:6}];
const subRect_12_08_05_0 = [{x:1, y:0, s:3}, {x:4, y:0, s:3}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:4, y:3, s:2}, {x:6, y:3, s:2}, {x:0, y:0, s:1}, {x:0, y:1, s:1}, {x:0, y:2, s:1}, {x:7, y:0, s:1}, {x:7, y:1, s:1}, {x:7, y:2, s:1}];
const subRect_12_05_03_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}];
const subRect_12_07_04_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:1}, {x:6, y:1, s:1}, {x:6, y:2, s:1}, {x:0, y:3, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}, {x:6, y:3, s:1}];
const subRect_12_18_10_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:0, y:5, s:5}, {x:5, y:5, s:5}, {x:10, y:0, s:4}, {x:14, y:0, s:4}, {x:10, y:6, s:4}, {x:14, y:6, s:4}, {x:10, y:4, s:2}, {x:12, y:4, s:2}, {x:14, y:4, s:2}, {x:16, y:4, s:2}];
const subRect_12_22_12_0 = [{x:0, y:0, s:6}, {x:6, y:0, s:6}, {x:12, y:0, s:6}, {x:0, y:6, s:6}, {x:6, y:6, s:6}, {x:18, y:0, s:4}, {x:18, y:4, s:4}, {x:18, y:8, s:4}, {x:12, y:6, s:3}, {x:15, y:6, s:3}, {x:12, y:9, s:3}, {x:15, y:9, s:3}];
const subRect_12_26_14_0 = [{x:0, y:0, s:7}, {x:7, y:0, s:7}, {x:0, y:7, s:7}, {x:7, y:7, s:7}, {x:14, y:4, s:6}, {x:20, y:4, s:6}, {x:14, y:0, s:4}, {x:18, y:0, s:4}, {x:22, y:0, s:4}, {x:14, y:10, s:4}, {x:18, y:10, s:4}, {x:22, y:10, s:4}];
const subRect_12_06_03_0 = [{x:1, y:0, s:2}, {x:3, y:0, s:2}, {x:0, y:0, s:1}, {x:0, y:1, s:1}, {x:5, y:0, s:1}, {x:5, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}];
const subRect_12_13_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:3, s:3}, {x:9, y:0, s:2}, {x:11, y:0, s:2}, {x:9, y:2, s:2}, {x:11, y:2, s:2}, {x:9, y:4, s:2}, {x:11, y:4, s:2}];
const subRect_12_33_15_0 = [{x:0, y:0, s:8}, {x:8, y:0, s:8}, {x:16, y:0, s:8}, {x:0, y:8, s:7}, {x:7, y:8, s:7}, {x:14, y:8, s:7}, {x:21, y:8, s:7}, {x:28, y:0, s:5}, {x:28, y:5, s:5}, {x:28, y:10, s:5}, {x:24, y:0, s:4}, {x:24, y:4, s:4}];
const subRect_12_40_18_0 = [{x:5, y:0,s:10}, {x:15, y:0,s:10}, {x:25, y:0,s:10}, {x:0, y:10, s:8}, {x:8, y:10, s:8}, {x:16, y:10, s:8}, {x:24, y:10, s:8}, {x:32, y:10, s:8}, {x:0, y:0, s:5}, {x:0, y:5, s:5}, {x:35, y:0, s:5}, {x:35, y:5, s:5}];
const subRect_12_09_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:2}, {x:8, y:0, s:1}, {x:8, y:1, s:1}, {x:8, y:2, s:1}, {x:8, y:3, s:1}];
const subRect_12_09_04_1 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:0, y:3, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}, {x:6, y:3, s:1}, {x:7, y:3, s:1}, {x:8, y:3, s:1}];
const subRect_12_07_03_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:1}, {x:6, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:6, y:2, s:1}];
const subRect_12_23_09_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:10, y:0, s:5}, {x:15, y:0, s:5}, {x:0, y:5, s:4}, {x:4, y:5, s:4}, {x:8, y:5, s:4}, {x:12, y:5, s:4}, {x:16, y:5, s:4}, {x:20, y:0, s:3}, {x:20, y:3, s:3}, {x:20, y:6, s:3}];
const subRect_12_18_07_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:8, y:0, s:4}, {x:12, y:0, s:4}, {x:0, y:4, s:3}, {x:3, y:4, s:3}, {x:6, y:4, s:3}, {x:9, y:4, s:3}, {x:12, y:4, s:3}, {x:15, y:4, s:3}, {x:16, y:0, s:2}, {x:16, y:2, s:2}];
const subRect_12_08_03_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:6, y:2, s:1}, {x:7, y:2, s:1}];
const subRect_12_17_06_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:8, y:0, s:3}, {x:11, y:0, s:3}, {x:14, y:0, s:3}, {x:8, y:3, s:3}, {x:11, y:3, s:3}, {x:14, y:3, s:3}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:4, y:4, s:2}, {x:6, y:4, s:2}];
const subRect_12_23_08_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:10, y:0, s:5}, {x:15, y:0, s:4}, {x:19, y:0, s:4}, {x:15, y:4, s:4}, {x:19, y:4, s:4}, {x:0, y:5, s:3}, {x:3, y:5, s:3}, {x:6, y:5, s:3}, {x:9, y:5, s:3}, {x:12, y:5, s:3}];
const subRect_12_26_09_0 = [{x:0, y:0, s:6}, {x:6, y:0, s:5}, {x:11, y:0, s:5}, {x:16, y:0, s:5}, {x:21, y:0, s:5}, {x:6, y:5, s:4}, {x:10, y:5, s:4}, {x:14, y:5, s:4}, {x:18, y:5, s:4}, {x:22, y:5, s:4}, {x:0, y:6, s:3}, {x:3, y:6, s:3}];
const subRect_12_29_10_0 = [{x:0, y:0, s:6}, {x:6, y:0, s:6}, {x:12, y:0, s:6}, {x:18, y:0, s:6}, {x:24, y:0, s:5}, {x:24, y:5, s:5}, {x:0, y:6, s:4}, {x:4, y:6, s:4}, {x:8, y:6, s:4}, {x:12, y:6, s:4}, {x:16, y:6, s:4}, {x:20, y:6, s:4}];
const subRect_12_35_12_0 = [{x:0, y:0, s:7}, {x:7, y:0, s:7}, {x:14, y:0, s:7}, {x:21, y:0, s:7}, {x:28, y:0, s:7}, {x:0, y:7, s:5}, {x:5, y:7, s:5}, {x:10, y:7, s:5}, {x:15, y:7, s:5}, {x:20, y:7, s:5}, {x:25, y:7, s:5}, {x:30, y:7, s:5}];
const subRect_12_06_02_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:0, y:1, s:1}, {x:1, y:1, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}];
const subRect_12_09_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}, {x:8, y:1, s:1}];
const subRect_12_12_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:11, y:0, s:1}, {x:8, y:1, s:1}, {x:9, y:1, s:1}, {x:10, y:1, s:1}, {x:11, y:1, s:1}];
const subRect_12_15_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:1}, {x:13, y:0, s:1}, {x:14, y:0, s:1}, {x:12, y:1, s:1}, {x:13, y:1, s:1}, {x:14, y:1, s:1}];
const subRect_12_18_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:1}, {x:17, y:0, s:1}, {x:16, y:1, s:1}, {x:17, y:1, s:1}];
const subRect_12_21_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:2}, {x:18, y:0, s:2}, {x:20, y:0, s:1}, {x:20, y:1, s:1}];
const subRect_12_12_01_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:11, y:0, s:1}];

const layout12 =
[
    {xd:4, yd:4, full:false, lovely:true,  flipped:true,  w:subRect_12_04_04_0},
    {xd:6, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_12_06_06_0},
    {xd:6, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_12_06_06_1},
    {xd:7, yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_12_07_07_0},
    {xd:21, yd:20, full:true,  lovely:true,  flipped:true,  w:subRect_12_21_20_0},
    {xd:15, yd:14, full:true,  lovely:true,  flipped:true,  w:subRect_12_15_14_0},
    {xd:13, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_12_13_12_0},
    {xd:31, yd:28, full:true,  lovely:true,  flipped:true,  w:subRect_12_31_28_0},
    {xd:10, yd:9, full:true,  lovely:true,  flipped:true,  w:subRect_12_10_09_0},
    {xd:20, yd:18, full:true,  lovely:true,  flipped:true,  w:subRect_12_20_18_0},
    {xd:8, yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_12_08_07_0},
    {xd:6, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_12_06_05_0},
    {xd:5, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_12_05_04_0},
    {xd:10, yd:8, full:true,  lovely:true,  flipped:true,  w:subRect_12_10_08_0},
    {xd:4, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_12_04_03_0},
    {xd:17, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_12_17_12_0},
    {xd:6, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_12_06_04_0},
    {xd:35, yd:22, full:true,  lovely:true,  flipped:true,  w:subRect_12_35_22_0},
    {xd:8, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_12_08_05_0},
    {xd:5, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_12_05_03_0},
    {xd:7, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_12_07_04_0},
    {xd:18, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_12_18_10_0},
    {xd:22, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_12_22_12_0},
    {xd:26, yd:14, full:true,  lovely:true,  flipped:true,  w:subRect_12_26_14_0},
    {xd:6, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_12_06_03_0},
    {xd:13, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_12_13_06_0},
    {xd:33, yd:15, full:true,  lovely:true,  flipped:true,  w:subRect_12_33_15_0},
    {xd:40, yd:18, full:true,  lovely:true,  flipped:true,  w:subRect_12_40_18_0},
    {xd:9, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_12_09_04_0},
    {xd:9, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_12_09_04_1},
    {xd:7, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_12_07_03_0},
    {xd:23, yd:9, full:true,  lovely:true,  flipped:true,  w:subRect_12_23_09_0},
    {xd:18, yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_12_18_07_0},
    {xd:8, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_12_08_03_0},
    {xd:17, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_12_17_06_0},
    {xd:23, yd:8, full:true,  lovely:true,  flipped:true,  w:subRect_12_23_08_0},
    {xd:26, yd:9, full:true,  lovely:true,  flipped:true,  w:subRect_12_26_09_0},
    {xd:29, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_12_29_10_0},
    {xd:35, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_12_35_12_0},
    {xd:6, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_12_06_02_0},
    {xd:9, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_12_09_02_0},
    {xd:12, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_12_12_02_0},
    {xd:15, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_12_15_02_0},
    {xd:18, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_12_18_02_0},
    {xd:21, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_12_21_02_0},
    {xd:12, yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_12_12_01_0}
];

/* 13 Participants               N xd yd #              0             1             2             3             4             5             6             7             8             9            10            11            12     */
const subRect_13_04_04_0 = [{x:1, y:1, s:2}, {x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:0, y:1, s:1}, {x:0, y:2, s:1}, {x:3, y:1, s:1}, {x:3, y:2, s:1}, {x:0, y:3, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}];
const subRect_13_05_05_0 = [{x:0, y:0, s:2}, {x:3, y:0, s:2}, {x:0, y:3, s:2}, {x:3, y:3, s:2}, {x:2, y:0, s:1}, {x:2, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:2, y:3, s:1}, {x:2, y:4, s:1}];
const subRect_13_15_12_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:8, y:0, s:4}, {x:0, y:4, s:4}, {x:4, y:4, s:4}, {x:8, y:4, s:4}, {x:0, y:8, s:4}, {x:4, y:8, s:4}, {x:8, y:8, s:4}, {x:12, y:0, s:3}, {x:12, y:3, s:3}, {x:12, y:6, s:3}, {x:12, y:9, s:3}];
const subRect_13_12_09_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:8, y:0, s:4}, {x:0, y:4, s:3}, {x:3, y:4, s:3}, {x:6, y:4, s:3}, {x:9, y:4, s:3}, {x:0, y:7, s:2}, {x:2, y:7, s:2}, {x:4, y:7, s:2}, {x:6, y:7, s:2}, {x:8, y:7, s:2}, {x:10, y:7, s:2}];
const subRect_13_16_12_0 = [{x:0, y:0, s:6}, {x:0, y:6, s:6}, {x:6, y:0, s:4}, {x:6, y:4, s:4}, {x:6, y:8, s:4}, {x:10, y:0, s:3}, {x:13, y:0, s:3}, {x:10, y:3, s:3}, {x:13, y:3, s:3}, {x:10, y:6, s:3}, {x:13, y:6, s:3}, {x:10, y:9, s:3}, {x:13, y:9, s:3}];
const subRect_13_15_11_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:10, y:0, s:5}, {x:0, y:5, s:3}, {x:3, y:5, s:3}, {x:6, y:5, s:3}, {x:9, y:5, s:3}, {x:12, y:5, s:3}, {x:0, y:8, s:3}, {x:3, y:8, s:3}, {x:6, y:8, s:3}, {x:9, y:8, s:3}, {x:12, y:8, s:3}];
const subRect_13_20_14_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:10, y:0, s:5}, {x:15, y:0, s:5}, {x:0, y:5, s:5}, {x:5, y:5, s:5}, {x:10, y:5, s:5}, {x:15, y:5, s:5}, {x:0, y:10, s:4}, {x:4, y:10, s:4}, {x:8, y:10, s:4}, {x:12, y:10, s:4}, {x:16, y:10, s:4}];
const subRect_13_10_06_0 = [{x:1, y:0, s:2}, {x:3, y:0, s:2}, {x:5, y:0, s:2}, {x:7, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:2}, {x:8, y:2, s:2}, {x:1, y:4, s:2}, {x:3, y:4, s:2}, {x:5, y:4, s:2}, {x:7, y:4, s:2}];
const subRect_13_12_07_0 = [{x:4, y:0, s:4}, {x:0, y:4, s:3}, {x:3, y:4, s:3}, {x:6, y:4, s:3}, {x:9, y:4, s:3}, {x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:8, y:2, s:2}, {x:10, y:2, s:2}];
const subRect_13_07_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:6, y:0, s:1}, {x:6, y:1, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:6, y:2, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}, {x:6, y:3, s:1}];
const subRect_13_12_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:6, y:2, s:2}, {x:8, y:2, s:2}, {x:10, y:2, s:2}, {x:6, y:4, s:2}, {x:8, y:4, s:2}, {x:10, y:4, s:2}];
const subRect_13_07_03_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:6, y:2, s:1}];
const subRect_13_10_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:2}, {x:8, y:2, s:1}, {x:9, y:2, s:1}, {x:8, y:3, s:1}, {x:9, y:3, s:1}];
const subRect_13_17_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:12, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:3, s:3}, {x:9, y:3, s:3}, {x:12, y:3, s:3}, {x:15, y:0, s:2}, {x:15, y:2, s:2}, {x:15, y:4, s:2}];
const subRect_13_40_13_0 = [{x:0, y:0, s:8}, {x:8, y:0, s:8}, {x:16, y:0, s:8}, {x:24, y:0, s:8}, {x:32, y:0, s:8}, {x:0, y:8, s:5}, {x:5, y:8, s:5}, {x:10, y:8, s:5}, {x:15, y:8, s:5}, {x:20, y:8, s:5}, {x:25, y:8, s:5}, {x:30, y:8, s:5}, {x:35, y:8, s:5}];
const subRect_13_42_13_0 = [{x:0, y:0, s:7}, {x:7, y:0, s:7}, {x:14, y:0, s:7}, {x:21, y:0, s:7}, {x:28, y:0, s:7}, {x:35, y:0, s:7}, {x:0, y:7, s:6}, {x:6, y:7, s:6}, {x:12, y:7, s:6}, {x:18, y:7, s:6}, {x:24, y:7, s:6}, {x:30, y:7, s:6}, {x:36, y:7, s:6}];
const subRect_13_08_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}];
const subRect_13_11_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}, {x:8, y:1, s:1}, {x:9, y:1, s:1}, {x:10, y:1, s:1}];
const subRect_13_14_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:1}, {x:11, y:0, s:1}, {x:12, y:0, s:1}, {x:13, y:0, s:1}, {x:10, y:1, s:1}, {x:11, y:1, s:1}, {x:12, y:1, s:1}, {x:13, y:1, s:1}];
const subRect_13_17_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:1}, {x:15, y:0, s:1}, {x:16, y:0, s:1}, {x:14, y:1, s:1}, {x:15, y:1, s:1}, {x:16, y:1, s:1}];
const subRect_13_20_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:2}, {x:18, y:0, s:1}, {x:19, y:0, s:1}, {x:18, y:1, s:1}, {x:19, y:1, s:1}];
const subRect_13_23_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:2}, {x:18, y:0, s:2}, {x:20, y:0, s:2}, {x:22, y:0, s:1}, {x:22, y:1, s:1}];
const subRect_13_13_01_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:11, y:0, s:1}, {x:12, y:0, s:1}];

const layout13 =
[
    {xd:4, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_13_04_04_0},
    {xd:5, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_13_05_05_0},
    {xd:15, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_13_15_12_0},
    {xd:12, yd:9, full:true,  lovely:true,  flipped:true,  w:subRect_13_12_09_0},
    {xd:16, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_13_16_12_0},
    {xd:15, yd:11, full:true,  lovely:true,  flipped:true,  w:subRect_13_15_11_0},
    {xd:20, yd:14, full:true,  lovely:true,  flipped:true,  w:subRect_13_20_14_0},
    {xd:10, yd:6, full:false, lovely:true,  flipped:false, w:subRect_13_10_06_0},
    {xd:12, yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_13_12_07_0},
    {xd:7, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_13_07_04_0},
    {xd:12, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_13_12_06_0},
    {xd:7, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_13_07_03_0},
    {xd:10, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_13_10_04_0},
    {xd:17, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_13_17_06_0},
    {xd:40, yd:13, full:true,  lovely:true,  flipped:true,  w:subRect_13_40_13_0},
    {xd:42, yd:13, full:true,  lovely:true,  flipped:true,  w:subRect_13_42_13_0},
    {xd:8, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_13_08_02_0},
    {xd:11, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_13_11_02_0},
    {xd:14, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_13_14_02_0},
    {xd:17, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_13_17_02_0},
    {xd:20, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_13_20_02_0},
    {xd:23, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_13_23_02_0},
    {xd:13, yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_13_13_01_0}
];

/* 14 Participants               N xd yd #              0             1             2             3             4             5             6             7             8             9            10            11            12            13     */
const subRect_14_08_08_0 = [{x:1, y:0, s:2}, {x:3, y:0, s:2}, {x:5, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:2}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:4, y:4, s:2}, {x:6, y:4, s:2}, {x:1, y:6, s:2}, {x:3, y:6, s:2}, {x:5, y:6, s:2}];
const subRect_14_08_08_1 = [{x:0, y:0, s:3}, {x:5, y:0, s:3}, {x:0, y:5, s:3}, {x:5, y:5, s:3}, {x:3, y:1, s:2}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:4, y:3, s:2}, {x:6, y:3, s:2}, {x:3, y:5, s:2}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:3, y:7, s:1}, {x:4, y:7, s:1}];
const subRect_14_09_09_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:0, y:3, s:3}, {x:0, y:6, s:3}, {x:3, y:3, s:2}, {x:5, y:3, s:2}, {x:7, y:3, s:2}, {x:3, y:5, s:2}, {x:5, y:5, s:2}, {x:7, y:5, s:2}, {x:3, y:7, s:2}, {x:5, y:7, s:2}, {x:7, y:7, s:2}];
const subRect_14_10_10_0 = [{x:0, y:0, s:4}, {x:0, y:4, s:4}, {x:4, y:0, s:3}, {x:7, y:0, s:3}, {x:4, y:3, s:3}, {x:7, y:3, s:3}, {x:4, y:6, s:2}, {x:6, y:6, s:2}, {x:8, y:6, s:2}, {x:0, y:8, s:2}, {x:2, y:8, s:2}, {x:4, y:8, s:2}, {x:6, y:8, s:2}, {x:8, y:8, s:2}];
const subRect_14_10_10_1 = [{x:2, y:2, s:6}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:0, y:2, s:2}, {x:0, y:4, s:2}, {x:0, y:6, s:2}, {x:8, y:2, s:2}, {x:8, y:4, s:2}, {x:8, y:6, s:2}, {x:1, y:8, s:2}, {x:3, y:8, s:2}, {x:5, y:8, s:2}, {x:7, y:8, s:2}];
const subRect_14_12_12_0 = [{x:3, y:0, s:6}, {x:0, y:6, s:4}, {x:4, y:6, s:4}, {x:8, y:6, s:4}, {x:0, y:0, s:3}, {x:0, y:3, s:3}, {x:9, y:0, s:3}, {x:9, y:3, s:3}, {x:0, y:10, s:2}, {x:2, y:10, s:2}, {x:4, y:10, s:2}, {x:6, y:10, s:2}, {x:8, y:10, s:2}, {x:10, y:10, s:2}];
const subRect_14_20_20_0 = [{x:0, y:0, s:8}, {x:8, y:0, s:8}, {x:0, y:8, s:8}, {x:8, y:8, s:6}, {x:14, y:8, s:6}, {x:8, y:14, s:6}, {x:16, y:0, s:4}, {x:16, y:4, s:4}, {x:0, y:16, s:4}, {x:4, y:16, s:4}, {x:14, y:14, s:3}, {x:17, y:14, s:3}, {x:14, y:17, s:3}, {x:17, y:17, s:3}];
const subRect_14_30_26_0 = [{x:0, y:0,s:10}, {x:10, y:0,s:10}, {x:20, y:0,s:10}, {x:5, y:10,s:10}, {x:15, y:10,s:10}, {x:0, y:20, s:6}, {x:6, y:20, s:6}, {x:12, y:20, s:6}, {x:18, y:20, s:6}, {x:24, y:20, s:6}, {x:0, y:10, s:5}, {x:0, y:15, s:5}, {x:25, y:10, s:5}, {x:25, y:15, s:5}];
const subRect_14_14_12_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:0, y:4, s:4}, {x:4, y:4, s:4}, {x:0, y:8, s:4}, {x:4, y:8, s:4}, {x:8, y:0, s:3}, {x:11, y:0, s:3}, {x:8, y:3, s:3}, {x:11, y:3, s:3}, {x:8, y:6, s:3}, {x:11, y:6, s:3}, {x:8, y:9, s:3}, {x:11, y:9, s:3}];
const subRect_14_12_10_0 = [{x:2, y:0, s:4}, {x:6, y:0, s:4}, {x:0, y:4, s:3}, {x:3, y:4, s:3}, {x:6, y:4, s:3}, {x:9, y:4, s:3}, {x:0, y:7, s:3}, {x:3, y:7, s:3}, {x:6, y:7, s:3}, {x:9, y:7, s:3}, {x:0, y:0, s:2}, {x:0, y:2, s:2}, {x:10, y:0, s:2}, {x:10, y:2, s:2}];
const subRect_14_18_15_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:10, y:0, s:5}, {x:0, y:5, s:5}, {x:5, y:5, s:5}, {x:10, y:5, s:5}, {x:0, y:10, s:5}, {x:5, y:10, s:5}, {x:10, y:10, s:5}, {x:15, y:0, s:3}, {x:15, y:3, s:3}, {x:15, y:6, s:3}, {x:15, y:9, s:3}, {x:15, y:12, s:3}];
const subRect_14_05_04_0 = [{x:0, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}];
const subRect_14_30_21_0 = [{x:0, y:0,s:10}, {x:10, y:0,s:10}, {x:20, y:0,s:10}, {x:0, y:10, s:6}, {x:6, y:10, s:6}, {x:12, y:10, s:6}, {x:18, y:10, s:6}, {x:24, y:10, s:6}, {x:0, y:16, s:5}, {x:5, y:16, s:5}, {x:10, y:16, s:5}, {x:15, y:16, s:5}, {x:20, y:16, s:5}, {x:25, y:16, s:5}];
const subRect_14_12_08_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:3, s:3}, {x:9, y:3, s:3}, {x:0, y:6, s:2}, {x:2, y:6, s:2}, {x:4, y:6, s:2}, {x:6, y:6, s:2}, {x:8, y:6, s:2}, {x:10, y:6, s:2}];
const subRect_14_18_12_0 = [{x:0, y:3, s:6}, {x:6, y:0, s:4}, {x:10, y:0, s:4}, {x:14, y:0, s:4}, {x:6, y:4, s:4}, {x:10, y:4, s:4}, {x:14, y:4, s:4}, {x:6, y:8, s:4}, {x:10, y:8, s:4}, {x:14, y:8, s:4}, {x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:0, y:9, s:3}, {x:3, y:9, s:3}];
const subRect_14_20_13_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:10, y:0, s:5}, {x:15, y:0, s:5}, {x:0, y:5, s:4}, {x:4, y:5, s:4}, {x:8, y:5, s:4}, {x:12, y:5, s:4}, {x:16, y:5, s:4}, {x:0, y:9, s:4}, {x:4, y:9, s:4}, {x:8, y:9, s:4}, {x:12, y:9, s:4}, {x:16, y:9, s:4}];
const subRect_14_19_12_0 = [{x:0, y:0, s:6}, {x:0, y:6, s:6}, {x:6, y:3, s:6}, {x:15, y:0, s:4}, {x:15, y:4, s:4}, {x:15, y:8, s:4}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:12, y:0, s:3}, {x:12, y:3, s:3}, {x:12, y:6, s:3}, {x:6, y:9, s:3}, {x:9, y:9, s:3}, {x:12, y:9, s:3}];
const subRect_14_10_06_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:1, y:2, s:2}, {x:3, y:2, s:2}, {x:5, y:2, s:2}, {x:7, y:2, s:2}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:4, y:4, s:2}, {x:6, y:4, s:2}, {x:8, y:4, s:2}];
const subRect_14_11_06_0 = [{x:0, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:0, s:2}, {x:5, y:0, s:2}, {x:7, y:0, s:2}, {x:9, y:0, s:2}, {x:3, y:2, s:2}, {x:5, y:2, s:2}, {x:7, y:2, s:2}, {x:9, y:2, s:2}, {x:3, y:4, s:2}, {x:5, y:4, s:2}, {x:7, y:4, s:2}, {x:9, y:4, s:2}];
const subRect_14_30_16_0 = [{x:10, y:0,s:10}, {x:0, y:10, s:6}, {x:6, y:10, s:6}, {x:12, y:10, s:6}, {x:18, y:10, s:6}, {x:24, y:10, s:6}, {x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:0, y:5, s:5}, {x:5, y:5, s:5}, {x:20, y:0, s:5}, {x:25, y:0, s:5}, {x:20, y:5, s:5}, {x:25, y:5, s:5}];
const subRect_14_23_12_0 = [{x:0, y:0, s:6}, {x:6, y:0, s:6}, {x:0, y:6, s:6}, {x:6, y:6, s:6}, {x:12, y:0, s:4}, {x:16, y:0, s:4}, {x:12, y:4, s:4}, {x:16, y:4, s:4}, {x:12, y:8, s:4}, {x:16, y:8, s:4}, {x:20, y:0, s:3}, {x:20, y:3, s:3}, {x:20, y:6, s:3}, {x:20, y:9, s:3}];
const subRect_14_08_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}, {x:6, y:2, s:1}, {x:7, y:2, s:1}, {x:6, y:3, s:1}, {x:7, y:3, s:1}];
const subRect_14_42_19_0 = [{x:0, y:0,s:12}, {x:12, y:0,s:12}, {x:0, y:12, s:7}, {x:7, y:12, s:7}, {x:14, y:12, s:7}, {x:21, y:12, s:7}, {x:28, y:12, s:7}, {x:35, y:12, s:7}, {x:24, y:0, s:6}, {x:30, y:0, s:6}, {x:36, y:0, s:6}, {x:24, y:6, s:6}, {x:30, y:6, s:6}, {x:36, y:6, s:6}];
const subRect_14_45_19_0 = [{x:0, y:0,s:10}, {x:10, y:0,s:10}, {x:20, y:0,s:10}, {x:0, y:10, s:9}, {x:9, y:10, s:9}, {x:18, y:10, s:9}, {x:27, y:10, s:9}, {x:36, y:10, s:9}, {x:30, y:0, s:5}, {x:35, y:0, s:5}, {x:40, y:0, s:5}, {x:30, y:5, s:5}, {x:35, y:5, s:5}, {x:40, y:5, s:5}];
const subRect_14_16_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:3, s:3}, {x:9, y:3, s:3}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:12, y:2, s:2}, {x:14, y:2, s:2}, {x:12, y:4, s:2}, {x:14, y:4, s:2}];
const subRect_14_11_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:2}, {x:8, y:2, s:2}, {x:10, y:0, s:1}, {x:10, y:1, s:1}, {x:10, y:2, s:1}, {x:10, y:3, s:1}];
const subRect_14_19_06_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:8, y:0, s:4}, {x:12, y:0, s:4}, {x:16, y:0, s:3}, {x:16, y:3, s:3}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:4, y:4, s:2}, {x:6, y:4, s:2}, {x:8, y:4, s:2}, {x:10, y:4, s:2}, {x:12, y:4, s:2}, {x:14, y:4, s:2}];
const subRect_14_10_03_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}, {x:8, y:1, s:1}, {x:9, y:1, s:1}, {x:6, y:2, s:1}, {x:7, y:2, s:1}, {x:8, y:2, s:1}, {x:9, y:2, s:1}];
const subRect_14_45_14_0 = [{x:0, y:0, s:9}, {x:9, y:0, s:9}, {x:18, y:0, s:9}, {x:27, y:0, s:9}, {x:36, y:0, s:9}, {x:0, y:9, s:5}, {x:5, y:9, s:5}, {x:10, y:9, s:5}, {x:15, y:9, s:5}, {x:20, y:9, s:5}, {x:25, y:9, s:5}, {x:30, y:9, s:5}, {x:35, y:9, s:5}, {x:40, y:9, s:5}];
const subRect_14_24_07_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:8, y:0, s:4}, {x:12, y:0, s:4}, {x:16, y:0, s:4}, {x:20, y:0, s:4}, {x:0, y:4, s:3}, {x:3, y:4, s:3}, {x:6, y:4, s:3}, {x:9, y:4, s:3}, {x:12, y:4, s:3}, {x:15, y:4, s:3}, {x:18, y:4, s:3}, {x:21, y:4, s:3}];
const subRect_14_07_02_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:0, y:1, s:1}, {x:1, y:1, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}];
const subRect_14_10_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}, {x:8, y:1, s:1}, {x:9, y:1, s:1}];
const subRect_14_13_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:11, y:0, s:1}, {x:12, y:0, s:1}, {x:8, y:1, s:1}, {x:9, y:1, s:1}, {x:10, y:1, s:1}, {x:11, y:1, s:1}, {x:12, y:1, s:1}];
const subRect_14_16_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:1}, {x:13, y:0, s:1}, {x:14, y:0, s:1}, {x:15, y:0, s:1}, {x:12, y:1, s:1}, {x:13, y:1, s:1}, {x:14, y:1, s:1}, {x:15, y:1, s:1}];
const subRect_14_19_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:1}, {x:17, y:0, s:1}, {x:18, y:0, s:1}, {x:16, y:1, s:1}, {x:17, y:1, s:1}, {x:18, y:1, s:1}];
const subRect_14_22_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:2}, {x:18, y:0, s:2}, {x:20, y:0, s:1}, {x:21, y:0, s:1}, {x:20, y:1, s:1}, {x:21, y:1, s:1}];
const subRect_14_25_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:2}, {x:18, y:0, s:2}, {x:20, y:0, s:2}, {x:22, y:0, s:2}, {x:24, y:0, s:1}, {x:24, y:1, s:1}];
const subRect_14_14_01_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:11, y:0, s:1}, {x:12, y:0, s:1}, {x:13, y:0, s:1}];

const layout14 =
[
    {xd:8, yd:8, full:false, lovely:true,  flipped:false, w:subRect_14_08_08_0},
    {xd:8, yd:8, full:true,  lovely:true,  flipped:true,  w:subRect_14_08_08_1},
    {xd:9, yd:9, full:true,  lovely:true,  flipped:true,  w:subRect_14_09_09_0},
    {xd:10, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_14_10_10_0},
    {xd:10, yd:10, full:false, lovely:true,  flipped:true,  w:subRect_14_10_10_1},
    {xd:12, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_14_12_12_0},
    {xd:20, yd:20, full:true,  lovely:true,  flipped:true,  w:subRect_14_20_20_0},
    {xd:30, yd:26, full:true,  lovely:true,  flipped:true,  w:subRect_14_30_26_0},
    {xd:14, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_14_14_12_0},
    {xd:12, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_14_12_10_0},
    {xd:18, yd:15, full:true,  lovely:true,  flipped:true,  w:subRect_14_18_15_0},
    {xd:5, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_14_05_04_0},
    {xd:30, yd:21, full:true,  lovely:true,  flipped:true,  w:subRect_14_30_21_0},
    {xd:12, yd:8, full:true,  lovely:true,  flipped:true,  w:subRect_14_12_08_0},
    {xd:18, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_14_18_12_0},
    {xd:20, yd:13, full:true,  lovely:true,  flipped:true,  w:subRect_14_20_13_0},
    {xd:19, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_14_19_12_0},
    {xd:10, yd:6, full:false, lovely:true,  flipped:false, w:subRect_14_10_06_0},
    {xd:11, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_14_11_06_0},
    {xd:30, yd:16, full:true,  lovely:true,  flipped:true,  w:subRect_14_30_16_0},
    {xd:23, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_14_23_12_0},
    {xd:8, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_14_08_04_0},
    {xd:42, yd:19, full:true,  lovely:true,  flipped:true,  w:subRect_14_42_19_0},
    {xd:45, yd:19, full:true,  lovely:true,  flipped:true,  w:subRect_14_45_19_0},
    {xd:16, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_14_16_06_0},
    {xd:11, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_14_11_04_0},
    {xd:19, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_14_19_06_0},
    {xd:10, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_14_10_03_0},
    {xd:45, yd:14, full:true,  lovely:true,  flipped:true,  w:subRect_14_45_14_0},
    {xd:24, yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_14_24_07_0},
    {xd:7, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_14_07_02_0},
    {xd:10, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_14_10_02_0},
    {xd:13, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_14_13_02_0},
    {xd:16, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_14_16_02_0},
    {xd:19, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_14_19_02_0},
    {xd:22, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_14_22_02_0},
    {xd:25, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_14_25_02_0},
    {xd:14, yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_14_14_01_0}
];

/* 15 Participants               N xd yd #              0             1             2             3             4             5             6             7             8             9            10            11            12            13            14     */
const subRect_15_06_06_0 = [{x:1, y:0, s:2}, {x:3, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:1, y:4, s:2}, {x:3, y:4, s:2}, {x:0, y:0, s:1}, {x:0, y:1, s:1}, {x:5, y:0, s:1}, {x:5, y:1, s:1}, {x:0, y:4, s:1}, {x:0, y:5, s:1}, {x:5, y:4, s:1}, {x:5, y:5, s:1}];
const subRect_15_07_07_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:4, y:3, s:2}, {x:0, y:5, s:2}, {x:2, y:5, s:2}, {x:4, y:5, s:2}, {x:6, y:0, s:1}, {x:6, y:1, s:1}, {x:6, y:2, s:1}, {x:6, y:3, s:1}, {x:6, y:4, s:1}, {x:6, y:5, s:1}, {x:6, y:6, s:1}];
const subRect_15_10_10_0 = [{x:2, y:2, s:6}, {x:1, y:0, s:2}, {x:3, y:0, s:2}, {x:5, y:0, s:2}, {x:7, y:0, s:2}, {x:0, y:2, s:2}, {x:0, y:4, s:2}, {x:0, y:6, s:2}, {x:8, y:2, s:2}, {x:8, y:4, s:2}, {x:8, y:6, s:2}, {x:1, y:8, s:2}, {x:3, y:8, s:2}, {x:5, y:8, s:2}, {x:7, y:8, s:2}];
const subRect_15_11_11_0 = [{x:0, y:0, s:5}, {x:5, y:2, s:3}, {x:8, y:2, s:3}, {x:2, y:5, s:3}, {x:5, y:5, s:3}, {x:8, y:5, s:3}, {x:2, y:8, s:3}, {x:5, y:8, s:3}, {x:8, y:8, s:3}, {x:5, y:0, s:2}, {x:7, y:0, s:2}, {x:9, y:0, s:2}, {x:0, y:5, s:2}, {x:0, y:7, s:2}, {x:0, y:9, s:2}];
const subRect_15_16_16_0 = [{x:0, y:0, s:6}, {x:0, y:6, s:6}, {x:6, y:0, s:5}, {x:11, y:0, s:5}, {x:6, y:5, s:5}, {x:11, y:5, s:5}, {x:0, y:12, s:4}, {x:4, y:12, s:4}, {x:8, y:12, s:4}, {x:12, y:12, s:4}, {x:6, y:10, s:2}, {x:8, y:10, s:2}, {x:10, y:10, s:2}, {x:12, y:10, s:2}, {x:14, y:10, s:2}];
const subRect_15_13_12_0 = [{x:0, y:0, s:4}, {x:0, y:4, s:4}, {x:0, y:8, s:4}, {x:4, y:0, s:3}, {x:7, y:0, s:3}, {x:10, y:0, s:3}, {x:4, y:3, s:3}, {x:7, y:3, s:3}, {x:10, y:3, s:3}, {x:4, y:6, s:3}, {x:7, y:6, s:3}, {x:10, y:6, s:3}, {x:4, y:9, s:3}, {x:7, y:9, s:3}, {x:10, y:9, s:3}];
const subRect_15_07_06_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:4, y:4, s:2}, {x:6, y:0, s:1}, {x:6, y:1, s:1}, {x:6, y:2, s:1}, {x:6, y:3, s:1}, {x:6, y:4, s:1}, {x:6, y:5, s:1}];
const subRect_15_06_05_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:1, y:2, s:2}, {x:3, y:2, s:2}, {x:0, y:2, s:1}, {x:0, y:3, s:1}, {x:5, y:2, s:1}, {x:5, y:3, s:1}, {x:0, y:4, s:1}, {x:1, y:4, s:1}, {x:2, y:4, s:1}, {x:3, y:4, s:1}, {x:4, y:4, s:1}, {x:5, y:4, s:1}];
const subRect_15_10_08_0 = [{x:2, y:0, s:3}, {x:5, y:0, s:3}, {x:2, y:3, s:3}, {x:5, y:3, s:3}, {x:0, y:0, s:2}, {x:0, y:2, s:2}, {x:0, y:4, s:2}, {x:8, y:0, s:2}, {x:8, y:2, s:2}, {x:8, y:4, s:2}, {x:0, y:6, s:2}, {x:2, y:6, s:2}, {x:4, y:6, s:2}, {x:6, y:6, s:2}, {x:8, y:6, s:2}];
const subRect_15_35_27_0 = [{x:0, y:0,s:10}, {x:10, y:0,s:10}, {x:20, y:0,s:10}, {x:0, y:10,s:10}, {x:10, y:10,s:10}, {x:20, y:10,s:10}, {x:0, y:20, s:7}, {x:7, y:20, s:7}, {x:14, y:20, s:7}, {x:21, y:20, s:7}, {x:28, y:20, s:7}, {x:30, y:0, s:5}, {x:30, y:5, s:5}, {x:30, y:10, s:5}, {x:30, y:15, s:5}];
const subRect_15_08_06_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:2}, {x:0, y:4, s:2}, {x:2, y:4, s:2}, {x:4, y:4, s:2}, {x:6, y:4, s:1}, {x:7, y:4, s:1}, {x:6, y:5, s:1}, {x:7, y:5, s:1}];
const subRect_15_24_17_0 = [{x:0, y:0, s:8}, {x:8, y:0, s:8}, {x:16, y:0, s:8}, {x:0, y:8, s:6}, {x:6, y:8, s:6}, {x:12, y:8, s:6}, {x:18, y:8, s:6}, {x:0, y:14, s:3}, {x:3, y:14, s:3}, {x:6, y:14, s:3}, {x:9, y:14, s:3}, {x:12, y:14, s:3}, {x:15, y:14, s:3}, {x:18, y:14, s:3}, {x:21, y:14, s:3}];
const subRect_15_06_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:0, y:3, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}];
const subRect_15_08_05_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:4, y:3, s:2}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}, {x:6, y:2, s:1}, {x:7, y:2, s:1}, {x:6, y:3, s:1}, {x:7, y:3, s:1}, {x:6, y:4, s:1}, {x:7, y:4, s:1}];
const subRect_15_05_03_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:0, y:1, s:1}, {x:1, y:1, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}];
const subRect_15_21_12_0 = [{x:0, y:0, s:6}, {x:0, y:6, s:6}, {x:6, y:0, s:4}, {x:10, y:0, s:4}, {x:14, y:0, s:4}, {x:6, y:4, s:4}, {x:10, y:4, s:4}, {x:14, y:4, s:4}, {x:6, y:8, s:4}, {x:10, y:8, s:4}, {x:14, y:8, s:4}, {x:18, y:0, s:3}, {x:18, y:3, s:3}, {x:18, y:6, s:3}, {x:18, y:9, s:3}];
const subRect_15_09_05_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:0, y:3, s:2}, {x:7, y:3, s:2}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}, {x:6, y:3, s:1}, {x:2, y:4, s:1}, {x:3, y:4, s:1}, {x:4, y:4, s:1}, {x:5, y:4, s:1}, {x:6, y:4, s:1}];
const subRect_15_06_03_0 = [{x:2, y:0, s:2}, {x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:0, y:1, s:1}, {x:1, y:1, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}];
const subRect_15_22_10_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:0, y:5, s:5}, {x:5, y:5, s:5}, {x:10, y:0, s:4}, {x:14, y:0, s:4}, {x:18, y:0, s:4}, {x:10, y:4, s:3}, {x:13, y:4, s:3}, {x:16, y:4, s:3}, {x:19, y:4, s:3}, {x:10, y:7, s:3}, {x:13, y:7, s:3}, {x:16, y:7, s:3}, {x:19, y:7, s:3}];
const subRect_15_09_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:8, y:0, s:1}, {x:8, y:1, s:1}, {x:6, y:2, s:1}, {x:7, y:2, s:1}, {x:8, y:2, s:1}, {x:6, y:3, s:1}, {x:7, y:3, s:1}, {x:8, y:3, s:1}];
const subRect_15_07_03_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:6, y:2, s:1}];
const subRect_15_15_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:3, s:3}, {x:9, y:0, s:2}, {x:11, y:0, s:2}, {x:13, y:0, s:2}, {x:9, y:2, s:2}, {x:11, y:2, s:2}, {x:13, y:2, s:2}, {x:9, y:4, s:2}, {x:11, y:4, s:2}, {x:13, y:4, s:2}];
const subRect_15_08_03_0 = [{x:1, y:0, s:2}, {x:3, y:0, s:2}, {x:5, y:0, s:2}, {x:0, y:0, s:1}, {x:0, y:1, s:1}, {x:7, y:0, s:1}, {x:7, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:6, y:2, s:1}, {x:7, y:2, s:1}];
const subRect_15_09_03_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:1}, {x:8, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:6, y:2, s:1}, {x:7, y:2, s:1}, {x:8, y:2, s:1}];
const subRect_15_12_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:2}, {x:8, y:2, s:2}, {x:10, y:2, s:1}, {x:11, y:2, s:1}, {x:10, y:3, s:1}, {x:11, y:3, s:1}];
const subRect_15_10_03_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:6, y:2, s:1}, {x:7, y:2, s:1}, {x:8, y:2, s:1}, {x:9, y:2, s:1}];
const subRect_15_20_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:12, y:0, s:3}, {x:15, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:3, s:3}, {x:9, y:3, s:3}, {x:12, y:3, s:3}, {x:15, y:3, s:3}, {x:18, y:0, s:2}, {x:18, y:2, s:2}, {x:18, y:4, s:2}];
const subRect_15_18_05_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:12, y:0, s:3}, {x:15, y:0, s:3}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:4, y:3, s:2}, {x:6, y:3, s:2}, {x:8, y:3, s:2}, {x:10, y:3, s:2}, {x:12, y:3, s:2}, {x:14, y:3, s:2}, {x:16, y:3, s:2}];
const subRect_15_56_15_0 = [{x:0, y:0, s:8}, {x:8, y:0, s:8}, {x:16, y:0, s:8}, {x:24, y:0, s:8}, {x:32, y:0, s:8}, {x:40, y:0, s:8}, {x:48, y:0, s:8}, {x:0, y:8, s:7}, {x:7, y:8, s:7}, {x:14, y:8, s:7}, {x:21, y:8, s:7}, {x:28, y:8, s:7}, {x:35, y:8, s:7}, {x:42, y:8, s:7}, {x:49, y:8, s:7}];
const subRect_15_09_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}, {x:8, y:1, s:1}];
const subRect_15_12_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:11, y:0, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}, {x:8, y:1, s:1}, {x:9, y:1, s:1}, {x:10, y:1, s:1}, {x:11, y:1, s:1}];
const subRect_15_15_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:1}, {x:11, y:0, s:1}, {x:12, y:0, s:1}, {x:13, y:0, s:1}, {x:14, y:0, s:1}, {x:10, y:1, s:1}, {x:11, y:1, s:1}, {x:12, y:1, s:1}, {x:13, y:1, s:1}, {x:14, y:1, s:1}];
const subRect_15_18_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:1}, {x:15, y:0, s:1}, {x:16, y:0, s:1}, {x:17, y:0, s:1}, {x:14, y:1, s:1}, {x:15, y:1, s:1}, {x:16, y:1, s:1}, {x:17, y:1, s:1}];
const subRect_15_21_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:2}, {x:18, y:0, s:1}, {x:19, y:0, s:1}, {x:20, y:0, s:1}, {x:18, y:1, s:1}, {x:19, y:1, s:1}, {x:20, y:1, s:1}];
const subRect_15_24_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:2}, {x:18, y:0, s:2}, {x:20, y:0, s:2}, {x:22, y:0, s:1}, {x:23, y:0, s:1}, {x:22, y:1, s:1}, {x:23, y:1, s:1}];
const subRect_15_27_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:2}, {x:18, y:0, s:2}, {x:20, y:0, s:2}, {x:22, y:0, s:2}, {x:24, y:0, s:2}, {x:26, y:0, s:1}, {x:26, y:1, s:1}];
const subRect_15_15_01_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:11, y:0, s:1}, {x:12, y:0, s:1}, {x:13, y:0, s:1}, {x:14, y:0, s:1}];

const layout15 =
[
    {xd:6, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_15_06_06_0},
    {xd:7, yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_15_07_07_0},
    {xd:10, yd:10, full:false, lovely:true,  flipped:true,  w:subRect_15_10_10_0},
    {xd:11, yd:11, full:true,  lovely:true,  flipped:true,  w:subRect_15_11_11_0},
    {xd:16, yd:16, full:true,  lovely:true,  flipped:true,  w:subRect_15_16_16_0},
    {xd:13, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_15_13_12_0},
    {xd:7, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_15_07_06_0},
    {xd:6, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_15_06_05_0},
    {xd:10, yd:8, full:true,  lovely:true,  flipped:true,  w:subRect_15_10_08_0},
    {xd:35, yd:27, full:true,  lovely:true,  flipped:true,  w:subRect_15_35_27_0},
    {xd:8, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_15_08_06_0},
    {xd:24, yd:17, full:true,  lovely:true,  flipped:true,  w:subRect_15_24_17_0},
    {xd:6, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_15_06_04_0},
    {xd:8, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_15_08_05_0},
    {xd:5, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_15_05_03_0},
    {xd:21, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_15_21_12_0},
    {xd:9, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_15_09_05_0},
    {xd:6, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_15_06_03_0},
    {xd:22, yd:10, full:true,  lovely:true,  flipped:true,  w:subRect_15_22_10_0},
    {xd:9, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_15_09_04_0},
    {xd:7, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_15_07_03_0},
    {xd:15, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_15_15_06_0},
    {xd:8, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_15_08_03_0},
    {xd:9, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_15_09_03_0},
    {xd:12, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_15_12_04_0},
    {xd:10, yd:3, full:true,  lovely:true,  flipped:true,  w:subRect_15_10_03_0},
    {xd:20, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_15_20_06_0},
    {xd:18, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_15_18_05_0},
    {xd:56, yd:15, full:true,  lovely:true,  flipped:true,  w:subRect_15_56_15_0},
    {xd:9, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_15_09_02_0},
    {xd:12, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_15_12_02_0},
    {xd:15, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_15_15_02_0},
    {xd:18, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_15_18_02_0},
    {xd:21, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_15_21_02_0},
    {xd:24, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_15_24_02_0},
    {xd:27, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_15_27_02_0},
    {xd:15, yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_15_15_01_0}
];

/* 16 Participants               N xd yd #              0             1             2             3             4             5             6             7             8             9            10            11            12            13            14            15     */
const subRect_16_04_04_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:0, y:1, s:1}, {x:1, y:1, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:0, y:3, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}];
const subRect_16_05_05_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:0, y:2, s:2}, {x:4, y:0, s:1}, {x:4, y:1, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}, {x:0, y:4, s:1}, {x:1, y:4, s:1}, {x:2, y:4, s:1}, {x:3, y:4, s:1}, {x:4, y:4, s:1}];
const subRect_16_14_14_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:0, y:5, s:5}, {x:5, y:5, s:5}, {x:10, y:0, s:4}, {x:10, y:4, s:4}, {x:0, y:10, s:4}, {x:4, y:10, s:4}, {x:10, y:8, s:2}, {x:12, y:8, s:2}, {x:8, y:10, s:2}, {x:10, y:10, s:2}, {x:12, y:10, s:2}, {x:8, y:12, s:2}, {x:10, y:12, s:2}, {x:12, y:12, s:2}];
const subRect_16_21_20_0 = [{x:5, y:4,s:12}, {x:0, y:0, s:5}, {x:0, y:5, s:5}, {x:0, y:10, s:5}, {x:0, y:15, s:5}, {x:5, y:0, s:4}, {x:9, y:0, s:4}, {x:13, y:0, s:4}, {x:17, y:0, s:4}, {x:17, y:4, s:4}, {x:17, y:8, s:4}, {x:17, y:12, s:4}, {x:5, y:16, s:4}, {x:9, y:16, s:4}, {x:13, y:16, s:4}, {x:17, y:16, s:4}];
const subRect_16_16_15_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:0, y:5, s:5}, {x:5, y:5, s:5}, {x:0, y:10, s:5}, {x:5, y:10, s:5}, {x:10, y:0, s:3}, {x:13, y:0, s:3}, {x:10, y:3, s:3}, {x:13, y:3, s:3}, {x:10, y:6, s:3}, {x:13, y:6, s:3}, {x:10, y:9, s:3}, {x:13, y:9, s:3}, {x:10, y:12, s:3}, {x:13, y:12, s:3}];
const subRect_16_12_11_0 = [{x:0, y:0, s:4}, {x:8, y:0, s:4}, {x:0, y:7, s:4}, {x:8, y:7, s:4}, {x:0, y:4, s:3}, {x:3, y:4, s:3}, {x:6, y:4, s:3}, {x:9, y:4, s:3}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:2}, {x:4, y:7, s:2}, {x:6, y:7, s:2}, {x:4, y:9, s:2}, {x:6, y:9, s:2}];
const subRect_16_08_07_0 = [{x:1, y:0, s:3}, {x:4, y:0, s:3}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:4, y:3, s:2}, {x:6, y:3, s:2}, {x:0, y:5, s:2}, {x:2, y:5, s:2}, {x:4, y:5, s:2}, {x:6, y:5, s:2}, {x:0, y:0, s:1}, {x:0, y:1, s:1}, {x:0, y:2, s:1}, {x:7, y:0, s:1}, {x:7, y:1, s:1}, {x:7, y:2, s:1}];
const subRect_16_05_04_0 = [{x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:0, y:1, s:1}, {x:1, y:1, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:0, y:2, s:1}, {x:1, y:2, s:1}, {x:2, y:2, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}];
const subRect_16_12_09_0 = [{x:2, y:2, s:4}, {x:6, y:2, s:4}, {x:0, y:6, s:3}, {x:3, y:6, s:3}, {x:6, y:6, s:3}, {x:9, y:6, s:3}, {x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:0, y:2, s:2}, {x:0, y:4, s:2}, {x:10, y:2, s:2}, {x:10, y:4, s:2}];
const subRect_16_52_37_0 = [{x:0, y:0,s:13}, {x:13, y:0,s:13}, {x:26, y:0,s:13}, {x:39, y:0,s:13}, {x:8, y:13,s:12}, {x:20, y:13,s:12}, {x:32, y:13,s:12}, {x:8, y:25,s:12}, {x:20, y:25,s:12}, {x:32, y:25,s:12}, {x:0, y:13, s:8}, {x:0, y:21, s:8}, {x:0, y:29, s:8}, {x:44, y:13, s:8}, {x:44, y:21, s:8}, {x:44, y:29, s:8}];
const subRect_16_06_04_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:3, y:2, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:0, y:3, s:1}, {x:1, y:3, s:1}, {x:2, y:3, s:1}, {x:3, y:3, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}];
const subRect_16_19_12_0 = [{x:0, y:0, s:4}, {x:4, y:0, s:4}, {x:8, y:0, s:4}, {x:12, y:0, s:4}, {x:0, y:4, s:4}, {x:4, y:4, s:4}, {x:8, y:4, s:4}, {x:12, y:4, s:4}, {x:0, y:8, s:4}, {x:4, y:8, s:4}, {x:8, y:8, s:4}, {x:12, y:8, s:4}, {x:16, y:0, s:3}, {x:16, y:3, s:3}, {x:16, y:6, s:3}, {x:16, y:9, s:3}];
const subRect_16_08_05_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:2}, {x:0, y:4, s:1}, {x:1, y:4, s:1}, {x:2, y:4, s:1}, {x:3, y:4, s:1}, {x:4, y:4, s:1}, {x:5, y:4, s:1}, {x:6, y:4, s:1}, {x:7, y:4, s:1}];
const subRect_16_12_07_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:0, y:3, s:2}, {x:2, y:3, s:2}, {x:4, y:3, s:2}, {x:6, y:3, s:2}, {x:8, y:3, s:2}, {x:10, y:3, s:2}, {x:0, y:5, s:2}, {x:2, y:5, s:2}, {x:4, y:5, s:2}, {x:6, y:5, s:2}, {x:8, y:5, s:2}, {x:10, y:5, s:2}];
const subRect_16_07_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}, {x:4, y:2, s:1}, {x:5, y:2, s:1}, {x:6, y:2, s:1}, {x:4, y:3, s:1}, {x:5, y:3, s:1}, {x:6, y:3, s:1}];
const subRect_16_44_25_0 = [{x:0, y:0, s:9}, {x:9, y:0, s:9}, {x:18, y:0, s:9}, {x:27, y:0, s:9}, {x:8, y:16, s:9}, {x:17, y:16, s:9}, {x:26, y:16, s:9}, {x:35, y:16, s:9}, {x:36, y:0, s:8}, {x:36, y:8, s:8}, {x:0, y:9, s:8}, {x:0, y:17, s:8}, {x:8, y:9, s:7}, {x:15, y:9, s:7}, {x:22, y:9, s:7}, {x:29, y:9, s:7}];
const subRect_16_30_17_0 = [{x:0, y:0, s:6}, {x:6, y:0, s:6}, {x:12, y:0, s:6}, {x:18, y:0, s:6}, {x:24, y:0, s:6}, {x:0, y:6, s:6}, {x:6, y:6, s:6}, {x:12, y:6, s:6}, {x:18, y:6, s:6}, {x:24, y:6, s:6}, {x:0, y:12, s:5}, {x:5, y:12, s:5}, {x:10, y:12, s:5}, {x:15, y:12, s:5}, {x:20, y:12, s:5}, {x:25, y:12, s:5}];
const subRect_16_10_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:2}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:8, y:1, s:1}, {x:9, y:1, s:1}, {x:8, y:2, s:1}, {x:9, y:2, s:1}, {x:8, y:3, s:1}, {x:9, y:3, s:1}];
const subRect_16_40_14_0 = [{x:0, y:0, s:7}, {x:7, y:0, s:7}, {x:14, y:0, s:7}, {x:21, y:0, s:7}, {x:0, y:7, s:7}, {x:7, y:7, s:7}, {x:14, y:7, s:7}, {x:21, y:7, s:7}, {x:28, y:0, s:6}, {x:34, y:0, s:6}, {x:28, y:6, s:4}, {x:32, y:6, s:4}, {x:36, y:6, s:4}, {x:28, y:10, s:4}, {x:32, y:10, s:4}, {x:36, y:10, s:4}];
const subRect_16_19_06_0 = [{x:0, y:0, s:3}, {x:3, y:0, s:3}, {x:6, y:0, s:3}, {x:9, y:0, s:3}, {x:12, y:0, s:3}, {x:0, y:3, s:3}, {x:3, y:3, s:3}, {x:6, y:3, s:3}, {x:9, y:3, s:3}, {x:12, y:3, s:3}, {x:15, y:0, s:2}, {x:17, y:0, s:2}, {x:15, y:2, s:2}, {x:17, y:2, s:2}, {x:15, y:4, s:2}, {x:17, y:4, s:2}];
const subRect_16_13_04_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:0, y:2, s:2}, {x:2, y:2, s:2}, {x:4, y:2, s:2}, {x:6, y:2, s:2}, {x:8, y:2, s:2}, {x:10, y:2, s:2}, {x:12, y:0, s:1}, {x:12, y:1, s:1}, {x:12, y:2, s:1}, {x:12, y:3, s:1}];
const subRect_16_30_08_0 = [{x:0, y:0, s:5}, {x:5, y:0, s:5}, {x:10, y:0, s:5}, {x:15, y:0, s:5}, {x:20, y:0, s:5}, {x:25, y:0, s:5}, {x:0, y:5, s:3}, {x:3, y:5, s:3}, {x:6, y:5, s:3}, {x:9, y:5, s:3}, {x:12, y:5, s:3}, {x:15, y:5, s:3}, {x:18, y:5, s:3}, {x:21, y:5, s:3}, {x:24, y:5, s:3}, {x:27, y:5, s:3}];
const subRect_16_63_16_0 = [{x:0, y:0, s:9}, {x:9, y:0, s:9}, {x:18, y:0, s:9}, {x:27, y:0, s:9}, {x:36, y:0, s:9}, {x:45, y:0, s:9}, {x:54, y:0, s:9}, {x:0, y:9, s:7}, {x:7, y:9, s:7}, {x:14, y:9, s:7}, {x:21, y:9, s:7}, {x:28, y:9, s:7}, {x:35, y:9, s:7}, {x:42, y:9, s:7}, {x:49, y:9, s:7}, {x:56, y:9, s:7}];
const subRect_16_08_02_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:0, y:1, s:1}, {x:1, y:1, s:1}, {x:2, y:1, s:1}, {x:3, y:1, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}];
const subRect_16_11_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:4, y:1, s:1}, {x:5, y:1, s:1}, {x:6, y:1, s:1}, {x:7, y:1, s:1}, {x:8, y:1, s:1}, {x:9, y:1, s:1}, {x:10, y:1, s:1}];
const subRect_16_14_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:11, y:0, s:1}, {x:12, y:0, s:1}, {x:13, y:0, s:1}, {x:8, y:1, s:1}, {x:9, y:1, s:1}, {x:10, y:1, s:1}, {x:11, y:1, s:1}, {x:12, y:1, s:1}, {x:13, y:1, s:1}];
const subRect_16_17_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:1}, {x:13, y:0, s:1}, {x:14, y:0, s:1}, {x:15, y:0, s:1}, {x:16, y:0, s:1}, {x:12, y:1, s:1}, {x:13, y:1, s:1}, {x:14, y:1, s:1}, {x:15, y:1, s:1}, {x:16, y:1, s:1}];
const subRect_16_20_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:1}, {x:17, y:0, s:1}, {x:18, y:0, s:1}, {x:19, y:0, s:1}, {x:16, y:1, s:1}, {x:17, y:1, s:1}, {x:18, y:1, s:1}, {x:19, y:1, s:1}];
const subRect_16_23_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:2}, {x:18, y:0, s:2}, {x:20, y:0, s:1}, {x:21, y:0, s:1}, {x:22, y:0, s:1}, {x:20, y:1, s:1}, {x:21, y:1, s:1}, {x:22, y:1, s:1}];
const subRect_16_26_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:2}, {x:18, y:0, s:2}, {x:20, y:0, s:2}, {x:22, y:0, s:2}, {x:24, y:0, s:1}, {x:25, y:0, s:1}, {x:24, y:1, s:1}, {x:25, y:1, s:1}];
const subRect_16_29_02_0 = [{x:0, y:0, s:2}, {x:2, y:0, s:2}, {x:4, y:0, s:2}, {x:6, y:0, s:2}, {x:8, y:0, s:2}, {x:10, y:0, s:2}, {x:12, y:0, s:2}, {x:14, y:0, s:2}, {x:16, y:0, s:2}, {x:18, y:0, s:2}, {x:20, y:0, s:2}, {x:22, y:0, s:2}, {x:24, y:0, s:2}, {x:26, y:0, s:2}, {x:28, y:0, s:1}, {x:28, y:1, s:1}];
const subRect_16_16_01_0 = [{x:0, y:0, s:1}, {x:1, y:0, s:1}, {x:2, y:0, s:1}, {x:3, y:0, s:1}, {x:4, y:0, s:1}, {x:5, y:0, s:1}, {x:6, y:0, s:1}, {x:7, y:0, s:1}, {x:8, y:0, s:1}, {x:9, y:0, s:1}, {x:10, y:0, s:1}, {x:11, y:0, s:1}, {x:12, y:0, s:1}, {x:13, y:0, s:1}, {x:14, y:0, s:1}, {x:15, y:0, s:1}];

const layout16 =
[
    {xd:4, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_16_04_04_0},
    {xd:5, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_16_05_05_0},
    {xd:14, yd:14, full:true,  lovely:true,  flipped:true,  w:subRect_16_14_14_0},
    {xd:21, yd:20, full:true,  lovely:true,  flipped:true,  w:subRect_16_21_20_0},
    {xd:16, yd:15, full:true,  lovely:true,  flipped:true,  w:subRect_16_16_15_0},
    {xd:12, yd:11, full:true,  lovely:true,  flipped:true,  w:subRect_16_12_11_0},
    {xd:8, yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_16_08_07_0},
    {xd:5, yd:4, full:false, lovely:true,  flipped:true,  w:subRect_16_05_04_0},
    {xd:12, yd:9, full:true,  lovely:true,  flipped:true,  w:subRect_16_12_09_0},
    {xd:52, yd:37, full:true,  lovely:true,  flipped:true,  w:subRect_16_52_37_0},
    {xd:6, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_16_06_04_0},
    {xd:19, yd:12, full:true,  lovely:true,  flipped:true,  w:subRect_16_19_12_0},
    {xd:8, yd:5, full:true,  lovely:true,  flipped:true,  w:subRect_16_08_05_0},
    {xd:12, yd:7, full:true,  lovely:true,  flipped:true,  w:subRect_16_12_07_0},
    {xd:7, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_16_07_04_0},
    {xd:44, yd:25, full:true,  lovely:true,  flipped:true,  w:subRect_16_44_25_0},
    {xd:30, yd:17, full:true,  lovely:true,  flipped:true,  w:subRect_16_30_17_0},
    {xd:10, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_16_10_04_0},
    {xd:40, yd:14, full:true,  lovely:true,  flipped:true,  w:subRect_16_40_14_0},
    {xd:19, yd:6, full:true,  lovely:true,  flipped:true,  w:subRect_16_19_06_0},
    {xd:13, yd:4, full:true,  lovely:true,  flipped:true,  w:subRect_16_13_04_0},
    {xd:30, yd:8, full:true,  lovely:true,  flipped:true,  w:subRect_16_30_08_0},
    {xd:63, yd:16, full:true,  lovely:true,  flipped:true,  w:subRect_16_63_16_0},
    {xd:8, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_16_08_02_0},
    {xd:11, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_16_11_02_0},
    {xd:14, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_16_14_02_0},
    {xd:17, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_16_17_02_0},
    {xd:20, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_16_20_02_0},
    {xd:23, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_16_23_02_0},
    {xd:26, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_16_26_02_0},
    {xd:29, yd:2, full:true,  lovely:true,  flipped:true,  w:subRect_16_29_02_0},
    {xd:16, yd:1, full:true,  lovely:true,  flipped:true,  w:subRect_16_16_01_0}
];

const layoutTable =
[
    {options:null, numOptions:0},
    {options:layout1, numOptions:layout1.length},
    {options:layout2, numOptions:layout2.length},
    {options:layout3, numOptions:layout3.length},
    {options:layout4, numOptions:layout4.length},
    {options:layout5, numOptions:layout5.length},
    {options:layout6, numOptions:layout6.length},
    {options:layout7, numOptions:layout7.length},
    {options:layout8, numOptions:layout8.length},
    {options:layout9, numOptions:layout9.length},
    {options:layout10, numOptions:layout10.length},
    {options:layout11, numOptions:layout11.length},
    {options:layout12, numOptions:layout12.length},
    {options:layout13, numOptions:layout13.length},
    {options:layout14, numOptions:layout14.length},
    {options:layout15, numOptions:layout15.length},
    {options:layout16, numOptions:layout16.length},
];

function LmiRectangleConstruct(rect, x, y, width, height) {
    rect.x0 = x;
    rect.y0 = y;
    rect.x1 = x+width;
    rect.y1 = y+height;
}

function LmiRectangleDestruct(r) {
    r.x0 = r.y0 = r.x1 = r.y1 = -1;
}

function LmiRectangleGetWidth(r) {
    return (r.x1 - r.x0);
}

function LmiRectangleGetHeight(r) {
    return (r.y1 - r.y0);
}

function  LmiRectangleResizeToAspectRatio(r, width, height, letterbox) {
    if(width > 0 && height > 0)
    {
        var oldWidth = LmiRectangleGetWidth(r);
        var oldHeight = LmiRectangleGetHeight(r);

        if((oldHeight * width > oldWidth * height) == letterbox)
        {
            /* Fit width */
            var newHeight = (oldWidth * height / width);
            r.y0 = (r.y0 + r.y1 - newHeight) / 2;
            r.y1 = r.y0 + newHeight;
        }
        else
        {
            /* Fit height */
            var newWidth = (oldHeight * width / height);
            r.x0 = (r.x0 + r.x1 - newWidth) / 2;
            r.x1 = r.x0 + newWidth;
        }
    }
}

function LmiRectangleGetArea(r) {
    return LmiRectangleGetWidth(r) * LmiRectangleGetHeight(r);
}

function LmiRectangleAssign(d, s) {
    for (var k in s) {
        d[k] = s[k];
    }
}

function LmiRectangleGetLeft(r) {
    return r.x0;
}

function LmiRectangleGetTop(r) {
    return r.y0;
}

function LmiRectangleSetMinAndMaxX(r, xMin, xMax) {
    r.x0 = xMin;
    r.x1 = xMax;
}

function LmiRectangleSetMinAndMaxY(r, yMin, yMax) {
    r.y0 = yMin;
    r.y1 = yMax;
}

function LmiRectangleSetMinAndMax(r, xMin, yMin, xMax, yMax) {
    LmiRectangleSetMinAndMaxX(r, xMin, xMax);
    LmiRectangleSetMinAndMaxY(r, yMin, yMax);
}

function LmiLayoutScoreBetter(a, b) {
    if(a.equalSized != b.equalSized)
        return a.equalSized;
    if(a.filled != b.filled)
        return a.filled;
    if(a.size != b.size)
        return a.size > b.size;
    return a.area > b.area;
}


function LmiLayoutHasEqualSizes(wl, numRects, lastPreferred) {
    var firstScrub, lastRect;
    if(lastPreferred > 0 && wl.w[0].s != wl.w[lastPreferred].s)
        return false;
    firstScrub = lastPreferred + 1;
    lastRect = numRects - 1;
    if(firstScrub < lastRect && wl.w[firstScrub].s != wl.w[lastRect].s)
        return false;
    if(firstScrub < numRects && wl.w[lastPreferred].s == wl.w[firstScrub].s)
        return false;

    return true;
}

function LmiLayoutIsLovely(wl, flipped) {
    return flipped ? wl.flipped : wl.lovely;
}


function LmiLayoutMakerGetLayout(numRects, numPreferred, width, height, rects, groupRank) {
    var table = layoutTable[numRects];
    var lastPreferred = (numPreferred >= 1 && numPreferred <= numRects) ? (numPreferred - 1) : (numRects - 1);
    var minVisiblePctX = layoutMaker.minVisiblePctX;
    var minVisiblePctY = layoutMaker.minVisiblePctY;
    var aspectW = layoutMaker.aspectW;
    var aspectH = layoutMaker.aspectH;

    var isFlipped = false;
    var best = {};
    var layout = null;
    var layoutRect = {};
    var layoutFlipped = false;
    var i;

    best.equalSized = false;
    best.filled = false;
    best.size = 0;
    best.area = 0;

    LmiRectangleConstruct(layoutRect, 0, 0, 1, 1); /* dummy init to avoid silly warning */

    /* Find the layout that gives a large rectangle for the last preferred
    participant, but also consider the size of the smallest rectangle. */
    for(i=0; i<table.numOptions; ++i)
    {
        var wl = table.options[i];
        var score = {};
        var f;

        score.equalSized = layoutMaker.equalSizes && LmiLayoutHasEqualSizes(wl, numRects, lastPreferred);

        if(best.equalSized && !score.equalSized)
            continue;

        for(f=0; f<2; ++f)
        {
            var flip = f == 1;
            var layoutAspectW, layoutAspectH;
            var minLayoutAspectW, minLayoutAspectH;
            var maxLayoutAspectW, maxLayoutAspectH;
            var rect = {};
            var r;

            if(layoutMaker.strict && !LmiLayoutIsLovely(wl, flip))
                continue;

            if(isFlipped != flip)
            {
                // LmiUintSwap(&width, &height);
                var t = width;
                width = height;
                height = t;

                // LmiUintSwap(&aspectW, &aspectH);
                t = aspectW;
                aspectW = aspectH;
                aspectH = t;

                // LmiUintSwap(&minVisiblePctX, &minVisiblePctY);
                t = minVisiblePctX;
                minVisiblePctX = minVisiblePctY;
                minVisiblePctY = t;

                isFlipped = flip;
            }

            layoutAspectW = wl.xd * aspectW;
            layoutAspectH = wl.yd * aspectH;
            minLayoutAspectW = minVisiblePctX * layoutAspectW;
            minLayoutAspectH = 100 * layoutAspectH;
            maxLayoutAspectW = 100 * layoutAspectW;
            maxLayoutAspectH = minVisiblePctY * layoutAspectH;

            LmiRectangleConstruct(rect, 0, 0, width, height);

            if(width * minLayoutAspectH < height * minLayoutAspectW)
            {
                LmiRectangleResizeToAspectRatio(rect, minLayoutAspectW, minLayoutAspectH, true);
                score.filled = false;
            }
            else if(width * maxLayoutAspectH > height * maxLayoutAspectW)
            {
                LmiRectangleResizeToAspectRatio(rect, maxLayoutAspectW, maxLayoutAspectH, true);
                score.filled = false;
            }
            else
                score.filled = layoutMaker.fill && wl.full;

            r = wl.w[lastPreferred];
            score.size = (LmiRectangleGetWidth(rect) * r.s / wl.xd) * (LmiRectangleGetHeight(rect) * r.s / wl.yd);

            if(lastPreferred != numRects - 1)
            {
                r = wl.w[(numRects - 1)];
                score.size += (LmiRectangleGetWidth(rect) * r.s / wl.xd) * (LmiRectangleGetHeight(rect) * r.s / wl.yd) / 10;
            }

            score.area = LmiRectangleGetArea(rect);

            if(layout == null || LmiLayoutScoreBetter(score, best))
            {
                LmiRectangleAssign(layoutRect, rect);
                layout = wl;
                layoutFlipped = isFlipped;
                best.equalSized = score.equalSized;
                best.filled = score.filled;
                best.size = score.size;
                best.area = score.area;
            }

            LmiRectangleDestruct(rect);
        }
    }

    if(layout == null)
    {
        LmiRectangleDestruct(layoutRect);
        return false;
    }

    for(i=0; i<numRects; ++i)
    {
        var rect = rects[i];
        var r = layout.w[i];

        /* Calculate width and height using both endpoints (instead of just using r->s)
        to avoid gaps between rectangles due to integer roundoff */
        var x0 = Math.floor(LmiRectangleGetLeft(layoutRect) + r.x * LmiRectangleGetWidth(layoutRect) / layout.xd);
        var x1 = Math.floor(LmiRectangleGetLeft(layoutRect) + (r.x + r.s) * LmiRectangleGetWidth(layoutRect) / layout.xd);
        var y0 = Math.floor(LmiRectangleGetTop(layoutRect) + r.y * LmiRectangleGetHeight(layoutRect) / layout.yd);
        var y1 = Math.floor(LmiRectangleGetTop(layoutRect) + (r.y + r.s) * LmiRectangleGetHeight(layoutRect) / layout.yd);

        if(layoutFlipped)
            LmiRectangleSetMinAndMax(rect, y0, x0, y1, x1);
        else
            LmiRectangleSetMinAndMax(rect, x0, y0, x1, y1);
    }

    /**
    if(groupRank != NULL)
    {
        LmiAssert(numRects > 0);
        groupRank[0] = 0;
        for(i=1; i<numRects; ++i)
        {
            if(layout->w[i].s == layout->w[i-1].s)
                groupRank[i] = groupRank[i-1];
            else
                groupRank[i] = groupRank[i-1] + 1;
        }
    }

    **/
    LmiRectangleDestruct(layoutRect);
    return true;
}

// displayCropped can be 0, 1, 2
// 0 - do not crop
// 1 - crop
// 2 - composite renderer - crop a bit
function VidyoClientGetLayout(numRects, numPreferred, width, height, displayCropped) {
    var i = 0;
    var rects = [];
    for (i = 0; i < numRects; i++)
    {
        rects[i] = {};
        LmiRectangleConstruct(rects[i], 0, 0, 0, 0);
    }

    if (displayCropped === 0)
    {
        layoutMaker.minVisiblePctX = 100;
        layoutMaker.minVisiblePctY = 100;
    }
    else if (displayCropped === 1)
    {
        layoutMaker.minVisiblePctX = 0;
        layoutMaker.minVisiblePctY = 0;
    }
    else if (displayCropped === 2)
    {
        layoutMaker.minVisiblePctX = MIN_VISIBLE_PCT_WIDTH;
        layoutMaker.minVisiblePctY = MIN_VISIBLE_PCT_HEIGHT;
    }

    if (numRects > 1)
    {
        LmiLayoutMakerGetLayout(numRects, numPreferred, width, height, rects, null);

        // add/subtract 2 to get borders around the tiles
        for (i = 0; i < numRects; i++)
        {
            rects[i].width = LmiRectangleGetWidth(rects[i]) - 2;
            rects[i].height = LmiRectangleGetHeight(rects[i]) - 2;
            rects[i].x = rects[i].x0 + 2;
            rects[i].y = rects[i].y0 + 2;
        }
    }
    else
    {
        rects[0].width = width;
        rects[0].height = height;
        rects[0].x = 0;
        rects[0].y = 0;
    }

    return rects;
}

function VidyoClientResizeToAspectRatio(attr, iw, ih) {
    var r = {};
    LmiRectangleConstruct(r, attr.x, attr.y, attr.width, attr.height);

    var w = LmiRectangleGetWidth(r), h = LmiRectangleGetHeight(r);
    var minW, minH;

    // minW = iw * (100 - ct->maxCropPctW);
    minW = iw * layoutMaker.minVisiblePctX;
    minH = ih * 100;

    if(w * minH < h * minW)
        LmiRectangleResizeToAspectRatio(r, minW, minH, true);
    else
    {
        var maxW = iw * 100;
        // var maxH = ih * (100 - ct->maxCropPctH);
        var maxH = ih * layoutMaker.minVisiblePctY;
        if(w * maxH > h * maxW)
            LmiRectangleResizeToAspectRatio(r, maxW, maxH, true);
    }
    attr.width = LmiRectangleGetWidth(r);
    attr.height = LmiRectangleGetHeight(r);
    attr.x = r.x0;
    attr.y = r.y0;
}
////////////////// VCLmiLayout.js end ////////////////////
}

/////////////////// VidyoWebRTCClientEngine.js start //////////////////////
function StopStream (streams, stopAudio, stopVideo) {
    for (var i = 0; i < streams.length; i++) {
        if (!streams[i]) {
            continue;
        }
        var audioTracks = streams[i].getAudioTracks();
        var videoTracks = streams[i].getVideoTracks();

        if (stopAudio) {
            for (var j = 0; j < audioTracks.length; j++) {
                audioTracks[j].stop();
            }
        }

        if (stopVideo) {
            for (var j = 0; j < videoTracks.length; j++) {
                videoTracks[j].stop();
            }
        }
    }
};

function GetTimeForLogging() {
    return new Date().toLocaleTimeString();
};

/** @type {Promise<void>}
 *  @description Global Promise to synchronize VideoCameras starting sequence ( mainly for FireFox, since FireFox is not able to operate several getUserMedia invocations in the same time )*/
let deviceEventsPromise = Promise.resolve();

function VidyoInputDevice(type, startCallback, stopCallback) { // type can be "AUDIO" or "VIDEO"
    var id_ = "";
    var deviceLabel_ = "";
    var pendingId_ = "";
    var constraints_ = null;
    var logLevel = (VCUtils.params && VCUtils.params.webrtcLogLevel) ? VCUtils.params.webrtcLogLevel : "info";

    function LogInfo (msg) {
        if (logLevel === "info") {
            console.log("" + VLogger.GetTimeForLogging() + " VidyoDevice[" + type + "]: " + msg);
            vidyoApp.pushToLog(" INFO: VidyoWebRTC: " + msg); // Neo Specific
        }
    };


    function LogErr (msg) {
        if (logLevel === "info" || logLevel === "error") {
            console.error("" + VLogger.GetTimeForLogging() + " VidyoDevice: " + msg);
            vidyoApp.pushToLog(" ERR: VidyoWebRTC: " + msg); // Neo Specific
        }
    };


    const DEVICE_STATE_IDLE = "DEVICE_IDLE";
    const DEVICE_STATE_STARTING = "DEVICE_STARTING";
    const DEVICE_STATE_STARTED = "DEVICE_STARTED";
    const DEVICE_STATE_STOP_PENDING = "DEVICE_STOP_PENDING"; // while starting/start pending, stop comes
    const DEVICE_STATE_START_PENDING = "DEVICE_START_PENDING"; // while in stop pending, start comes


    /*************************

          IDLE ---------------------
         |    \                    |
         |     \                   |
         |      STARTING ------STOP_PENDING
         |      /     |             |
         |     /      |             |
         |    /       |             |
        STARTED       |---------START_PENDING

    **************************/

    var stream_ = null;
    var state_ = DEVICE_STATE_IDLE;

    function noop(currentState, nextState, op) {
        LogInfo("NO-OP [" + op + "] Curr:" + currentState + " Next:" + nextState);
    };

    function startDevice(currentState, nextState, op) {
        LogInfo("startDevice: starting Label: " + deviceLabel_ + "; id: " + id_ + "; constraints: " + JSON.stringify(constraints_));
        if (stream_ !== null) {
            StopStream([stream_], type === "AUDIO", type === "VIDEO");
            stream_ = null;
        }

        if (type === "VIDEO") {
            constraints_.video.deviceId = {exact: id_};
        } else {
            constraints_.audio.deviceId = {exact: id_};
        }

        deviceEventsPromise = deviceEventsPromise.then( () => {
            return navigator.mediaDevices.getUserMedia(constraints_).then(function (str) {
                stream_ = str;
                InvokeStateMachine("deviceStarted");
                // startCallback(str);
                return Promise.resolve();
                },
                (err) => {
                    LogErr("startDevice: FAILED Label: " + deviceLabel_ + "; id: " + id_ + "; constraints: " + JSON.stringify(constraints_) + ". err: " + err.name + " " + err.toString());
                    var restartCameraWithoutConstraints = false;
                    if (err && type === "VIDEO" && constraints_.video.width) {
                        if (err.message === "Invalid constraint" || err.name === "NotReadableError") {
                            restartCameraWithoutConstraints = true;
                        }
                    }
                    if (restartCameraWithoutConstraints) {
                        delete constraints_.video.width;
                        delete constraints_.video.height;
                        startDevice(currentState, nextState, op);
                    } else {
                        InvokeStateMachine("deviceStarted"); // Will trigger startCallback with null to indicate start failure
                        InvokeStateMachine("stop");
                    }
                    return Promise.resolve();
                });
        });
    };

    function stopDevice(currentState, nextState, op) {
        deviceEventsPromise = deviceEventsPromise.then( () => {
            id_ = "";
            if (stream_ !== null) {
                StopStream([stream_], type === "AUDIO", type === "VIDEO");
                stream_ = null;
                stopCallback();
            }
            return Promise.resolve();
        });
    };

    function restartDevice(currentState, nextState, op) {
        LogInfo("restartDevice id=" + id_ + " pending=" + pendingId_);
        if (id_.length > 0 && pendingId_.length > 0 && id_ != pendingId_) {
            id_ = pendingId_;
            pendingId_ = "";
            startDevice();
        } else {
            InvokeStateMachine("deviceStarted");
        }
    };

    function deviceStarted(currentState, nextState, op) {
        startCallback(stream_);
    };

    const stateMachine_ = {
        "DEVICE_IDLE" : {
            start: {
                nextState: DEVICE_STATE_STARTING,
                operation: startDevice
            },
            stop: {
                nextState: DEVICE_STATE_IDLE,
                operation: noop
            },
            deviceStarted: {
                nextState: DEVICE_STATE_IDLE,
                operation: noop
            }
        },

        "DEVICE_STARTING" : {
            start: {
                nextState: DEVICE_STATE_STARTING,
                operation: noop
            },
            stop: {
                nextState: DEVICE_STATE_STOP_PENDING,
                operation: noop
            },
            deviceStarted: {
                nextState: DEVICE_STATE_STARTED,
                operation: deviceStarted
            }
        },

        "DEVICE_STARTED" : {
            start: {
                nextState: DEVICE_STATE_STARTED,
                operation: noop
            },
            stop: {
                nextState: DEVICE_STATE_IDLE,
                operation: stopDevice
            },
            deviceStarted: {
                nextState: DEVICE_STATE_STARTED,
                operation: noop
            }
        },

        "DEVICE_STOP_PENDING" : {
            start: {
                nextState: DEVICE_STATE_START_PENDING,
                operation: noop
            },
            stop: {
                nextState: DEVICE_STATE_STOP_PENDING,
                operation: noop
            },
            deviceStarted: {
                nextState: DEVICE_STATE_IDLE,
                operation: stopDevice
            },
        },

        "DEVICE_START_PENDING" : {
            start: {
                nextState: DEVICE_STATE_START_PENDING,
                operation: noop
            },
            stop: {
                nextState: DEVICE_STATE_STOP_PENDING,
                operation: noop
            },
            deviceStarted: {
                nextState: DEVICE_STATE_STARTING,
                operation: restartDevice
            }
        },
    };

    function InvokeStateMachine(op) {
        var prevState = state_;
        var fn = stateMachine_[state_][op].operation;
        state_ = stateMachine_[state_][op].nextState;
        LogInfo("SM: Curr=" + prevState + " Next=" + state_ + " Op=" + op);
        fn(prevState, state_, op);
    };


    this.GetDeviceId = function() {
        return id_;
    };

    this.StartDevice = function(id, constraints, deviceLabel) {
        if (id_.length <= 0) {
            id_ = id;
        } else {
            pendingId_ = id;
        }
        constraints_ = constraints;
        deviceLabel_ = deviceLabel;
        LogInfo("StartDevice Label=" + deviceLabel + "; id=" + id + "; id_=" + id_ + "; pendingId_=" + pendingId_ + " constraints=" + JSON.stringify(constraints));
        InvokeStateMachine("start");
    };

    this.StopDevice = function(id) {
        LogInfo("StopDevice id=" + id);
        InvokeStateMachine("stop");
    };

    this.SetDevice = function(id, constraints) {
        id_ = id;
        constraints_ = constraints;
        LogInfo("SetDevice id=" + id + " constraints=" + JSON.stringify(constraints));
    };

    this.StartPendingDevice = function() {
        LogInfo("StartPendingDevice id=*" + id_ + "*");
        if (id_ && id_.length > 0) {
            InvokeStateMachine("start");
        }
    };

    this.DeviceRemoved = function(id) {
        LogInfo("DeviceRemoved id=*" + id + "* *" + id_ + "*");
        if (id_ === id) {
            InvokeStateMachine("stop");
        }
    };

    this.GetState = function() {
        return {
            id: stream_ ? stream_.id : null,
            state: state_
        };
    };

    this.SetStream = function(s) {
        if (state_ !== DEVICE_STATE_IDLE) {
            LogErr("SetStream in invalid state " + state_);
            return;
        }
        stream_ = s;
        state_ = DEVICE_STATE_STARTED;
    };

    this.DiffState = function(oldState) {

        var id = stream_ ? stream_.id : null;
        if (oldState.id !== id) {
            if (oldState.id === null) {
                return "started";
            } else if (id === null) {
                return "stopped";
            } else {
                return "restarted";
            }
        }
        return "nochange";
    };

    this.GetStreamAndTrack = function () {
        if (stream_ === null) {
            return {
                stream: null,
                track: null
            };
        }

        var track;

        if (type === "VIDEO") {
            track = stream_.getVideoTracks()[0];
        } else {
            track = stream_.getAudioTracks()[0];
        }
        return {
            stream: stream_,
            track: track
        };
    };

    this.IsStarting = function() {
        return state_ === DEVICE_STATE_STARTING || state_ === DEVICE_STATE_START_PENDING;
    };

};

if(isNeo() !== true){
///////////////// VCStats.js start /////////////////
function VidyoClientWebRTCStats(t, LogInfo, LogErr) {

    const STATS_INTERVAL = 5000; // 5 seconds;
    const SHARE_VIDEO_INDEX = 0;
    const MAIN_VIDEO_INDEX = 1;

    var sendPeriodicStatsTimer_ = null;
    var peerConnectionStats_ = {};
    var peerConnection_ = null;
    var localSharePeerConnection_ = null;
    var transport_ = t;

    var maxAudio_ = 4;
    var maxVideo_ = 9;

    function InitializeStats() {
        peerConnectionStats_ = {
            timestamp: Date.now(),
            availableTxBw: 0,
            availableRxBw: 0,
            audioTxSsrc: "",
            audioTxBytes: 0,
            audioTxBitrate: 0,
            videoTxSsrc: ["", ""],
            videoTxBytes: [0, 0],
            videoTxBitrate: [0, 0],
            videoTxFrames: [0, 0],
            videoTxFramerate: [0, 0],
            videoTxFirsReceived: [0, 0],
            videoTxNacksReceived: [0, 0],
            videoTxRtt: [0, 0],
            audioRxBytes: [],
            audioRxBitrate: [],
            audioRxJitterBufferSize: [],
            audioRxPacketsLost: [],
            videoRxBytes: [],
            videoRxBitrate: [],
            videoRxPacketsLost: [],
            videoRxFrames: [],
            videoRxFramerate: [],
            videoRxJitterBufferSize: [],
            videoRxNacksSent: [],
            videoRxFirsSent: [],
        };

        for (var i = 0; i <= maxAudio_; i++) {
            peerConnectionStats_.audioRxBytes.push(0);
            peerConnectionStats_.audioRxBitrate.push(0);
            peerConnectionStats_.audioRxJitterBufferSize.push(0);
            peerConnectionStats_.audioRxPacketsLost.push(0);
        }
        for (var i = 0; i <= maxVideo_; i++) {
            peerConnectionStats_.videoRxBytes.push(0);
            peerConnectionStats_.videoRxBitrate.push(0);
            peerConnectionStats_.videoRxPacketsLost.push(0);
            peerConnectionStats_.videoRxFrames.push(0);
            peerConnectionStats_.videoRxFramerate.push(0);
            peerConnectionStats_.videoRxJitterBufferSize.push(0);
            peerConnectionStats_.videoRxNacksSent.push(0);
            peerConnectionStats_.videoRxFirsSent.push(0);
        }
    };

    function GetBitRate (b1, b2, t) {
        var bits = (b1 - b2) << 3; // Multiply by 8 to convert to bits as b1,b2 are bytes
        return (bits < 0) ? 0 : (Math.floor(bits*1000/t)); // bits / t/1000 since t is in milliseconds
    };

    function ResetVideoTxStats(index) {
        peerConnectionStats_.videoTxBytes[index] = 0;
        peerConnectionStats_.videoTxBitrate[index] = 0;
        peerConnectionStats_.videoTxFrames[index] = 0;
        peerConnectionStats_.videoTxFramerate[index] = 0;
        peerConnectionStats_.videoTxFirsReceived[index] = 0;
        peerConnectionStats_.videoTxNacksReceived[index] = 0;
    };

    function ResetAudioTxStats() {
        peerConnectionStats_.audioTxBytes = 0;
        peerConnectionStats_.audioTxBitrate = 0;
    };

    function ProcessChromeStats(response) {
        var standardReport = {};
        var reports = response.result();
        reports.forEach(function(report) {
            var standardStats = {
                id: report.id,
                timestamp: report.timestamp,
                type: {
                    localcandidate: 'local-candidate',
                    remotecandidate: 'remote-candidate'
                }[report.type] || report.type
            };
            report.names().forEach(function(name) {
                standardStats[name] = report.stat(name);
            });
            standardReport[standardStats.id] = standardStats;
        });
        return standardReport;
    };

    function SetChromeTxStats(stats, timediff, index) {
        var audioTxKey = "";
        var videoTxKey = "";
        var bytes = 0;

        var CheckSsrcInSdp = function(k, index) {
            var ssrc = k.replace("ssrc_", "").replace("_send", "");

            if (index === MAIN_VIDEO_INDEX  && peerConnection_.localDescription.sdp.indexOf(ssrc) !== -1) {
                return ssrc;
            } else if (index === SHARE_VIDEO_INDEX && localSharePeerConnection_ && localSharePeerConnection_.localDescription.sdp.indexOf(ssrc) !== -1) {
                return ssrc;
            }
            return "";
        };

        for (var k in stats) {
            if (k.indexOf("_send") !== -1) {
                var ssrc = CheckSsrcInSdp(k, index);

                if (ssrc.length <= 0) {
                    continue;
                }
                if (stats[k].mediaType == "video") {
                    videoTxKey = k;
                    if (peerConnectionStats_.videoTxSsrc[index] !== ssrc) {
                        peerConnectionStats_.videoTxSsrc[index] = ssrc;
                        ResetVideoTxStats(index);
                    }
                } else if (stats[k].mediaType == "audio") {
                    audioTxKey = k
                    if (peerConnectionStats_.audioTxSsrc !== ssrc) {
                        peerConnectionStats_.audioTxSsrc = ssrc;
                        ResetAudioTxStats();
                    }
                } else {
                    LogErr("Unknown send stats[" + k + "]: " + JSON.stringify(stats[k]));
                }
            }
        }

        if (audioTxKey.length > 0) {
            bytes = parseInt(stats[audioTxKey].bytesSent, 10);
            peerConnectionStats_.audioTxBitrate = GetBitRate(bytes, peerConnectionStats_.audioTxBytes, timediff);
            peerConnectionStats_.audioTxBytes = bytes;
        } else {
            ResetAudioTxStats();
        }

        if (videoTxKey.length > 0) {
            bytes = parseInt(stats[videoTxKey].bytesSent, 10);
            peerConnectionStats_.videoTxBitrate[index] = GetBitRate(bytes, peerConnectionStats_.videoTxBytes[index], timediff);
            peerConnectionStats_.videoTxBytes[index] = bytes;
            peerConnectionStats_.videoTxFramerate[index] = parseInt(stats[videoTxKey].googFrameRateSent, 10);
            peerConnectionStats_.videoTxFirsReceived[index] = parseInt(stats[videoTxKey].googFirsReceived, 10) + parseInt(stats[videoTxKey].googPlisReceived, 10);
            peerConnectionStats_.videoTxNacksReceived[index] = parseInt(stats[videoTxKey].googNacksReceived, 10);
            peerConnectionStats_.videoTxRtt[index] = parseInt(stats[videoTxKey].googRtt, 10);
        } else {
            ResetVideoTxStats(index);
        }
    };

    function GetChromeShareStats(timediff, callback) {
        if (!localSharePeerConnection_) {
            ResetVideoTxStats(SHARE_VIDEO_INDEX);
            callback(true);
            return;
        }

        localSharePeerConnection_.getStats(function(s) {
            var stats = ProcessChromeStats(s);
            SetChromeTxStats(stats, timediff, SHARE_VIDEO_INDEX);
            callback(true);
        }, function(err) {
            LogErr("SharePeerConnection GetStats err " + err);
            callback(true);
        });
    };

    function GetChromeStats(callback) {

        peerConnection_.getStats(function(s) {
            var stats = ProcessChromeStats(s);
            var timestamp = Date.now();
            var timediff = peerConnectionStats_.timestamp > 0 ? timestamp - peerConnectionStats_.timestamp : STATS_INTERVAL;
            peerConnectionStats_.timestamp = timestamp;
            peerConnectionStats_.interval = timediff;

            var bytes = 0;

            SetChromeTxStats(stats, timediff, MAIN_VIDEO_INDEX);

            if (stats.bweforvideo) {
                peerConnectionStats_.availableTxBw = parseInt(stats.bweforvideo.googAvailableSendBandwidth, 10);
                peerConnectionStats_.availableRxBw = parseInt(stats.bweforvideo.googAvailableReceiveBandwidth, 10);
            }

            for (var i = 1; i <= maxAudio_; i++) {
                var audioRxKey = "ssrc_1000" + i + "_recv";
                if (stats[audioRxKey]) {
                    bytes = parseInt(stats[audioRxKey].bytesReceived, 10);
                    peerConnectionStats_.audioRxBitrate[i] = GetBitRate(bytes, peerConnectionStats_.audioRxBytes[i], timediff);
                    peerConnectionStats_.audioRxBytes[i] = bytes;
                    peerConnectionStats_.audioRxJitterBufferSize[i] = parseInt(stats[audioRxKey].googJitterBufferMs, 10);
                    peerConnectionStats_.audioRxPacketsLost[i] = parseInt(stats[audioRxKey].packetsLost, 10);
                }
            }
            for (var i = 1; i <= maxVideo_; i++) {
                var videoRxKey = "ssrc_5000" + i + "_recv";
                if (stats[videoRxKey]) {
                    bytes = parseInt(stats[videoRxKey].bytesReceived, 10);
                    peerConnectionStats_.videoRxBitrate[i] = GetBitRate(bytes, peerConnectionStats_.videoRxBytes[i], timediff);
                    peerConnectionStats_.videoRxBytes[i] = bytes;
                    peerConnectionStats_.videoRxPacketsLost[i] = parseInt(stats[videoRxKey].packetsLost, 10);
                    peerConnectionStats_.videoRxFramerate[i] = parseInt(stats[videoRxKey].googFrameRateOutput, 10);
                    peerConnectionStats_.videoRxJitterBufferSize[i] = parseInt(stats[videoRxKey].googJitterBufferMs, 10);
                    peerConnectionStats_.videoRxNacksSent[i] = parseInt(stats[videoRxKey].googNacksSent, 10);
                    peerConnectionStats_.videoRxFirsSent[i] = parseInt(stats[videoRxKey].googFirsSent, 10) + parseInt(stats[videoRxKey].googPlisSent, 10);
                }
            }
            GetChromeShareStats(timediff, callback);
        }, function(err) {
            LogErr("PeerConnection GetStats err " + err);
            callback(false);
        });
    };

    function SetStandardTxStats(stats, timediff, index) {
        var audioTxKey = "";
        var videoTxKey = "";
        var bytes = 0;

        var CheckSsrcInSdp = function(ssrc, index) {

            if (index === MAIN_VIDEO_INDEX  && peerConnection_.localDescription.sdp.indexOf(ssrc) !== -1) {
                return "" + ssrc;
            } else if (index === SHARE_VIDEO_INDEX && localSharePeerConnection_ && localSharePeerConnection_.localDescription.sdp.indexOf(ssrc) !== -1) {
                return "" + ssrc;
            }
            return "";
        };

        stats.forEach(function(k) {
            if (k.type === "outboundrtp" || k.type === "outbound-rtp") {
                var ssrc = CheckSsrcInSdp(k.ssrc, index);
                if (ssrc.length <= 0) {
                    return;
                }
                if (k.mediaType == "video") {
                    videoTxKey = k.id;
                    if (peerConnectionStats_.videoTxSsrc[index] !== ssrc) {
                        peerConnectionStats_.videoTxSsrc[index] = ssrc;
                        ResetVideoTxStats(index);
                    }
                } else if (k.mediaType == "audio") {
                    audioTxKey = k.id;
                    if (peerConnectionStats_.audioTxSsrc !== ssrc) {
                        peerConnectionStats_.audioTxSsrc = ssrc;
                        ResetAudioTxStats();
                    }
                } else {
                    LogErr("Unknown send stats[" + k + "]: " + JSON.stringify(stats[k]));
                }
            } else if (k.type === "candidate-pair") {
                if (k.hasOwnProperty("availableIncomingBitrate")) {
                    peerConnectionStats_.availableRxBw = Math.floor(k.availableIncomingBitrate/1000);
                }
                if (k.hasOwnProperty("availableOutgoingBitrate")) {
                    peerConnectionStats_.availableTxBw = Math.floor(k.availableOutgoingBitrate/1000);
                }
            }
        });

        if (audioTxKey.length > 0) {
            var audioStats = stats.get(audioTxKey);
            bytes = audioStats.bytesSent;
            peerConnectionStats_.audioTxBitrate = GetBitRate(bytes, peerConnectionStats_.audioTxBytes, timediff);
            peerConnectionStats_.audioTxBytes = bytes;
        } else {
            ResetAudioTxStats();
        }

        if (videoTxKey.length > 0) {
            var videoStats = stats.get(videoTxKey);
            bytes = videoStats.bytesSent;
            peerConnectionStats_.videoTxBitrate[index] = GetBitRate(bytes, peerConnectionStats_.videoTxBytes[index], timediff);
            peerConnectionStats_.videoTxBytes[index] = bytes;
            if (videoStats.hasOwnProperty("framerateMean")) {
                peerConnectionStats_.videoTxFramerate[index] = Math.floor(videoStats.framerateMean);
            } else if (videoStats.hasOwnProperty("framesEncoded")) {
                peerConnectionStats_.videoTxFramerate[index] = Math.floor((videoStats.framesEncoded - peerConnectionStats_.videoTxFrames[index]) / (timediff/1000));
                peerConnectionStats_.videoTxFrames[index] = videoStats.framesEncoded;
            }
        } else {
            ResetVideoTxStats(index);
        }
    };

    function GetStandardShareStats(timediff, callback) {
        if (!localSharePeerConnection_) {
            ResetVideoTxStats(SHARE_VIDEO_INDEX);
            callback(true);
            return;
        }

        localSharePeerConnection_.getStats(null).then(function(stats) {
            SetStandardTxStats(stats, timediff, SHARE_VIDEO_INDEX);
            callback(true);
        }).catch(function(err) {
            LogErr("SharePeerConnection GetStats err " + err);
            callback(true);
        });
    };

    function GetStandardStats(callback) {
        peerConnection_.getStats(null).then(function(stats) {
            var timestamp = Date.now();
            var timediff = peerConnectionStats_.timestamp > 0 ? timestamp - peerConnectionStats_.timestamp : STATS_INTERVAL;
            peerConnectionStats_.timestamp = timestamp;
            peerConnectionStats_.interval = timediff;

            var bytes = 0;

            SetStandardTxStats(stats, timediff, MAIN_VIDEO_INDEX);

            for (var i = 1; i <= maxAudio_; i++) {
                var audioRxKey = "inbound_rtp_audio_" + (i-1);
                var audioStats = stats.get(audioRxKey);
                if (!audioStats) {
                    audioRxKey = "RTCInboundRTPAudioStream_1000" + i;
                    audioStats = stats.get(audioRxKey);
                }
                if (audioStats) {
                    bytes = audioStats.bytesReceived;
                    peerConnectionStats_.audioRxBitrate[i] = GetBitRate(bytes, peerConnectionStats_.audioRxBytes[i], timediff);
                    peerConnectionStats_.audioRxBytes[i] = bytes;
                    peerConnectionStats_.audioRxJitterBufferSize[i] = Math.floor(audioStats.jitter);
                    peerConnectionStats_.audioRxPacketsLost[i] = audioStats.packetsLost;
                }
            }

            for (var i = 1; i <= maxVideo_; i++) {
                var videoRxKey = "inbound_rtp_video_" + ((i-1) + maxAudio_);
                var videoStats = stats.get(videoRxKey);
                if (!videoStats) {
                    videoRxKey = "RTCInboundRTPVideoStream_5000" + i;
                    videoStats = stats.get(videoRxKey);
                }
                if (videoStats) {
                    bytes = videoStats.bytesReceived;
                    peerConnectionStats_.videoRxBitrate[i] = GetBitRate(bytes, peerConnectionStats_.videoRxBytes[i], timediff);
                    peerConnectionStats_.videoRxBytes[i] = bytes;
                    peerConnectionStats_.videoRxPacketsLost[i] = videoStats.packetsLost;
                    if (videoStats.hasOwnProperty("framerateMean")) {
                        peerConnectionStats_.videoRxFramerate[i] = Math.floor(videoStats.framerateMean);
                    } else if (videoStats.hasOwnProperty("framesDecoded")) {
                        peerConnectionStats_.videoRxFramerate[i] = Math.floor((videoStats.framesDecoded - peerConnectionStats_.videoRxFrames[i]) / (timediff/1000));
                        peerConnectionStats_.videoRxFrames[i] = videoStats.framesDecoded;
                    }
                    peerConnectionStats_.videoRxJitterBufferSize[i] = Math.floor(videoStats.jitter);
                }
            }
            GetStandardShareStats(timediff, callback);
        }).catch(function(err) {
            LogErr("PeerConnection GetStats Err " + err);
            callback(false);
        });
    };

    function SendPeriodicStats() {
        if (!peerConnection_) {
            return;
        }

        var SendStats = function(status) {
            if (status) {
                var stats = JSON.parse(JSON.stringify(peerConnectionStats_));

                delete stats.audioTxSsrc;
                delete stats.audioTxBytes;
                delete stats.videoTxSsrc;
                delete stats.videoTxBytes;
                delete stats.videoTxFrames;
                delete stats.audioRxBytes;
                delete stats.videoRxBytes;
                delete stats.videoRxFrames;


                var statsMsg = {
                    method: "VidyoWebRTCStats",
                    stats: stats
                };

                transport_.SendWebRTCMessage(statsMsg, function() {
                    sendPeriodicStatsTimer_ = setTimeout(SendPeriodicStats, STATS_INTERVAL);
                });
            } else {
                LogErr("GetStats failed");
            }
        };

        if (window.adapter.browserDetails.browser === "chrome") {
            GetChromeStats(SendStats);
        } else if (window.adapter.browserDetails.browser === "firefox" || window.adapter.browserDetails.browser === "safari") {
            GetStandardStats(SendStats);
        }
    };

    this.Start = function(pc, maxAudio, maxVideo) {
        if(sendPeriodicStatsTimer_){
            return;
        }
        peerConnection_ = pc;
        maxAudio_ = maxAudio;
        maxVideo_ = maxVideo;
        InitializeStats();
        sendPeriodicStatsTimer_ = setTimeout(SendPeriodicStats, STATS_INTERVAL);
    };

    this.Stop = function() {
        sendPeriodicStatsTimer_ = null;
        peerConnection_ = null;
        localSharePeerConnection_ = null;
    };

    this.SetSharePeerConnection = function(pc) {
        localSharePeerConnection_ = pc;
    };
};
VidyoTranscodingContext.VidyoClientWebRTCStats = VidyoClientWebRTCStats;
///////////////// VCStats.js end ///////////////////
}

//  TODO: streamMapping_ should be refactored to have sourceId in streamMapping_.sourceId attribute always (not in previewSourceId for the preview)
//  TODO: and use streamMapping_.type to determine if it a preview on not ( across whole transcoding code base )
    /** @typedef  {{sourceId: string, streamId: number, previewSourceId:string, attached: boolean, type: string, viewId: string,  name: string}}  streamMappingItem
     * @description viewId - is VidyoIO specific */

/////////////////////////////////////////// VidyoClientWebRTC /////////////////////////////////////
    function VidyoClientWebRTC(t) {
        var self = this;
        self.initializedState = "NOTINITIALIZED";

        var transport_ = t;

        const maxShareResolution_ = "1080p";
        const maxShareFrameRate_ = 10;

        // NEO specific - Driven by ice connection state changes
        const MEDIASTATE_IDLE = "MEDIA_IDLE";
        const MEDIASTATE_CONNECTING = "MEDIA_CONNECTING";
        const MEDIASTATE_CONNECTED = "MEDIA_CONNECTED";
        /** @type {string} */
        var mediaState_ = MEDIASTATE_IDLE;

        var peerConnection_ = null;
        var additionalPc_ = [];
        var additionalOffers_ = [];
        var additionalIceCandidates_ = [];
        var peerConnectionStats_ = new VidyoTranscodingContext.VidyoClientWebRTCStats(transport_, LogInfo, LogErr);
        var peerConnectionAudioTransceiver_ = null;
        var peerConnectionVideoTransceiver_ = null;

        // TODO: now we support correctly a single-camera endpoint only.
        //  Since that we have mess in Device's StateMachine as several camera using (especially in case some of them locked by other applications).
        //  The issue is almost always rises up for Chrome-74
        var camera_ = new VidyoInputDevice("VIDEO", CameraStarted, CameraStopped);
        var mic_ = new VidyoInputDevice("AUDIO", MicStarted, MicStopped);

        var cameraState_ = null;
        var micState_ = null;

        /** @type {Array.<HTMLAudioElement>} */
        var remoteAudio_ = [];
        var currentAudioIndex_ = 0;

        var devices_ = null;
        var deviceStorage_ = null;
        var offer_ = null;
        /** @type {Object.<string, streamMappingItem>} */
        let streamMapping_ = {};
        var micStream_ = null;
        var videoStreams_ = [null]; // localCamera always has VidyoTranscodingContext.LOCAL_STREAM_ID=0 index
        var maxResolution_ = "360p";
        var maxSubscriptions_ = 8;
        var startCallData_ = null;
        /** @type {Promise} */
        let peerConnectionStatePromise = null;

        var localShareId_ = -1;
        var pendingRequestId_ = -1;
        var shareSelectedCallback_ = null;
        var shareStreamOnInactiveCallback_ = null;

        var localSharePeerConnection_ = null;
        var localShareStream_ = [];
        var localShareElement_ = null;
        var localShareOffer_ = null;
        var localShareOfferInProgress_ = false;
        var iceCandidateTimeout_ = null;

        var googleAuthCallback_ = null;
        var googleAuthWindow_ = null;

        /** @type {LayoutEngine} */
        var _UILayoutEngine = VidyoTranscodingContext.LayoutEngine.initUILayout(streamMapping_, videoStreams_, localShareStream_, transport_);

        /** @type {AudioMeter} */
        let audioMeter = new VidyoTranscodingContext.AudioMeter(mic_, remoteAudio_);

        const CALLSTATE_IDLE = "IDLE";
        const CALLSTATE_WAITING_FOR_DEVICES = "WAITING_FOR_DEVICES";
        const CALLSTATE_GETTING_OFFER = "GETTING_OFFER";
        const CALLSTATE_WAITING_FOR_ANSWER = "WAITING_FOR_ANSWER";
        const CALLSTATE_CONNECTING = "CONNECTING";
        const CALLSTATE_CONNECTED = "CONNECTED";
        const CALLSTATE_DISCONNECTING = "DISCONNECTING";
        const CALLSTATE_RENEGOTIATE_PENDING = "RENEGOTIATE_PENDING";

        var callState_ = CALLSTATE_IDLE;
        const stateMachine_ = {
            [CALLSTATE_IDLE]: {
                startCall: {
                    nextState: CALLSTATE_WAITING_FOR_DEVICES,
                    operation: CheckForDevices,
                },
                gotOffer: {
                    nextState: CALLSTATE_IDLE,
                    operation: noop
                },
                gotAnswer: {
                    nextState: CALLSTATE_IDLE,
                    operation: noop
                },
                signalingStable: {
                    nextState: CALLSTATE_IDLE,
                    operation: noop
                },
                stopCall : {
                    nextState: CALLSTATE_IDLE,
                    operation: noop
                },
                deviceStateChanged: {
                    nextState: CALLSTATE_IDLE,
                    operation: noop
                },
            },

            [CALLSTATE_WAITING_FOR_DEVICES]: {
                startCall: {
                    nextState: CALLSTATE_GETTING_OFFER,
                    operation: HandleStartCall
                },
                gotOffer: {
                    nextState: CALLSTATE_WAITING_FOR_DEVICES,
                    operation: noop
                },
                gotAnswer: {
                    nextState: CALLSTATE_WAITING_FOR_DEVICES,
                    operation: noop
                },
                signalingStable: {
                    nextState: CALLSTATE_WAITING_FOR_DEVICES,
                    operation: noop
                },
                stopCall : {
                    nextState: CALLSTATE_DISCONNECTING,
                    operation: noop
                },
                deviceStateChanged: {
                    nextState: CALLSTATE_WAITING_FOR_DEVICES,
                    operation: CheckForDevices
                },
            },

            [CALLSTATE_GETTING_OFFER] : {
                startCall: {
                    nextState: CALLSTATE_GETTING_OFFER,
                    operation: noop
                },
                gotOffer: {
                    nextState: CALLSTATE_WAITING_FOR_ANSWER,
                    operation: SendLocalOffer
                },
                gotAnswer: {
                    nextState: CALLSTATE_IDLE,
                    operation: noop
                },
                signalingStable: {
                    nextState: CALLSTATE_GETTING_OFFER,
                    operation: noop
                },
                stopCall : {
                    nextState: CALLSTATE_IDLE,
                    operation: HandleStopCall
                },
                deviceStateChanged: {
                    nextState: CALLSTATE_RENEGOTIATE_PENDING,
                    operation: noop
                },
            },

            [CALLSTATE_WAITING_FOR_ANSWER] : {
                startCall: {
                    nextState: CALLSTATE_WAITING_FOR_ANSWER,
                    operation: noop
                },
                gotOffer: {
                    nextState: CALLSTATE_WAITING_FOR_ANSWER,
                    operation: noop
                },
                gotAnswer: {
                    nextState: CALLSTATE_CONNECTING,
                    operation: HandleAnswerSdp
                },
                signalingStable: {
                    nextState: CALLSTATE_WAITING_FOR_ANSWER,
                    operation: noop
                },
                stopCall : {
                    nextState: CALLSTATE_IDLE,
                    operation: HandleStopCall
                },
                deviceStateChanged: {
                    nextState: CALLSTATE_RENEGOTIATE_PENDING,
                    operation: noop
                },
            },

            [CALLSTATE_CONNECTING] : {
                startCall: {
                    nextState: CALLSTATE_CONNECTING,
                    operation: noop
                },
                gotOffer: {
                    nextState: CALLSTATE_CONNECTING,
                    operation: noop
                },
                gotAnswer: {
                    nextState: CALLSTATE_CONNECTING,
                    operation: noop
                },
                signalingStable: {
                    nextState: CALLSTATE_CONNECTED,
                    operation: noop
                },
                stopCall : {
                    nextState: CALLSTATE_IDLE,
                    operation: HandleStopCall
                },
                deviceStateChanged: {
                    nextState: CALLSTATE_RENEGOTIATE_PENDING,
                    operation: noop
                },
            },


            [CALLSTATE_CONNECTED] : {
                startCall: {
                    nextState: CALLSTATE_CONNECTED,
                    operation: noop
                },
                gotOffer: {
                    nextState: CALLSTATE_CONNECTED,
                    operation: noop
                },
                gotAnswer: {
                    nextState: CALLSTATE_CONNECTED,
                    operation: noop
                },
                signalingStable: {
                    nextState: CALLSTATE_CONNECTED,
                    operation: noop
                },
                stopCall : {
                    nextState: CALLSTATE_IDLE,
                    operation: HandleStopCall
                },
                deviceStateChanged: {
                    nextState: CALLSTATE_GETTING_OFFER,
                    operation: AddRemoveStreams
                },
            },

            [CALLSTATE_DISCONNECTING]: {
                startCall: {
                    nextState: CALLSTATE_IDLE,
                    operation: HandleStopCall
                },
                gotOffer: {
                    nextState: CALLSTATE_IDLE,
                    operation: HandleStopCall
                },
                gotAnswer: {
                    nextState: CALLSTATE_IDLE,
                    operation: HandleStopCall
                },
                signalingStable: {
                    nextState: CALLSTATE_IDLE,
                    operation: HandleStopCall
                },
                stopCall : {
                    nextState: CALLSTATE_IDLE,
                    operation: HandleStopCall
                },
                deviceStateChanged: {
                    nextState: CALLSTATE_IDLE,
                    operation: HandleStopCall
                },
            },

            [CALLSTATE_RENEGOTIATE_PENDING]: {
                startCall: {
                    nextState: CALLSTATE_RENEGOTIATE_PENDING,
                    operation: noop
                },
                gotOffer: {
                    nextState: CALLSTATE_RENEGOTIATE_PENDING,
                    operation: SendLocalOffer
                },
                gotAnswer: {
                    nextState: CALLSTATE_RENEGOTIATE_PENDING,
                    operation: HandleAnswerSdp,
                },
                signalingStable: {
                    nextState: CALLSTATE_GETTING_OFFER,
                    operation: AddRemoveStreams,
                },
                stopCall : {
                    nextState: CALLSTATE_IDLE,
                    operation: HandleStopCall
                },
                deviceStateChanged: {
                    nextState: CALLSTATE_RENEGOTIATE_PENDING,
                    operation: noop
                },
            }
        };

        function noop(currentState, nextState, op) {
            LogInfo("NO-OP [" + op + "] Curr:" + currentState + " Next:" + nextState);
        };

        function InvokeStateMachine(op, data) {
            var prevState = callState_;
            var fn = stateMachine_[prevState][op].operation;
            callState_ = stateMachine_[prevState][op].nextState;
            LogInfo("SM: Curr=" + prevState + " Next=" + callState_ + " Op=" + op);
            fn(prevState, callState_, op, data);
        };


        const resolutionMap_ = {
            "180p" : { w: 320,  h: 180,   br: "256"},
            "240p" : { w: 426,  h: 240,   br: "384"},
            "270p" : { w: 480,  h: 270,   br: "448"},
            "360p" : { w: 640,  h: 360,   br: "512"},
            "480p" : { w: 854,  h: 480,   br: "768"},
            "540p" : { w: 960,  h: 540,   br: "1024"},
            "720p" : { w: 1280, h: 720,   br: "1536"},
            "1080p": { w: 1920, h: 1080,  br: "2048"},
        };

        var peerConnectionConstraints_ = {
            iceServers: []
        };
        if (window.adapter.browserDetails.browser === "chrome") {
            peerConnectionConstraints_.sdpSemantics = 'plan-b';
        }

        for (var r = 0; r < VidyoTranscodingContext.MAX_REMOTE_AUDIO_STREAMS; r++) {
            remoteAudio_[r] = document.createElement("audio");
            remoteAudio_[r].autoplay = true;
        }

        window.addEventListener("message", WindowMessageHandler);
        window.addEventListener("unload", () => SendUninitialize(true));

        var logLevel = (VCUtils.params && VCUtils.params.webrtcLogLevel) ? VCUtils.params.webrtcLogLevel : "info";

        function LogInfo (msg) {
            if (logLevel === "info") {
                console.log("" + VLogger.GetTimeForLogging() + " VidyoClientWebRTC: " + msg);
                vidyoApp.pushToLog(" INFO: VidyoWebRTC: " + msg); // Neo Specific
            }
        }

        function LogErr (msg) {
            if (logLevel === "info" || logLevel === "error") {
                console.error("" + VLogger.GetTimeForLogging() + " VidyoClientWebRTC: " + msg);
                vidyoApp.pushToLog(" ERR: VidyoWebRTC: " + msg); // Neo Specific
            }
        }

        function CameraStarted(stream) {
            var streamDetails = "null";
            if (stream) {
                var tracks = stream.getVideoTracks();
                if (tracks.length) {
                    streamDetails = "" + stream.id + " *" + tracks[0].label + "*";
                } else {
                    streamDetails = "" + stream.id + " No label";
                }
            }
            LogInfo("CameraStarted stream=" + streamDetails);
            if (window.adapter.browserDetails.browser === "chrome") {
            } else {
                mic_.StartPendingDevice();
            }
            videoStreams_[VidyoTranscodingContext.LOCAL_STREAM_ID] = stream;

            let sourceName = "Preview";
            if (streamMapping_.hasOwnProperty(VidyoTranscodingContext.PREVIEW_SOURCE_ID)){
                sourceName = streamMapping_[VidyoTranscodingContext.PREVIEW_SOURCE_ID].name || sourceName;
            }

            // CreateSourceIdEntryInStreamMappingAndAttachVideo({sourceId: VidyoTranscodingContext.PREVIEW_SOURCE_ID, streamId: VidyoTranscodingContext.LOCAL_STREAM_ID, attached: false, type: VidyoTranscodingContext.STREAM_TYPE_PREVIEW, name: "Preview"});
            CreateSourceIdEntryInStreamMappingAndAttachVideo({sourceId: VidyoTranscodingContext.PREVIEW_SOURCE_ID, streamId: VidyoTranscodingContext.LOCAL_STREAM_ID, attached: false, type: VidyoTranscodingContext.STREAM_TYPE_PREVIEW, name: sourceName});

            if (stream !== null) {
                InvokeStateMachine("deviceStateChanged");
            }
        };

        function CameraStopped() {
            LogInfo("CameraStopped");
            videoStreams_[VidyoTranscodingContext.LOCAL_STREAM_ID] = null;
            InvokeStateMachine("deviceStateChanged");
        };

        function MicStarted(stream) {
            var streamDetails = "null";
            if (stream) {
                var tracks = stream.getAudioTracks();
                if (tracks.length) {
                    streamDetails = "" + stream.id + " *" + tracks[0].label + "*";
                } else {
                    streamDetails = "" + stream.id + " No label";
                }
            }
            LogInfo("MicrophoneStarted stream=" + streamDetails);
            if (stream !== null) {
                InvokeStateMachine("deviceStateChanged");
                if (VidyoTranscodingContext.SHOW_AUDIO_METERS) {
                    audioMeter.StartLocalAudioLevelDetection();
                }
            }
        };

        function MicStopped() {
            LogInfo("MicrophoneStopped");
            InvokeStateMachine("deviceStateChanged");
            if (VidyoTranscodingContext.SHOW_AUDIO_METERS) {
                audioMeter.StopLocalAudioLevelDetection();
            }
        }

        function CreateSourceIdEntryInStreamMappingAndAttachVideo(streamMapInfo) {
            var sourceId = streamMapInfo.sourceId;
            if (!streamMapping_.hasOwnProperty(sourceId)) {
                streamMapping_[sourceId] = {
                    attached: false
                }
            }

            for (var k in streamMapInfo) {
                streamMapping_[sourceId][k] = streamMapInfo[k];
            }

            _UILayoutEngine.AttachVideo(sourceId);
        }
        this.CreateSourceIdEntryInStreamMappingAndAttachVideo = CreateSourceIdEntryInStreamMappingAndAttachVideo;

    function GetDevicesPostGetUserMedia(constraints, cb) {
        navigator.mediaDevices.getUserMedia(constraints).
        then(function(stream) {
            GetDevices().then((devices) => {
                StopStream([stream], true, true);
                cb(true, devices);
            });
        }).
        catch(function(err) {
            LogErr("getUserMediaFailed " + err.name + " - " + err.toString());
            console.log(err);
            cb(false, []);
        });
    };

    function GetDevices() {
        if (window.adapter.browserDetails.browser === 'safari') {
            return GetDevicesSafari();
        }

        return Promise.all([
            navigator.mediaDevices.getUserMedia({ audio: { deviceId: mic_.GetDeviceId() }})
                .then((stream) => Promise.resolve({ audioinput: stream }))
                .catch((error) => LogErr(`GetDevices: audioinput: ${error}`)),

            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => Promise.resolve({ videoinput: stream }))
                .catch((error) => LogErr(`GetDevices: videoinput: ${error}`))

        ]).then((userMedia) => {
            return Promise.resolve(Object.assign({}, ...userMedia));
        }).then(async (streams) => {
            let devices = await navigator.mediaDevices.enumerateDevices().then((devs) => {
                return devs.filter((d) => {
                    if (isNeo()) {
                        if (d.deviceId === 'communications') {
                            return false;
                        }
                    }
                    if (/.*?input$/.test(d.kind) && !(d.kind in streams)) {
                        return false;
                    }
                    if (/.*?output$/.test(d.kind) && !(d.label)) {
                        return false;
                    }
                    if (window.adapter.browserDetails.browser === 'firefox' && d.label.includes('CubebAggregateDevice')) {
                        // On firefox, browser generates a CubebAggregateDevice which is not a real audio device
                        return false;
                    }
                    return true;
                });
            });

            StopStream(Object.values(streams), true, true);

            LogInfo(`GetDevices:${devices.map((device) => ` ${device.kind}:"${device.label}"`)}`);
            return Promise.resolve(devices);
        }).catch((error) => {
            LogErr(`GetDevices: ${error}`);
            return Promise.resolve([]);
        });
    };

    async function GetDevicesSafari() {
        const devices_ = await navigator.mediaDevices.enumerateDevices();
        const constraints = {
            audio: devices_.some(({ kind }) => kind === 'audioinput') && { deviceId: mic_.GetDeviceId() },
            video: devices_.some(({ kind }) => kind === 'videoinput')
        };

        LogInfo(`GetDevices[Safari]: constraints: ${JSON.stringify(constraints)}`);

        return navigator.mediaDevices.getUserMedia(constraints).then(async (stream) => {
            let devices = await navigator.mediaDevices.enumerateDevices().then((devs) => {
                return devs.filter((d) => {
                    if (!d.label) {
                        return false;
                    }
                    return true;
                });
            });

            StopStream([stream], true, true);

            LogInfo(`GetDevices[Safari]:${devices.map((device) => ` ${device.kind}:"${device.label}"`)}`);
            return Promise.resolve(devices);
        }).catch((error) => {
            LogErr(`GetDevices[Safari]: ${error}`);
            return Promise.resolve([]);
        });
    };

    function DiffDevices(oldDevices, newDevices) {
        let getDeviceId = function(d) {
            return `${d.kind}:${d.deviceId}:${d.groupId}`;
        };

        let oldDeviceIds = oldDevices.map(getDeviceId);
        let newDeviceIds = newDevices.map(getDeviceId);

        let addedDevices = newDevices.filter(function(d) {
            return oldDeviceIds.indexOf(getDeviceId(d)) === -1;
        });

        let removedDevices = oldDevices.filter(function(d) {
            return newDeviceIds.indexOf(getDeviceId(d)) === -1;
        });

        return {
            added: addedDevices,
            removed: removedDevices
        };
    };

        function GetDevicesUpdateObject() {
            return {
                method: "VidyoWebRTCDevicesUpdated",
                added: {
                    microphones: [],
                    cameras: [],
                    speakers: []
                },
                removed: {
                    microphones: [],
                    cameras: [],
                    speakers: []
                }
            };

        };

    function SendDevicesUpdated(added, removed, callback) {
        var deviceUpdate = GetDevicesUpdateObject();
        ConvertToDeviceInfo(added, deviceUpdate.added.microphones, deviceUpdate.added.cameras, deviceUpdate.added.speakers);
        ConvertToDeviceInfo(removed, deviceUpdate.removed.microphones, deviceUpdate.removed.cameras, deviceUpdate.removed.speakers);

        if (deviceUpdate.removed.microphones.length > 0) {
            for (var i = 0; i < deviceUpdate.removed.microphones.length; i++) {
                mic_.DeviceRemoved(deviceUpdate.removed.microphones[i].id);
            }
        }

        if (deviceUpdate.removed.cameras.length > 0) {
            for (var j = 0; j < deviceUpdate.removed.cameras.length; j++) {
                camera_.DeviceRemoved(deviceUpdate.removed.cameras[j].id);
            }
        }

        transport_.SendWebRTCMessage(deviceUpdate, function() {
            LogInfo("DeviceUpdate sent: " + JSON.stringify(deviceUpdate));
            callback();
        });
    };

    function NeoSendDevicesUpdated(added, removed, callback) {
        const deviceId = mic_.GetDeviceId();

        const switched = added.find((devA) => {
            return removed.find((devB) => {
                return devA.kind === devB.kind && devA.deviceId === devB.deviceId;
            });
        });

        if (switched) {
            const isRestartNeeded = switched.deviceId === deviceId;
            const filterSwitched = d => d.deviceId !== switched.deviceId;

            LogInfo(`NeoSendDevicesUpdated: filter the switched ${switched.kind} with id=${switched.deviceId}`);

            removed = removed.filter(filterSwitched);
            added = added.filter(filterSwitched);

            if (isRestartNeeded && switched.kind === 'audioinput') {
                LogInfo('NeoSendDevicesUpdated: restarting the switched device because it is being used');
                mic_.StopDevice(deviceId);

                setTimeout(() => {
                    mic_.StartDevice(deviceId, { audio: { deviceId }});
                });
            }

            if (!added.length && !removed.length) {
                return LogInfo('NeoSendDevicesUpdated: nothing to send');
            }
        }

        SendDevicesUpdated(added, removed, callback);
    }

    function CheckForDeviceUpdate(callback) {
        if (typeof callback != "function") {
            callback = function() { };
        }
        GetDevices().then((devices) => {
            var diff = DiffDevices(devices_, devices);
            if (diff.added.length > 0 || diff.removed.length > 0) {
                devices_ = devices;

                if (isNeo()) {
                    NeoSendDevicesUpdated(diff.added, diff.removed, callback);
                } else {
                    SendDevicesUpdated(diff.added, diff.removed, callback);
                }

            } else {
                callback();
            }
        });
    };

    function ConvertToDeviceInfo(devices, microphones, cameras, speakers) {
        var micLabels = [];
        var camLabels = [];
        var speakerLabels = [];

        for (var i = 0; i < devices.length; i++) {
            var device = {
                id: devices[i].deviceId,
                name: devices[i].label.replace(/\s*\([a-zA-Z0-9]+:[a-zA-Z0-9]+\)/, "") // In windows label comes as Camera(1dead:2code), this is to remove the dead code
            };
            switch(devices[i].kind) {
                case "audioinput":
                    if (micLabels.indexOf(device.name) === -1) {
                        microphones.push(device);
                        micLabels.push(device.name);
                    }
                    break;

                case "videoinput":
                    if (camLabels.indexOf(device.name) === -1) {
                        cameras.push(device);
                        camLabels.push(device.name);
                    }
                    break;

                case "audiooutput":
                    if (speakerLabels.indexOf(device.name) === -1) {
                        speakers.push(device);
                        speakerLabels.push(device.name);
                    }
                    break;
            }
        }
    };

    function SendDeviceEnumerationResponse(devices) {
        var deviceInfo = {
            method: "VidyoWebRTCEnumerateDeviceResponse",
            status: "success",
            microphones: [],
            cameras: [],
            speakers: [],
            shareEnabled: (IsShareEnabled() !== null)
        };

        if (devices.length <= 0) {
            deviceInfo.status = "error";
        } else {
            ConvertToDeviceInfo(devices, deviceInfo.microphones, deviceInfo.cameras, deviceInfo.speakers);
        }


        if (deviceInfo.speakers.length <= 0) {
            var defaultSpeaker = {
                id: "default",
                name: "Default"
            };
            deviceInfo.speakers.push(defaultSpeaker);
        }

        transport_.SendWebRTCMessage(deviceInfo, function() {
            LogInfo("DeviceInfo sent: " + JSON.stringify(deviceInfo));
            HandleShareSupportedRequest();
        });

        devices_ = devices;

        if (devices.length > 0) {
            navigator.mediaDevices.ondevicechange = CheckForDeviceUpdate;
        }
    };

    function HandleDeviceEnumerationRequest (data) {
        GetDevices().then((devices) => {
            SendDeviceEnumerationResponse(devices);
        });
    };

        function SendShareAdded(shareId) {
            var shareAddedMsg = {
                method: "VidyoWebRTCLocalShareAdded",
                shareId: ""+shareId
            };

            transport_.SendWebRTCMessage(shareAddedMsg, function() {
                LogInfo("ShareAdded sent successfully");
            });
        };

        function SendShareRemoved(shareId, cb) {
            var shareRemovedMsg = {
                method: "VidyoWebRTCLocalShareRemoved",
                shareId: ""+shareId
            };

            transport_.SendWebRTCMessage(shareRemovedMsg, function() {
                LogInfo("ShareRemoved sent successfully");
                cb();
            });
        };

        function periodicExtensionCheck() {
            setTimeout(function() {
                if (IsShareEnabled()) {
                    HandleShareSupportedRequest();
                } else {
                    periodicExtensionCheck();
                }
            }, 3000);
        };

        /**
         * @returns {("standardAPI"|"alternativeAPI"|"pluginBased"|null)}
         */
        function IsShareEnabled() {
            let shareSupport = null;

            if (window.adapter.browserDetails.browser === "firefox") {
                // https://bugzilla.mozilla.org/show_bug.cgi?id=1612006
                shareSupport = 'alternativeAPI';
            } else if (navigator.mediaDevices &&  navigator.mediaDevices.getDisplayMedia) {
                shareSupport = 'standardAPI';
            } else {
                shareSupport = document.getElementById("vidyowebrtcscreenshare_is_installed") ? 'pluginBased' : null;
            }
            return shareSupport;
        }

        function IsUnifiedSdp() {
          var unifiedSdp = false;
          if ((window.adapter.browserDetails.browser === "firefox" && window.adapter.browserDetails.version >= 59) ||
              (window.adapter.browserDetails.browser === "safari" && window['RTCRtpTransceiver'].prototype.hasOwnProperty('currentDirection')))
          {
              unifiedSdp = true;
          }
          return unifiedSdp;
      }

          function HandleShareSupportedRequest() {
            const shareSupport = IsShareEnabled();

            if (!shareSupport) {
                periodicExtensionCheck();
                return;
            }

            if (shareSupport === 'standardAPI' || shareSupport === 'alternativeAPI') {
                if(isNeo() === true) {
                    SendShareAdded(-localShareId_); // Hunter specific
                }
            } else {
                window.postMessage({type: "VidyoAddDomain", domain: window.location.hostname}, "*");
            }

            // Trinity specific
            if(isNeo() !== true) {
                var shareUpdate = GetDevicesUpdateObject();
                shareUpdate.shareEnabled = true;
                transport_.SendWebRTCMessage(shareUpdate, function () {
                    LogInfo("ShareUpdate sent: " + JSON.stringify(shareUpdate));
                });
            }
        };

        function SendCandidate (streamId, candidate) {
            var candidateMsg = {
                method: "VidyoWebRTCIceCandidate",
                streamId: streamId,
                candidate: candidate
            };

            transport_.SendWebRTCMessage(candidateMsg, function() {
                LogInfo("Candidate send success - " + JSON.stringify(candidate));
            });
        };

        function SendLocalOffer(currentState, nextState, op, data) {
            var offer = offer_;
            var offerMsg = {
                method: "VidyoWebRTCOfferSdp",
                sdp: offer.sdp,
                clientType: window.adapter.browserDetails.browser,
                restart: data
            };

            transport_.SendWebRTCMessage(offerMsg, function() {
                LogInfo("PeerConnection Offer sent = " + offer.sdp);
            });
        };

        function GetLocalOffer(restart) {

            LogInfo("PeerConnection onnegotiationneeded callstate=" + callState_);

            var offerConstraints = {
                offerToReceiveAudio: remoteAudio_.length,
                offerToReceiveVideo: maxSubscriptions_ + 1
            };

            if (window.adapter.browserDetails.browser === "chrome") {
                offerConstraints.offerToReceiveVideo = true; // Chrome doesn't accept numbers for these constraints
                offerConstraints.offerToReceiveAudio = true; // Chrome doesn't accept numbers for these constraints
            }

            cameraState_ = camera_.GetState();
            micState_ = mic_.GetState();

            peerConnection_.createOffer(offerConstraints).
            then(function(offer) {
                offer_ = offer;
                InvokeStateMachine("gotOffer", restart);
            }).
            catch(function(err) {
                LogErr("PeerConnection CreateOffer failed " + err.toString());
                console.log(err);
            });
        };

        function CheckForDevices(currentState, nextState, op, data) {
            // Don't wait for devices to start on firefox.
            // Let them start later and trigger renegotiation
            if (window.adapter.browserDetails.browser === "chrome") {
                if (camera_.IsStarting()) {
                    LogInfo("Waiting for camera");
                    return;
                }

                if (mic_.IsStarting()) {
                    LogInfo("Waiting for mic");
                    return;
                }
            }

            InvokeStateMachine("startCall");
        };

        function HandleAdditionalPc(i) {
            var offerConstraints = {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            };

            try {
                additionalPc_[i] = new RTCPeerConnection(peerConnectionConstraints_);
                additionalIceCandidates_[i] = [];
            } catch(e) {
                console.error(e);
                LogErr("RTCPeerConnection exception: " + suppressFilePaths(e.stack) + " " + suppressFilePaths(e));
                SendUninitialize();
            }

            if (i >= remoteAudio_.length) {
                offerConstraints.offerToReceiveAudio = false;
            }

            additionalPc_[i].createOffer(offerConstraints).
            then(function(offer) {
                additionalOffers_[i] = offer;
                var offerMsg = {
                    method: "VidyoWebRTCAdditionalOfferSdp",
                    streamId: i+1,
                    sdp: offer.sdp
                };
                LogInfo("PeerConnection [" + (i+1) + "] Offer: " + offer.sdp);
                transport_.SendWebRTCMessage(offerMsg, function() {
                    if (additionalOffers_[i]) {
                        var o = additionalOffers_[i];
                        additionalOffers_[i] = null;
                        additionalPc_[i].setLocalDescription(o).
                        then(function() {
                            LogInfo("PeerConnection [" + (i+1) + "] setLocalDescription success ");
                        }).catch(function(err) {
                            LogErr("PeerConnection [" + (i+1) + "] setLocalDescription failed " + err.toString());
                            console.log(err);
                        });
                    }
                });
            }).catch(function(err) {
                LogErr("PeerConnection [" + (i+1) + "] CreateOffer failed " + err.toString());
                console.log(err);
            });

            additionalPc_[i].onicecandidate = function(evt) {
                if (evt.candidate) {
                    SendCandidate((i+1), evt.candidate);
                } else {
                    LogInfo("PeerConnection [" + (i+1) + "] onicecandidate done");
                }
            };

            additionalPc_[i].onicegatheringstatechange = function(state) {
                var iceGatheringState = state.target.iceGatheringState;
                LogInfo("PeerConnection [" + (i+1) + "] onicegatheringstatechange - " + iceGatheringState);
                if (iceGatheringState !== "new") {
                    LogInfo("PeerConnection [" + (i+1) + "] onicegatheringstatechange applying iceCandidates " + additionalIceCandidates_[i].length);
                    additionalIceCandidates_[i].forEach(function(iceCandidate) {
                        additionalPc_[i].addIceCandidate(iceCandidate).
                        then(function() {
                            LogInfo("HandleIceCandidate in icegatheringstatchange[" + (i+1) + "] set success - "  + JSON.stringify(iceCandidate));
                        }).
                        catch(function(err){
                            LogErr("HandleIceCandidatein icegatheringstatchange [" + (i+1) + "] set failed - " + JSON.stringify(iceCandidate) + " " + err.stack + " " + err.toString());
                            console.log(err);
                        });
                    });
                    additionalIceCandidates_[i].length = 0;
                }
            };

            additionalPc_[i].oniceconnectionstatechange = function(state) {
                LogInfo("PeerConnection [" + (i+1) + "] oniceconnectionstatechange - " + state.target.iceConnectionState);
                if (state.target.iceConnectionState === "closed" || state.target.iceConnectionState === "failed") {
                    transport_.SendWebRTCMessage({method: "VidyoWebRTCIceFailed"}, function() {
                    });
                }
            };

            additionalPc_[i].onsignalingstatechange = function(state) {
                var sigState = (state.target ? state.target.signalingState : state);
                LogInfo("PeerConnection [" + (i+1) + "] onsignalingstatechange - " + sigState);
            };

            additionalPc_[i].onaddstream = HandleOnAddStream;
        };

        function HandleOnAddStream(evt) {
            LogInfo("PeerConnection onaddstream " + evt.stream.id + " audiotracks=" + evt.stream.getAudioTracks().length + " videoTracks=" + evt.stream.getVideoTracks().length);
            if (evt.stream.getAudioTracks().length > 0) {
                if (currentAudioIndex_ < remoteAudio_.length) {
                    LogInfo("PeerConnection onaudiostream [" + currentAudioIndex_ + "] - audio src: " + evt.stream.id);
                    remoteAudio_[currentAudioIndex_].srcObject = evt.stream;
                    currentAudioIndex_++;
                    if (VidyoTranscodingContext.SHOW_AUDIO_METERS && currentAudioIndex_ === remoteAudio_.length) {
                        audioMeter.StartRemoteAudioLevelDetection();
                    }
                } else {
                    LogErr("PeerConnection onaudiotrack more than " + remoteAudio_.length + " received");
                }
            } else if (evt.stream.getVideoTracks().length > 0) {
                videoStreams_.push(evt.stream);

                // Check if we are waiting for video, this happens when someone is already in the call, the element and sources are added, but the stream comes later
                for (var sourceId in streamMapping_) {
                    if (streamMapping_[sourceId].hasOwnProperty("streamId")) {
                        var streamId = streamMapping_[sourceId]["streamId"];
                        if (videoStreams_[streamId]) {
                            CreateSourceIdEntryInStreamMappingAndAttachVideo({sourceId: sourceId});
                        }
                    }
                }
            }
        }

        function HandleOnAddTrack(evt) {
            LogInfo("PeerConnection ontrack ");
            if (evt.track && evt.track.kind === "audio") {
                if (evt.streams && evt.streams.length > 0) {
                    if (currentAudioIndex_ < remoteAudio_.length) {
                        LogInfo("PeerConnection onaudiotrack [" + currentAudioIndex_ + "] - audio src: " + evt.streams[0].id);
                        remoteAudio_[currentAudioIndex_].srcObject = evt.streams[0];
                        currentAudioIndex_++;
                        if (VidyoTranscodingContext.SHOW_AUDIO_METERS && currentAudioIndex_ === remoteAudio_.length) {
                            audioMeter.StartRemoteAudioLevelDetection();
                        }
                    } else {
                        LogErr("PeerConnection onaudiotrack more than " + remoteAudio_.length + " received");
                    }
                } else {
                    LogErr("PeerConnection ontrack - audio No streams present !!");
                }
            } else if (evt.track && evt.track.kind === "video") {
                videoStreams_.push(evt.streams[0]);

                // Check if we are waiting for video, this happens when someone is already in the call, the element and sources are added, but the stream comes later
                for (var sourceId in streamMapping_) {
                    if (streamMapping_[sourceId].hasOwnProperty("streamId")) {
                        var streamId = streamMapping_[sourceId]["streamId"];
                        if (videoStreams_[streamId]) {
                            CreateSourceIdEntryInStreamMappingAndAttachVideo({sourceId: sourceId});
                        }
                    }
                }
            }
        }

        function HandleStartCall (currentState, nextState, op) {
            var data = startCallData_;
            startCallData_ = null;
            maxSubscriptions_ = data.maxSubscriptions;
            mediaState_ = MEDIASTATE_CONNECTING;

            // Get the peer connection constraints
            peerConnectionConstraints_.iceServers.length = 0;
            peerConnectionConstraints_.iceServers.push({urls : "stun:" + data.stunServer});

            if (data.turnCreds) {
                var urls = [];
                for (var k = 0; k < data.turnCreds.urls.length; k++) {
                    urls.push(data.turnCreds.urls[k]);
                    if (data.turnCreds.urls[k].indexOf("self_address") !== -1) {
                        urls[k] = urls[k].replace("self_address", window.location.hostname);
                    }
                }
                data.turnCreds.urls = urls;
                peerConnectionConstraints_.iceServers.push(data.turnCreds);
            }

            try {
                // Create the peer connection
                peerConnection_ = new RTCPeerConnection(peerConnectionConstraints_);
            } catch (e) {
                console.error(e);
                LogErr("RTCPeerConnection exception: " + suppressFilePaths(e.stack) + " " + suppressFilePaths(e));
                SendUninitialize();
            }

            peerConnection_.onicecandidate = function(evt) {
                if (evt.candidate) {
                    if (iceCandidateTimeout_ !== null) {
                        LogInfo("PeerConnection onicecandidate clearing candidate timeout");
                        clearTimeout(iceCandidateTimeout_);
                        iceCandidateTimeout_ = null;
                    }
                    SendCandidate(1, evt.candidate);
                } else {
                    LogInfo("PeerConnection onicecandidate done");
                }
            };

            peerConnection_.oniceconnectionstatechange = function(state) {
                LogInfo("PeerConnection oniceconnectionstatechange - " + state.target.iceConnectionState);
                if (state.target.iceConnectionState === "completed" || state.target.iceConnectionState === "connected") {
                    mediaState_ = MEDIASTATE_CONNECTED;
                    peerConnectionStats_.Start(peerConnection_, remoteAudio_.length, maxSubscriptions_ + 1);
                }
                if (state.target.iceConnectionState === "closed" || state.target.iceConnectionState === "failed") {
                    transport_.SendWebRTCMessage({method: "VidyoWebRTCIceFailed"}, function() {
                    });
                    if (mediaState_ === MEDIASTATE_CONNECTING) {
                        VidyoTranscodingContext.CheckAndRedirectToPortal();
                    }
                }
            };

            peerConnection_.onsignalingstatechange = function(state) {
                var sigState = (state.target ? state.target.signalingState : state);
                LogInfo("PeerConnection onsignalingstatechange - " + sigState);
                if (sigState === "stable") {
                    InvokeStateMachine("signalingStable");
                }

            };

            peerConnection_.ontrack = HandleOnAddTrack;

            // We will trigger manually since multiple stream operations may be required before sending the offer
            // peerConnection_.onnegotiationneeded = GetLocalOffer;

            var cameraStream = camera_.GetStreamAndTrack().stream;
            var micStream = mic_.GetStreamAndTrack().stream;

            if (IsUnifiedSdp()) {
                const transceiverOptions = {
                    direction: "recvonly"
                };
                const localTransceiverOptions = {
                    direction: "sendrecv"
                };
                if (micStream && micStream.getAudioTracks().length) {
                    peerConnectionAudioTransceiver_ =  peerConnection_.addTransceiver( micStream.getAudioTracks()[0], localTransceiverOptions);
                } else {
                    peerConnectionAudioTransceiver_ =  peerConnection_.addTransceiver( 'audio', localTransceiverOptions);
                }

                for (let i = 0; i < remoteAudio_.length - 1; ++i ) {
                    peerConnection_.addTransceiver( "audio", transceiverOptions );
                }

                if (cameraStream && cameraStream.getVideoTracks().length) {
                    peerConnectionVideoTransceiver_ =   peerConnection_.addTransceiver( cameraStream.getVideoTracks()[0], localTransceiverOptions);
                }   else {
                    peerConnectionVideoTransceiver_ =   peerConnection_.addTransceiver( 'video', localTransceiverOptions);
                }
                for (let i = 0; i < maxSubscriptions_; ++i ) {
                    peerConnection_.addTransceiver( "video", transceiverOptions );
                }
            } else {
                if (cameraStream) {
                    AddLocalCameraVideoStream(cameraStream);
                } else if (window.adapter.browserDetails.browser === "safari") {
                    peerConnection_.addTransceiver("video");
                }

                if (micStream) {
                    AddLocalMicrophoneAudioStream(micStream);
                } else if (window.adapter.browserDetails.browser === "safari") {
                    peerConnection_.addTransceiver("audio");
                }
            }
            if (iceCandidateTimeout_ !== null) {
                clearTimeout(iceCandidateTimeout_);
                iceCandidateTimeout_ = null;
            }

            iceCandidateTimeout_ = setTimeout(function() {
                LogErr("No ICE candidates generated, disconnecting the call");
                InvokeStateMachine("stopCall", false);
            }, 30 * 1000);
            GetLocalOffer(data.restart);

            /** Upload logs 1 minute into the call */
            setTimeout(function() {
                vidyoApp.createLogFileArchive(); // Neo Specific
            }, 60 * 1000);
        };

        function HandleStopCall(currentState, nextState, op, restart) {
            mediaState_ = MEDIASTATE_IDLE;
            offer_ = null;

            if (iceCandidateTimeout_ !== null) {
                clearTimeout(iceCandidateTimeout_);
                iceCandidateTimeout_ = null;
            }


            HandleStopLocalShare();
            StopStream(localShareStream_, true, true);

            peerConnectionStats_.Stop();
            if (peerConnection_ !== null) {
                // Firefox throws an exception when trying to close peer connection in offline mode
                try {
                    peerConnection_.oniceconnectionstatechange = undefined;
                    peerConnection_.close();
                } catch (e) {
                }
                peerConnection_ = null;
            }

            audioMeter.StopRemoteAudioLevelDetection();
            currentAudioIndex_ = 0;

            _UILayoutEngine.onCallStopped();

            for (var i = 0; i < additionalPc_.length; i++) {
                if (additionalPc_[i]) {
                    additionalPc_[i].close();
                }
            }
            additionalPc_.length = 0;
            additionalOffers_.length = 0;

            currentAudioIndex_ = 0;

            videoStreams_.length = 0;
            if (restart) {
                videoStreams_.push(camera_.GetStreamAndTrack().stream);
            } else {
                videoStreams_[VidyoTranscodingContext.LOCAL_STREAM_ID] = null;
            }
            bytesNotReceivedCounter_ = 0;
            bytesSent_ = 0;
            bytesReceived_ = 0;
        }

        function HandleAnswerSdp(currentState, nextState, op, data) {
            SetAnswerSdp(data, function(){});
        };

        function SetAnswerSdp(data, callback) {
            if (peerConnection_ === null) {
                LogInfo("peerConnection SetAnswerSdp pc null, call stopped");
                callback(false);
                return;
            }

            LogInfo("SetAnswerSdp: " + data.sdp);

            var br = resolutionMap_.hasOwnProperty(maxResolution_) ? resolutionMap_[maxResolution_].br: "768";

            if(window.adapter.browserDetails.browser == "firefox" && window.adapter.browserDetails.version >= "63"){
                data.sdp = data.sdp.replace(/sdparta_/g, "");
            }

            data.sdp = data.sdp.replace(/a=mid:video\r\n/g, "a=mid:video\r\nb=AS:" + br + "\r\n");

            /** @returns {Promise} */
            var SetRemoteDescription = function () {
                if (peerConnection_ === null) {
                    LogInfo("peerConnection HandleAnswerSdp pc null, call stopped");
                    callback(false);
                    return Promise.reject();
                }

                var remoteSdp = new RTCSessionDescription({type: "answer", sdp: data.sdp});
                return peerConnection_.setRemoteDescription(remoteSdp).
                then(function() {
                    LogInfo("PeerConnection setRemoteDescription success");
                    callback(true);
                    // @todo investigate root cause
                    // some delay to make sure that setRemoteDescription was finished before handling ice candidates
                    return new Promise((resolve, reject) => { setTimeout(resolve, 1000); });
                }).
                catch(function(err) {
                    LogErr("PeerConnection setRemoteDescription failed " + err.toString());
                    console.log(err);
                    callback(false);
                });
            };

            if (offer_ !== null) {
                LogInfo("PeerConnection HandleAnswerSdp localOffer not yet set, setting  local offer first");
                var o = offer_;
                offer_ = null;
                peerConnectionStatePromise = peerConnection_.setLocalDescription(o).
                then(function() {
                    LogInfo("PeerConnection setLocalDescription success");
                    return SetRemoteDescription();
                }).
                catch(function(err) {
                    LogErr("PeerConnection setLocalDescription failed " + err.toString());
                    console.log(err);
                });
            } else {
                SetRemoteDescription();
            }
        };

        function HandleIceCandidate(data) {
            if(peerConnectionStatePromise) {
                peerConnectionStatePromise.then(() => {
                    _handleIceCandidate(data);
                });
            } else if(data.streamId === 0 && localSharePeerConnection_ !== null){
                _handleIceCandidate(data);
            } else {
                LogErr('Error processing ICE candidates');
            }
        }
        function _handleIceCandidate(data) {
            delete data.candidate.call;
            var iceCandidate;

            if (data.candidate.candidate && data.candidate.candidate.length > 0 && data.candidate.sdpMid && data.candidate.sdpMid.length > 0) {
                iceCandidate = new RTCIceCandidate(data.candidate);
            } else {
                return;
            }

            if (data.streamId === 1 && peerConnection_ !== null) {
                peerConnection_.addIceCandidate(iceCandidate).
                then(function() {
                    LogInfo("HandleIceCandidate set success - "  + JSON.stringify(iceCandidate));
                }).
                catch(function(err){
                    LogErr("HandleIceCandidate set failed - " + JSON.stringify(iceCandidate) + " " + err.stack + " " + err.toString());
                    console.log(err);
                });
            } else if (data.streamId === 0 && localSharePeerConnection_ !== null) {
                localSharePeerConnection_.addIceCandidate(iceCandidate).
                then(function() {
                    LogInfo("Share: HandleIceCandidate set success - " + JSON.stringify(data.candidate));
                }).
                catch(function(err){
                    LogErr("Share: HandleIceCandidate set failed - " + JSON.stringify(data.candidate) + " " + err.stack + " " + err.toString());
                    console.log(err);
                });
            } else {
                if (additionalPc_[data.streamId-1] !== null) {
                    if (additionalPc_[data.streamId-1].iceGatheringState !== "new") {
                        additionalPc_[data.streamId-1].addIceCandidate(iceCandidate).
                        then(function() {
                            LogInfo("HandleIceCandidate [" + (data.streamId) + "] set success - "  + JSON.stringify(iceCandidate));
                        }).
                        catch(function(err){
                            LogErr("HandleIceCandidate [" + (data.streamId) + "] set failed - " + JSON.stringify(iceCandidate) + " " + err.stack + " " + err.toString());
                            console.log(err);
                        });
                    } else {
                        LogInfo("HandleIceCandidate [" + (data.streamId) + "]  queuing since icegathering state - "  + additionalPc_[data.streamId-1].iceGatheringState);
                        additionalIceCandidates_[data.streamId-1].push(iceCandidate);
                    }
                } else {
                    LogErr("Additional PeerConnection not found " + (data.streamId));
                }
            }
        };

        function HandleStreamMappingChanged(data) {
            var oldSourceIds = Object.keys(streamMapping_);
            var newSourceIds = [];
            var streamIds = [];

            for (let i = 0; i < data.streams.length; i++) {

                var sourceId = data.streams[i].sourceId;
                newSourceIds.push(sourceId);

                var streamId = data.streams[i].streamId;
                streamIds.push(streamId);

                var viewId = data.streams[i].viewId;
                var name = data.streams[i].sourceName || "Video" + i;
                var type = data.streams[i].type;

                switch(type) {
                    case VidyoTranscodingContext.STREAM_TYPE_PREVIEW:
                        if (!streamMapping_.hasOwnProperty(VidyoTranscodingContext.PREVIEW_SOURCE_ID) || streamMapping_[VidyoTranscodingContext.PREVIEW_SOURCE_ID].name !== name) {
                            CreateSourceIdEntryInStreamMappingAndAttachVideo({
                                sourceId: VidyoTranscodingContext.PREVIEW_SOURCE_ID,
                                streamId: VidyoTranscodingContext.LOCAL_STREAM_ID,
                                attached: false,
                                type: VidyoTranscodingContext.STREAM_TYPE_PREVIEW,
                                name: name,
                                viewId: viewId
                            });
                        }
                        break;
                    case VidyoTranscodingContext.STREAM_TYPE_SHARE_PREVIEW:
                        CreateSourceIdEntryInStreamMappingAndAttachVideo({
                            sourceId: VidyoTranscodingContext.LOCAL_SHARE_PREVIEW_SOURCE_ID,
                            streamId: VidyoTranscodingContext.LOCAL_STREAM_ID,
                            viewId: viewId,
                            type: VidyoTranscodingContext.STREAM_TYPE_SHARE_PREVIEW,
                            name: "Share Preview",
                            attached: false
                        });
                        break;
                    default:
                        CreateSourceIdEntryInStreamMappingAndAttachVideo({
                            sourceId: sourceId,
                            streamId: streamId,
                            viewId: viewId,
                            type: type,
                            name: name
                        });
                        break;
                }
            }

            var deletedSourceIds = oldSourceIds.filter(function(i) { return newSourceIds.indexOf(i) === -1 });

            LogInfo("Deleting source ids: " + JSON.stringify(deletedSourceIds));
            for (let i = 0; i < deletedSourceIds.length; i++) {
                var sourceId = deletedSourceIds[i];
                if(sourceId === VidyoTranscodingContext.PREVIEW_SOURCE_ID){
                    continue;
                }
                if (streamMapping_.hasOwnProperty(sourceId)) {
                    var streamId = streamMapping_[sourceId].streamId;
                    var type = streamMapping_[sourceId].type;
                    if (streamIds.indexOf(streamId) === -1) {
                        let viewId = streamMapping_[sourceId].viewId;
                        _UILayoutEngine.HideVideoPanel(viewId, type, streamId);
                    }
                    streamMapping_[sourceId].attached = false;
                    delete streamMapping_[sourceId];
                }
            }

        };

    function GetCameraConstraints(data) {
        var constraints = {
            video: {
                frameRate: {min: 20},
            }
        };

        if (data.camera) {
            constraints.video.deviceId = data.camera;
        }

        if (data.maxResolution) {
            maxResolution_ = data.maxResolution;
            var resolution = resolutionMap_[maxResolution_];

            if (window.adapter.browserDetails.browser === "safari") {
                switch(maxResolution_) {
                    // safari expects 4:3 aspect ratio for resolutions less than 540p and supports fewer resolutions
                    case "480p":
                    case "360p":
                        resolution.w = 640;
                        resolution.h = 480;
                        break;

                    case "270p":
                    case "240p":
                    case "180p":
                        resolution.w = 320;
                        resolution.h = 240;
                        break;
                }
            }

            constraints.video.width = {ideal: resolution.w };
            constraints.video.height = {ideal: resolution.h };

            if (window.adapter.browserDetails.browser === "chrome" || window.adapter.browserDetails.browser === "safari") {
            } else {
                // Firefox doesn't seem to be handling constraints
                // So if resolution is greater than 480p, don't specify constraints
                if (constraints.video.height.ideal >= 480) {
                    delete constraints.video.width;
                    delete constraints.video.height;
                }
            }
        }

        return constraints;
    };

    /**
     * @returns {MediaDeviceInfo|null}
     */
    function getDeviceInfo(deviceId, deviceKind){
        /** @type {MediaDeviceInfo[]} */
        let deviceFiltered = devices_.filter((dev) => {return dev.kind === deviceKind && dev.deviceId === deviceId;});
        if(deviceFiltered.length > 0){
            return deviceFiltered[0];
        } else {
            return null;
        }
    }

    function HandleStartCamera(data) {
        var constraints = GetCameraConstraints(data);
        /** @type {MediaDeviceInfo} */
        let deviceInfo = getDeviceInfo(data.camera, 'videoinput');
        if(camera_.GetDeviceId() && camera_.GetDeviceId() !== data.camera){
            camera_.StopDevice();
            camera_ = new VidyoInputDevice("VIDEO", CameraStarted, CameraStopped);
        }
        camera_.StartDevice(data.camera, constraints, deviceInfo ? deviceInfo.label : 'NOT_NAMED_DEVICE');
    };

    function HandleStopCamera(data) {
        camera_.StopDevice(data.camera);
    };

    function HandleStartMicrophone(data) {
        var constraints = {
            audio: {
                deviceId: data.microphone
            }
        };

        if (window.adapter.browserDetails.browser === "chrome") {
            mic_.StartDevice(data.microphone, constraints);
        } else {
            // In firefox, if a camera pemission window is open and we do getUsermedia for mic,
            // that permission window is overwritten with this mic permission window
            // and there is no way for the user to grant camera access after granting mic access
            // Hence if waiting for camera access, do not show mic access and wait for camera started
            if (camera_.IsStarting()) {
                mic_.SetDevice(data.microphone, constraints);
            } else {
                mic_.StartDevice(data.microphone, constraints);
            }
        }
    };

        function HandleStopMicrophone(data) {
            mic_.StopDevice(data.microphone);
        };

        function HandleStartSpeaker(data) {
            if (typeof remoteAudio_[0].setSinkId === "function") {
                for (var r = 0; r < remoteAudio_.length; r++) {
                    remoteAudio_[r].setSinkId(data.speaker);
                }
            }

            // Fix for an issue that Safari mutes WebRTC audio if user joined to call with muted mic and camera
            // because we don't request audio context after user interaction with the page
            if (isNeo()) {
                if (window.adapter.browserDetails.browser === "safari") {
                    const deviceId = mic_.GetDeviceId();

                    const constraints = {
                        audio: deviceId ? { deviceId } : true
                    };

                    navigator.mediaDevices.getUserMedia(constraints)
                        .then(stream => setTimeout(() => {
                            stream.getTracks().forEach(track => track.stop())
                        }))
                    ;
                }
            }
        };

        function HandleStartLocalShare(data) {
            LogInfo("Starting Local Screen Share in call state " + callState_ + " count=" + localShareStream_.length);

            if (callState_ === CALLSTATE_IDLE) {
                HandleStopCall();
                return;
            }

            try {
                localSharePeerConnection_ = new RTCPeerConnection(peerConnectionConstraints_);
                peerConnectionStats_.SetSharePeerConnection(localSharePeerConnection_);
                localShareOfferInProgress_ = false;
            } catch (e) {
                console.error(e);
                LogErr("RTCPeerConnection exception: " + suppressFilePaths(e.stack) + " " + suppressFilePaths(e));
                SendUninitialize();
            }

            localSharePeerConnection_.onRemoteDescriptionSetPromise = new Promise((resolve, reject) => {
              localSharePeerConnection_.onRemoteDescriptionSetResolve = resolve;
            });

            localSharePeerConnection_.onicecandidate = function(evt) {
              let promise = localSharePeerConnection_.onRemoteDescriptionSetPromise || Promise.resolve();
                if (evt.candidate) {
                    SendCandidate(0, evt.candidate);
                    promise.then(() => { SendCandidate(0, evt.candidate); });
                } else {
                    LogInfo("SharePeerConnection onicecandidate done");
                }
            };

            localSharePeerConnection_.oniceconnectionstatechange = function(state) {
                LogInfo("SharePeerConnection oniceconnectionstatechange - " + state.target.iceConnectionState);
            };

            localSharePeerConnection_.onsignalingstatechange = function(state) {
                LogInfo("SharePeerConnection onsignalingstatechange - " + (state.target ? state.target.signalingState : state));
            };

            localSharePeerConnection_.ontrack = function(evt) {
                LogInfo("SharePeerConnection ontrack");
            };

            localSharePeerConnection_.onnegotiationneeded = function() {
                LogInfo("SharePeerConnection onnegotiationneeded callState=" + callState_);

                if (callState_ === CALLSTATE_IDLE) {
                    HandleStopCall();
                    return;
                }

                if (localShareOfferInProgress_) {
                    return;
                }

                var offerConstraints = {
                    offerToReceiveAudio: false,
                    offerToReceiveVideo: false
                };

                localShareOfferInProgress_ = true;
                localSharePeerConnection_.createOffer(offerConstraints).
                then(function(offer) {
                    var offerMsg = {
                        method: "VidyoWebRTCShareOfferSdp",
                        sdp: offer.sdp
                    };
                    localShareOffer_ = offer;
                    transport_.SendWebRTCMessage(offerMsg, function() {
                        LogInfo("SharePeerConnection Offer sent = " + offer.sdp);

                        if (localShareOffer_ !== null) {
                            localShareOffer_ = null;
                            localSharePeerConnection_.setLocalDescription(offer).
                            then(function() {
                                LogInfo("SharePeerConnection setLocalDescription success");
                            }).
                            catch(function(err) {
                                LogErr("SharePeerConnection setLocalDescription failed " + err.toString());
                                console.log(err);
                            });
                        }
                    });
                }).
                catch(function(err) {
                    LogErr("SharePeerConnection CreateOffer failed " + err.toString());
                    console.log(err);
                });
            };

            localSharePeerConnection_.addTrack(localShareStream_[0].getVideoTracks()[0], localShareStream_[0]);
        };

        function HandleShareAnswerSdp(data) {
            LogInfo("ShareAnswerSdp: " + data.sdp);
            if (window.adapter.browserDetails.browser === "safari" ||
               (window.adapter.browserDetails.browser === "firefox" && window.adapter.browserDetails.version >= "63")) {
                data.sdp = data.sdp.replace(/sdparta_/g, "");
                data.sdp = data.sdp.replace(/a=group:BUNDLE 0(.+)/g,'a=group:BUNDLE 0');
            }
            var SetShareRemoteDescription = function() {

                if (localSharePeerConnection_ === null) {
                    LogInfo("localSharePeerConnection HandleShareAnswerSdp pc null, call stopped");
                    return;
                }

                var remoteSdp = new RTCSessionDescription({type: "answer", sdp: data.sdp});
                localSharePeerConnection_.setRemoteDescription(remoteSdp).
                  then(function() {
                      LogInfo("SharePeerConnection setRemoteDescription success");
                          localShareOfferInProgress_ = false;
                          if (localSharePeerConnection_.onRemoteDescriptionSetResolve) {
                            // @todo investigate root cause
                            // some delay to make sure that setRemoteDescription was finished before handling ice candidates
                            setTimeout(localSharePeerConnection_.onRemoteDescriptionSetResolve, 1000);
                          }
                  }).catch(function(err) {
                      LogErr("SharePeerConnection setRemoteDescription failed " + err.toString());
                      localShareOfferInProgress_ = false;
                      console.log(err);
                  })
                ;
            };

            if (localShareOffer_ !== null) {
                LogInfo("SharePeerConnection HandleShareAnswerSdp localOffer not yet set");
                var o = localShareOffer_;
                localShareOffer_ = null;
                localSharePeerConnection_.setLocalDescription(o).
                then(function() {
                    LogInfo("SharePeerConnection setLocalDescription success");
                    SetShareRemoteDescription();
                }).
                catch(function(err) {
                    LogErr("SharePeerConnection setLocalDescription failed " + err.toString());
                    console.log(err);
                });
            } else {
                SetShareRemoteDescription();
            }
        };

        function HandleStopLocalShare(data) {
            localShareOffer_ = null;
            localShareElement_ = null;
            shareSelectedCallback_ = null;

            if (localShareId_ > 0) {
                SendShareRemoved(localShareId_, function() {
                });

                self.ResetShareId();
            }

            if (pendingRequestId_ !== -1) {
                window.postMessage({type: "VidyoCancelRequest", requestId: pendingRequestId_}, "*");
                pendingRequestId_ = -1;
            }


            if (localShareStream_.length > 0) {
                localShareStream_[0].oninactive = undefined;
                StopStream([localShareStream_[0]], true, true);
                localShareStream_ = localShareStream_.slice(1);
                _UILayoutEngine.updateLocalShareStream(localShareStream_);
                LogInfo("StopLocalShare count=" + localShareStream_.length);
            }

            peerConnectionStats_.SetSharePeerConnection(null);
            if (localSharePeerConnection_ !== null) {
                localSharePeerConnection_.close();
                localSharePeerConnection_ = null;

            }
        };

        function HandleStreamStatus(data) {
            for (var s = 0; s < data.streams.length; s++) {
                var streamId = data.streams[s].streamId;
                var status = data.streams[s].status == 0 ? "stalled" : "started";

                _UILayoutEngine.handleStreamStatus(streamId, status);
            }
        };

        function HandleAdditionalAnswerSdp(data) {
            var i = data.streamId - 1;
            LogInfo("PeerConnection [" + (i+1) + "] Answer: " + data.sdp);
            var SetRemoteSdp = function() {
                if (additionalPc_[i]) {
                    var remoteSdp = new RTCSessionDescription({type: "answer", sdp: data.sdp});
                    additionalPc_[i].setRemoteDescription(remoteSdp).
                    then(function() {
                        LogInfo("PeerConnection [" + (i+1) + "] setRemoteDescription success");
                    }).
                    catch(function(err) {
                        LogErr("PeerConnection [" + (i+1) + "] setRemoteDescription failed " + err.toString());
                        console.log(err);
                    });
                } else {
                    LogErr("PeerConnection not found for " + i);
                }
            };

            if (additionalOffers_[i]) {
                LogInfo("PeerConnection [" + (i+1) + "] HandleAnswerSdp localOffer not yet set, setting  local offer first");
                var o = additionalOffers_[i];
                additionalOffers_[i] = null;
                additionalPc_[i].setLocalDescription(o).
                then(function() {
                    LogInfo("PeerConnection [" + (i+1) + "] setLocalDescription success ");
                    SetRemoteSdp();
                }).catch(function(err) {
                    LogErr("PeerConnection [" + (i+1) + "] setLocalDescription failed " + err.toString());
                    console.log(err);
                });
            } else {
                SetRemoteSdp();
            }
        };
        function RemoveLocalMicrophoneAudioStream() {
            if (window.adapter.browserDetails.browser === "chrome") {
                peerConnection_ && peerConnection_.removeStream(micStream_);
                StopStream([micStream_], true, true);
                micStream_ = null;
            } else if (IsUnifiedSdp()) {
                if(peerConnectionAudioTransceiver_) {
                    peerConnectionAudioTransceiver_.sender.replaceTrack(null);
                }
            } else { //firefox (older) and safari
                var senders = peerConnection_.getSenders();
                for (var i = 0; i < senders.length; i++) {
                    var track = senders[i].track;
                    if (track && track.kind === "audio") {
                        peerConnection_.removeTrack(senders[i]);
                    }
                }
            }
        };

        function AddLocalMicrophoneAudioStream(micStream) {
            micStream_ = micStream;
            if (window.adapter.browserDetails.browser === "chrome") {
                peerConnection_.addStream(micStream_);
            } else if (IsUnifiedSdp()) {
                if(peerConnectionAudioTransceiver_ && micStream.getAudioTracks().length) {
                    peerConnectionAudioTransceiver_.sender.replaceTrack(micStream.getAudioTracks()[0]);
                }
            } else { //firefox (older) and safari
                peerConnection_.addTrack(micStream_.getAudioTracks()[0], micStream_);
            }
        };

        function RemoveLocalCameraVideoStream() {
            if (!peerConnection_) {
                videoStreams_[VidyoTranscodingContext.LOCAL_STREAM_ID] = null;
                LogInfo("PeerConnection is empty in RemoveLocalCameraVideoStream");
                return;
            }
            if (window.adapter.browserDetails.browser === "chrome") {
                var localStreams = peerConnection_.getLocalStreams();
                for(var i = 0; i < localStreams.length; i++) {
                    var stream = localStreams[i];
                    if (stream.getVideoTracks().length > 0) {
                        peerConnection_.removeStream(stream);
                        StopStream([stream], true, true);
                    }
                }
                videoStreams_[VidyoTranscodingContext.LOCAL_STREAM_ID] = null;
            } else if (IsUnifiedSdp()) {
                if(peerConnectionVideoTransceiver_) {
                    peerConnectionVideoTransceiver_.sender.replaceTrack(null);
                }
            } else { //firefox (older) and safari
                var senders = peerConnection_.getSenders();
                for (var i = 0; i < senders.length; i++) {
                    var track = senders[i].track;
                    if (track && track.kind === "video") {
                        peerConnection_.removeTrack(senders[i]);
                    }
                }
            }
        };

        function AddLocalCameraVideoStream(cameraStream) {
            if (window.adapter.browserDetails.browser === "chrome") {
                peerConnection_.addStream(cameraStream);
            } else if (IsUnifiedSdp()){
                if(peerConnectionVideoTransceiver_ && cameraStream.getVideoTracks().length) {
                    peerConnectionVideoTransceiver_.sender.replaceTrack(cameraStream.getVideoTracks()[0]);
                }
            } else { //firefox (older) and safari
                peerConnection_.addTrack(cameraStream.getVideoTracks()[0], cameraStream);
            }
        };

        function AddRemoveStreams() {
            var cameraCase = camera_.DiffState(cameraState_);
            var micCase = mic_.DiffState(micState_);

            LogInfo("AddRemoveStreams camera=" + cameraCase + " mic=" + micCase);

            if (cameraCase === "stopped" || cameraCase === "restarted") {
                RemoveLocalCameraVideoStream();
            }

            if (cameraCase === "started" || cameraCase === "restarted") {
                AddLocalCameraVideoStream(camera_.GetStreamAndTrack().stream);
            }

            if (micCase === "stopped" || micCase === "restarted") {
                RemoveLocalMicrophoneAudioStream();
            }

            if (micCase === "started" || micCase === "restarted") {
                AddLocalMicrophoneAudioStream(mic_.GetStreamAndTrack().stream);
            }

            GetLocalOffer(false);
        }

        this.callback = function(data) {
            LogInfo("Callback - " + JSON.stringify(data));
            switch(data.method) {
                case "VidyoWebRTCEnumerateDeviceRequest":
                    HandleDeviceEnumerationRequest(data);
                    break;

                case "VidyoWebRTCStartCall":
                    startCallData_ = data;
                    if (startCallData_.restart) {
                        InvokeStateMachine("stopCall", true);
                    }
                    InvokeStateMachine("startCall");
                    break;

                case "VidyoWebRTCStopCall":
                    InvokeStateMachine("stopCall", false);
                    vidyoApp.createLogFileArchive(); // Neo Specific
                    break;

                case "VidyoWebRTCAnswerSdp":
                    InvokeStateMachine("gotAnswer", data);
                    break;

                case "VidyoWebRTCIceCandidate":
                    HandleIceCandidate(data);
                    break;

                case "VidyoWebRTCStreamMappingChanged":
                    HandleStreamMappingChanged(data);
                    break;

                case "VidyoWebRTCStartCamera":
                    HandleStartCamera(data);
                    break;

                case "VidyoWebRTCStopCamera":
                    HandleStopCamera(data);
                    break;

                case "VidyoWebRTCStartSpeaker":
                    HandleStartSpeaker(data);
                    break;

                case "VidyoWebRTCStopSpeaker":
                    // No-op
                    break;

                case "VidyoWebRTCStartMicrophone":
                    HandleStartMicrophone(data);
                    break;

                case "VidyoWebRTCStopMicrophone":
                    HandleStopMicrophone(data);
                    break;

                case "VidyoWebRTCStartLocalShare":
                    HandleStartLocalShare(data);
                    break;

                case "VidyoWebRTCShareAnswerSdp":
                    HandleShareAnswerSdp(data);
                    break;

                case "VidyoWebRTCStopLocalShare":
                    HandleStopLocalShare(data);
                    break;

                case "VidyoWebRTCStreamStatus":
                    HandleStreamStatus(data);
                    break;

                case "VidyoWebRTCInitRenderer":
                    _UILayoutEngine.VidyoWebRTCInitRenderer(data.viewId);
                    break;
                case "VidyoWebRTCSelectShare":
                    if(!isNeo()) {
                        localShareId_ = -localShareId_ + 1;
                        SendShareAdded(localShareId_);
                    }
                    break;
                case "VidyoWebRTCAdditionalAnswerSdp":
                    HandleAdditionalAnswerSdp(data);
                    break;

                case "VidyoWebRTCAudioStreamMapping":
                    audioMeter.UpdateAudioLevel(data.audioId, 0);
                    audioMeter.MapAudioStream(data.audioId, data.streamId);
                    break;

                case "VidyoWebRTCGoogleAuthCode":
                    if (googleAuthCallback_) {
                        googleAuthCallback_(data.code);
                        googleAuthCallback_ = null;
                    }
                    if (googleAuthWindow_) {
                        googleAuthWindow_.close();
                        googleAuthWindow_ = null;
                    }
                    break;

                default:
                    LogErr("Unsupported Server Signal - " + data.method);
                    break;
            }
        };

        function ShareGetUserMedia(constraints) {
            let getShareStreamPromise = null;
            if (IsShareEnabled() === 'standardAPI') {
                getShareStreamPromise = navigator.mediaDevices.getDisplayMedia(constraints);
            } else {
                getShareStreamPromise = navigator.mediaDevices.getUserMedia(constraints);
            }
            getShareStreamPromise.then(function(str) {
                LogInfo("Got Local Share Stream count=" + localShareStream_.length + " id=" + str.id);
                localShareStream_.push(str);
                if (localShareElement_) {
                    localShareElement_.srcObject = str;
                    localShareElement_.dataset.streamId = str.id;
                }

                str.oninactive = function () {
                    LogInfo("SharePeerConnection share stream ended");
                    if (typeof shareStreamOnInactiveCallback_ === 'function') {
                        shareStreamOnInactiveCallback_();
                    }
                };
                if (shareSelectedCallback_) {
                    shareSelectedCallback_(true);
                } else {
                    LogErr("ShareGetUserMedia shareSelectedCallback_ null");
                }
            }).
            catch(function(err) {
                LogErr("Local Share Stream error" + err.toString());
                console.log(err);
                if (shareSelectedCallback_) {
                    shareSelectedCallback_(false);
                } else {
                    LogErr("ShareGetUserMedia error shareSelectedCallback_ null");
                }
            });
        };

        this.ResetShareId = function() {
            if (localShareId_ > 0) {
                // To indicate that share has been removed and the next share add will go with localShareId_ + 1
                localShareId_ = -localShareId_;
            }
        };

        this.SelectShare = function(shareSelectedCallback, shareStreamOnInactiveCallback) {
            if (localShareId_ > 0) {
                LogInfo("SelectShare: Share already added with id " + localShareId_);
                shareSelectedCallback(false);
                return;
            }
            if (pendingRequestId_ !== -1) {
                LogErr("Pending request for StartLocalShare");
                shareSelectedCallback(false);
                return;
            }
            shareSelectedCallback_ = shareSelectedCallback;
            shareStreamOnInactiveCallback_ = shareStreamOnInactiveCallback;

            let constraints = null;
            let shareEnabled = IsShareEnabled();
            if (shareEnabled === 'standardAPI') {
                constraints = {
                    video: {
                        frameRate: maxShareFrameRate_
                    }
                };
            } else if (shareEnabled === 'pluginBased') {
                shareSelectedCallback_ = shareSelectedCallback;
                window.postMessage({ type: "VidyoRequestGetWindowsAndDesktops"}, "*");
            } else {
                constraints = {
                    video : {
                        mediaSource: "window",
                        mozMediaSource: "window",
                        height: {max: resolutionMap_[maxShareResolution_].h},
                        width: {max: resolutionMap_[maxShareResolution_].w},
                        frameRate: {max: maxShareFrameRate_}
                    }
                };
            }
            ShareGetUserMedia(constraints);
        };

        function WindowMessageHandler(event) {
            if (event.origin !== window.location.origin) {
                return;
            }

            if (event.data.type === "VidyoRequestId") {
                LogInfo("VidyoRequestId - " + event.data.requestId);
                pendingRequestId_ = event.data.requestId;
            }

            if (event.data.type === "VidyoOutEventSourceId") {
                pendingRequestId_ = -1;

                if (event.data.sourceId === "") { // The user clicked cancel
                    if (shareSelectedCallback_) {
                        LogInfo("ShareGetUserMedia User Cancelled");
                        shareSelectedCallback_(false);
                    } else {
                        LogErr("ShareGetUserMedia cancel shareSelectedCallback_ null");
                    }
                    return;
                }

                var width = 1920;
                var height = 1080;

                var constraints = {
                    video:  { mandatory:
                            {
                                chromeMediaSource: "desktop",
                                chromeMediaSourceId: event.data.sourceId,
                                maxWidth: resolutionMap_[maxShareResolution_].w,
                                maxHeight: resolutionMap_[maxShareResolution_].h,
                                maxFrameRate: maxShareFrameRate_
                            }
                    }
                };
                ShareGetUserMedia(constraints);
            }
        };

        function SendUninitialize(unload) {
            LogInfo(`SendUninitialize was called with unload:${unload} flag`);

            if (unload) {
                self.uninitializedOnUnload = true;
                transport_.SendBeaconMessage();
                return;
            }

            callState_ = CALLSTATE_IDLE;
            HandleStopCall();

            mic_.StopDevice();
            StopStream([micStream_], true, true);
            micStream_ = null;

            camera_.StopDevice();
            StopStream(videoStreams_, true, true);

            var uninitMsg = {
                method: "VidyoWebRTCUninitialize"
            };
            transport_.SendWebRTCMessage(uninitMsg, function() {
                LogInfo("VidyoWebRTCUninitialize success");
            });
            self.initializedState = "UNINITIALIZED";
            vidyoApp.createLogFileArchive(); // Neo Specific

            _UILayoutEngine.Uninitialize();

            window.removeEventListener("message", WindowMessageHandler);
        };

        /**
         * Capture video stream from canvas and select it for share
         * @param  {Function} shareSelectedCallback_ Callback for capturing and selecting share from canvas
         * @param  {HTMLElement} canvas              Target canvas for capturing stream from
         * @return {Void}
         * @description Neo specific - used by WhiteBoard plugin
         */
        // Neo specific - used by WhiteBoard plugin
        this.selectCanvasForShare = function(shareSelectedCallback_, canvas) {
            var canvasStream;

            if (typeof shareSelectedCallback_ !== 'function') {
                shareSelectedCallback_ = function() {
                    LogInfo("VidyoAppWebRTC:: Callback was not passed to selectCanvasForShare");
                };
            }

            if (!canvas) {
                LogInfo("VidyoAppWebRTC:: Canvas was not passed to selectCanvasForShare");
                shareSelectedCallback_(false);
            }
            try {
                canvasStream = canvas.captureStream(5);
            } catch (e) {
                LogErr("VidyoAppWebRTC canvas.captureStream was finished with error");
                shareSelectedCallback_(false);
            }

            LogInfo("Got Local Share Stream count=" + localShareStream_.length + " id=" + canvasStream.id);
            localShareStream_.push(canvasStream);
            if (localShareElement_) {
                localShareElement_.srcObject = canvasStream;
                localShareElement_.dataset.streamId = canvasStream.id;
            }

            canvasStream.oninactive = function() {
                LogInfo("SharePeerConnection share stream inactive");
                localShareStream_.length = 0;
                SendShareRemoved(localShareId_, function() {
                    localShareId_ += 1;
                    SendShareAdded(localShareId_);
                });
            };

            shareSelectedCallback_(true);
        };

        // Neo specific
        this.enablePersonalRoomSearch = function(enable) {
            var msg = {
                method: "VidyoWebRTCEnablePersonalRoomSearch",
                enable: enable
            };
            transport_.SendWebRTCMessage(msg, function() {
                LogInfo("enablePersonalRoomSearch sent successfully with " + enable);
            });
        };

        // Neo specific - used by GoogleCalender Integration
        this.getTransportState = function() {
            var state = transport_.GetState();
            return encodeURI(btoa(JSON.stringify(state)));
        };

        // Neo specific
        this.getGoogleAuthToken = function(URL, callback) {
            if (googleAuthCallback_ !== null) {
                callback("");
                return;
            }

            googleAuthCallback_ = callback;
            googleAuthWindow_ = window.open(URL, "");
        };

        this.getLayoutEngine = function(){
            return _UILayoutEngine;
        };

        this.showAudioMeters = function (viewId, showAudioMeters) {
            this.vLogger.LogInfo("ShowAudioMeters: viewId=" + viewId + " showAudioMeters=" + showAudioMeters_ + " " + showAudioMeters);

            audioMeter.SetShowAudioMeters(showAudioMeters);

            if (showAudioMeters) {
                audioMeter.StartLocalAudioLevelDetection();
                audioMeter.StartRemoteAudioLevelDetection();
            } else {
                audioMeter.StopLocalAudioLevelDetection();
                audioMeter.StopRemoteAudioLevelDetection();
            }

            if (this._videoPanels.hasOwnProperty(viewId)) {
                this._videoPanels[viewId].showAudioMeters(showAudioMeters);
            }
        };

        this.Uninitialize = function(unload) {
            SendUninitialize(unload);
        };

}
/////////////////// VidyoWebRTCClientEngine.js end ////////////////////////

  /*************************************** Layout Engine's constants ****************************************/
  VidyoTranscodingContext.RENDERER_TYPE_COMPOSITE = "composite";
  VidyoTranscodingContext.RENDERER_TYPE_TILES = "tiles";

  VidyoTranscodingContext.LOCAL_STREAM_ID = 0;

  VidyoTranscodingContext.STREAM_TYPE_PREVIEW = "preview";
  VidyoTranscodingContext.STREAM_TYPE_VIDEO = "video";
  VidyoTranscodingContext.STREAM_TYPE_SHARE = "share";
  VidyoTranscodingContext.STREAM_TYPE_SHARE_PREVIEW = "sharepreview";

  VidyoTranscodingContext.PREVIEW_SOURCE_ID = "preview-source-id";
  VidyoTranscodingContext.LOCAL_SHARE_PREVIEW_SOURCE_ID = "share-preview-source-id";


  if(isNeo() !== true) {
////////////////// VCLayoutEngine.js start //////////////////
    /** VidyoIO Layout Engine **/
    /**
     * @param {Object.<string, streamMappingItem>} streamMapping
     * @param videoStreams
     * @param localShareStream
     * @param transport
     * @constructor
     */
    function LayoutEngine(streamMapping, videoStreams, localShareStream, transport) {

      var layoutEngineCss = "                                        \
        .videoContainer {                                          \
            position: relative;                                    \
            width: 100%;                                           \
            height: 100%;                                          \
            overflow: hidden;                                      \
        }                                                          \
                                                                   \
        .videoContainer .frame {                                   \
            display: none;                                         \
            position: absolute;                                    \
            top: 0;                                                \
            right: 0;                                              \
            bottom: 0;                                             \
            left: 0;                                               \
            overflow: hidden;                                      \
            background-color: #202020;                             \
        }                                                          \
                                                                   \
        .videoContainer .video video {                             \
            width: 100%;                                           \
            height: 100%;                                          \
            object-fit: cover;                                     \
        }                                                          \
                                                                   \
        .videoContainer .share video {                             \
            width: 100%;                                           \
            height: 100%;                                          \
        }                                                          \
                                                                   \
        .videoContainer .selfview video {                          \
            transform: scaleX(-1);                                 \
        }                                                          \
                                                                   \
        .videoContainer .frame .label {                            \
            position: absolute;                                    \
            bottom: 10px;                                          \
            width: 100%;                                           \
            text-align: left;                                      \
        }                                                          \
                                                                   \
        .videoContainer .frame .label .labelContainer {            \
            height: 100%;                                          \
            display: inline-block;                                 \
            font-size: 0px;                                        \
        }                                                          \
                                                                   \
        .videoContainer .frame .label .labelContainer div {        \
            color: white;                                          \
            background-color: rgba(0, 0, 0, 0.2);                  \
            border-radius: 2px;                                    \
            padding: 3px 15px;                                     \
            height: 100%;                                          \
        }                                                          \
                                                                   \
        .videoContainer .frame .label .audioContainer .level {     \
            width: calc(100% - 20px);                              \
            margin-left: 15px;                                     \
            margin-right: 1px;                                     \
            height: 5px;                                           \
        }                                                          \
                                                                   \
        @media (min-aspect-ratio: 16/9) {                          \
            .videoContainer .share video {                         \
                height: 100%;                                      \
            }                                                      \
        }                                                          \
                                                                   \
        @media (max-aspect-ratio: 16/9) {                          \
            .videoContainer .share video {                         \
                width: 100%;                                       \
                height: 100%;                                      \
            }                                                      \
        } ";

      this.rendererType = VidyoTranscodingContext.RENDERER_TYPE_COMPOSITE;

      this.layoutEngineAttrs_ = {};

      /** @type {Object.<string, streamMappingItem>} */
      this.streamMapping_ = streamMapping;
      this.videoStreams_ = videoStreams;
      /** @type {Array.<MediaStream>} */
      this.localShareStream_ = localShareStream;
      this.transport_ = transport;

      /** @type { Object.<string, VideoPanel> } */
      this._videoPanels = {};

      var layoutEngineStyle = document.createElement("style");
      layoutEngineStyle.type = "text/css";
      layoutEngineStyle.innerHTML = layoutEngineCss;
      document.getElementsByTagName("head")[0].appendChild(layoutEngineStyle);

      /**
       Input: context: {
            participantCount,
            participants: <array of indices to indicate which participant is in which frame in the layout>
            selfViewMode: "Dock|PIP|None",
            numShares: number of shares
            width:
            height:
            layoutMode: "grid|preferred",
        }

       Output: layout: {
            videoAttributes []: {
                display: "block|none",
                x:
                y:
                width:
                height:
                fontSize:
            },
            shareAttrs: {
                // Same as videoAttributes
            },
            selfViewAttributes: {
                // Same as videoAttributes
            }
        }
       **/

      this.setDisplayCropped = function (viewId, displayCropped) {
        VLogger.LogInfo("SetDisplayCropped: viewId=" + viewId + " displayCropped=" + displayCropped);
        this.layoutEngineAttrs_[viewId] = displayCropped;
      };

      this.showViewLabel = function (viewId, showLabel) {
        VLogger.LogInfo("ShowViewLabel: viewId=" + viewId + " showLabel=" + showLabel);
        if (this._videoPanels.hasOwnProperty(viewId)) {
          this._videoPanels[viewId].showViewLabel(showLabel);
        }
      };

      this.VidyoWebRTCInitRenderer = function (viewId) {
        if (this._videoPanels.hasOwnProperty(viewId)) {
          this._videoPanels[viewId].uninitialize();
          delete this._videoPanels[viewId];
          // VLogger.LogInfo("VidyoWebRTCInitRenderer : " + JSON.stringify(Object.keys(this._videoPanels)));
        }
        this._videoPanels[viewId] = new VideoPanel(viewId);
      };

      this._buildRenderer = function (viewId, streamType) {
        var displayCropped = this.layoutEngineAttrs_.hasOwnProperty(viewId) ? this.layoutEngineAttrs_[viewId] : false;
        this._videoPanels[viewId].initialize(this.rendererType, streamType, displayCropped);
        this._videoPanels[viewId]._showAudioMeters(VidyoTranscodingContext.SHOW_AUDIO_METERS);
      };

      this.AttachVideo = function (sourceId) {
        if (this.streamMapping_.hasOwnProperty(sourceId) &&
            this.streamMapping_[sourceId].hasOwnProperty("viewId") &&
            this.streamMapping_[sourceId].hasOwnProperty("streamId") &&
            !this.streamMapping_[sourceId].attached) {

          let viewId = this.streamMapping_[sourceId]["viewId"];
          let streamType = this.streamMapping_[sourceId].type;

          if (!this._videoPanels.hasOwnProperty(viewId)) {
            VLogger.LogErr("Invalid view id - no layout engine found for " + viewId + " contains: " + JSON.stringify(Object.keys(this._videoPanels), null, 2));
            return;
          }
          this._buildRenderer(viewId, streamType);

          var streamId = this.streamMapping_[sourceId]["streamId"];
          var videoElement = this._videoPanels[viewId].getVideoElement(streamType, streamId);

          let videoStream = streamType === VidyoTranscodingContext.STREAM_TYPE_SHARE_PREVIEW ? this.localShareStream_[streamId] : this.videoStreams_[streamId];
          if (videoElement && videoStream) { // it is impossible to localCamera.SetPreviewLabel in case camera is muted or unavailable because of this if's condition
            this.streamMapping_[sourceId].attached = true;
            videoElement.srcObject = videoStream;
            videoElement.dataset.streamId = videoStream.id;
            videoElement.dataset.playIndex = streamId;

            VLogger.LogInfo("AttachVideo: viewId=" + viewId + "; videoElement=" + videoElement + "; source=" + sourceId + "; streamId=" + streamId);
            this._videoPanels[viewId].show(streamType, streamId, this.streamMapping_[sourceId].name);
          }
        }
      };

      this.HideVideoPanel = function (viewId, type, streamId) {
        if (viewId && this._videoPanels.hasOwnProperty(viewId)) {
          this._videoPanels[viewId].hide(type, streamId);
        } else {
          VLogger.LogErr("Hide: LayoutEngine not found streamId = " + streamId);
        }
      };

      this.Uninitialize = function () {
        for (var v in this._videoPanels) {
          this._videoPanels[v].uninitialize();
          delete this._videoPanels[v];
        }
        this.layoutEngineAttrs_ = {};
      };

      this._setRendererType = function (type) {
        this.rendererType = type;
        let msg = {
          method: "VidyoWebRTCSetRendererType",
          type: type
        };
        this.transport_.SendWebRTCMessage(msg, function () {
          VLogger.LogInfo("VidyoWebRTCSetRendererType sent: " + JSON.stringify(msg));
        });
      };

      this.handleStreamStatus = function (streamId, status) {
        let viewId = this.getViewId(streamId);
        if (viewId && this._videoPanels.hasOwnProperty(viewId)) {
          this._videoPanels[viewId].videoStatus(VidyoTranscodingContext.STREAM_TYPE_VIDEO, streamId, status);
        }
      };

      this.HandleVideoElementPause = function (e) {
        var videoElem = e.target;
        var streamId = parseInt(videoElem.dataset.playIndex, 10);
        VLogger.LogInfo("Paused: " + streamId);
        videoElem.play();
      };

      this.HandleVideoElementPlay = function (e) {
        var videoElem = e.target;
        var streamId = parseInt(videoElem.dataset.playIndex, 10);
        VLogger.LogInfo("Play: " + streamId);
        this.transport_.SendWebRTCMessage({
          method: "VidyoWebRTCKeyFrameRequest",
          streamId: streamId
        }, function () {
        });
      };

      this.HandleVideoElementRightClick = function (e) {
        e.preventDefault();
        return false;
      };

      this.getViewId = function (streamId) {
        for (let sourceId in this.streamMapping_) {
          if (this.streamMapping_[sourceId].streamId === streamId) {
            return this.streamMapping_[sourceId].viewId;
          }
        }
        VLogger.LogInfo("getViewId " + streamId + " NOT FOUND");
        return "";
      }

      this.onCallStopped = function () {
        var sourceIds = Object.keys(this.streamMapping_);
        for (var i = 0; i < sourceIds.length; i++) {
          var sourceId = sourceIds[i];
          var streamId = this.streamMapping_[sourceId].streamId;
          var type = this.streamMapping_[sourceId].type;
          if (type !== VidyoTranscodingContext.STREAM_TYPE_PREVIEW) {
            var viewId = this.streamMapping_[sourceId].viewId;
            if (viewId && this._videoPanels.hasOwnProperty(viewId)) {
              this._videoPanels[viewId].hide(type, streamId);
            }
            delete this.streamMapping_[sourceId];
          }
        }
      }

      this.updateLocalShareStream = function(list) {
        this.localShareStream_ = list;
      }
    }


    class AttrSet {
      constructor() {
        this.display = "none";
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.fontSize = 15;
      }
    }

    class VideoPanel {

      constructor(viewId) {
        VideoPanel.FRAME = '<div class="frame video" id="<frameid>"> <video muted autoplay playsinline> </video> <div class="label"> <div class="labelContainer"> <div class="guest" id="<elmid>"> </div> </div> <div class="audioContainer" style="display: none;"> <meter class="level" min="0.0" max="100.0"></meter> </div> </div> </div>';

        this.initialized = false;
        this.viewId = viewId;

        this.layoutUpdateInterval = -1;

        this.currentContext = {
          participantCount: 0,
          participants: new Array(LayoutEngine.NUM_ELEMENTS).fill(-1),
          selfViewMode: "None",
          numShares: 0,
          poppedOutWindows: new Array(LayoutEngine.NUM_ELEMENTS).fill(-1),
          width: 0,
          height: 0,
          layoutMode: "grid",
          displayCropped: 2,
          videoSizes: new Array(LayoutEngine.NUM_ELEMENTS + 1) // +1 for the preview element
        };

        this.currentLayout = {
          selfViewAttributes: new AttrSet(),
          videoAttributes: this.getAttrSetArray(LayoutEngine.NUM_ELEMENTS)
        };

        /** @type {VLogger} */
        this.vLogger = new VLogger(" LayoutEngine[" + this.viewId + "]: ");
      }

      initialize(rendererType, streamType, displayCropped,) {
        if (!this.initialized) {
          this.initialized = this._init(rendererType, streamType, displayCropped);
        }
      }

      uninitialize() {
        this.vLogger.LogInfo("uninitialize: " + this.viewId + " " + this.layoutUpdateInterval);
        if (this.layoutUpdateInterval !== -1) {
          clearInterval(this.layoutUpdateInterval);
          this.layoutUpdateInterval = -1;
        }
        this.initialized = false;
      }

      _init(rendererType, streamType, displayCropped) {
        this.vLogger.LogInfo("VideoPanel._init: viewId=" + this.viewId + " type=" + rendererType + " sourceId=" + streamType + " displayCropped=" + displayCropped);
        var view = document.getElementById(this.viewId);
        if (!view) {
          this.vLogger.LogErr("VideoPanel.init: NULL viewId");
          return false;
        }

        if (rendererType === VidyoTranscodingContext.RENDERER_TYPE_TILES) {
          view.innerHTML = this._buildVideoContainer_Tiles(streamType, displayCropped);
        } else {
          view.innerHTML = this._buildVideoContainer_Composite();
        }

        var videos = view.getElementsByTagName("video");
        for (let i = 0; i < videos.length; i++) {
          videos[i].addEventListener("dblclick", this.popOut.bind(this));
          this.currentContext.videoSizes[i] = {w: 0, h: 0};
        }

        this.currentContext.width = view.clientWidth;
        this.currentContext.height = view.clientHeight;

        // TODO: rid of this function by processing events/messages in right way
        this.layoutUpdateInterval = window.setInterval(() => {
          if (this.initialized) {
            var v = document.getElementById(this.viewId);
            if (!v) {
              return;
            }

            var w = v.clientWidth;
            var h = v.clientHeight;
            var videoSizeChanged = false;
            var videos = v.getElementsByTagName("video");
            for (var i = 0; i < videos.length; i++) {
              if (this.currentContext.videoSizes[i].w !== videos[i].videoWidth ||
                  this.currentContext.videoSizes[i].h !== videos[i].videoHeight) {
                this.currentContext.videoSizes[i].w = videos[i].videoWidth;
                this.currentContext.videoSizes[i].h = videos[i].videoHeight;
                videoSizeChanged = true;
              }
            }
            if (this.currentContext.width !== w || this.currentContext.height !== h || videoSizeChanged) {
              this.currentContext.width = w;
              this.currentContext.height = h;
              this.calculateLayout(this.currentContext, this.currentLayout);
            }
          }
        }, 3000);
        return true;
      }

      _buildVideoContainer_Composite() {
        LayoutEngine.NUM_ELEMENTS = 9;
        this.currentContext.displayCropped = 2;

        let layoutTemplate = '<div class="videoContainer">';

        for (let i = 0; i < LayoutEngine.NUM_ELEMENTS; i++) {
          layoutTemplate += VideoPanel.FRAME.replace("<frameid>", this.viewId + LayoutEngine.REMOTE_FRAME_ID + i).replace("<elmid>", this.viewId + LayoutEngine.REMOTE_ELM_ID + i);
        }

        layoutTemplate += VideoPanel.FRAME.replace('"frame video"', '"frame video selfview"').replace("<frameid>", this.viewId + LayoutEngine.SELF_FRAME_ID).replace("<elmid>", this.viewId + LayoutEngine.SELF_ELM_ID);
        layoutTemplate += "</div>";
        return layoutTemplate;
      }

      _buildVideoContainer_Tiles(streamType, displayCropped) {
        LayoutEngine.NUM_ELEMENTS = 1;
        if (displayCropped) {
          this.currentContext.displayCropped = 1;
        } else {
          this.currentContext.displayCropped = 0;
        }

        let layoutTemplate = '<div class="videoContainer">';

        switch (streamType) {
          case VidyoTranscodingContext.STREAM_TYPE_PREVIEW:
            layoutTemplate += VideoPanel.FRAME.replace('"frame video"', '"frame video selfview"').replace("<frameid>", this.viewId + LayoutEngine.SELF_FRAME_ID).replace("<elmid>", this.viewId + LayoutEngine.SELF_ELM_ID);
            break;
          case VidyoTranscodingContext.STREAM_TYPE_VIDEO:
          case VidyoTranscodingContext.STREAM_TYPE_SHARE:
            layoutTemplate += VideoPanel.FRAME.replace("<frameid>", this.viewId + LayoutEngine.REMOTE_FRAME_ID + 0).replace("<elmid>", this.viewId + LayoutEngine.REMOTE_ELM_ID + 0);
            break;
          case VidyoTranscodingContext.STREAM_TYPE_SHARE_PREVIEW:
            layoutTemplate += VideoPanel.FRAME.replace('"frame video"', '"frame video sharepreview"').replace("<frameid>", this.viewId + LayoutEngine.SHARE_PREVIEW_FRAME_ID).replace("<elmid>", this.viewId + LayoutEngine.SHARE_PREVIEW_ELM_ID);
            break;
        }

        layoutTemplate += "</div>";
        return layoutTemplate;
      }

      calculateLayout(context, layout) {
        var numLayoutFrames = context.participantCount;

        if (context.selfViewMode === LayoutEngine.SELF_VIEW_DOCK) {
          numLayoutFrames += 1;
        }

        var i;
        if (context.width === 0 || context.height === 0 || numLayoutFrames === 0) {
          layout.shareAttrs = new AttrSet();
          layout.selfViewAttributes = new AttrSet();
          layout.videoAttributes = this.getAttrSetArray(LayoutEngine.NUM_ELEMENTS);
          this.applyLayout(context.participants, layout);
          return;
        }

        var videoMetrics = VidyoClientGetLayout(numLayoutFrames, context.numShares, context.width, context.height, context.displayCropped);
        var fontSize;

        for (i = 0; i < context.participantCount && i < LayoutEngine.NUM_ELEMENTS; i++) {
          var attrs = layout.videoAttributes[i];
          var metrics = videoMetrics[i];
          attrs.display = "block";
          attrs.x = metrics.x;
          attrs.y = metrics.y;
          attrs.width = metrics.width;
          attrs.height = metrics.height;
          attrs.fontSize = Math.floor(attrs.height * 7 / 100);
        }

        for (i = context.participantCount; i < LayoutEngine.NUM_ELEMENTS; i++) {
          layout.videoAttributes[i].display = "none";
        }

        var selfViewAttrs = layout.selfViewAttributes;

        var selfViewMetrics;
        switch (context.selfViewMode) {
          case LayoutEngine.SELF_VIEW_DOCK:
            selfViewMetrics = videoMetrics[videoMetrics.length - 1];
            selfViewAttrs.display = "block";
            selfViewAttrs.x = selfViewMetrics.x;
            selfViewAttrs.y = selfViewMetrics.y;
            selfViewAttrs.width = selfViewMetrics.width;
            selfViewAttrs.height = selfViewMetrics.height;
            break;
          case LayoutEngine.SELF_VIEW_PIP:
            selfViewAttrs.display = "block";
            var width = Math.floor(context.width / 4);
            var height = Math.floor(context.height / 4);
            if (width > height) {
              width = Math.floor((16 * height) / 9);
            } else {
              height = Math.floor((9 * width) / 16);
            }
            selfViewAttrs.x = context.width - width;
            selfViewAttrs.y = context.height - height;
            selfViewAttrs.width = width;
            selfViewAttrs.height = height;
            break;
          default:
            selfViewAttrs.display = "none";
        }

        selfViewAttrs.fontSize = Math.floor(selfViewAttrs.height * 7 / 100);
        this.applyLayout(context.participants, layout);
      }

      applyLayout(participants, layout) {
        var applyToFrame = function (attr, frame) {
          frame.style.display = attr.display;
          if (attr.display !== "none") {
            var videoElem = frame.getElementsByTagName("video")[0];
            if (videoElem.videoWidth > 0 && videoElem.videoHeight > 0) {
              VidyoClientResizeToAspectRatio(attr, videoElem.videoWidth, videoElem.videoHeight);
            }
            frame.style.left = attr.x + "px";
            frame.style.top = attr.y + "px";
            frame.style.width = attr.width + "px";
            frame.style.height = attr.height + "px";

            frame.getElementsByClassName("labelContainer")[0].style.fontSize = attr.fontSize + "px";
          }
        };

        var frame = document.getElementById(this.viewId + LayoutEngine.SELF_FRAME_ID);
        if (frame) {
          applyToFrame(layout.selfViewAttributes, frame);
        } else {
          this.vLogger.LogInfo("applyLayout: frame not found " + (this.viewId + LayoutEngine.SELF_FRAME_ID));
        }

        var displayedFrames = new Array(LayoutEngine.NUM_ELEMENTS).fill(-1);

        var layoutIndex = 0;
        for (var i = 0; i < LayoutEngine.NUM_ELEMENTS; i++) {
          if (participants[i] !== -1) {
            displayedFrames[participants[i]] = 1;
            frame = document.getElementById(this.viewId + LayoutEngine.REMOTE_FRAME_ID + participants[i]);
            if (frame) {
              frame.dataset.index = participants[i];
              applyToFrame(layout.videoAttributes[layoutIndex++], frame);
            } else {
              this.vLogger.LogInfo("applyLayout: frame not found " + (this.viewId + LayoutEngine.REMOTE_FRAME_ID + participants[i]));
            }
          }
        }

        for (i = 0; i < LayoutEngine.NUM_ELEMENTS; i++) {
          if (displayedFrames[i] === -1) {
            frame = document.getElementById(this.viewId + LayoutEngine.REMOTE_FRAME_ID + i);
            if (frame) {
              applyToFrame({display: "none"}, frame);
            } else {
              this.vLogger.LogInfo("applyLayout: frame not found " + (this.viewId + LayoutEngine.REMOTE_FRAME_ID + i));
            }
          }
        }
      }

      showViewLabel(showLabel) {
        var display = showLabel ? "block" : "none";
        var view = document.getElementById(this.viewId);
        if (view) {
          var labels = view.getElementsByClassName("label");
          for (var i = 0; i < labels.length; i++) {
            labels[i].style.display = display;
          }
        }
      }

      _showAudioMeters(showAudioMeter) {
        var display = showAudioMeter ? "block" : "none";
        var view = document.getElementById(this.viewId);
        if (view) {
          var elems = view.querySelectorAll(".frame.video .audioContainer"); // set showAudioMeter for all video streams but VidyoTranscodingContext.STREAM_TYPE_SHARE/VidyoTranscodingContext.STREAM_TYPE_SHARE_PREVIEW
          for (var i = 0; i < elems.length; i++) {
            elems[i].style.display = display;
          }
        }
      }

      getVideoElement(type, index) {
        var frame;
        switch (type) {
          case VidyoTranscodingContext.STREAM_TYPE_PREVIEW:
            frame = document.getElementById(this.viewId + LayoutEngine.SELF_FRAME_ID);
            break;

          case VidyoTranscodingContext.STREAM_TYPE_SHARE_PREVIEW:
            frame = document.getElementById(this.viewId + LayoutEngine.SHARE_PREVIEW_FRAME_ID);
            break;

          case VidyoTranscodingContext.STREAM_TYPE_SHARE:
          case VidyoTranscodingContext.STREAM_TYPE_VIDEO:
            if (LayoutEngine.NUM_ELEMENTS <= 1) {
              index = 1;
            }
            frame = document.getElementById(this.viewId + LayoutEngine.REMOTE_FRAME_ID + (index - 1));
            break;
        }

        if (frame) {
          return frame.getElementsByTagName("video")[0];
        }

        return frame;
      }

      show(type, index, name) {
        if (!this.initialized) {
          this.vLogger.LogErr("show: NOT initialized");
          return;
        }
        if (LayoutEngine.NUM_ELEMENTS <= 1) {
          index = 1;
        }
        this.vLogger.LogInfo("show " + type + " " + index + " " + name);
        switch (type) {
          case VidyoTranscodingContext.STREAM_TYPE_PREVIEW:
            this.showPreview(name);
            break;

          case VidyoTranscodingContext.STREAM_TYPE_SHARE_PREVIEW:
            this.showSharePreview(name);
            break;

          case VidyoTranscodingContext.STREAM_TYPE_SHARE:
          case VidyoTranscodingContext.STREAM_TYPE_VIDEO:
            this.showVideo(type, index - 1, name);
            break;
        }
      }

      hide(type, index) {
        if (!this.initialized) {
          this.vLogger.LogErr("hide: NOT initialized");
          return;
        }
        this.vLogger.LogInfo("hide " + type + " " + index);
        if (LayoutEngine.NUM_ELEMENTS <= 1) {
          index = 1;
        }
        switch (type) {
          case VidyoTranscodingContext.STREAM_TYPE_PREVIEW:
            this.hidePreview();
            break;

          case VidyoTranscodingContext.STREAM_TYPE_SHARE_PREVIEW:
            this.hideSharePreview();
            break;

          case VidyoTranscodingContext.STREAM_TYPE_SHARE:
          case VidyoTranscodingContext.STREAM_TYPE_VIDEO:
            this.hideVideo(type, index - 1);
            break;
        }
      }

      showVideo(type, index, name) {
        var frame = document.getElementById(this.viewId + LayoutEngine.REMOTE_FRAME_ID + index);
        var elem = document.getElementById(this.viewId + LayoutEngine.REMOTE_ELM_ID + index);

        if (elem) {
          elem.innerHTML = name;
        }

        if (this.currentContext.participants.indexOf(index) !== -1) {

          if (type === VidyoTranscodingContext.STREAM_TYPE_SHARE && this.isVideoFrame(frame)) {
            this.vLogger.LogInfo("showVideo: switch from video to share index " + index);
            this.hideVideo(VidyoTranscodingContext.STREAM_TYPE_VIDEO, index);
            this.showVideo(type, index, name);
          } else if (type === VidyoTranscodingContext.STREAM_TYPE_VIDEO && this.isShareFrame(frame)) {
            this.vLogger.LogInfo("showVideo: switch from share to video index " + index);
            this.hideVideo(VidyoTranscodingContext.STREAM_TYPE_SHARE, index);
            this.showVideo(type, index, name);
          } else {
            this.vLogger.LogInfo("showVideo: " + type + " index " + index + " already shown");
          }
          return;
        }

        this.vLogger.LogInfo("showVideo: " + type + " index " + index + " name " + name);

        this.currentContext.participantCount += 1;
        if (type === VidyoTranscodingContext.STREAM_TYPE_SHARE) {
          this.currentContext.numShares += 1;
          for (var i = 0; i < LayoutEngine.NUM_ELEMENTS; i++) {
            if (this.currentContext.participants[i] === -1) {
              this.currentContext.participants[i] = index;
              break;
            }
          }
          this.setShareFrame(frame);
        } else {
          for (var i = LayoutEngine.NUM_ELEMENTS - 1; i >= 0; i--) {
            if (this.currentContext.participants[i] === -1) {
              this.currentContext.participants[i] = index;
              break;
            }
          }
          this.setVideoFrame(frame);
        }

        this.setPreviewMode(); // self view mode may change based on the number of participants
        this.calculateLayout(this.currentContext, this.currentLayout);
      }

      hideVideo(type, index) {
        var i = 0;
        var elem = document.getElementById(this.viewId + LayoutEngine.REMOTE_ELM_ID + index);
        if (elem) {
          elem.innerHTML = "";
        }

        var isInLayout = (this.currentContext.participants.indexOf(index) !== -1);
        var poppedOut = (this.currentContext.poppedOutWindows[index] !== -1);

        if (!isInLayout && !poppedOut) {
          this.vLogger.LogErr("hide: " + type + " index " + index + " already hidden");
          return;
        }

        this.vLogger.LogInfo("hideVideo: " + type + " index " + index + " InLayout=" + isInLayout + " poppedOut=" + poppedOut);

        // If the window is popped out, close it
        if (poppedOut) {
          var wnd = this.currentContext.poppedOutWindows[index];
          this.currentContext.poppedOutWindows[index] = -1; // so that the unload handler is not processed
          wnd.close();
        }

        // decrement and remove only if it is in the layout, else it is already decremented when popped out
        if (isInLayout) {
          this.currentContext.participantCount -= 1;
          if (type === VidyoTranscodingContext.STREAM_TYPE_SHARE) {
            this.currentContext.numShares -= 1;
          }

          var pos = -1;
          for (i = 0; i < LayoutEngine.NUM_ELEMENTS; i++) {
            if (this.currentContext.participants[i] === index) {
              this.currentContext.participants[i] = -1;
              pos = i;
              break;
            }
          }

          // Move the video elements to the end of the array so that the top slots are open for share
          // This is because the layout engine calculates the layout windows with preferred windows
          // followed by grid windows
          if (type === VidyoTranscodingContext.STREAM_TYPE_VIDEO) {
            for (i = pos; i > this.currentContext.numShares; i--) {
              this.currentContext.participants[i] = this.currentContext.participants[i - 1];
            }
            this.currentContext.participants[this.currentContext.numShares] = -1;
          } else if (type === VidyoTranscodingContext.STREAM_TYPE_SHARE) {
            // Do not leave empty spaces at the top of the array followed by share for eg [-1, S, ..]
            // The next show will occupy the top space causing it to be shown in the preferred window
            for (i = pos; i < this.currentContext.numShares; i++) {
              this.currentContext.participants[i] = this.currentContext.participants[i + 1];
            }
            this.currentContext.participants[this.currentContext.numShares] = -1;
          }
        }

        this.setPreviewMode(); // self view mode may change based on the number of participants
        this.calculateLayout(this.currentContext, this.currentLayout);
      }

      showPreview(name) {
        this.currentContext.selfViewMode = LayoutEngine.SELF_VIEW_DOCK;
        this.setPreviewMode();
        this.calculateLayout(this.currentContext, this.currentLayout);
        var elem = document.getElementById(this.viewId + LayoutEngine.SELF_ELM_ID);
        if (elem) {
          elem.innerHTML = name;
        }
      }

      hidePreview() {
        this.currentContext.selfViewMode = "None";
        var elem = document.getElementById(this.viewId + LayoutEngine.SELF_ELM_ID);
        if (elem) {
          elem.innerHTML = "";
        }
        this.calculateLayout(this.currentContext, this.currentLayout);
      }

      // this method is NOT for Composite Layout since it does not call calculateLayout
      showSharePreview(name) {
        this.currentContext.selfViewMode = "None";
        let frame = document.getElementById(this.viewId + LayoutEngine.SHARE_PREVIEW_FRAME_ID);
        let elem = document.getElementById(this.viewId + LayoutEngine.SHARE_PREVIEW_ELM_ID);
        if (elem) {
          elem.innerHTML = name;
        }
        frame.style.display = 'block';
      }

      // this method is NOT for Composite Layout since it does not call calculateLayout
      hideSharePreview() {
        this.currentContext.selfViewMode = "None";
        let frame = document.getElementById(this.viewId + LayoutEngine.SHARE_PREVIEW_FRAME_ID);
        let elem = document.getElementById(this.viewId + LayoutEngine.SHARE_PREVIEW_ELM_ID);
        if (elem) {
          elem.innerHTML = "";
        }
        frame.style.display = 'none';
      }

      popIn(type, index, name) {
        if (this.currentContext.poppedOutWindows[index] !== -1) {
          this.currentContext.poppedOutWindows[index] = -1;
          this.vLogger.LogInfo("popIn " + type + " index=" + index + " name=" + name);
          this.showVideo(type, index, name);
        } else {
          this.vLogger.LogInfo("popIn " + type + " index=" + index + " name=" + name + " window closed");
        }
      }

      popOut(e) {
        var videoElem = e.target;
        var frame = videoElem.parentNode;
        // Only share windows are allowed to popped out, but this can be changed to pop out videos as well
        if (frame && this.isShareFrame(frame)) {
          var layoutIndex = parseInt(frame.dataset.index, 10);
          var name = document.getElementById(this.viewId + LayoutEngine.REMOTE_ELM_ID + layoutIndex).innerHTML;
          var height = Math.min(videoElem.videoHeight, screen.height * 0.9);
          var width = Math.min(videoElem.videoWidth, screen.width * 0.9);
          var top = (screen.height - height) * 0.2;
          var left = (screen.width - width) * 0.3;

          this.vLogger.LogInfo("popOut share frame with id " + frame.id + " name=" + name + " index=" + layoutIndex + " Res=" + width + "x" + height);// + " src=" + src);
          this.hideVideo(VidyoTranscodingContext.STREAM_TYPE_SHARE, layoutIndex);

          this.currentContext.poppedOutWindows[layoutIndex] = window.open("", "Share - " + name, "width=" + width + ", height=" + height + ", left=" + left + ", top=" + top);

          var html = "<html style=\"width:100%;height:100%;\"><head><title>Share - " + name + "</title></head><body style=\"background-color:#202020;margin:0;width:100%;height:100%;\"\"><video autoplay muted playsinline style=\"width:100%;height:100%;\"></video></body></html>";
          this.currentContext.poppedOutWindows[layoutIndex].document.open();
          this.currentContext.poppedOutWindows[layoutIndex].document.write(html);
          this.currentContext.poppedOutWindows[layoutIndex].document.close();

          let videoTag = this.currentContext.poppedOutWindows[layoutIndex].document.querySelector("video");
          videoTag.muted = true;
          videoTag.autoplay = true;
          videoTag.playsinline = true;
          videoTag.srcObject = videoElem.srcObject;

          this.currentContext.poppedOutWindows[layoutIndex].addEventListener("beforeunload", this.popIn.bind(this, VidyoTranscodingContext.STREAM_TYPE_SHARE, layoutIndex, name));
          this.currentContext.poppedOutWindows[layoutIndex].addEventListener("unload", this.popIn.bind(this, VidyoTranscodingContext.STREAM_TYPE_SHARE, layoutIndex, name));
        }
      }

      setPreviewMode() {
        if (this.currentContext.selfViewMode !== LayoutEngine.SELF_VIEW_DOCK && this.currentContext.selfViewMode !== LayoutEngine.SELF_VIEW_PIP) {
          return;
        }

        // For single participant, self view is dock
        // For more than 1 participants, self view is dock
        // For 1 participant, self view is pip
        if (this.currentContext.participantCount <= 0 || this.currentContext.participantCount > 1) {
          this.currentContext.selfViewMode = LayoutEngine.SELF_VIEW_DOCK;
        } else {
          this.currentContext.selfViewMode = LayoutEngine.SELF_VIEW_PIP;
        }
      };

      isShareFrame(frame) {
        if (frame && frame.className.indexOf(" share") !== -1) {
          return true;
        }
        return false;
      }

      isVideoFrame(frame) {
        if (frame && frame.className.indexOf(" video") !== -1) {
          return true;
        }
        return false;
      }

      setShareFrame(frame) {
        if (frame) {
          frame.className = frame.className.replace(" video", " share");
        }
      }

      setVideoFrame(frame) {
        if (frame) {
          frame.className = frame.className.replace(" share", " video");
        }
      }

      getAttrSetArray(n) {
        var ret = [];
        for (var i = 0; i < n; i++) {
          ret.push(new AttrSet());
        }
        return ret;
      }

      videoStatus(type, index, status) {
        if (!this.initialized) {
          this.vLogger.LogErr("videoStatus: NOT initialized");
          return;
        }
        this.vLogger.LogInfo("videoStatus " + type + " " + index + " " + status);
        if (LayoutEngine.NUM_ELEMENTS <= 1) {
          index = 1;
        }
        var frame;
        switch (type) {
          case VidyoTranscodingContext.STREAM_TYPE_SHARE:
          case VidyoTranscodingContext.STREAM_TYPE_VIDEO:
            frame = document.getElementById(this.viewId + LayoutEngine.REMOTE_FRAME_ID + (index - 1));
            break;
        }

        if (frame) {
          if (status === "stalled") {
            frame.getElementsByTagName("video")[0].load();
          }
        }
      }

      setAudioLevel(type, index, level) {
        if (!this.initialized) {
          this.vLogger.LogErr("setAudioLevels: NOT initialized");
          return;
        }
        // this.vLogger.LogInfo("setAudioLevel " + type + " " + index + " " + level);
        if (LayoutEngine.NUM_ELEMENTS <= 1) {
          index = 1;
        }
        var frame;
        switch (type) {
          case VidyoTranscodingContext.STREAM_TYPE_PREVIEW:
            frame = document.getElementById(this.viewId + LayoutEngine.SELF_FRAME_ID);
            break;
          case VidyoTranscodingContext.STREAM_TYPE_SHARE_PREVIEW:
            break;
          case VidyoTranscodingContext.STREAM_TYPE_SHARE:
          case VidyoTranscodingContext.STREAM_TYPE_VIDEO:
            frame = document.getElementById(this.viewId + LayoutEngine.REMOTE_FRAME_ID + (index - 1));
            break;
        }

        if (frame) {
          window.requestAnimationFrame(function () {
            frame.getElementsByClassName("level")[0].value = level;
          });
        }
      }
    }

    /**
     * @param streamMapping
     * @param videoStreams
     * @param localShareStream
     * @param transport
     * @returns {LayoutEngine}
     */
    LayoutEngine.initUILayout = function (streamMapping, videoStreams, localShareStream, transport) {
      if (!LayoutEngine._layoutEngineInstance) {
        LayoutEngine._layoutEngineInstance = new LayoutEngine(streamMapping, videoStreams, localShareStream, transport);
      }
      return LayoutEngine._layoutEngineInstance;
    };

    LayoutEngine.setRendererType = function (type) {
      LayoutEngine._layoutEngineInstance._setRendererType(type);
    };

    LayoutEngine.NUM_ELEMENTS = 9;
    LayoutEngine.SELF_VIEW_DOCK = "Dock";
    LayoutEngine.SELF_VIEW_PIP = "PIP";

    LayoutEngine.LAYOUT_MODE_PREFERRED = "preferred";
    LayoutEngine.LAYOUT_MODE_GRID = "grid";

    LayoutEngine.SELF_FRAME_ID = "_vidyoSelfFrame";
    LayoutEngine.SHARE_PREVIEW_FRAME_ID = "_vidyoSharePreviewFrame";
    LayoutEngine.REMOTE_FRAME_ID = "_vidyoRemoteFrame";

    LayoutEngine.SELF_ELM_ID = "_vidyoSelfElm";
    LayoutEngine.SHARE_PREVIEW_ELM_ID = "_vidyoSharePreviewElm";
    LayoutEngine.REMOTE_ELM_ID = "_vidyoRemoteElm";

    VidyoTranscodingContext.LayoutEngine = LayoutEngine;

//////////////////////// AudioMetering //////////////////////////////
  class AudioMeter {
    /**
     * @param {VidyoInputDevice} mic
     * @param {Array.<HTMLAudioElement>} remoteAudio
     */
    constructor(mic, remoteAudio) {
      /** @type {VidyoInputDevice} */
      this.mic_ = mic;
      /** @type {Array<HTMLAudioElement>} */
      this.remoteAudio_ = remoteAudio;

      this.showAudioMeters_ = true;
      /** @type {AudioLevelDetection} */
      this.localAudioLevelDetection_ = null;
      /** @type {Array.<AudioLevelDetection>} */
      this.remoteAudioLevelDetection_ = [];
      this.remoteAudioStreamIdMapping_ = [];

      for (var r = 0; r < VidyoTranscodingContext.MAX_REMOTE_AUDIO_STREAMS; r++) {
        this.remoteAudioLevelDetection_[r] = null;
        this.remoteAudioStreamIdMapping_[r] = -1;
      }
    }

    /**
     * @param {boolean} showAudioMeters
     */
    SetShowAudioMeters(showAudioMeters) {
        this.showAudioMeters_ = showAudioMeters;
    }

    MapAudioStream(audioId, streamId) {
      this.remoteAudioStreamIdMapping_[audioId] = streamId;
    }

    UpdateAudioLevel(audioId, level) {
      let streamMapping_ = LayoutEngine._layoutEngineInstance.streamMapping_;
      if (audioId === 0) {
        if (streamMapping_.hasOwnProperty(VidyoTranscodingContext.PREVIEW_SOURCE_ID)) {
          var viewId = streamMapping_[VidyoTranscodingContext.PREVIEW_SOURCE_ID].viewId;
          if (viewId) {
            LayoutEngine._layoutEngineInstance._videoPanels[viewId].setAudioLevel(VidyoTranscodingContext.STREAM_TYPE_PREVIEW, 0, level);
          }
        }
      } else {
        var streamId = this.remoteAudioStreamIdMapping_[audioId];
        for (var sourceId in streamMapping_) {
          var viewId = streamMapping_[sourceId].viewId;
          if (streamMapping_[sourceId].streamId === streamId && viewId) {
            LayoutEngine._layoutEngineInstance._videoPanels[viewId].setAudioLevel(VidyoTranscodingContext.STREAM_TYPE_VIDEO, streamId, level);
          }
        }
      }
    }

    StartLocalAudioLevelDetection() {
      var stream = this.mic_.GetStreamAndTrack().stream;
      if (stream) {
        this.localAudioLevelDetection_ = new AudioLevelDetection(0, 300); // Update the audio level every 300ms
        this.localAudioLevelDetection_.Start(stream, (audioId, level) => {
          this.UpdateAudioLevel(audioId, level);
        });
      } else {
        VLogger.LogErr("StartLocalAudioLevelDetection failed: no mic stream");
      }
    }

    StopLocalAudioLevelDetection() {
      if (this.localAudioLevelDetection_) {
        this.localAudioLevelDetection_.Stop();
        this.localAudioLevelDetection_ = null;
        this.UpdateAudioLevel(0, 0);
      }
    }

    StartRemoteAudioLevelDetection() {
      for (var i = 0; i < VidyoTranscodingContext.MAX_REMOTE_AUDIO_STREAMS; i++) {
        if (this.remoteAudio_[i].srcObject && !this.remoteAudioLevelDetection_[i]) {
          this.remoteAudioLevelDetection_[i] = new AudioLevelDetection(i + 1, 300);
          this.remoteAudioLevelDetection_[i].Start(this.remoteAudio_[i].srcObject, (audioId, level) => {
            this.UpdateAudioLevel(audioId, level);
          });
        }
      }
    }

    StopRemoteAudioLevelDetection() {
      for (var i = 0; i < this.remoteAudioLevelDetection_.length; i++) {
        if (this.remoteAudioLevelDetection_[i]) {
          this.remoteAudioLevelDetection_[i].Stop();
          this.remoteAudioLevelDetection_[i] = null;
          this.UpdateAudioLevel(i + 1, 0);
        }
      }
    }
  }

  VidyoTranscodingContext.AudioMeter = AudioMeter;

  class AudioLevelDetection {

    constructor(id, interval) {
      this.id = id;
      this.interval = interval;
      this.audioAnalyser_ = AudioLevelDetection.audioContext.createAnalyser();
      this.audioAnalyser_.fftSize = 64;
      this.audioAnalyser_.smoothingTimeConstant = 0.3;
      this.source_ = null;
      this.buffer_ = null;
      this.callback_ = null;
    }

    GetAudioLevel() {
      if (!this.buffer_) {
        return;
      }
      this.audioAnalyser_.getByteFrequencyData(this.buffer_);
      var average = 0;
      for (var i = 0; i < this.buffer_.length; i++) {
        average += this.buffer_[i];
      }

      average = average / this.buffer_.length;
      if (this.callback_) {
        this.callback_(this.id, average);
        setTimeout(() => {
          this.GetAudioLevel();
        }, this.interval);
      }
    }

    Start(stream, callback) {
      this.source_ = AudioLevelDetection.audioContext.createMediaStreamSource(stream);
      this.callback_ = callback;
      this.source_.connect(this.audioAnalyser_);
      this.buffer_ = new Uint8Array(this.audioAnalyser_.frequencyBinCount);
      this.GetAudioLevel();
    }

    Stop() {
      this.source_.disconnect();
      this.audioAnalyser_.disconnect();
      this.buffer_ = null;
      this.callback_ = null;
    }
  }

  AudioLevelDetection.audioContext = new (window.AudioContext || window.webkitAudioContext)();

/////////////////////////////////////////////////////////////////////
////////////////// VCLayoutEngine.js end ////////////////////

////////////////// VCPortal.js start //////////////////
  function CheckAndRedirectToPortal() {
    console.log('ERROR: CheckAndRedirectToPortal not implemented...');
    return false;
  }

  VidyoTranscodingContext.CheckAndRedirectToPortal = CheckAndRedirectToPortal;
////////////////// VCPortal.js end /////////////////////
}

  /**
   * @param plugInObj
   * @param statusChangeHandler
   * @param callbackHandler
   * @param plugInDivId - TODO: never used !!!
   * @constructor
   *
   * @description The class has unsuitable name, but it is used by VidyoClientDispatcher.js by this name
   */
  function VidyoClientTransport(plugInObj, statusChangeHandler, callbackHandler, plugInDivId){

    /** @type {VidyoClientTransportWebRTC} */
    var vidyoClientTransportWebRTC = null;

    function randomString(length, chars) {
      var result = '';
      for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
      return result;
    }
    var sessionId = randomString(12, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

    /*
    Possible args{}
    ({uiEvent:"create", viewId:viewId, viewStyle:viewStyle, remoteParticipants:remoteParticipants, userData:userData, consoleLogFilter:consoleLogFilter, fileLogFilter:fileLogFilter, fileLogName:fileLogName});
    ({uiEvent:"constructor", viewId:viewId, viewStyle:viewStyle, remoteParticipants:remoteParticipants, userData:userData, consoleLogFilter:consoleLogFilter, fileLogFilter:fileLogFilter, fileLogName:fileLogName});
    ({uiEvent:"CreateRendererFromViewId", viewId:viewId, x:x, y:y, width:width, height:height});
    ({uiEvent:"AssignViewToCompositeRenderer", viewId:viewId, viewStyle:viewStyle, remoteParticipants:remoteParticipants});
    ({uiEvent:"AssignViewToLocalCamera", viewId:viewId, localCamera:localCamera, displayCropped:displayCropped, allowZoom:allowZoom});
    ({uiEvent:"AssignViewToRemoteCamera", viewId:viewId, remoteCamera:remoteCamera, displayCropped:displayCropped, allowZoom:allowZoom});
    ({uiEvent:"AssignViewToRemoteWindowShare", viewId:viewId, remoteWindowShare:remoteWindowShare, displayCropped:displayCropped, allowZoom:allowZoom});
    ({uiEvent:"HideView", viewId:viewId});
    ({uiEvent:"SetViewAnimationSpeed", viewId:viewId, speedPercentage:speedPercentage});
    ({uiEvent:"SetViewBackgroundColor", viewId:viewId, red:red, green:green, blue:blue});
    ({uiEvent:"ShowAudioMeters", viewId:viewId, showMeters:showMeters});
    ({uiEvent:"ShowViewAt", viewId:viewId, x:x, y:y, width:width, height:height});
    ({uiEvent:"ShowViewLabel", viewId:viewId, showLabel:showLabel});
    */
    this.UpdateViewOnDOM = function(args){
      var plugInDivId = args.viewId ? sessionId + "_" + args.viewId : args.viewId;
      var type = "RENDERER";
      if((args.uiEvent.indexOf("create") !== -1) || (args.uiEvent.indexOf("constructor") !== -1) || (args.uiEvent.indexOf("AssignView") !== -1)){
        if(args.viewId){
          var view = document.querySelector('#' + args.viewId);
          if (view && ! view.querySelector(".VidyoClientPlugIn")) {
            let plugInDiv = document.createElement('div');
            plugInDiv.id = plugInDivId;
            plugInDiv.vidyoclientplugin_type=type;
            plugInDiv.classList.add('VidyoClientPlugIn');
            plugInDiv.style.cssText='width: 100%; height: 100%;';
            view.appendChild(plugInDiv);
            if (args.uiEvent.indexOf("AssignViewToLocalCamera") !== -1 || args.uiEvent.indexOf("AssignViewToRemoteCamera") !== -1 || args.uiEvent.indexOf("AssignViewToRemoteWindowShare") !== -1) {
              vidyoClientTransportWebRTC.GetWebRTCClient().getLayoutEngine().setDisplayCropped(plugInDivId, args.displayCropped);
            }
          }
        }
      }
      else if (args.uiEvent.indexOf("ShowView") !== -1){
      }
      else if (args.uiEvent.indexOf("HideView") !== -1){
        if(args.viewId){
          document.querySelector('#' + args.viewId).innerHTML = '';
        }
      }

      if (args.uiEvent === "constructor" || args.uiEvent === "create") {
        vidyoClientTransportWebRTC = new VidyoClientTransportWebRTC(plugInObj, statusChangeHandler, callbackHandler, plugInDivId, () => {
          VidyoTranscodingContext.LayoutEngine.setRendererType(!!args.viewId ? VidyoTranscodingContext.RENDERER_TYPE_COMPOSITE : VidyoTranscodingContext.RENDERER_TYPE_TILES);
        });
      } else if (args.uiEvent === "SetViewBackgroundColor") {
        if (args.viewId) {
          document.querySelector('#' + plugInDivId).style.backgroundColor = "rgb(" + args.red + "," + args.green + "," + args.blue + ")";
        }
      } else if (args.uiEvent === "ShowViewLabel") {
        vidyoClientTransportWebRTC.GetWebRTCClient().getLayoutEngine().showViewLabel(plugInDivId, args.showLabel);
      } else if (args.uiEvent === "ShowAudioMeters") {
        vidyoClientTransportWebRTC.GetWebRTCClient().showAudioMeters(plugInDivId, args.showMeters);
      } else if (args.uiEvent === "AssignViewToCompositeRenderer") {
        VidyoTranscodingContext.LayoutEngine.setRendererType(VidyoTranscodingContext.RENDERER_TYPE_COMPOSITE);
      }

      return plugInDivId;
    };

    this.SendMessage = function(data, asyncSuccess, asyncFailure, async){
      return vidyoClientTransportWebRTC.SendMessage(data, asyncSuccess, asyncFailure, async);
    };

    setTimeout(function() { statusChangeHandler({state: "READY", description: "WebRTC successfully loaded"}) }, 100);
  }

    /**
     *
     * @param plugInObj
     * @param statusChangeHandler
     * @param callbackHandler
     * @param plugInDivId - TODO: never used !!!
     * @param callback
     * @constructor
     */
function VidyoClientTransportWebRTC(plugInObj, statusChangeHandler, callbackHandler, plugInDivId, callback){

    const MAX_RETRIES = 10;
    const WAIT_TIME_BEFORE_RETRY = 400; // first retry after 400 ms, second retry after 800ms, third retry after 1200ms and so on

    var contextObj = plugInObj;
    var statusChangeCallback = statusChangeHandler;
    var receiveCallback = callbackHandler;

    var session = "";
    var callId = "";
    var ms = "";
    var webrtcServer = VCUtils.webRTCServer;
    var requestNum = 1;

    var webrtcClient = new VidyoClientWebRTC(this);
    if(typeof(VidyoAppWebRTC) !== 'undefined') { //  Neo specific
        VidyoAppWebRTC.webrtcClient = webrtcClient;
        VidyoAppWebRTC.transport = this;
    }

    var connectionState = "CONNECTING";
    var eventsCounter = 1;

    var loggedInInactivityTimer = null;

    var loggedOutTimer = null;

    var requestQueue = {};
    var requestPending = -1;

    var logLevel = (VCUtils.params && VCUtils.params.webrtcLogLevel) ? VCUtils.params.webrtcLogLevel : "info";

    if (logLevel !== "info") {
        VLogger.disableLog(true);
    }

    var LogInfo = function(msg) {
        if (logLevel === "info") {
            console.log(VLogger.GetTimeForLogging() + " Transport: " + msg);
            vidyoApp.pushToLog("INFO: Transport: " + msg);
        }
    };


    var LogErr = function(msg) {
        if (logLevel === "info" || logLevel === "error") {
            console.error(VLogger.GetTimeForLogging() + " Transport: " + msg);
            vidyoApp.pushToLog("ERR: Transport: " + msg);
        }
    };

    var connectionError = function() {
        if (webrtcClient.uninitializedOnUnload) { return; }
        if (connectionState === "CONNECTED" || connectionState === "CONNECTING") {
            webrtcClient.Uninitialize();
            connectionState = "DISCONNECTED";
            statusChangeCallback({state: "DISCONNECTED", description: "Cannot reach the WebRTC Server"});
        }
    };

    var connectionTimedOut = function() {
        if (connectionState === "CONNECTED" || connectionState === "CONNECTING") {
            webrtcClient.Uninitialize(true);
            connectionState = "TIMEDOUT";
            statusChangeCallback({state: "TIMEDOUT"});
        }
    };

    var stopLoggedOutTimeout = function() {
      if (loggedOutTimer) {
        window.clearTimeout(loggedOutTimer);
        loggedOutTimer = null;
      }
    };

    var startLoggedOutTimeout = function() {
      stopLoggedOutTimeout();
      loggedOutTimer = window.setTimeout(connectionTimedOut, VidyoTranscodingContext.LOGGEDOUT_TIMEOUT);
    };

    startLoggedOutTimeout();

    var listenForActivity = function() {
      window.addEventListener("mousemove", startLoggedInInactivityTimeout);
      window.addEventListener("mousedown", startLoggedInInactivityTimeout);
      window.addEventListener("keydown", startLoggedInInactivityTimeout);
    };

    var unlistenForActivity = function() {
      window.removeEventListener("mousemove", startLoggedInInactivityTimeout);
      window.removeEventListener("mousedown", startLoggedInInactivityTimeout);
      window.removeEventListener("keydown", startLoggedInInactivityTimeout);
    };

    var stopLoggedInInactivityTimeout = function() {
      if (loggedInInactivityTimer) {
        unlistenForActivity();
        window.clearTimeout(loggedInInactivityTimer);
        loggedInInactivityTimer = null;
      }
    };

    var startLoggedInInactivityTimeout = function() {
      if(VidyoTranscodingContext.LOGGEDIN_INACTIVITY_TIMEOUT > 0) {
        stopLoggedInInactivityTimeout();
        loggedInInactivityTimer = window.setTimeout(connectionTimedOut, VidyoTranscodingContext.LOGGEDIN_INACTIVITY_TIMEOUT);
        listenForActivity();
      }
    };

    var leftPad = function(num, size) {
        var s = num + "";
        while (s.length < size) {
            s = "0" + s;
        }
        return s;
    };

    var TransportMessageSequential = function(url, params, async, successCb, doLog) {
        requestQueue[leftPad(params.requestNum, 9)] = {url: url, params: params, async: async, successCb: successCb, doLog: doLog};
        CheckAndSendMessage();

    };

    var CheckAndSendMessage = function() {
        var requests = Object.keys(requestQueue);
        if (connectionState === "CONNECTING") {
            LogInfo("CheckAndSendMessage: Waiting for CONNECTED QLen=" + requests.length);
            return;
        }

        if (requests.length <= 0) {
            return;
        }

        var requestNumbers = requests.sort().splice(0, 10);
        var currentRequestNumber = requestQueue[requestNumbers[0]].params.requestNum;
        if (requestPending >= 0 && requestPending !== currentRequestNumber) {
            LogInfo("CheckAndSendMessage: Waiting for " + requestPending + " currentRequestNumber=" + currentRequestNumber + " QLen=" + requests.length);
        } else {
            var params = [];
            var callbacks = [];
            var destination = requestQueue[requestNumbers[0]].params.destination;
            var url = requestQueue[requestNumbers[0]].url;
            var async = requestQueue[requestNumbers[0]].async;

            requestNumbers.forEach(function(r) {
                var request = requestQueue[r];
                delete request.params.destination;
                delete request.params.session;
                params.push(request.params);
                callbacks.push(request.successCb);
                delete requestQueue[r];
            });

            var data = {
                destination: destination,
                params: params,
                session: session
            };
            var retryCount = 0;
            requestPending = params[0].requestNum;
            LogInfo("CheckAndSendMessage: Sending: " + requestPending + " - " + params[params.length-1].requestNum + " QLen=" + requests.length);

            var TransportMessageSuccess = function(a) {
                requestPending = -1;
                for (var i = 0; i < a.length; i++) {
                    callbacks[i](JSON.parse(a[i]));
                }
                CheckAndSendMessage();
            };

            var TransportMessageError = function(err) {
                if (err === "error" || err === "abort") {
                    if (retryCount <= MAX_RETRIES) {
                        retryCount++;
                        var timeout = retryCount * WAIT_TIME_BEFORE_RETRY;
                        LogInfo("CheckAndSendMessage [" + requestPending + "] err=" + err + " retryCount=" + retryCount + " retrying after " + timeout + "ms");
                        setTimeout(function() {
                            TransportMessage(url, data, async, TransportMessageSuccess, TransportMessageError, true, VidyoTranscodingContext.TRANSPORT_REQUEST_TIMEOUT);
                        }, timeout);
                    } else {
                        connectionError();
                    }
                } else {
                    connectionError();
                }
            };

            TransportMessage(url, data, async, TransportMessageSuccess, TransportMessageError, true, VidyoTranscodingContext.TRANSPORT_REQUEST_TIMEOUT);
        }
    };

    var TransportMessage = function(url, params, async, successCb, errorCb, doLog, timeout) {
        if (webrtcClient.initializedState === 'UNINITIALIZED'){
            LogInfo("Sending Transport Message in UNINITIALIZED state");
            return;
        }
        if (connectionState !== "CONNECTING" && connectionState !== "CONNECTED") {
            LogErr("Transport Message in invalid state " + connectionState);
            return;
        }
        var start = Date.now();
        var paramsStr = JSON.stringify(params);
        var logStr = webrtcServer + url + ":" + paramsStr;


        if (doLog && !isNeo()) {
            LogInfo("Req: async:" + async + " - " + logStr);
        }
        var oReq = new XMLHttpRequest();
        oReq.open("post", webrtcServer + url, async);

        if (timeout) {
            oReq.timeout = timeout;
        }

        oReq.onload = function() {
            if (oReq.status !== 200) {
                LogErr(logStr + " " + oReq.status + " " + oReq.statusText);
                errorCb(oReq.status + " " + oReq.statusText);
                return;
            }


            if (doLog) {
              if (isNeo()) {
                neoLogInfo(oReq, url,  params, LogInfo);
              } else {
                let logRespStr = oReq.responseText.replace(/VidyoRoomFeedbackGetRoomPropertiesResult.*VIDYO_ROOMGETPROPERTIESRESULT/, "VidyoRoomFeedbackGetRoomPropertiesResult*****VIDYO_ROOMGETPROPERTIESRESULT");
                LogInfo("Resp: [" + (Date.now() - start) + "] " + logStr + " response: " + logRespStr);
              }
            }

            try {
                var response = JSON.parse(oReq.responseText);
                successCb(response);
                return;
            } catch (e) {
                LogErr("TransportMessage: " + logStr + " Exception - " + e.stack + " " +  e);
                // statusChangeCallback({error: e});
            }
        };

        oReq.onerror = function(e) {
            LogErr(logStr + " onerror: " +  e);
            errorCb("error");
        };

        oReq.onabort = function(e) {
            LogErr(logStr + " onabort: " +  e);
            errorCb("abort");
        };

        oReq.ontimeout = function (e) {
            LogErr(logStr + " ontimeout: " +  e);
            errorCb("timeout");
        };

        oReq.send(paramsStr);

    };


    var HandleEvents = function(evts) {
        for (let i = 0; i < evts.length; i++) {
            switch(evts[i].destination) {
                case "VidyoWebRTC":
                    webrtcClient.callback(evts[i].data);
                    switch(evts[i].data.method) {
                        case "VidyoWebRTCStartCall":
                            stopLoggedOutTimeout();
                            startLoggedInInactivityTimeout();
                            break;

                        case "VidyoWebRTCStopCall":
                            stopLoggedInInactivityTimeout();
                            startLoggedOutTimeout();
                            break;
                    }
                break;
                case "VidyoClient":
                    try {
                        if (loggedOutTimer && evts[i].data.indexOf("VIDYO_USERLOGINRESULT_OK") !== -1) { //  Hunter specific
                          LogInfo("Login Succeeded, clearing login timeout");
                          stopLoggedOutTimeout();
                          startLoggedInInactivityTimeout();
                        }
                        // async processing of callbacks
                        setTimeout(() => {
                          receiveCallback(contextObj, JSON.parse(evts[i].data));
                        });
                    } catch (e) {
                        LogErr("HandleEvents: VidyoClient error: " + e.stack + " " + e);
                        // statusChangeCallback({error: e});
                    }
                    break;
                default:
                    if (evts[i].type === 'callDisconnected') {
                        if (!webrtcClient.uninitializedOnUnload) {
                            VCUtils.onloadCallback({state: 'DISCONNECTED', description: 'Call disconnected'});
                        }
                        break;
                    }
            }
        }
    };

    var LongPoll = function(retryCnt) {
        if (retryCnt === undefined) {
            retryCnt = 0;
            eventsCounter++;
        }

        TransportMessage("/events", {session: session, count: eventsCounter}, true,
            function(resp) {
                HandleEvents(resp);
                LongPoll();
            }, function(err) {
                if (err === "error" || err === "abort") {
                    if (retryCnt <= MAX_RETRIES) {
                        retryCnt++;
                        var timeout = retryCnt * WAIT_TIME_BEFORE_RETRY;
                        LogInfo("LongPoll err=" + err + " retrying after " + timeout + "ms");
                        setTimeout(function() {
                            LongPoll(retryCnt);
                        }, timeout);
                    } else {
                        connectionError();
                    }
                } else {
                    connectionError();
                }
            }, true, VidyoTranscodingContext.EVENTS_REQUEST_TIMEOUT);
    };

    var Initialize = function() {
        TransportMessage("/initialize", {version: VCUtils.webRTCGWServerVersion}, true, function(resp) {
            session = resp.session;
            callId = resp.callId;
            ms = resp.ms;
            if (resp.host.length > 0) {
                webrtcServer = "https://" + resp.host;
            }
            connectionState = "CONNECTED";
            webrtcClient.initializedState = "INITIALIZED";
            LongPoll();
            CheckAndSendMessage();
            callback();
            }, function() {
                connectionState = "DISCONNECTED";
                statusChangeCallback({state: "FAILED", description: "Could not initialize WebRTC transport"});
            }, true, VidyoTranscodingContext.TRANSPORT_REQUEST_TIMEOUT);
    };

    function SendVidyoClientMessage(data, asyncSuccess, async, reqNum) {
        var request = {
            destination: "VidyoClient",
            data: data,
            requestNum: reqNum,
            session: session
        };
        var ret;
        var localAsync = false;
        if (async === true && typeof asyncSuccess === "function") {
            localAsync = async;
        }

        TransportMessageSequential("/transport", request, localAsync,
            function(response) {
                ret = response;
                if (localAsync) {
                    asyncSuccess(response);
                }
                return response;
            }, true);

        return ret;
    }

    this.SendMessage = function(data, asyncSuccess, asyncFailure, async){
        if (webrtcClient.initializedState === 'UNINITIALIZED'){
            LogInfo("SendMessage in UNINITIALIZED state");
            return {result: "ok"};
        }
        if (connectionState !== "CONNECTED" && connectionState !== "CONNECTING") {
            LogErr("SendMessage in invalid state " + connectionState);
            return {result: "error"};
        }

        // intercept share register call to select sharing context first
        if (JSON.stringify(data).includes("VidyoConnectorRegisterLocalWindowShareEventListener")) {
            webrtcClient.SelectShare(status => {
                if (status) {
                    SendVidyoClientMessage(data, asyncSuccess, async, requestNum++);
                } else {
                    webrtcClient.ResetShareId();
                }
            }, function() {});
            return;
        }

        return SendVidyoClientMessage(data, asyncSuccess, async, requestNum++);
    };

    function SendWebRTCMessageWithRetry(params, cb, retryCount) {
        var request = {
            destination: "VidyoWebRTC",
            data: JSON.stringify(params),
            session: session
        };
        TransportMessage("/transport", request, true, cb, function(err) {
            if (err === "error" || err === "abort") {
                if (retryCount <= MAX_RETRIES) {
                    retryCount++;
                    var timeout = retryCount * WAIT_TIME_BEFORE_RETRY;
                    LogInfo("SendWebRTCMessage err=" + err + " retrying after " + timeout + "ms");
                    setTimeout(function() {
                        SendWebRTCMessageWithRetry(params, cb, retryCount);
                    }, timeout);
                } else {
                    connectionError();
                }
            } else {
                connectionError();
            }
        }, params.method !== 'VidyoWebRTCStats', VidyoTranscodingContext.TRANSPORT_REQUEST_TIMEOUT);
    };

    this.SendWebRTCMessage = function(params, cb) {
        if (webrtcClient.initializedState === 'UNINITIALIZED'){
            LogInfo("SendWebRTCMessage in UNINITIALIZED state");
            return true;
        }
        if (connectionState !== "CONNECTED") {
            LogErr("SendMessage in invalid state " + connectionState);
            return false;
        }

        SendWebRTCMessageWithRetry(params, cb, 0);
        return true;
    };

    this.SendBeaconMessage = function() {
        if (webrtcClient.initializedState === 'UNINITIALIZED'){
            return LogInfo("Sending Beacon Message in UNINITIALIZED state");
        }

        let resultVidyoWebRTCUninitialize = navigator.sendBeacon(`${webrtcServer}/transport`, JSON.stringify({
            destination: "VidyoWebRTC",
            data: JSON.stringify({"method":"VidyoWebRTCUninitialize"}),
            session: session
        }));

        if (resultVidyoWebRTCUninitialize) {
            LogInfo("User-agent successfully queued the VidyoWebRTCUninitialize request for transfer");
        } else {
            LogErr("User-agent was not able to queue the VidyoWebRTCUninitialize request for transfer");
        }
    };

    this.SendLogs = function(logs, cb) {
        var oReq = new XMLHttpRequest();
        oReq.open("post", webrtcServer + "/uploadlogs?callId="+callId+"&mediaserver="+ms, true);

        oReq.onload = function() {
            cb(true);
        };

        oReq.onerror = function(e) {
            LogErr("SendLogs: onerror: " +  e);
            cb(false);
        };

        oReq.onabort = function(e) {
            LogErr("SendLogs: onabort: " +  e);
            cb(false);
        };


        oReq.send(logs);
    };

    this.GetWebRTCClient = function() {
        return webrtcClient;
    };


    this.Uninitialize = function() {
        webrtcClient.Uninitialize();
        connectionState = "DISCONNECTED";
        statusChangeCallback({state: "DISCONNECTED", description: "Disconnected from WebRTC Server"});
    };

    // Neo specific - used by GoogleCalender Integration
    this.GetState = function() {
        return {
            sm: webrtcServer,
            session: session
        };
    };

    Initialize();
}

w.VidyoClientTransport = VidyoClientTransport;
/////////////////// VidyoClientTransportWebRTC.js end ////////////////////////


  if(isNeo() === true) {

    ////////////////// Request/Response logger for NEO //////////////////
    function neoLogInfo(oReq, url,  params, LogInfo) {
        if (window.gTransportLog && ['info', 'debug', 'trace'].includes(window.gTransportLog.getLevel())) {
            let paramsLines = JSON.stringify(params, null, 2).split('\n');
            let responseLines = [];
            try {
                let parsed = JSON.parse(oReq.responseText);
                if (parsed instanceof Array) {
                   parsed = parsed.map(r => ((typeof(r) === 'string') ? JSON.parse(r) : {...r, data: ((typeof(r.data) === 'string') ? JSON.parse(r.data) : r.data)}));
                }
                responseLines = JSON.stringify(parsed, null, 2).split('\n');
            } catch(e) {
                responseLines = oReq.responseText;
            }

            [
                `-------*********-------`,
                `Request: ${url}`,
                ...paramsLines,
                'Response:',
                ...responseLines,
                '-------*********-------'
            ].forEach(LogInfo);
        }
    }

    ////////////////// Handle multiple VidyoConnect Web tabs //////////////////
    localStorage.newPageAdded = Date.now();
    var onLocalStorageEvent = function(e){
      if (e.key === 'newPageAdded') {
        localStorage.pageAlreadyExists = Date.now();
        VLogger.LogErr('New VidyoConnect Web tab opened. Uninitializing current tab');
        if (typeof(window.onPageDisabled) === 'function') {
            window.onPageDisabled();
            vidyoApp.webrtcClient.Uninitialize(true);
        } else {
            vidyoApp.webrtcClient.Uninitialize();
        }
      }
      if (e.key === 'pageAlreadyExists') {
        VLogger.LogErr('Existing VidyoConnect Web tab is discovered.');
      }
    };
    window.addEventListener('storage', onLocalStorageEvent, false);

////////////////// NeoLayoutEngine.js start //////////////////
    class LayoutEngine {
      /**
       * @param streamMapping
       * @param videoStreams
       * @param localShareStream
       * @param transport
       * @returns {LayoutEngine}
       */
      static initUILayout(streamMapping, videoStreams, localShareStream, transport) {
        if (!LayoutEngine._layoutEngineInstance) {
          LayoutEngine._layoutEngineInstance = new LayoutEngine(streamMapping, videoStreams, localShareStream, transport);
        }
        return LayoutEngine._layoutEngineInstance;
      }

      static setRendererType(type) {
        // do nothing for Neo
      }

      /**
       * @param {Object.<string, streamMappingItem>} streamMapping
       * @param videoStreams
       * @param localShareStream
       * @param transport
       */
      constructor(streamMapping, videoStreams, localShareStream, transport) {
        /** @type {Object.<string, streamMappingItem>} */
        this.streamMapping_ = streamMapping;
        this.videoStreams_ = videoStreams;
        this.localShareStream_ = localShareStream;
        this.transport_ = transport;
        this.renderEventCallback_ = null;
        this.videoElems_ = [];
        this.remoteCameras_ = {};
        this.previousWindowSizes_ = {windows: [], sharing: false};
        /** @type {VLogger} */
        this.vLogger = new VLogger(" LayoutEngine: ");

        let maxSubscriptions_ = 8;

        for (var i = 1; i <= maxSubscriptions_ + 1; i++) {
          this.videoElems_[i] = document.createElement("video");
          this.videoElems_[i].setAttribute("autoplay", "");
          this.videoElems_[i].dataset.streamId = i;
          this.videoElems_[i].addEventListener("pause", (e) => {
            this.HandleVideoElementPause(e);
          });
          this.videoElems_[i].addEventListener("play", (e) => {
            this.HandleVideoElementPlay(e);
          });
          this.videoElems_[i].addEventListener("contextmenu", this.HandleVideoElementRightClick);
        }

        // this.updateVidyoRendererParameters = this.updateVidyoRendererParameters.bind(this);
      }

      VidyoWebRTCInitRenderer(viewId) {
        this.vLogger.LogInfo("VidyoWebRTCInitRenderer signal is not supported by Neo");
      }

      AttachVideo(sourceId) {
        if (this.streamMapping_.hasOwnProperty(sourceId) &&
            this.streamMapping_[sourceId].hasOwnProperty("streamId") &&
            !this.streamMapping_[sourceId].attached) {

          var videoElementId = 'V' + (this.streamMapping_[sourceId].previewSourceId || sourceId);
          var videoElement = document.getElementById(videoElementId);
          var streamId = this.streamMapping_[sourceId]["streamId"];

          if (videoElement && this.videoStreams_[streamId]) {
            this.streamMapping_[sourceId].attached = true;
            var videoStream = this.videoStreams_[streamId];
            videoElement.srcObject = videoStream;

            if (this.streamMapping_[sourceId].type === VidyoTranscodingContext.STREAM_TYPE_PREVIEW && this.renderEventCallback_) {
              this.renderEventCallback_(videoElementId, "started");
            }

            videoElement.dataset.streamId = videoStream.id;
            videoElement.dataset.playIndex = streamId;

            this.vLogger.LogInfo("AttachVideo: videoElementId=" + videoElementId + " source=" + sourceId + " streamId=" + streamId);
          }
        }
      };

      // TODO: really do nothing ?
      HideVideoPanel(videoElementId, type, streamId) {
        // do nothing
      }

      // TODO: really do nothing ?
      Uninitialize() {
        // do nothing
      }

      getSourceId(streamId) {
        for (let sourceId in this.streamMapping_) {
          if (this.streamMapping_[sourceId].streamId === streamId) {
            return this.streamMapping_[sourceId].sourceId;
          }
        }
        this.vLogger.LogErr("GetSourceId streamId=" + streamId + " NOT FOUND in " + JSON.stringify(this.streamMapping_));
        return '';
      }

      getElementId(streamId) {
        for (let sourceId in this.streamMapping_) {
          if (this.streamMapping_[sourceId].streamId === streamId) {
            return 'V' + (this.streamMapping_[sourceId].previewSourceId || sourceId);
          }
        }
        this.vLogger.LogErr("getElementId streamId=" + streamId + " NOT FOUND in " + JSON.stringify(this.streamMapping_));
        return '';
      }

      registerVidyoRenderer(sourceId, videoElementId, type) {
        this.vLogger.LogInfo("registerVidyoRenderer: sourceId=" + sourceId + "; videoElementId=" + videoElementId + "; type=" + type);
        switch (type) {
          case VidyoTranscodingContext.STREAM_TYPE_PREVIEW:
            // mute unmute creates a new video element and will not attach since attached is true
            var previewElement = document.getElementById(videoElementId);
            if (previewElement) {
              previewElement.muted = true;
              previewElement.playsinline = true;
            }

            this.transport_.GetWebRTCClient().CreateSourceIdEntryInStreamMappingAndAttachVideo({
              sourceId: VidyoTranscodingContext.PREVIEW_SOURCE_ID,
              previewSourceId: sourceId,
              streamId: VidyoTranscodingContext.LOCAL_STREAM_ID,
              type: type
            });
            break;

          case VidyoTranscodingContext.STREAM_TYPE_SHARE_PREVIEW:
            let localShareElement_ = document.getElementById(videoElementId);
            if (localShareElement_ && this.localShareStream_.length > 0) {
              var str = this.localShareStream_[this.localShareStream_.length - 1];
              localShareElement_.srcObject = str;
              localShareElement_.dataset.streamId = str.id;
            }
            break;

          case VidyoTranscodingContext.STREAM_TYPE_VIDEO:
          case VidyoTranscodingContext.STREAM_TYPE_SHARE:
            this.transport_.GetWebRTCClient().CreateSourceIdEntryInStreamMappingAndAttachVideo({
              sourceId: sourceId,
              type: type
            });
            if (this.renderEventCallback_) {
              this.renderEventCallback_(videoElementId, "started");
            }
            break;
        }

        var registerMessage = {
          method: "VidyoWebRTCRegisterSource",
          sourceId: sourceId,
          type: type
        };
        this.transport_.SendWebRTCMessage(registerMessage, () => {
          this.vLogger.LogInfo("VidyoWebRTCRegisterSource sent: " + JSON.stringify(registerMessage));
        });
        this.vLogger.LogInfo("registerRenderer streamMapping_=" + JSON.stringify(this.streamMapping_));
      }

      unregisterVidyoRenderer(sourceId) {
        if (sourceId === VidyoTranscodingContext.PREVIEW_SOURCE_ID) {
          return;
        }
        this.vLogger.LogInfo("unregisterRenderer srcId=" + sourceId + " " + JSON.stringify(this.streamMapping_));
        if (this.streamMapping_.hasOwnProperty(sourceId)) {
          var type = this.streamMapping_[sourceId].type;

          if (this.streamMapping_[sourceId]) {
            this.streamMapping_[sourceId].attached = false;
            delete this.streamMapping_[sourceId];
          }

          var unregisterMessage = {
            method: "VidyoWebRTCUnregisterSource",
            sourceId: sourceId,
            type: type
          };
          this.transport_.SendWebRTCMessage(unregisterMessage, () => {
            this.vLogger.LogInfo("VidyoWebRTCUnregisterSource sent: " + JSON.stringify(unregisterMessage));
          });
        }
      }

      updateVidyoRendererParameters(streamSizes) {
        var windows = [];
        var sharing = false;
        this.vLogger.LogInfo("UpdateVidyoRendererParameters: " + JSON.stringify(streamSizes));
        for (var i = 0; i < streamSizes.length; i++) {

          if (streamSizes[i].width <= 0 || streamSizes[i].height <= 0) {
            this.vLogger.LogErr("UpdateVidyoRendererParameters: INVALID HEIGHT/WIDTH");
            continue;
          }

          var sourceId = streamSizes[i].srcID.substring(1); //  streamSizes[i].srcID contains html element's Id
          if (this.streamMapping_.hasOwnProperty(sourceId)) {
            if (this.streamMapping_[sourceId].attached !== true) {
              streamSizes[i].ranking = 2;
            }
            var wnd = {
              height: streamSizes[i].height,
              width: streamSizes[i].width,
              ranking: streamSizes[i].ranking,
              dynamic: streamSizes[i].dynamic,
              show: streamSizes[i].show,
              fps: 30,
              sourceId: sourceId
            };

            var type = this.streamMapping_[sourceId].type;
            if (type === VidyoTranscodingContext.STREAM_TYPE_SHARE) {
              sharing = true;
              wnd.height = wnd.width = 0;
            } else if (type === VidyoTranscodingContext.STREAM_TYPE_PREVIEW) {
              wnd.sourceId = this.streamMapping_[sourceId].previewSourceId;
            }
            windows.push(wnd);
          }
        }
        var windowSizesMsg = {
          method: "VidyoWebRTCSetWindowSizes",
          windows: windows,
          sharing: sharing
        };

        // Check if previous and current stream sizes match
        var changed = false;
        if (windowSizesMsg.sharing !== this.previousWindowSizes_.sharing) {
          this.vLogger.LogInfo("VidyoWebRTCSetWindowSizes: sharing changed from " + this.previousWindowSizes_.sharing + " to " + windowSizesMsg.sharing);
          changed = true;
        } else if (windowSizesMsg.windows.length !== this.previousWindowSizes_.windows.length) {
          changed = true;
          this.vLogger.LogInfo("VidyoWebRTCSetWindowSizes: length changed from " + this.previousWindowSizes_.windows.length + " to " + windowSizesMsg.windows.length);
        } else {
          for (var i = 0; i < windowSizesMsg.windows.length && !changed; i++) {
            for (var x in windowSizesMsg.windows[i]) {
              if (this.previousWindowSizes_.windows[i][x] !== windowSizesMsg.windows[i][x]) {
                changed = true;
                this.vLogger.LogInfo("VidyoWebRTCSetWindowSizes: windows[" + i + "][" + x + "] changed from " + this.previousWindowSizes_.windows[i][x] + " to " + windowSizesMsg.windows[i][x]);
                break;
              }
            }
          }
        }

        if (changed) {
          this.previousWindowSizes_.windows = windowSizesMsg.windows.slice();
          this.transport_.SendWebRTCMessage(windowSizesMsg, () => {
            this.vLogger.LogInfo("VidyoWebRTCSetWindowSizes sent: " + JSON.stringify(windows));
          });
        } else {
          this.vLogger.LogInfo("VidyoWebRTCSetWindowSizes: No Change");
        }

      }

      getRendererId(remoteCameraObjId) {
        return remoteCameraObjId;
      }

      setRendererEventsCallback(cb) {
        this.renderEventCallback_ = cb;
      }

      setCurrentVideoTiles(numVideoTiles) {
        var msg = {
          method: "VidyoWebRTCSetCurrentVideoTiles",
          numVideoTiles: numVideoTiles
        };
        this.transport_.SendWebRTCMessage(msg, () => {
          this.vLogger.LogInfo("VidyoWebRTCSetCurrentVideoTiles sent: " + numVideoTiles);
        });
      }

      setDisplayCropped(viewId, displayCropped) {
        this.vLogger.LogErr("NEO does NOT support the method SetDisplayCropped: viewId=" + viewId + " displayCropped=" + displayCropped);
        // layoutEngineAttrs_[viewId] = displayCropped;
      }

      handleStreamStatus(streamId, status) {
        if (this.renderEventCallback_) {
          let videoElementId = this.getElementId(streamId);
          this.renderEventCallback_(videoElementId, status);
        }
      }

      HandleVideoElementPause(e) {
        var videoElem = e.target;
        var streamId = parseInt(videoElem.dataset.playIndex, 10);
        this.vLogger.LogInfo("Paused: " + streamId);
        videoElem.play();
      }

      HandleVideoElementPlay(e) {
        var videoElem = e.target;
        var streamId = parseInt(videoElem.dataset.playIndex, 10);
        this.vLogger.LogInfo("Play: " + streamId);
        this.transport_.SendWebRTCMessage({method: "VidyoWebRTCKeyFrameRequest", streamId: streamId}, () => {
        });
      }

      HandleVideoElementRightClick(e) {
        e.preventDefault();
        return false;
      }

      onCallStopped() {
        this.previousWindowSizes_ = {windows: []};
      }

      _setRendererType(type) {
        this.rendererType = type;
        let msg = {
          method: "VidyoWebRTCSetRendererType",
          type: type
        };
        this.transport_.SendWebRTCMessage(msg, function () {
          VLogger.LogInfo("VidyoWebRTCSetRendererType sent: " + JSON.stringify(msg));
        });
      }

      updateLocalShareStream(list) {
        this.localShareStream_ = list;
      }
    }

    VidyoTranscodingContext.LayoutEngine = LayoutEngine;

//////////////////////// AudioMetering //////////////////////////////
    class AudioMeter {
      /**
       * @param {VidyoInputDevice} mic
       * @param {Array.<HTMLAudioElement>} remoteAudio
       */
      constructor(mic, remoteAudio) {
          this.showAudioMeters_ = false;
      }

      /**
       * @param {boolean} showAudioMeters
       */
      SetShowAudioMeters(showAudioMeters) {
          this.showAudioMeters_ = showAudioMeters;
      }

      MapAudioStream(audioId, streamId) {
      }

      UpdateAudioLevel(audioId, level) {
      }

      StartLocalAudioLevelDetection() {
      }

      StopLocalAudioLevelDetection() {
      }

      StartRemoteAudioLevelDetection() {
      }

      StopRemoteAudioLevelDetection() {
      }
    }

    VidyoTranscodingContext.AudioMeter = AudioMeter;
/////////////////////////////////////////////////////////////////////
////////////////// NeoLayoutEngine.js end ////////////////////
////////////////// NeoStats.js start //////////////////
// actually this is not about sending the statistics to the server ( like VIO do it )
// it is just collecting statistics to provide VidyoWebRTCRestartCall functionality
    function VidyoClientWebRTCStats(t, LogInfo, LogErr) {
      var activeCheckTimer_ = null;
      var bytesNotReceivedCounter_ = 0;
      var bytesSent_ = 0;
      var bytesReceived_ = 0;
      var peerConnection_ = null;
      var transport_ = t;

      function ProcessChromeStats(response) {
        var standardReport = {};
        var reports = response.result();
        reports.forEach(function (report) {
          if (report.type === 'googCandidatePair') {
            var standardStats = {
              id: report.id,
              timestamp: report.timestamp,
              type: {
                localcandidate: 'local-candidate',
                remotecandidate: 'remote-candidate'
              }[report.type] || report.type
            };
            report.names().forEach(function (name) {
              standardStats[name] = report.stat(name);
            });
            standardReport[standardStats.id] = standardStats;
          }
        });
        return standardReport;
      }

      function StartActiveChromeCheck(callback) {
        if (peerConnection_.iceConnectionState === "disconnected") {
          callback(1, 0);
          return;
        }
        peerConnection_.getStats(function (s) {
          var stats = ProcessChromeStats(s);
          var bytesSent = 0;
          var bytesReceived = 0;
          for (var key in stats) {
            if (stats[key].hasOwnProperty("googActiveConnection")) {
              bytesSent += parseInt(stats[key].bytesSent, 10) || 0;
              bytesReceived += parseInt(stats[key].bytesReceived, 10) || 0;
            }
          }
          callback(bytesSent - bytesSent_, bytesReceived - bytesReceived_);
          bytesSent_ = bytesSent;
          bytesReceived_ = bytesReceived;
        });
      }

      function StartActiveFirefoxCheck(callback) {
        var iceConnectionState = peerConnection_.iceConnectionState;
        if (iceConnectionState === "disconnected") {
          callback(1, 0);
        } else if (iceConnectionState === "connected" || iceConnectionState === "completed") {
          callback(1, 1);
        }
      }

      function CheckIfActive(bytesSent, bytesReceived) {
        if (bytesSent != 0 && bytesReceived == 0) {
          VLogger.LogInfo("PeerConnection NoBytesReceivedCounter=" + bytesNotReceivedCounter_ + " bytesSent=" + bytesSent + " bytesReceived=" + bytesReceived);
          bytesNotReceivedCounter_++;
          if (bytesNotReceivedCounter_ >= 3) {
            bytesNotReceivedCounter_ = 0;
            transport_.SendWebRTCMessage({
              method: "VidyoWebRTCRestartCall"
            }, function () {
            });
            return;
          }
        } else {
          bytesNotReceivedCounter_ = 0;
        }
        activeCheckTimer_ = setTimeout(StartActiveCheck, 3000);
      }


      function StartActiveCheck() {
        activeCheckTimer_ = null;
        if (peerConnection_) {
          if (window.adapter.browserDetails.browser === "chrome") {
            StartActiveChromeCheck(CheckIfActive);
          } else if (window.adapter.browserDetails.browser === "firefox") {
            StartActiveFirefoxCheck(CheckIfActive);
          }
        }
      }

      this.Start = function (pc, maxAudio, maxVideo) {
        if (activeCheckTimer_) {
          return;
        }
        peerConnection_ = pc;
        StartActiveCheck();
      };

      this.Stop = function () {
        activeCheckTimer_ = null;
        peerConnection_ = null;
      };

      this.SetSharePeerConnection = function (pc) {
      };
    }

    VidyoTranscodingContext.VidyoClientWebRTCStats = VidyoClientWebRTCStats;
////////////////// NeoStats.js end ////////////////////

////////////////// NeoPortal.js start //////////////////
    function CheckAndRedirectToPortal() {
      if (typeof NEO === "object" && NEO.hasOwnProperty("downloadLink") && NEO.downloadLink.length > 0) {
        var search = window.top.location.search.substring(1);
        if (search.indexOf("portal") !== -1 || localStorage.portal) {
          var url = new URL(window.top.location.href);
          var portal = "";
          var roomKey = "";

          if (url.searchParams) {
            portal = url.searchParams.get("portal");
            if (!portal) {
              portal = url.searchParams.get("portalUri");
            }
            roomKey = url.searchParams.get("roomKey");
          } else {
            var searchParams = search.split("&");
            searchParams.forEach(function (p) {
              if (p.indexOf("portal") === 0) {
                portal = p.split("=")[1];
              } else if (p.indexOf("roomKey") === 0) {
                roomKey = p.split("=")[1];
              }
            });
          }

          if (!portal) {
            portal = localStorage.portal;
          }

          if (portal) {
            if (portal.indexOf("http:") !== 0 && portal.indexOf("https:") !== 0) {
              portal = "https://" + portal;
            }

            document.body.className = document.body.className.replace("in-video", "");

            vidyoApp.webrtcClient.Uninitialize(true);
            if (roomKey) {
              window.top.location.assign(portal + "/join/" + roomKey + "?forceNeo=true");
            } else {
              window.top.location.assign(portal + "/?forceNeo=true");
            }
            return true;
          }
        }
      }
      return false;
    }

    VidyoTranscodingContext.CheckAndRedirectToPortal = CheckAndRedirectToPortal;
////////////////// NeoPortal.js end ////////////////////


/////////////////// VidyoClientWebRTCInterface.js (Neo specific) start //////////////////////
    var gl_logfilename = "/opt/vidyo/log/VidyoWebRTC/VidyoConnect.log";
    window.gl_logfilename = gl_logfilename;
    var LOG_INDEX_COUNT = 16;
    var MAX_LINES_PER_INDEX = 500;

    var VidyoAppWebRTC = {
      /** @type {VidyoClientWebRTC} */
      webrtcClient: null,
      transport: null,
      logFileCb: null,
      logIndex: 0,
      logCount: 0,
      logCounter: 1,

      placeholder: function () {
      },

      getMode: function () {
        return 1;
      },

      get: function (url) {
        var ret = {result: "ok"};
        switch (url) {
          case "GetApplicationBuildTag":
            // proper buildTag will be set on build step
            ret.data = {buildTag: "TAG_NEO_0_0_0_DEV"};
            break;
          default:
            console.log("VidyoAppWebRTC: " + url + " UNHANDLED IN GET");
            ret.result = "fail";
            break;
        }

        return JSON.stringify(ret);
      },

      // NEO(compositor) specific only
      registerVidyoRenderer: function (sourceId, videoElementId, type) {
        if (this.webrtcClient !== null) {
          this.webrtcClient.getLayoutEngine().registerVidyoRenderer(sourceId, videoElementId, type);
        } else {
          console.error("VidyoAppWebRTC:registerVidyoRenderer  webrtcClient NULL");
        }
      },

      unregisterVidyoRenderer: function (sourceId) {
        if (this.webrtcClient !== null) {
          this.webrtcClient.getLayoutEngine().unregisterVidyoRenderer(sourceId);
        } else {
          console.error("VidyoAppWebRTC:unregisterVidyoRenderer  webrtcClient NULL");
        }
      },

      resetVidyoRenderer: function (id) {
        console.log("VidyoAppWebRTC:resetVidyoRenderer called with " + id);
      },

      updateVidyoRendererParameters: function (streamSizes) {

        if (this.webrtcClient !== null) {
          this.webrtcClient.getLayoutEngine().updateVidyoRendererParameters(streamSizes);
        } else {
          console.error("VidyoAppWebRTC:updateVidyoRendererParameters  webrtcClient NULL");
        }
      },

      getRoomUrl: function () {
        var search = window.top.location.search.substring(1);
        var url = "";

        // Need url with just the portal for SAML login case
        if (search.indexOf("portal") !== -1) { // && search.indexOf("roomKey") !== -1) {
          url = window.top.location.href;
        }
        console.log("VidyoAppWebRTC:getRoomUrl - " + url);
        return url;
      },

      executeUrl: function (scheme, URL) {
        console.log("VidyoAppWebRTC:executeUrl " + scheme + "  " + URL);
        if (scheme === "saml") {
          var url = URL + "?mode=webrtc";
          if (window.top.location.search.indexOf("roomKey") !== -1) {
            var params = window.top.location.search.substring(1).split("&");
            for (var p = 0; p < params.length; p++) {
              var q = params[p].split("=");
              if (q[0] === "roomKey") {
                url += "&";
                url += params[p];
                break;
              }
            }
          }
          window.top.location.assign(url);
          return;
        }
        if (URL.indexOf("mailto:") === 0) {
          var wnd = window.open(URL, "");
          wnd.onblur = function () {
            console.log("VidyoAppWebRTC:executeUrl closing window");
            wnd.close();
          };
        } else {
          window.open(URL, "");
        }
      },

      executeFileUrlFromBytes: function (scheme, contents, name) {
        console.log("VidyoAppWebRTC:executeFileUrlFromBytes scheme://" + scheme + "  contents:**" + contents + "** name:" + name);
        window.top.location.assign("data:text/calendar;charset=utf8," + escape(contents));
      },

      // NEO specific only
      getRendererId: function (remoteCameraObjId) {
        console.log("VidyoAppWebRTC:getRendererId remoteCameraObjId=" + remoteCameraObjId);
        if (this.webrtcClient !== null) {
          return this.webrtcClient.getLayoutEngine().getRendererId(remoteCameraObjId);
        }
        return null;
      },

      setRendererEventsCallback: function (cb) {
        console.log("VidyoAppWebRTC:setRendererEventsCallback ");
        if (this.webrtcClient !== null) {
          this.webrtcClient.getLayoutEngine().setRendererEventsCallback(cb);
        } else {
          console.error("VidyoAppWebRTC:setRendererEventsCallback webrtcClient NULL");
        }
      },

      getCAPath: function () {
        return "/opt/vidyo/conf/openssl/certs/ca-certificates.crt";
      },

      setCurrentVideoTiles: function (numVideoTiles) {
        console.log("VidyoAppWebRTC:setCurrentVideoTiles: " + numVideoTiles);
        if (this.webrtcClient !== null) {
          this.webrtcClient.getLayoutEngine().setCurrentVideoTiles(numVideoTiles);
        } else {
          console.error("VidyoAppWebRTC:setCurrentVideoTiles webrtcClient NULL");
        }
      },

      selectShare: function (shareSelectedCallback, shareStreamOnInactiveCallback) {
        console.log("VidyoAppWebRTC:selectShare ");
        if (this.webrtcClient !== null) {
          this.webrtcClient.SelectShare(shareSelectedCallback, shareStreamOnInactiveCallback);
        } else {
          console.error("VidyoAppWebRTC:selectShare webrtcClient NULL");
        }
      },

      /**
       * Capture video stream from canvas and select it for share
       * @param  {Function} shareSelectedCallback_ Callback for capturing and selecting share from canvas
       * @param  {HTMLElement} canvas              Target canvas for capturing stream from
       * @return {Void}
       */
      selectCanvasForShare: function (cb, canvas) {
        console.log("VidyoAppWebRTC:selectCanvasForShare ");
        if (this.webrtcClient !== null) {
          this.webrtcClient.selectCanvasForShare(cb, canvas);
        } else {
          console.error("VidyoAppWebRTC:selectCanvasForShare webrtcClient NULL");
        }
      },

      createLogFileArchive: function () {

        var i = (this.logIndex + 1) % LOG_INDEX_COUNT;

        var data = "";
        for (var x = 0; x < LOG_INDEX_COUNT; x++) {
          data = data + localStorage["log" + i];
          i = (i + 1) % LOG_INDEX_COUNT;
        }

        var self = this;
        this.transport.SendLogs(data, function () {
          self.logFileCb();
        });
      },

      setCreateLogFileArchiveCallback: function (cb) {
        for (var x = 0; x <= LOG_INDEX_COUNT; x++) {
          localStorage["log" + x] = "";
        }

        this.logFileCb = cb;
      },

      pushToLog: function (text) {
        try {
          localStorage["log" + this.logIndex] = localStorage["log" + this.logIndex] + "\n[" + this.logCounter + "]" + new Date().toLocaleTimeString() + " " + text;
        } catch (e) {
          var l = JSON.stringify(localStorage).length;
          console.error("PushToLog Exception: " + e);
          console.error("LocalStorage size: " + l);
          this.setCreateLogFileArchiveCallback(this.logFileCb);
          localStorage["log" + this.logIndex] = "" + new Date().toLocaleTimeString() + " " + "PushToLog Exception: " + e + " size: " + l;
          localStorage["log" + this.logIndex] = localStorage["log" + this.logIndex] + "\n[" + this.logCounter + "]" + new Date().toLocaleTimeString() + " " + text;
        }
        this.logCount++;
        this.logCounter++;

        if (this.logCount >= MAX_LINES_PER_INDEX) {
          this.logIndex = (this.logIndex + 1) % LOG_INDEX_COUNT;
          this.logCount = 0;
          localStorage["log" + this.logIndex] = "\nSwitching to " + this.logIndex;
        }
      },

      enablePersonalRoomSearch: function (enable) {
        console.log("VidyoAppWebRTC:enablePersonalRoomSearch " + enable);
        if (this.webrtcClient !== null) {
          this.webrtcClient.enablePersonalRoomSearch(enable);
        } else {
          console.error("VidyoAppWebRTC:enablePersonalRoomSearch webrtcClient NULL");
        }
      },

      getPlatformCalendarPlugins: function () {
        return [];
      },

      getTransportState: function () {
        console.log("VidyoAppWebRTC:getTransportState ");
        if (this.webrtcClient !== null) {
          return this.webrtcClient.getTransportState();
        } else {
          console.error("VidyoAppWebRTC:getTransportState webrtcClient NULL");
          return "invalid_state";
        }
      },

      getGoogleAuthToken: function (URL, callback) {
        console.log("VidyoAppWebRTC:getGoogleAuthToken " + URL);
        if (this.webrtcClient !== null) {
          this.webrtcClient.getGoogleAuthToken(URL, callback);
        } else {
          console.error("VidyoAppWebRTC:getGoogleAuthToken webrtcClient NULL");
        }
      },

      /**
       * Get list of preferred languages based on navigator.languages and navigator.language
       * @return {Array} List of user preferred languages.
       */
      getPreferredLanguages: function () {
        return (navigator.languages || [navigator.language]);
      },

      setInvocationUrlCallback: function (roomLinkClickedCallback) {
        console.log('%c' + 'setInvocationUrlCallback not implemented', 'color: darkviolet');
      },
      setQuitCallback: function (quitCallback) {
        console.log('%c' + 'setQuitCallback not implemented', 'color: darkviolet');
      },
      setWindowActionCallback: function (windowActionCallback) {
        console.log('%c' + 'setWindowActionCallback not implemented', 'color: darkviolet');
      },
      setCurrentMonitorChangedCallback: function (currentMonitorChangedCallback) {
        console.log('%c' + 'setCurrentMonitorChangedCallback not implemented', 'color: darkviolet');
      },
      setSuspendCallback: function (hostStateChangedCallback) {
        console.log('%c' + 'setSuspendCallback not implemented', 'color: darkviolet');
      },
      setResumeCallback: function (hostStateChangedCallback) {
        console.log('%c' + 'setResumeCallback not implemented', 'color: darkviolet');
      },
      setLockScreenCallback(hostStateChangedCallback) {
        console.log('%c' + 'setLockScreenCallback not implemented', 'color: darkviolet');
      },
      setUnlockScreenCallback(hostStateChangedCallback) {
        console.log('%c' + 'setUnlockScreenCallback not implemented', 'color: darkviolet');
      }
    };

    var vidyoApp = new Proxy(VidyoAppWebRTC, {
      get: function (target, property, receiver) {
        if (target.hasOwnProperty(property)) {
          return target[property];
        } else {
          console.warn("VidyoAppWebRTC: " + property + " NOT IMPLEMENTED");
          return target.placeholder;
        }
      },

      has: function (target, property) {
        return target.hasOwnProperty(property);
      }
    });
    window.vidyoApp = vidyoApp;
/////////////////// VidyoClientWebRTCInterface.js (Neo specific) end ////////////////////////
  }

})(window);