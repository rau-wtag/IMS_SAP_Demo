sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  /**
   * @namespace imsts.controller
   */
  const App = Controller.extend("imsts.controller.App", {
    /*eslint-disable @typescript-eslint/no-empty-function*/onInit: function _onInit() {},
    onLogout: function _onLogout() {
      var oSecurityModel = this.getOwnerComponent().getModel("security");
      oSecurityModel.setData({
        isAdmin: false,
        isLoggedIn: false,
        user: "",
        name: "",
        ID: "",
        role: ""
      });
      window.location.href = "/app-logout";
    }
  });
  return App;
});
//# sourceMappingURL=App-dbg.controller.js.map
