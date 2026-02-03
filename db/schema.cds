namespace my.inventory;

using { managed, cuid } from '@sap/cds/common';

entity Details : cuid, managed {
    key ID          : UUID;
    name            : String @title: 'Product Name';
    description     : String @title: 'Description';
    unit_type       : String @title: 'Category'; 
    unit_price      : Decimal @title: 'Price';
    reorder_level   : Integer @title: 'Reorder Level';
    items           : Association to many Products on items.details = $self;
}

entity Products : cuid, managed {
    key ID              : UUID;
    code                : String @title: 'Asset ID / Serial';
    status              : String enum { available; repair; lost; requested; } default 'available';
    details             : Association to Details;
    currentPossession   : Association to Users;
    requests            : Association to RequestItems on requests.product = $self;
}

entity Users {
    key ID          : String;
    name            : String @title: 'Name';
    email           : String @title: 'Email';
    role            : String enum { user; admin };
    possessions     : Association to many Products on possessions.currentPossession = $self;
    performed       : Association to many Logs on performed.performedBy = $self;
}

entity Requests : cuid, managed {
    key ID      : UUID;
    requestNo   : String; 
    requestedBy : Association to Users; 
    type        : String enum { request; return; repair; } default 'request';
    cause       : String;
    status      : String enum { PENDING; APPROVED; REJECTED; PARTIAL; } default 'PENDING';
    items       : Composition of many RequestItems on items.parent = $self;
    logs        : Association to Logs on logs.request = $self;
}

entity RequestItems : cuid, managed {
    key ID      : UUID;
    parent      : Association to Requests @on.delete: #Cascade;
    product     : Association to Products;
    status      : String enum { PENDING; APPROVED; REJECTED; } default 'PENDING';
    adminNote   : String; 
}

// entity Possessions : cuid, managed {
//     key ID      : UUID;
//     user        : Association to Users;
//     assginedBy  : Association to Users;
//     request     : Association to Requests;
//     assignedAt  : DateTime;
//     product     : Association to Products;
// }

entity Logs : cuid, managed {
    key ID      : UUID;
    action      : String enum {CHECKED_OUT; CHECKED_IN; REJECTED; RESTOCKED;};
    performedBy : Association to Users;
    timestamp   : DateTime;
    product     : Association to Products;
    request     : Association to Requests;
}

view DashboardCards as select from Details {
    key unit_type,
    avg(unit_price) as avg_price : Decimal,
    count(items.ID) as total_count : Integer,  
    
} group by unit_type;

view ProductStockReport as select from Details {
    key ID,
    name,
    unit_type,
    unit_price,
    count(items.ID) as stock_count : Integer
} group by ID, name, unit_type, unit_price;

view Possessions as select from Logs {
    key ID, 
    product.ID as productID, 
    request.ID as requestID,
    performedBy.name as performedBy,
    product.currentPossession.ID as user,
    timestamp as assignedAt,
};

view StockAlerts as select from Details {
    key ID,
    name,
    (reorder_level - (select count(ID) from Products where details.ID = Details.ID)) as itemsToOrder : Integer,
    (reorder_level - (select count(ID) from Products where details.ID = Details.ID)) * unit_price as estimatedCost : Decimal
} where (select count(ID) from Products where details.ID = Details.ID and status = 'available') <= reorder_level;

view InUseCount as select from Products {
    key ID
} where currentPossession != null;

view AvailableCount as select from Products {
    key ID
} where status = 'available';

view RepairCount as select from Products {
    key ID
} where status = 'repair';

view StatusAnalytics as select from Products {
    key ID, 
    key case 
        when (currentPossession.ID is not null and status is null) then 'In Use'
        else status
    end as status : String,
    count(ID) as count : Integer
} group by status,ID,currentPossession.ID;

view RecentRestocks as select from Logs {
    key ID,
    product.code as productCode, 
    action,
    product.details.name as modelName,
    cast(timestamp as Timestamp) as timestamp
} where action = 'RESTOCKED' or action = 'CHECKED_IN' and createdAt >= add_days(now(), -7);

view WeeklyActivity as select from Requests {
    key ID,
    requestNo,
    type,
    status,
    requestedBy.name as requester,
    cast(createdAt as Timestamp) as createdAt
} where createdAt >= add_days(now(), -7);

view MaintenanceAlerts as select from RequestItems {
    key ID,
    product.code as productCode, 
    product.details.name as modelName,
    product.details.unit_price * 0.7 AS estRepairCost : Decimal(10,3),
    parent.requestedBy.name as reportedBy
} where parent.type = 'repair' and status = 'PENDING';

view UserNmaes as select from Users {
    key ID, 
    name
};

view PendingRequests as select from Requests {
    key ID,
    status
} where status = 'PENDING';

view CategoryDistribution as select from Products {
    key status,
    key details.unit_type,
    count (ID) as amount : Integer
} group by details.unit_type, status;

view ModelNames as select from Details {
    key name
};

view TotalValuation as select from Products {
    key details.unit_type,
    count(ID) as total_count : Integer,
    sum(details.unit_price) as total_value : Decimal(15,2)

} group by details.unit_type;

