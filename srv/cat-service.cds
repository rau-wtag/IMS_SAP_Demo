using my.inventory as my from '../db/schema';

service CatalogService @(requires:'authenticated-user') {
    entity Users as projection on my.Users;
    function getUserInfo() returns String;
    
    @readonly entity DashboardCards as projection on my.DashboardCards;
    @readonly entity StockAlerts as projection on my.StockAlerts;
    @readonly entity ModelNames as projection on my.ModelNames;
    @cds.redirection.target entity Details as projection on my.Details;
    annotate Details with @(restrict: [
        {
            grant: ['*'],
            to   : 'Admin_Role'
        },
        {
            grant: ['READ'],
            to   : 'Employee_Role'
        }
    ]);

    @readonly entity InUseCount as projection on my.InUseCount;
    @readonly entity AvailableCount as projection on my.AvailableCount;
    @readonly entity RepairCount as projection on my.RepairCount;
    @readonly entity StatusAnalytics as projection on my.StatusAnalytics;
    @readonly entity CategoryDistribution as projection on my.CategoryDistribution;
    @readonly entity TotalValuation as projection on my.TotalValuation;
    @cds.redirection.target entity Products as projection on my.Products;
    annotate Products with @(restrict: [
        {
            grant: ['*'],
            to   : 'Admin_Role'
        },
        {
            grant: ['READ'],
            to   : 'Employee_Role'
        }
    ]);
    @readonly entity WeeklyActivity as projection on my.WeeklyActivity;
    @readonly entity PendingRequests as projection on my.PendingRequests;
    @cds.redirection.target entity Requests as projection on my.Requests;
    annotate Requests with @(restrict: [
        { grant: ['WRITE', 'UPDATE', 'DELETE'], to: 'authenticated-user', where: 'createdBy = $user' },
        { grant: ['READ'], to: 'EMPLOYEE_ROLE'},
        { grant: ['*'], to: 'Admin_Role' }
    ]);

    @readonly entity MaintenanceAlerts as projection on my.MaintenanceAlerts;
    @cds.redirection.target entity RequestItems as projection on my.RequestItems;
    annotate RequestItems with @(restrict: [
        { grant: ['WRITE', 'UPDATE', 'DELETE'], to: 'authenticated-user', where: 'createdBy = $user' },
        { grant: ['READ'], to: 'EMPLOYEE_ROLE'},
        { grant: ['*'], to: 'Admin_Role' }
    ]);

    @readonly entity Possessions as projection on my.Possessions;
    @readonly entity RecentRestocks as projection on my.RecentRestocks;
    @cds.redirection.target entity Logs as projection on my.Logs;
    annotate Logs with @(restrict: [
        {
            grant: ['*'],
            to   : 'Admin_Role'
        },
        {
            grant: ['READ'],
            to   : 'Employee_Role'
        }
    ]);
}
