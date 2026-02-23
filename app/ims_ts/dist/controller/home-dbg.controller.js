sap.ui.define(["./ErrorHandler"], function (__ErrorHandler) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const ErrorHandler = _interopRequireDefault(__ErrorHandler);
  /**
   * @namespace imsts.controller
   */
  const home = ErrorHandler.extend("imsts.controller.home", {
    /*eslint-disable @typescript-eslint/no-empty-function*/onInit: function _onInit() {},
    formatCurrencyShort: function _formatCurrencyShort(fValue) {
      if (!fValue) return "0";
      var fNum = parseFloat(fValue);
      if (fNum >= 1000000) {
        return (fNum / 1000000).toFixed(1); // Returns 1.2 for 1,200,000
      } else if (fNum >= 1000) {
        return (fNum / 1000).toFixed(1); // Returns 150.5 for 150,500
      }
      return fNum.toFixed(0);
    },
    formatScale: function _formatScale(fValue) {
      if (!fValue) return "BDT";
      var fNum = parseFloat(fValue);
      if (fNum >= 1000000) {
        return "M BDT"; // Million
      } else if (fNum >= 1000) {
        return "K BDT"; // Thousand
      }
      return "BDT";
    }
  });
  return home;
});
//# sourceMappingURL=home-dbg.controller.js.map
