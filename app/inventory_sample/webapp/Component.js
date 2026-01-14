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
            var oUserData = sSavedUser ? JSON.parse(sSavedUser) : { isAdmin: false, user: "", role: "", ID: "", name:"" };

            var oSecurityModel = new JSONModel(oUserData);
            this.setModel(oSecurityModel, "security");

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