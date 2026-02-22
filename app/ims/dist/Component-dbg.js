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
    _loadUser(oSecurityModel) {
      $.get("/odata/v4/catalog/getUserInfo()").done(data => {
        let oData = data.value ?? data;
        if (typeof oData === "string") {
          oData = JSON.parse(oData);
        }
        const oFreshData = {
          isAdmin: oData.isAdmin,
          isEmployee: oData.isEmployee,
          user: oData.email,
          ID: oData.ID,
          name: oData.name,
          role: oData.role
        };
        oSecurityModel.setData(oFreshData);
        localStorage.setItem("inventoryUser", JSON.stringify(oFreshData));
      }).fail(() => {
        const oRouter = this.getRouter();
        oRouter.navTo("Login");
      });
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
