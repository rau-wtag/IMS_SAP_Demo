sap.ui.define([
    "sap/ui/core/UIComponent",
    "inventorysample/model/models",
    "sap/ui/model/json/JSONModel",
], (UIComponent, models, JSONModel) => {
    "use strict";

    return UIComponent.extend("inventorysample.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            var sSavedUser = localStorage.getItem("inventoryUser");
            var oUserData = sSavedUser ? JSON.parse(sSavedUser) : { isAdmin: false, isEmployee: false, user: "", ID: "", name:"" };

            var oSecurityModel = new JSONModel(oUserData);
            this.setModel(oSecurityModel, "security");

            $.get("/odata/v4/catalog/getUserInfo()").done(function(data) {
                var oData = JSON.parse(data.value);
                oSecurityModel.setData({
                        isAdmin: oData.isAdmin,
                        isEmployee: oData.isEmployee,
                        user: oData.email,     
                        ID: oData.id,      
                        name: oData.name
                    });
                }.bind(this))
                .fail(function() {
                    // If the backend says "Unauthorized", send them to Login
                    this.getRouter().navTo("Login");
                }.bind(this));

            var oCartModel = new JSONModel({
                items: [],
                count: 0
            });
            this.setModel(oCartModel, "cart");

            // enable routing
            this.getRouter().initialize();

            
        }
    });
});