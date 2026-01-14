sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageBox", "sap/ui/model/json/JSONModel"], function (Controller, MessageBox, JSONModel) {
    "use strict";
    return Controller.extend("inventorysample.controller.Login", {
        onLogin: function () {
            var sEmail = this.byId("emailInput").getValue();
            var oModel = this.getView().getModel();

            var oListBinding = oModel.bindList("/Users", null, null, [new sap.ui.model.Filter("email", "EQ", sEmail)]);
            oListBinding.requestContexts().then(function (aContexts) {
                if (aContexts.length > 0) {
                    var oUser = aContexts[0].getObject();
                    var oSecurityModel = this.getOwnerComponent().getModel("security");
                    var oDataModel = this.getOwnerComponent().getModel();
                    console.log("oDataModel: " + oDataModel)
                    // oDataModel.changeHttpHeaders({
                    //     "x-user-role": oUser.role
                    // });

                    var bIsAdmin = (oUser.role === "admin");
                    oSecurityModel.setProperty("/isAdmin", bIsAdmin);
                    oSecurityModel.setProperty("/user", oUser.email);
                    oSecurityModel.setProperty("/role", oUser.role);
                    oSecurityModel.setProperty("/ID", oUser.ID);
                    oSecurityModel.setProperty("/name", oUser.name);
                    console.log(oUser)

                    var oUserData = {
                        isAdmin: bIsAdmin, 
                        user: oUser.email,
                        role: oUser.role,
                        ID: oUser.ID,
                        name: oUser.name
                    }
                    
                    localStorage.setItem("inventoryUser", JSON.stringify(oUserData))
                    console.log(this.getOwnerComponent().getModel("security").getData())
                    sap.m.MessageToast.show("Welcome " + oUser.name);
                    this.getOwnerComponent().getRouter().navTo("Routehome");
                } else {
                    MessageBox.error("Invalid Credentials");
                }
            }.bind(this));
        }
    });
});