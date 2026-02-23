sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel", "./model/models"], function (UIComponent, JSONModel, ___model_models) {
  "use strict";

  const createDeviceModel = ___model_models["createDeviceModel"];
  class Component extends UIComponent {
    static metadata = {
      manifest: "json",
      interfaces: ["sap.ui.core.IAsyncContentCreation"]
    };
    countdown = 240000;
    init() {
      super.init();
      this.setModel(createDeviceModel(), "device");
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
      this._startInactivityTimer();
      this._setupActivityListeners();
      this.getRouter().initialize();
    }
    async _loadUser(oSecurityModel) {
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
        oSecurityModel.setData(oFreshData);
        localStorage.setItem("inventoryUser", JSON.stringify(oFreshData));
      } catch (error) {
        this.getRouter().navTo("Login");
      }
    }
    _setupActivityListeners() {
      const aEvents = ["mousemove", "keydown", "click", "touchstart", "scroll"];
      const fnReset = this._resetInactivityTimer.bind(this);
      aEvents.forEach(sEvent => {
        document.addEventListener(sEvent, fnReset);
      });
    }
    _resetInactivityTimer() {
      if (this._iTimerId) {
        clearTimeout(this._iTimerId);
      }
      this._startInactivityTimer();
    }
    _startInactivityTimer() {
      this._iTimerId = window.setTimeout(() => {
        window.location.replace("/app-logout");
      }, this.countdown);
    }
  }
  return Component;
});
//# sourceMappingURL=Component-dbg.js.map
