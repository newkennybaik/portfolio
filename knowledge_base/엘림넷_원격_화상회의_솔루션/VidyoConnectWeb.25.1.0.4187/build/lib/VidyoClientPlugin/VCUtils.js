var VCUtils = {};

var WEBRTC_SERVER = "https://fs-webrtc.vidyoqa.com";

window.VCLogSilentList = {};
window.VCRequestLogExclusionList = {};
window.VCCallbackLogExclusionList = {};
window.glVCDbgLogAll = false;
window.gTransportLog = console;
window.debugDumpObj = function() { console.log(arguments); }
window.logIndent = 10;
window.safund = function (r, t) { return r || t;}

/////////////// WebRTC Transcoding specific - start /////////////////////
if ( typeof vidyoApp == 'undefined' ) {
    VCUtils.vidyoPlatform = "VidyoConnect";
    VCUtils.webRTCGWServerVersion = "latest";

    /* parameters in VidyoConnectLoader.js */
    let search = window.location.search.split('?')[1];
    VCUtils.windowParams = search ? JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}') : {};

//check to see if the variables were passed from the URL's first. Then check the global variables.
    if (VCUtils.windowParams.VidyoWebRTCGWServerVersion) {
        VCUtils.webRTCGWServerVersion = VCUtils.windowParams.VidyoWebRTCGWServerVersion;
    } else if (typeof VidyoWebRTCGWServerVersion !== "undefined") { // see if it is set as a global variable.
        VCUtils.webRTCGWServerVersion = VidyoWebRTCGWServerVersion;
    }

    /* Global variable that stores the address of the WebRTC server */
    if (WEBRTC_SERVER) {
        VCUtils.webRTCServer = WEBRTC_SERVER;
    } else if (VCUtils.windowParams.webrtcserver) {
        VCUtils.webRTCServer = VCUtils.windowParams.webrtcserver;
    } else if (typeof VidyoWebRTCServer !== "undefined") { // see if the webserver host is set as a global variable.
        VCUtils.webRTCServer = VidyoWebRTCServer;
    } else {
        VCUtils.webRTCServer = window.location.protocol + '//' + window.location.hostname; // using local (current window.location URL) SessionManager/MediaManager server in case there is no WebRTC server specified
    }
    VCUtils.onloadCallback = onVidyoClientStatus;
}
/////////////// WebRTC Transcoding specific - end ///////////////////////

function onVidyoClientStatus(status) {
  console.warn('onVidyoClientStatus', status);
}
