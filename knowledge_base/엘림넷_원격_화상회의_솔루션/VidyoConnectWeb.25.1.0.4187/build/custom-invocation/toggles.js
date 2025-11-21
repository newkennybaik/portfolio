const toggles = [{
  name: "Main",
  items: [{
    name:         "Portal",
    key:          "portal",
    defaultValue: "",
    uiType:       "input",
    use:          true,
    required:     true,
    description:  "TBD"
  }, {
    name:         "Room Key",
    key:          "roomKey",
    defaultValue: "",
    uiType:       "input",
    use:          true,
    required:     true,
    description:  "TBD"
  }, {
    name:         "Room Pin",
    key:          "roomPin",
    defaultValue: "",
    uiType:       "input",
    description:  "TBD"
  },
  {
    name:         "Session Token",
    key:          "sessionTokenToggle",
    defaultValue: "",
    uiType:       "input",
    description:  "Main token that receives from invoke link"
  },
  {
    name:         "Skip Browser Check",
    key:          "skipBrowserCheck",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Only for WebRTC app. If this parameter is provided, then the user will skip browser check and will be able to open the app in unsupported browsers"
  }]
}, {
  name: "External Data",
  items: [{
    name:         "External Data Field",
    key:          "extData",
    defaultValue: "",
    uiType:       "input",
    description:  "Contains a base64 string containing the Epic Integration Data.  This data shall be set in the CDR via setProductInfo."
  }, {
    name:         "External Data Type",
    key:          "extDataType",
    defaultValue: 0,
    uiType:       "input",
    description:  "Contains a type value string containing the external data field type.  This data shall be set in the CDR via setProductInfo."
  }, {
    name:         "Display Name",
    key:          "displayName",
    defaultValue: "",
    uiType:       "input",
    description:  "Guest Name(displayName)"
  }, {
    name:         "Direct Dial",
    key:          "directDial",
    defaultValue: "",
    uiType:       "input",
    description:  "Entity ID(directDial)"
  }]
}, {
  name: "Epic Waiting room content",
  items: [{
    name:         "Waiting room video content",
    key:          "wrvc",
    defaultValue: "",
    uiType:       "input",
    description:  "String value that should match custom parameter key 'wrvc{value}'"
  }, {
    name:         "Waiting room audio content",
    key:          "wrac",
    defaultValue: "",
    uiType:       "input",
    description:  "String value that should match custom parameter key 'wrac{value}''"
  }, {
    name:         "Waiting room background content",
    key:          "wrbc",
    defaultValue: "",
    uiType:       "input",
    description:  "String value that should match custom parameter key 'wrbc{value}'"
  }]
}, {
  name: "Registered Users",
  items: [{
    name:         "Login Module",
    key:          "loginMod",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Enable/ Disable login module If hidden User can access VidyoConnect only in guest mode."
  }, {
    name:         "Lock User Name",
    key:          "lockUserName",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "A Boolean value indicating whether the user name can or cannot be modified by the user. When this option is enabled, the Mac user name will be used as the default user name."
  }, {
    name:         "User Name",
    key:          "userName",
    defaultValue: "",
    uiType:       "input",
    description:  "User's username which would be otherwise entered in the username/password box upon login. If this is provided, then the user may skip entering the username into the login box."
  },
  {
    name:         "Password",
    key:          "password",
    defaultValue: "",
    uiType:       "input",
    description:  "User's password. If this is provided, then the user may be logged into the system."
  },
  {
    name:         "Logout if custom login",
    key:          "logoutIfLogin",
    defaultValue: false,
    uiType:       "input",
    description:  "If this is provided, then the user may be logged into the system again via another credentials even if they have already been logged in."
  },
  {
    name:         "Keep me sign in",
    key:          "keepMeSignIn",
    defaultValue: false,
    uiType:       "input",
    description:  "If this is provided, then the user may be logged into the system again via credentials and 'Keep me sign in' flag enabled."
  }]
}, {
  name: "Guest Users",
  items: [{
    name:         "Welcome Page",
    key:          "welcomePage",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Disable: Allow the user to bypass the welcome page and join the call Enable: Show welcome page before joining the call."
  }, {
    name:         "Beauty Screen",
    key:          "beautyScreen",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Disable: Hide beauty screen Enable: Show Beauty Screen."
  }, {
   name:         "Rejoin Screen",
   key:          "rejoinScr",
   defaultValue: true,
   uiType:       "checkbox",
   description:  "Disable: Hide Rejoin screen after call is ended Enable: Show Rejoin Screen after call is ended."
  }, {
    name:         "Display Name",
    key:          "displayName",
    defaultValue: "",
    uiType:       "input",
    description:  "Guest Name(displayName) - deprecated"
  }, {
    name:         "Do Not Save Display Name",
    key:          "doNotSaveDisplayName",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Guest Name(displayName) will not be stored in local storage"
  }, {
    name:         "Hardware Test Enabled",
    key:          "hwt",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Enable/disable Hardware Test before call"
  },{
    name:         "Hardware Test Strict Mode",
    key:          "hwtStrictMode",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Do not allow join call if Hardware Test was failed"
  }, {
    name:         "Access Code",
    key:          "pin",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Disable: Hide Access code input Enable: Show Access code input."
    },{
      name:         "Beauty Screen Mode",
      key:          "beautyScreenMode",
      defaultValue: 0,
      uiType:       "input",
      description:  "Beauty screen mode 0 is for default and 1 is for provider join flow"
    },{
      name:         "Skip participant notification",
      key:          "skipParticipantNotifications",
      defaultValue: false,
      uiType:       "checkbox",
      description:  "skip participant join leave notification"
    },]
}, {
  name: "Application Window Settings",
  items: [{
    name:         "Window Width",
    key:          "winSzW",
    defaultValue: "",
    uiType:       "input",
    description:  "Width of the VidyoConnect window."
  }, {
    name:         "Window Height",
    key:          "winSzH",
    defaultValue: "",
    uiType:       "input",
    description:  "Height of the VidyoConnect window."
  }, {
    name:         "Window Position Left",
    key:          "winPosX",
    defaultValue: "",
    uiType:       "input",
    description:  "X position of the VidyoConnect window on the screen."
  }, {
    name:         "Window Position Top",
    key:          "winPosY",
    defaultValue: "",
    uiType:       "input",
    description:  "Y position of the VidyoConnect window on the screen."
  }]
}, {
  name: "In-Call Settings",
  items: [{
    name:         "Public Chat",
    key:          "chat",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "All chat related features, incoming and outgoing chat."
  }, {
    name:         "Sidebar",
    key:          "leftPanel",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Sidebar/left panel."
  }, {
    name:         "In-Call Search",
    key:          "search",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Search box on Left panel"
  }, {
    name:         "Invite Participants",
    key:          "invite",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Ability to Invite Participants In Call"
  }, {
    name:         "Content Sharing",
    key:          "share",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Allow User to the option to Share Content"
  }, {
    name:         "Show Content Share Dialog",
    key:          "shareOnJoin",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "The Content Share preview selection dialog will be shown when the user first enters the conference."
  }, {
    name:         "Display Labels",
    key:          "labels",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Controls whether labels with the participants names will be displayed."
  }, {
    name:         "Remote Content Access",
    key:          "remoteContentAccess",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Ability to view content shared by other participants"
  }, {
    name:         "Camera Mute Control",
    key:          "camMuteCntrl",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Show/ Hide camera mute control on In-call screen"
  }, {
    name:         "Mic Mute Control",
    key:          "micMuteCntrl",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Show/Hide Mic mute control on In-call screen"
  }, {
    name:         "Mute Camera On Entry",
    key:          "muteCameraOnJoin",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Mute the camera when entering the conference."
  }, {
    name:         "Mute Mic On Entry",
    key:          "muteMicOnJoin",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Mute the Mic when entering the conference."
  }, {
    name:         "Mute Audio",
    key:          "disableAudio",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Mute the the speaker and ringing devices."
  }, {
   name:         "Voice+Content Only",
   key:          "vcomCntrl",
   defaultValue: false,
   uiType:       "checkbox",
   description:  "Enable/Disable Voice+Content Only mode"
 }, {
    name:         "Automatically Update",
    key:          "autoUpdate",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Automatically check for new versions."
  }, {
    name:         "Enable Auto Answer",
    key:          "autoAns",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Controls whether incoming calls and invitations will be answered automatically. (Registered Users)"
  }, {
      name:         "Enable Auto Start",
      key:          "autoStart",
      defaultValue: false,
      uiType:       "checkbox",
      description:  "Controls whether application will start automatically on reboot."
  }, {
    name:         "Participant Notification",
    key:          "participantNot",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Participant joining and chat Notifications sounds"
  }, {
    name:         "Exit on User Hangup",
    key:          "quituserHangup",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "VidyoConnect will automatically shut itself down when Call is disconnected by user."
  }, {
    name:         "Device Settings",
    key:          "devSetting",
    defaultValue: true,
    uiType:       "checkbox",
    description:  "Allow/Restrict user from changing device settings."
  }, {
    name:         "Hide EULA",
    key:          "eula",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Hide/show EULA"
  }, {
    name:         "T&C Consented",
    key:          "tc",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "T&C Consented"
  }, {
    name:         "TytoCare API server",
    key:          "tyto",
    defaultValue: "",
    uiType:       "input",
    description:  "Change TytoCare API server address. https://stormy-thicket-97600.herokuapp.com - can be used for AQA team. http://localhost:3000 - for local development"
  }, {
    name:         "Performance profile",
    key:          "perfProfile",
    defaultValue: "",
    uiType:       "input",
    description:  "Available performance profiles: high, low, voice, share"
  },{
    name:         "Disable Google Analytics",
    key:          "disableGA",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Can be used to disable sending Google Analytics events"
  },{
    name:         "Launch Token",
    key:          "launchToken",
    defaultValue: "",
    uiType:       "input",
    description:  "Launch token"
  },{
    name:         "Moderator Pin",
    key:          "moderatorPIN",
    defaultValue: "",
    uiType:       "input",
    description:  "Moderator Pin"
  },{
    name:         "Stats Server",
    key:          "statsServer",
    defaultValue: "",
    uiType:       "input",
    description:  "Stats Server URL(Only Webrtc)"
  },{
    name:         "Hardware test",
    key:          "hwt",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Hardware test"
  },{
    name:         "Hardware test strict mode",
    key:          "hwtStrictMode",
    defaultValue: false,
    uiType:       "checkbox",
    description:  "Hardware test strict mode"
  },]
}, {
  name: "Injectable Frames",
  items: [{
    name:         "preIframeUrl",
    key:          "preIframeUrl",
    defaultValue: "",
    uiType:       "disabled",
    description:  "Can be enabled only on portal"
  }, {
    name:         "postIframeUrl",
    key:          "postIframeUrl",
    defaultValue: "",
    uiType:       "disabled",
    description:  "Can be enabled only on portal"
  }, {
    name:         "topIframeUrl",
    key:          "topIframeUrl",
    defaultValue: "",
    uiType:       "disabled",
    description:  "Can be enabled only on portal"
  }, {
    name:         "rightIframeUrl",
    key:          "rightIframeUrl",
    defaultValue: "",
    uiType:       "disabled",
    description:  "Can be enabled only on portal"
  }, {
    name:         "bottomIframeUrl",
    key:          "bottomIframeUrl",
    defaultValue: "",
    uiType:       "disabled",
    description:  "Can be enabled only on portal"
  }, {
    name:         "leftIframeUrl",
    key:          "leftIframeUrl",
    defaultValue: "",
    uiType:       "disabled",
    description:  "Can be enabled only on portal"
  }, {
    name:         "topIframeSize",
    key:          "topIframeSize",
    defaultValue: "",
    uiType:       "disabled",
    description:  "Can be enabled only on portal"
  }, {
    name:         "rightIframeSize",
    key:          "rightIframeSize",
    defaultValue: "",
    uiType:       "disabled",
    description:  "Can be enabled only on portal"
  }, {
    name:         "bottomIframeSize",
    key:          "bottomIframeSize",
    defaultValue: "",
    uiType:       "disabled",
    description:  "Can be enabled only on portal"
  }, {
    name:         "leftIframeSize",
    key:          "leftIframeSize",
    defaultValue: "",
    uiType:       "disabled",
    description:  "Can be enabled only on portal"
  }, {
    name:         "preIframeShowTime",
    key:          "preIframeShowTime",
    defaultValue: "",
    uiType:       "disabled",
    description:  "Can be enabled only on portal"
  }, {
    name:         "postIframeShowTime",
    key:          "postIframeShowTime",
    defaultValue: "",
    uiType:       "disabled",
    description:  "Can be enabled only on portal"
  }]
}, {
  name: "TODO",
  items: [{
    name:         "recordConference",
    key:          "recordConference",
    defaultValue: "",
    uiType:       "disabled",
    description:  "TBD"
  }, {
    name:         "recordingProfile",
    key:          "recordingProfile",
    defaultValue: "",
    uiType:       "disabled",
    description:  "TBD"
  }]
}];
