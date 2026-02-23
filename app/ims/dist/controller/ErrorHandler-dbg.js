sap.ui.define(["sap/m/MessageItem", "sap/m/MessagePopover", "sap/m/Button", "sap/fe/core/BaseController"], function (MessageItem, MessagePopover, Button, BaseController) {
  "use strict";

  class ErrorHandler extends BaseController {
    onInit() {}
    onMessagePopoverPress(oEvent) {
      var oSource = oEvent.getSource();
      var oMessageManager = sap.ui.getCore().getMessageManager();
      if (!this._oMessagePopover) {
        this._oMessagePopover = new MessagePopover({
          headerButton: new Button({
            icon: "sap-icon://delete",
            text: "Clear",
            type: "Transparent",
            press: () => {
              oMessageManager.removeAllMessages();
              this._oMessagePopover.close();
            }
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
  }
  return ErrorHandler;
});
//# sourceMappingURL=ErrorHandler-dbg.js.map
