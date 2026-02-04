sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageBox", "sap/ui/model/json/JSONModel"], function (Controller, MessageBox, JSONModel) {
    "use strict";
    return Controller.extend("ims.controller.Login", {

        onInit: function () {
            var oSecurityModel = this.getOwnerComponent().getModel("security");
            oSecurityModel.setData({
                isAdmin: false,
                isEmployee: false,
                user: "",
                name: "",
                ID: "",
                role: ""
            })

            this.getView().setBusy(true)

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
                .fail(function() {
                    
                })
                .always(function () {
                    this.getView().setBusy(false);
                }.bind(this));
            //this._checkSession();
        },

        onEnter: function () {
            var oSecurityModel = this.getOwnerComponent().getModel("security");
            var sUserEmail = oSecurityModel.getProperty("/user");

            if(sUserEmail)
            {
                this.getOwnerComponent().getRouter().navTo("Routehome");
            }
            else {
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

                    })
                    .always(function () {
                        this.getView().setBusy(false);
                        sap.ui.core.BusyIndicator.hide();
                    }.bind(this));
            } 
        },

        // _checkSession: function (bIsExplicitAttempt) {
        //     var oSecurityModel = this.getOwnerComponent().getModel("security");
        //     var sUserEmail = oSecurityModel.getProperty("/user");

        //     if(sUserEmail)
        //     {
        //         this.getOwnerComponent().getRouter().navTo("Routehome");
        //     }
        //     else {
        //         $.get("/odata/v4/catalog/getUserInfo()")
        //             .done(function(data) {
        //                 sap.ui.core.BusyIndicator.hide();
        //                 // If successful, the user is now authenticated!
        //                 // Navigate them to the home page
        //                 var oUser = data.value ? data.value : data;
        //                 oSecurityModel.setProperty("/user", oUser.email);
        //                 oSecurityModel.setProperty("/name", oUser.name);
        //                 oSecurityModel.setProperty("/ID", oUser.ID);
        //                 oSecurityModel.setProperty("/role", oUser.role); // 'admin' or 'user'
        //                 oSecurityModel.setProperty("/isAdmin", oUser.isAdmin);
        //                 oSecurityModel.setProperty("/isEmployee", oUser.isEmployee);
        //                 console.log(oSecurityModel.getData())
        //                 this.getOwnerComponent().getRouter().navTo("Routehome");
        //             }.bind(this))
        //             .fail(function(err) {
        //                 sap.ui.core.BusyIndicator.hide();
                        
        //                 var sErrorMsg = "Authentication failed.";
        //                 if (err.responseJSON && err.responseJSON.error) {
        //                     sErrorMsg = err.responseJSON.error.message;
        //                 }
        //                 sap.m.MessageBox.error(sErrorMsg, {
        //                     title: "Access Denied",
        //                     onClose: function() {
        //                         // Optional: Redirect to a generic login page or stay put
        //                         this.getOwnerComponent().getRouter().navTo("Login"); 
        //                     }
        //                 });

        //             })
        //             .always(function () {
        //                 this.getView().setBusy(false);
        //                 sap.ui.core.BusyIndicator.hide();
        //             }.bind(this));
        //     }
        // },

        onLogout: function () {
            var sUrl = window.location.origin + "/odata/v4/catalog/";
            var oRequest = new XMLHttpRequest();

            // 2. THE SECRET: Send WRONG credentials ('logout':'logout') 
            // This overwrites the browser's saved 'admin@test.com'
            oRequest.open("GET", sUrl, true, "logout", "logout"); 
            oRequest.send();

            oRequest.onreadystatechange = function() {
                if (oRequest.readyState === 4) {
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
            }.bind(this);
        }
    });
});