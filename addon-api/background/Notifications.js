//import promisify from "../common/promisifier.js";

//const promisified = promisify(chrome.notifications);

export default class Notifications extends EventTarget {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
    this.update = chrome.notifications.update;
    this.clear = chrome.notifications.clear;
    this.onButtonClicked = chrome.notifications.onButtonClicked;

    this._onClicked = (notifId) => {
      if (notifId.startsWith(this._addonId)) {
        this.dispatchEvent(
          new CustomEvent("click", {
            detail: {
              id: notifId,
            },
          })
        );
      }
    };
    this._onClosed = (notifId) => {
      if (notifId.startsWith(this._addonId)) {
        this.dispatchEvent(
          new CustomEvent("close", {
            detail: {
              id: notifId,
            },
          })
        );
      }
    };
    this._onButtonClicked = (notifId, buttonIndex) => {
      if (notifId.startsWith(this._addonId)) {
        this.dispatchEvent(
          new CustomEvent("buttonclick", {
            detail: {
              id: notifId,
              buttonIndex,
            },
          })
        );
      }
    };
    chrome.notifications.onClicked.addListener(this._onClicked);
    chrome.notifications.onClosed.addListener(this._onClosed);
    chrome.notifications.onButtonClicked.addListener(this._onButtonClicked);
  }
  create(opts, callback) {
    if (typeof opts !== "object") {
      throw "ScratchAddons exception: do not specify a notification ID.";
    }
    // TODO: if muted, do not create notification and trigger close event immediatelly
    const notifId = `${this._addonId}__${Date.now()}`;
    let newOpts;
    if (typeof InstallTrigger !== "undefined") {
      newOpts = JSON.parse(JSON.stringify(opts));
      // On Firefox, remove notification properties that throw.
      delete newOpts.buttons;
      delete newOpts.requireInteraction;
    } else newOpts = opts;
    return chrome.notifications.create(notifId, newOpts, callback);
  }
  getAll(callback) {
    chrome.notifications.getAll((notifications) => {
      const notifIds = Object.keys(notifications).filter((notifId) =>
        notifId.startsWith(this._addonId)
      );
      const obj = {};
      for (const notifId of notifIds) {
        obj[notifId] = notifications[notifId];
      }
      return callback(obj);
    });
  }
  _removeEventListeners() {
    chrome.notifications.onClicked.removeListener(this._onClicked);
    chrome.notifications.onClosed.removeListener(this._onClosed);
    chrome.notifications.onButtonClicked.removeListener(this._onButtonClicked);
  }
}