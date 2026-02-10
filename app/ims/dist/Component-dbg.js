sap.ui.define([
    "sap/ui/core/UIComponent",
    "ims/model/models",
    "sap/ui/model/json/JSONModel",
], (UIComponent, models, JSONModel) => {
    "use strict";

    return UIComponent.extend("ims.Component", {
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

            this._attachSessionTimeoutHandler();

            // enable routing
            this.getRouter().initialize();


        },

        _attachSessionTimeoutHandler: function () {
            // Get the Global Message Manager (Where all OData errors are reported)
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oMessageModel = oMessageManager.getMessageModel();

            // Watch for new error messages
            var oBinding = oMessageModel.bindList("/");
            
            oBinding.attachChange(function (oEvent) {
                var aContexts = oEvent.getSource().getContexts();
                var bSessionExpired = false;

                aContexts.forEach(function (oContext) {
                    var oMessage = oContext.getObject();
                    
                    // CHECK 1: Standard 401/403 Errors
                    if (oMessage.code === "401" || oMessage.code === "403") {
                        bSessionExpired = true;
                    }

                    // CHECK 2: The "HTML in JSON" Parser Error
                    // This happens when AppRouter redirects an API call to the Login Page HTML
                    if (oMessage.technical && oMessage.message && 
                        (oMessage.message.includes("Unexpected token") || oMessage.message.includes("is not valid JSON"))) {
                        bSessionExpired = true;
                    }
                });

                if (bSessionExpired) {
                    this._handleSessionExpiration();
                }
            }.bind(this));
        },

        _handleSessionExpiration: function () {
            // Prevent multiple alerts popping up at once
            if (this._bLogoutTriggered) {
                return;
            }
            this._bLogoutTriggered = true;

            // Show a friendly message, then Redirect
            MessageBox.alert("Your session has expired due to inactivity. Please log in again.", {
                icon: MessageBox.Icon.WARNING,
                title: "Session Expired",
                actions: [MessageBox.Action.OK],
                onClose: function () {
                    // Redirect to your logout endpoint to clean up standard & XSUAA sessions
                    window.location.replace("/app-logout");
                }
            });
        }
    });
});