import Controller from "sap/ui/core/mvc/Controller";
import ErrorHandler from "./ErrorHandler";

/**
 * @namespace imsts.controller
 */
export default class home extends ErrorHandler {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {

    }

    public formatCurrencyShort(fValue : string) : string {
        if(!fValue) return "0";

        var fNum : number = parseFloat(fValue)
        if (fNum >= 1000000) {
                return (fNum / 1000000).toFixed(1); // Returns 1.2 for 1,200,000
            } else if (fNum >= 1000) {
                return (fNum / 1000).toFixed(1); // Returns 150.5 for 150,500
            }

        return fNum.toFixed(0);    
    }

    public formatScale(fValue:string) : string {
        if (!fValue) return "BDT";
        var fNum : number = parseFloat(fValue)   
        if (fNum >= 1000000) {
            return "M BDT"; // Million
        } else if (fNum >= 1000) {
            return "K BDT"; // Thousand
        }
        return "BDT";
    }

        
}