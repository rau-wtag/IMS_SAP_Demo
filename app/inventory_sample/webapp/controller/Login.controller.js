sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageBox", "sap/ui/model/json/JSONModel"], function (Controller, MessageBox, JSONModel) {
    "use strict";
    return Controller.extend("inventorysample.controller.Login", {
        // onLogin: function () {
        //     var sEmail = this.byId("emailInput").getValue();
        //     var oModel = this.getView().getModel();

        //     var oListBinding = oModel.bindList("/Users", null, null, [new sap.ui.model.Filter("email", "EQ", sEmail)]);
        //     oListBinding.requestContexts().then(function (aContexts) {
        //         if (aContexts.length > 0) {
        //             var oUser = aContexts[0].getObject();
        //             var oSecurityModel = this.getOwnerComponent().getModel("security");
        //             var oDataModel = this.getOwnerComponent().getModel();
        //             console.log("oDataModel: " + oDataModel)
        //             // oDataModel.changeHttpHeaders({
        //             //     "x-user-role": oUser.role
        //             // });

        //             var bIsAdmin = (oUser.role === "admin");
        //             oSecurityModel.setProperty("/isAdmin", bIsAdmin);
        //             oSecurityModel.setProperty("/user", oUser.email);
        //             oSecurityModel.setProperty("/role", oUser.role);
        //             oSecurityModel.setProperty("/ID", oUser.ID);
        //             oSecurityModel.setProperty("/name", oUser.name);
        //             console.log(oUser)

        //             var oUserData = {
        //                 isAdmin: bIsAdmin, 
        //                 user: oUser.email,
        //                 role: oUser.role,
        //                 ID: oUser.ID,
        //                 name: oUser.name
        //             }
                    
        //             localStorage.setItem("inventoryUser", JSON.stringify(oUserData))
        //             console.log(this.getOwnerComponent().getModel("security").getData())
        //             sap.m.MessageToast.show("Welcome " + oUser.name);
        //             this.getOwnerComponent().getRouter().navTo("Routehome");
        //         } else {
        //             MessageBox.error("Invalid Credentials");
        //         }
        //     }.bind(this));
        // },

        onEnter: function () {
            var oSecurityModel = this.getOwnerComponent().getModel("security");
            sap.ui.core.BusyIndicator.show(0);
            // Simply trying to reach the protected backend triggers the login prompt
            $.get("/odata/v4/catalog/getUserInfo()")
                .done(function(data) {
                    sap.ui.core.BusyIndicator.hide();
                    // If successful, the user is now authenticated!
                    // Navigate them to the home page
                    var oUser = data.value ? data.value : data;
                    oSecurityModel.setProperty("/user", oUser.email);
                    oSecurityModel.setProperty("/name", oUser.name);
                    oSecurityModel.setProperty("/ID", oUser.ID);
                    oSecurityModel.setProperty("/role", oUser.role); // 'admin' or 'user'
                    oSecurityModel.setProperty("/isAdmin", oUser.isAdmin);
                    oSecurityModel.setProperty("/isEmployee", oUser.isEmployee);
                    console.log(oSecurityModel.getData())
                    this.getOwnerComponent().getRouter().navTo("Routehome");
                }.bind(this))
                .fail(function(err) {
                    sap.ui.core.BusyIndicator.hide();
                    var sErrorMsg = "Authentication failed.";
                    if (err.responseJSON && err.responseJSON.error) {
                        sErrorMsg = err.responseJSON.error.message;
                    }
                    sap.m.MessageBox.error(sErrorMsg, {
                        title: "Access Denied",
                        onClose: function() {
                            // Optional: Redirect to a generic login page or stay put
                            this.getOwnerComponent().getRouter().navTo("Login"); 
                        }
                    });
                    
                });
        }
    });
});