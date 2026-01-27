sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageBox", "sap/ui/model/json/JSONModel"], function (Controller, MessageBox, JSONModel) {
    "use strict";
    return Controller.extend("inventorysample.controller.Login", {

        onEnter: function () {
            var oSecurityModel = this.getOwnerComponent().getModel("security");
            sap.ui.core.BusyIndicator.show(0);
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