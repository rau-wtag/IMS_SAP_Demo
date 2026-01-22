namespace my.admin;
//For admin service
@cds.persistence.skip
entity User {
    key userName       : String;
        btpId          : String;
        externalId     : String;
        firstName      : String;
        lastName       : String;
        displayName    : String;
        eMail          : String;
    key originKey      : String;
        origin         : Association to one IdP on  $self.originKey = origin.originKey;
        authorizations : Composition of many UserAuthorization
                            on authorizations.parent = $self;
        isActive       : Boolean;
        isVerified     : Boolean;
};

@cds.persistence.skip
entity UserAuthorization {
    key parent_userName : String;
    key parent_originKey   : String;
    key authorization_ID : String;
    parent        : Association to one User on parent.userName = $self.parent_userName and parent.originKey = $self.parent_originKey;
    authorization : Association to one Authorization on authorization.ID = $self.authorization_ID;
};

@readonly
@cds.autoexpose
@cds.persistence.skip
entity IdP {
    key originKey : String;
        name      : String;
}

@readonly
@cds.autoexpose
@cds.persistence.skip
entity Authorization {
    key ID          : String;
        name        : String;
        description : String;
}