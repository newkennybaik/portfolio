function getToogles(togglesGroups) {
  return togglesGroups.reduce(function(result, next) {
    return result.concat(next.items);
  }, []).reduce(function(result, next) {
    result[next.key] = next;
    return result;
  }, {});
}

function getUsedTooglesLink(togglesGroups) {
  return togglesGroups.reduce(function(result, next) {
    return result.concat(next.items);
  }, []).filter(function(toggle) {
    return toggle.use && !toggle.required;
  }).map(function(toggle) {
    if (typeof toggle.value === "boolean") {
      toggle.value = Number(toggle.value);
    }
    return `${toggle.key}=${toggle.value}`
  }).join('&');
}

function getUsedTooglesLinkForIntent(togglesGroups) {
  return togglesGroups.reduce(function(result, next) {
    return result.concat(next.items);
  }, []).filter(function(toggle) {
    return toggle.use && !toggle.required;
  }).map(function(toggle) {
    prefixValue = "S"
    if (toggle.value === true || toggle.value === false) {
      prefixValue = "B"
    }
    return `${prefixValue}.${toggle.key}=${toggle.value}`
  }).join(';');
}

new Vue({
  el: '#app',
  data: function() {
    return {
      togglesGroups: toggles.map(function(group) {
        group.items = group.items.map(function(toggle) {
          toggle.use = toggle.use || false;
          toggle.value = toggle.defaultValue;
          return toggle;
        });
        return group;
      }),
      profiles: profiles
    };
  },
  mounted: function() {
    document.body.className = "";
  },
  computed: {
    desktopUri: function () {
      let toggles = getToogles(this.togglesGroups);
      if (toggles.password.value && toggles.userName.value) {
        let loginToggles = ["userName", "password", "logoutIfLogin", "keepMeSignIn"];
        for (const param of loginToggles) {
          toggles[param].value = encodeURIComponent(toggles[param].value);
        }
        return `vidyo://login?portal=${toggles.portal.value.replace(/(\/)$/, '')}&username=${toggles.userName.value}&password=${toggles.password.value}&logoutIfLogin=${toggles.logoutIfLogin.value}&keepMeSignIn=${toggles.keepMeSignIn.value}`;
      } else {
        return `vidyo://join?portal=${toggles.portal.value}&roomKey=${toggles.roomKey.value}&isCustom=true&${getUsedTooglesLink(this.togglesGroups)}`;
      }
    },
    webUri: function () {
      let toggles = getToogles(this.togglesGroups);
      if (!(toggles.portal.value && toggles.roomKey.value)) {
        return false;
      }
      return `${toggles.portal.value}/join/${toggles.roomKey.value}?isCustom=true&${getUsedTooglesLink(this.togglesGroups)}`;
    },
    iOSUri: function () {
      let toggles = getToogles(this.togglesGroups);
      if (!(toggles.portal.value && toggles.roomKey.value)) {
        return false;
      }
      return `vidyo://join?portal=${toggles.portal.value}&roomKey=${toggles.roomKey.value}&${getUsedTooglesLink(this.togglesGroups)}`;
    },
    androidUri: function () {
      let toggles = getToogles(this.togglesGroups);
      if (!(toggles.portal.value && toggles.roomKey.value)) {
        return false;
      }
      return `intent://join/#Intent;scheme=vidyo;package=com.vidyo.neomobile;action=join;S.portal=${toggles.portal.value};S.roomKey=${toggles.roomKey.value};S.pin=${toggles.roomKey.pin||false};${getUsedTooglesLinkForIntent(this.togglesGroups)};end`;
    }
  },
  methods: {
    openDesktopUri: function() {
      console.log('DesktopUri: ', this.desktopUri);
      window.location = this.desktopUri;
    },
    openWebUri: function() {
      console.log('WebUri: ', this.webUri);
      window.open(this.webUri);
    },
    openiOSUri: function() {
      console.log('iOSUri: ', this.iOSUri);
      window.location = this.iOSUri;
    },
    openAndroidUri: function() {
      console.log('AndroidUri: ', this.androidUri);
      window.location = this.androidUri;
    },
    loadProfile: function(profile) {
      let toggles = getToogles(this.togglesGroups);
      Object.keys(toggles).forEach(function(toggleKey) {
        if (typeof profile.value[toggleKey] !== 'undefined') {
          toggles[toggleKey].value  = profile.value[toggleKey];
          toggles[toggleKey].use    = true;
        } else {
          toggles[toggleKey].use    = toggles[toggleKey].required ? true : false;
          toggles[toggleKey].value  = toggles[toggleKey].defaultValue;
        }
      });
    }
  }
});