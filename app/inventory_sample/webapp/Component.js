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
            sap.ui.getCore().getMessageManager().registerObject(this, true);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            var sSavedUser = localStorage.getItem("inventoryUser");
            var oUserData = sSavedUser ? JSON.parse(sSavedUser) : { isAdmin: false, isEmployee: false, user: "", ID: "", name: "", role:"" };

            var oSecurityModel = new JSONModel(oUserData);
            this.setModel(oSecurityModel, "security");

            $.get("/odata/v4/catalog/getUserInfo()")
                .done(function (data) {
                    var oData = data.value ? data.value : data;
                    if (typeof oData === "string") oData = JSON.parse(oData);

                    var oFreshData = {
                        isAdmin: oData.isAdmin,
                        isEmployee: oData.isEmployee,
                        user: oData.email,
                        ID: oData.ID,
                        name: oData.name,
                        role: oData.role
                    };
                    oSecurityModel.setData(oFreshData);
                    localStorage.setItem("inventoryUser", JSON.stringify(oFreshData));
                }.bind(this))
                .fail(function () {
                    this.getRouter().navTo("Login");
                }.bind(this));

            var oCartModel = new JSONModel({
                items: [],
                count: 0
            });
            this.setModel(oCartModel, "cart");

            var oMessageManager = sap.ui.getCore().getMessageManager();
    // Register the entire Component so ALL views automatically get validation errors
            oMessageManager.registerObject(this, true);
            // Set the model globally so "message>/" works everywhere
            this.setModel(oMessageManager.getMessageModel(), "message");

            // enable routing
            this.getRouter().initialize();


        }
    });
});