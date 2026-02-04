sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "sap/ui/core/message/Message",
    "sap/ui/core/library"
], function (Controller, MessagePopover, MessageItem, Message, library) {
    "use strict";

    return Controller.extend("ims.controller.ErrorHandler", {

        // --- GLOBAL ERROR POPOVER LOGIC ---
        onMessagePopoverPress: function (oEvent) {
            var oSource = oEvent.getSource();
            var oMessageManager = sap.ui.getCore().getMessageManager();

            if (!this._oMessagePopover) {
                this._oMessagePopover = new MessagePopover({
                    headerButton: new sap.m.Button({
                        icon: "sap-icon://delete",
                        text: "Clear",
                        type: "Transparent",
                        press: function () {
                            oMessageManager.removeAllMessages();
                            this._oMessagePopover.close();
                        }.bind(this)
                    }),
                    items: {
                        path: "message>/",
                        template: new MessageItem({
                            type: "{message>type}",
                            title: "{message>message}",
                            subtitle: "{message>additionalText}",
                            description: "{message>description}",
                            counter: 1
                        })
                    }
                });
                this.getView().addDependent(this._oMessagePopover);
            }
            this._oMessagePopover.toggle(oSource);
        }

    });
});