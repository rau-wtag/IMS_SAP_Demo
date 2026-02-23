sap.ui.define(["sap/ui/core/UIComponent", "./model/models", "sap/ui/model/json/JSONModel"], function (BaseComponent, ___model_models, JSONModel) {
  "use strict";

  const createDeviceModel = ___model_models["createDeviceModel"];
  /**
   * @namespace imsts
   */
  const Component = BaseComponent.extend("imsts.Component", {
    constructor: function constructor() {
      BaseComponent.prototype.constructor.apply(this, arguments);
      this.countdown = 120000;
    },
    metadata: {
      manifest: "json",
      interfaces: ["sap.ui.core.IAsyncContentCreation"]
    },
    init: function _init() {
      // call the base component's init function
      BaseComponent.prototype.init.call(this);

      // set the device model
      this.setModel(createDeviceModel(), "device");
      sap.ui.getCore().getMessageManager().registerObject(this, true);
      this.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");
      const sSavedUser = localStorage.getItem("inventoryUser");
      const oUserData = sSavedUser ? JSON.parse(sSavedUser) : {
        isAdmin: false,
        isEmployee: false,
        user: "",
        ID: "",
        name: "",
        role: ""
      };
      const oSecurityModel = new JSONModel(oUserData);
      this.setModel(oSecurityModel, "security");
      this._loadUser(oSecurityModel);
      const oCartModel = new JSONModel({
        items: [],
        count: 0
      });
      this.setModel(oCartModel, "cart");

      // this._startInactivityTimer();
      // this._setupActivityListeners();

      // enable routing
      this.getRouter().initialize();
    },
    _loadUser: async function _loadUser(oSecurityModel) {
      const oModel = this.getModel();
      try {
        const oContext = oModel.bindContext("/getUserInfo()");
        const oResult = await oContext.requestObject();
        const oFreshData = {
          isAdmin: oResult.isAdmin,
          isEmployee: oResult.isEmployee,
          user: oResult.email,
          ID: oResult.ID,
          name: oResult.name,
          role: oResult.role
        };
        console.log(oFreshData);
        oSecurityModel.setData(oFreshData);
        localStorage.setItem("inventoryUser", JSON.stringify(oFreshData));
        this._startInactivityTimer();
        this._setupActivityListeners();
      } catch (error) {
        this.getRouter().navTo("Login");
      }
    },
    _setupActivityListeners: function _setupActivityListeners() {
      const aEvents = ["mousemove", "keydown", "click", "touchstart", "scroll"];
      const fnReset = this._resetInactivityTimer.bind(this);
      aEvents.forEach(sEvent => {
        document.addEventListener(sEvent, fnReset);
      });
    },
    _resetInactivityTimer: function _resetInactivityTimer() {
      if (this._iTimerId) {
        clearTimeout(this._iTimerId);
      }
      // console.log("Resetting inactivity timer")
      this._startInactivityTimer();
    },
    _startInactivityTimer: function _startInactivityTimer() {
      // console.log("Staring inactivity timer")
      if (this._iTimerId) {
        clearTimeout(this._iTimerId);
      }
      this._iTimerId = window.setTimeout(() => {
        console.log("Enough, get out");
        window.location.href = "/app-logout";
      }, this.countdown);
    },
    exit: function _exit() {
      if (this._iTimerId) {
        clearTimeout(this._iTimerId);
      }
    }
  });
  return Component;
});
//# sourceMappingURL=Component-dbg.js.map
