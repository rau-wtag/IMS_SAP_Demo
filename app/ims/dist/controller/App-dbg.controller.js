sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/Fragment",
  "sap/ui/model/json/JSONModel"
], (BaseController, Fragment, JSONModel) => {
  "use strict";

  return BaseController.extend("ims.controller.App", {
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
          name: "ims.view.fragments.Cart",
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
        sap.m.MessageToast.show("Request Submitted! Check Message Popover in the footer. If there is no popover, then the operation was successful!");

        oCartModel.setProperty("/items", []);
        oCartModel.setProperty("/count", 0);
        this.onCloseCart();
      }.bind(this)).catch(function (oError) {
        this.getView().setBusy(false);
        console.log(oError.message);
        sap.m.MessageBox.error("Submission failed: " + oError.message);
      }.bind(this));
    },

    // onLogout: function () {
    //     var sUrl = window.location.origin + "/odata/v4/catalog/";
    
    // // 1. Create a request to a PROTECTED backend URL
    //     var oRequest = new XMLHttpRequest();

    //     // 2. THE SECRET: Send WRONG credentials ('logout':'logout') 
    //     // This overwrites the browser's saved 'admin@test.com'
    //     oRequest.open("GET", sUrl, true, "logout", "logout"); 
    //     oRequest.send();

    //     oRequest.onreadystatechange = function() {
    //         if (oRequest.readyState === 4) {
    //             // 3. Clear the local security model
    //             this.getOwnerComponent().getModel("security").setData({
    //                 isAdmin: false,
    //                 isLoggedIn: false,
    //                 user: "",
    //                 name:"",
    //                 ID:"",
    //                 role:""
                    
    //             });
                
    //             window.location.href = "/app-logout";
    //             console.log(window.location.href)
    //             console.log(this.getOwnerComponent().getModel("security").getData())
    //             //window.location.reload(); 
    //         }
    //     }.bind(this);
    //   },

      onLogout: function () {
        //var sUrl = window.location.origin + "/odata/v4/catalog/";
    
    // 1. Create a request to a PROTECTED backend URL
        //var oRequest = new XMLHttpRequest();

        // 2. THE SECRET: Send WRONG credentials ('logout':'logout') 
        // This overwrites the browser's saved 'admin@test.com'
        //oRequest.open("GET", sUrl, true, "logout", "logout"); 
        //oRequest.send();

        // oRequest.onreadystatechange = function() {
            // if (oRequest.readyState === 4) {
                // 3. Clear the local security model
                this.getOwnerComponent().getModel("security").setData({
                    isAdmin: false,
                    isLoggedIn: false,
                    user: "",
                    name:"",
                    ID:"",
                    role:""
                    
                });
                
                window.location.href = "/app-logout";
                console.log(window.location.href)
                console.log(this.getOwnerComponent().getModel("security").getData())
                //window.location.reload(); 
            }
        // }.bind(this);
      
  });
});