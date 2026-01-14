sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/Fragment",
  "sap/ui/model/json/JSONModel"
], (BaseController, Fragment, JSONModel) => {
  "use strict";

  return BaseController.extend("inventorysample.controller.App", {
    onInit() {

      var oLoginModel = new JSONModel({
        isLoggedIn: false
      });
      this.getView().setModel(oLoginModel, "isLogin");

      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.attachRouteMatched(this._onRouteMatched, this);

    },

    _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oUiModel = this.getView().getModel("isLogin");
            console.log(oUiModel)
            
            if (sRouteName === "Login") {
                oUiModel.setProperty("/isLoggedIn", false);
            } else {
                oUiModel.setProperty("/isLoggedIn", true);
            }
        },
    onOpenCart: function () {
      var oView = this.getView();
      if (!this._pCartDialog) {
        this._pCartDialog = Fragment.load({
          id: oView.getId(),
          name: "inventorysample.view.fragments.Cart",
          controller: this
        }).then(function (oDialog) {
          oView.addDependent(oDialog);
          return oDialog;
        });
      }
      this._pCartDialog.then(function (oDialog) {
        oDialog.open();
      });
    },

    onCloseCart: function () {
      this.byId("cartDialog").close();
    },

    onDeleteCartItem: function (oEvent) {
      var oCartModel = this.getOwnerComponent().getModel("cart");
      var aItems = oCartModel.getProperty("/items");

      var oButton = oEvent.getSource();
      var oBindingContext = oButton.getBindingContext("cart");

      var sIdToRemove = oBindingContext.getProperty("ID");

      var aNewItems = aItems.filter(function (item) {
        return item.ID !== sIdToRemove;
      });

      oCartModel.setProperty("/items", aNewItems);
      oCartModel.setProperty("/count", aNewItems.length);

      sap.m.MessageToast.show("Removed from cart");
    },

    onConfirmCart: function () {
      var oModel = this.getOwnerComponent().getModel(); 
      var oCartModel = this.getOwnerComponent().getModel("cart");
      var aItems = oCartModel.getProperty("/items");
      var sCause = this.byId("requestCause").getValue();
      var sUser = this.getOwnerComponent().getModel("security").getProperty("/ID");
      console.log(sUser)

      if (!sCause) {
        sap.m.MessageToast.show("Please provide a reason for your request.");
        return;
      }

      this.getView().setBusy(true);
      var sGroupId = "requestGroup";
      var oRequestBinding = oModel.bindList("/Requests", null, null, null, {
        $$updateGroupId: sGroupId
      });
      var oNewRequest = oRequestBinding.create({
        requestNo: "REQ-" + Math.floor(1000 + Math.random() * 9000),
        requestedBy_ID: sUser,
        type:"request",
        cause: sCause,
        status: 'PENDING'
      });

      console.log(oNewRequest)
      oModel.submitBatch(sGroupId).then(function () {
        return oNewRequest.created();
      }).then(function () {
        var sReqID = oNewRequest.getProperty("ID");
        var oItemBinding = oModel.bindList("/RequestItems", null, null, null, {
            $$updateGroupId: sGroupId
        });

        aItems.forEach(function (item) {
          oItemBinding.create({
            parent_ID: sReqID,
            product_ID: item.ID,
            status: 'PENDING'
          });
        });
        return oModel.submitBatch(sGroupId);
      }.bind(this)).then(function () {
        this.getView().setBusy(false);
        sap.m.MessageToast.show("Request Submitted Successfully!");

        oCartModel.setProperty("/items", []);
        oCartModel.setProperty("/count", 0);
        this.onCloseCart();
      }.bind(this)).catch(function (oError) {
        this.getView().setBusy(false);
        console.log(oError.message);
        sap.m.MessageBox.error("Submission failed: " + oError.message);
      }.bind(this));
    },

    onLogout: function () {
      var oSecurityModel = this.getOwnerComponent().getModel("security");
      oSecurityModel.setProperty("/user", "");
      oSecurityModel.setProperty("/role", "");
      oSecurityModel.setProperty("/isAdmin", false);
      oSecurityModel.setProperty("/ID", "");
      oSecurityModel.setProperty("/name", "");
      //this.getOwnerComponent().getModel("isLogin").setProperty("/isLoggedIn", false);
      this.getOwnerComponent().getRouter().navTo("Login");
    }
  });
});