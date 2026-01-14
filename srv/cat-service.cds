using my.inventory as my from '../db/schema';

service CatalogService {
    entity Users as projection on my.Users;
    
    @readonly entity DashboardCards as projection on my.DashboardCards;
    @readonly entity StockAlerts as projection on my.StockAlerts;
    @readonly entity ModelNames as projection on my.ModelNames;
    @cds.redirection.target entity Details as projection on my.Details;

    @readonly entity InUseCount as projection on my.InUseCount;
    @readonly entity AvailableCount as projection on my.AvailableCount;
    @readonly entity RepairCount as projection on my.RepairCount;
    @readonly entity StatusAnalytics as projection on my.StatusAnalytics;
    @readonly entity CategoryDistribution as projection on my.CategoryDistribution;
    @cds.redirection.target entity Products as projection on my.Products actions {
        action setRepairStatus();
        action setAvailableStatus();
    };
    
    @readonly entity WeeklyActivity as projection on my.WeeklyActivity;
    @readonly entity PendingRequests as projection on my.PendingRequests;
    @cds.redirection.target entity Requests as projection on my.Requests;

    @readonly entity MaintenanceAlerts as projection on my.MaintenanceAlerts;
    @cds.redirection.target entity RequestItems as projection on my.RequestItems;

    @readonly entity Possessions as projection on my.Possessions;
    @readonly entity RecentRestocks as projection on my.RecentRestocks;
    @cds.redirection.target entity Logs as projection on my.Logs;
}