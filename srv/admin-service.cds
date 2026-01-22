using my.admin as srv from '../db/admin-schema';

namespace btp.srv;

service UserManager @(requires: 'Admin_Role') {
    
    entity User as projection on srv.User actions {
        @cds.odata.bindingparameter.collection
        action refreshData() returns Boolean;
    };
    entity Authorization as projection on srv.Authorization;
    entity UserAuthorization as projection on srv.UserAuthorization;
    entity IdP as projection on srv.IdP;
}

