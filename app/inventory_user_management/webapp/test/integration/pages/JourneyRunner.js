sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"inventoryusermanagement/test/integration/pages/UserList",
	"inventoryusermanagement/test/integration/pages/UserObjectPage",
	"inventoryusermanagement/test/integration/pages/UserAuthorizationObjectPage"
], function (JourneyRunner, UserList, UserObjectPage, UserAuthorizationObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('inventoryusermanagement') + '/test/flp.html#app-preview',
        pages: {
			onTheUserList: UserList,
			onTheUserObjectPage: UserObjectPage,
			onTheUserAuthorizationObjectPage: UserAuthorizationObjectPage
        },
        async: true
    });

    return runner;
});

