sap.ui.define(["sap/m/MessageBox", "sap/m/MessageToast", "sap/ui/core/Fragment", "sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel"], function (MessageBox, MessageToast, Fragment, Controller, JSONModel) {
  "use strict";

  /**
   * @namespace ims.controller
   */
  const App = Controller.extend("webapp.controller.App", {
    /*eslint-disable @typescript-eslint/no-empty-function*/onInit: function _onInit() {
      var oLoginModel = new JSONModel({
        isLoggedIn: false
      });
      this.getView()?.setModel(oLoginModel, "isLogin");
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.attachRoutePatternMatched(this._onRouteMatched, this);
    },
    _onRouteMatched: function _onRouteMatched(oEvent) {
      var sRouteName = oEvent.getParameter("name");
      var oUIModel = this.getView()?.getModel("isLogin");
      if (sRouteName === "Login") {
        oUIModel.setProperty("/isLoggedIn", false);
      } else {
        oUIModel.setProperty("/isLoggedIn", true);
      }
    },
    onOpenCart: function _onOpenCart() {
      const oView = this.getView();
      if (!this._pCartDialog) {
        this._pCartDialog = Fragment.load({
          id: oView.getId(),
          name: "ims.view.fragments.Cart",
          controller: this
        }).then(oControl => {
          const oDialog = oControl;
          oView.addDependent(oDialog);
          return oDialog;
        });
      }
      this._pCartDialog.then(oDialog => {
        oDialog.open();
      });
    },
    onCloseCart: function _onCloseCart() {
      this.byId("cartDialog").close();
    },
    onDeleteCartItem: function _onDeleteCartItem(oEvent) {
      const oCartModel = this.getOwnerComponent().getModel("cart");
      const aItems = oCartModel.getProperty("/items");
      const oButton = oEvent.getSource();
      const oBindingContext = oButton.getBindingContext("cart");
      const sIdToRemove = oBindingContext.getProperty("ID");
      const aNewItems = aItems.filter(item => item.ID !== sIdToRemove);
      oCartModel.setProperty("/items", aNewItems);
      oCartModel.setProperty("/count", aNewItems.length);
      MessageToast.show("Removed from cart");
    },
    onConfirmCart: function _onConfirmCart() {
      const oModel = this.getOwnerComponent().getModel();
      const oCartModel = this.getOwnerComponent().getModel("cart");
      const aItems = oCartModel.getProperty("/items");
      const sCause = this.byId("requestCause").getValue();
      const sUser = this.getOwnerComponent().getModel("security").getProperty("/ID");
      if (!sCause) {
        MessageToast.show("Please provide a reason for your request.");
        return;
      }
      this.getView().setBusy(true);
      const sGroupId = "requestGroup";
      const oRequestBinding = oModel.bindList("/Requests", undefined, undefined, undefined, {
        $$updateGroupId: sGroupId
      });
      const oNewRequest = oRequestBinding.create({
        requestNo: "REQ-" + Math.floor(1000 + Math.random() * 9000),
        requestedBy_ID: sUser,
        type: "request",
        cause: sCause,
        status: "PENDING"
      });
      oModel.submitBatch(sGroupId).then(() => oNewRequest.created()).then(() => {
        const sReqID = oNewRequest.getProperty("ID");
        const oItemBinding = oModel.bindList("/RequestItems", undefined, undefined, undefined, {
          $$updateGroupId: sGroupId
        });
        aItems.forEach(item => {
          oItemBinding.create({
            parent_ID: sReqID,
            product_ID: item.ID,
            status: "PENDING"
          });
        });
        return oModel.submitBatch(sGroupId);
      }).then(() => {
        this.getView().setBusy(false);
        MessageToast.show("Request Submitted! Check Message Popover in the footer. If there is no popover, then the operation was successful!");
        oCartModel.setProperty("/items", []);
        oCartModel.setProperty("/count", 0);
        this.onCloseCart();
      }).catch(oError => {
        this.getView().setBusy(false);
        MessageBox.error("Submission failed: " + oError.message);
      });
    },
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
