import MessageItem from "sap/m/MessageItem";
import MessagePopover from "sap/m/MessagePopover";
import Event from "sap/ui/base/Event";
import Control from "sap/ui/core/Control";
import Controller from "sap/ui/core/mvc/Controller";
import Button from "sap/m/Button";

export default class ErrorHandler extends Controller {

    private _oMessagePopover!: MessagePopover;

    public onInit(): void | undefined {
        
    }

    public onMessagePopoverPress(oEvent: Event) : void {
        var oSource = oEvent.getSource();
        var oMessageManager = sap.ui.getCore().getMessageManager();

        if (!this._oMessagePopover) {
                this._oMessagePopover = new MessagePopover({
                    headerButton: new Button({
                        icon: "sap-icon://delete",
                        text: "Clear",
                        type: "Transparent",
                        press:  () => {
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
                this.getView()!.addDependent(this._oMessagePopover);
            }
            this._oMessagePopover.toggle(oSource as Control);
    }
}