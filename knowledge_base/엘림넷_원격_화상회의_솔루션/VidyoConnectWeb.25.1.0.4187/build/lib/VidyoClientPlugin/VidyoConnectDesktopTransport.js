function VidyoClientTransport(plugInObj, statusChangedHandler, callbackHandler, plugInDivId) {
    this.contextObj = plugInObj;
    this.statusChangedHandler = statusChangedHandler;
    this.ReceiveCallback = callbackHandler;
    this.plugIn = null;

    var filterUrlParams = function(url) {
        var parts = url.split('?');
        return (parts.length < 2) ? parts[0] : parts[0] + "?...(parameters filtered out)";
    };

    this.AddPlugInIntoDOM = function(plugInDivId) {
        var html = '';
        if (DEBUG) {
            html += "<div id='VidyoClientPlugIn' class='VidyoClientPlugIn'></div>";
        } else {
            navigator.plugins.refresh(false);
            html += "<object type='application/x-VidyoClientPlugIn' id='VidyoClientPlugIn' class='VidyoClientPlugIn' style='width: 100%; height: 100%;'></object>";
        }
        //$('#' + plugInDivId).append(html);
        if (DEBUG) {
            plugIn = new VidyoClientPlugInTest();
        } else {
            plugIn = document.getElementById("VidyoClientPlugIn");
        }
        return plugIn;
    };

    this.SendMessage = function(url, asyncSuccess, asyncFailure, async) {
        try {
            var response;
            var reqName, reqDelimIndex;
            var parsedResponse = null;
            if (typeof vidyoApp != "undefined") {
                response = vidyoApp.get(url);
            } else {
                response = this.plugIn.get(url);
            }
            if (response !== "") {
                parsedResponse = JSON.parse(response);
            }

            // GetVersion() is an example of a command that has no arguments
            reqDelimIndex = url.indexOf("?");
            if (reqDelimIndex >= 0) {
                reqName = url.substring(0, reqDelimIndex);
            } else {
                reqName = url;
            }
            // Note:
            //    Use (modify) VCRequestLogExclusionList to control which VC requests
            //    will be excluded from logging.
            if (reqName in VCLogSilentList) {
                // skip
            } else if (glVCDbgLogAll || !(reqName in VCRequestLogExclusionList)) {
                gTransportLog.debug("VidyoClientTransport.SendMessage():");
                gTransportLog.debug(`${logIndent}url: ${filterUrlParams(url)}`);
                if (parsedResponse !== null) {
                    if (typeof parsedResponse == "object") {
                        debugDumpObj("response (obj)", parsedResponse, 9, logIndent, null, null, null, gTransportLog);
                    } else {
                        gTransportLog.debug(logIndent + "response: " + parsedResponse);
                    }
                }
            } else {
                if (reqName != "VidyoEndpointFeedbackLogComplete") {
                    gTransportLog.debug("VidyoClientTransport.SendMessage():");
                    gTransportLog.debug(`${logIndent} request: ${reqName}`);
                    gTransportLog.debug(`${logIndent} (printing of VC request content restricted due to confidentiality)`);
                }
            }

            if (async === true && typeof asyncSuccess === "function") {
                asyncSuccess(parsedResponse);
            }
            if (response !== "") {
                return parsedResponse;
            }
        } catch (err) {
            this.statusChangedHandler({
                state: "FAILED",
                error: err
            });
            return null;
        }
    };

    this.UpdateViewOnDOM = function(uiEvent, viewId, x, y, w, h) {
        // Empty implmentation to support latest VidyoClient bindings
        return;
    };

    this.StartCallbackPoll = function() {
        var nextEvent = 250;

        try {
            var response = this.plugIn.get("GetCallbacks");

            if (response) {
                if (this.ReceiveCallback(this.contextObj, JSON.parse(response))) {
                    nextEvent = 1;
                }
                setTimeout(this.StartCallbackPoll.bind(this), nextEvent);
            } else {
                this.crashCallback();
            }
        } catch (err) {
            this.crashCallback(err);
        }
    };

    this.appReceiveCallback = function(context, response) {
        let parsedObj = null;
        try {
            parsedObj = safund(JSON.parse(response), null);
        } catch (err) {
            gTransportLog.error("VidyoClientTransport.appReceiveCallback() - parsing response failed");
            console.error(err);
            return null;
        }
        if (parsedObj !== null) {
            let parsedResult = safund(parsedObj.result, null);
            let parsedData = safund(parsedObj.data, null);
            if ((parsedResult !== null) && (parsedData !== null)) {
                let arrIndex, locParsedData;
                let locParsedObj = {};
                locParsedObj.result = parsedResult;
                locParsedObj.data = [];
                for (arrIndex in parsedData) {
                    locParsedData = parsedData[arrIndex];
                    locParsedObj.data[0] = locParsedData;

                    let parsedCallback = safund(locParsedData.callback, null);
                    // Note:
                    //    Use (modify) VCCallbackLogExclusionList to control which VC callbacks
                    //    will be excluded from logging.
                    if (parsedCallback !== null) {
                        if (parsedCallback in VCLogSilentList) {
                            // skip
                        } else if (glVCDbgLogAll || !(parsedCallback in VCCallbackLogExclusionList)) {
                            gTransportLog.debug("VidyoClientTransport.appReceiveCallback():");
                            debugDumpObj("callback obj", locParsedObj, 9, logIndent, null, null, null, gTransportLog);
                        } else {
                            if (parsedCallback != "VidyoEndpointFeedbackLog") {
                                gTransportLog.debug("callback: " + parsedCallback);
                                gTransportLog.debug(`${logIndent}(printing of VC callback content restricted due to confidentiality)`);
                            }
                        }
                    }

                    try {
                        callbackHandler(context, locParsedObj);
                    } catch (err) {
                        let errMessage = ((typeof err.message != "undefined") ? err.message :
                            ((typeof err.description != "undefined") ? err.description : ""));
                        if (errMessage !== "") {
                            gTransportLog.error("Exception in VidyoClient callback: " + errMessage, false);
                            if (typeof err.stack != "undefined") {
                                gTransportLog.error("(stack): " + suppressFilePaths(err.stack));
                            }
                        } else {
                            gTransportLog.error("Exception in VidyoClient callback: " +
                                suppressFilePaths(err), false);
                        }
                    }
                }
            } else {
                gTransportLog.warn("VidyoClientTransport.appReceiveCallback() - incomplete response received");
            }
        } else {
            gTransportLog.error("VidyoClientTransport.appReceiveCallback() - parsing response returned null");
            return null;
        }
    };

    if (typeof vidyoApp != "undefined") {
        window.VidyoAppRegisterCallback(this.appReceiveCallback, this.contextObj);
        this.statusChangedHandler({state:"READY"});
    } else {
        plugIn = this.AddPlugInIntoDOM(plugInDivId);
        if (this.plugIn === null) {
            return null;
        }
        this.StartCallbackPoll();
    }
}
