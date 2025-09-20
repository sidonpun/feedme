using feedme.Server.Models;

namespace feedme.Server.Repositories;

public interface ICatalogRepository
{
    Task<IEnumerable<CatalogItem>> GetAllAsync();
    Task<CatalogItem?> GetByIdAsync(string id);
    Task<CatalogItem> AddAsync(CatalogItem item);
    Task<bool> DeleteAsync(string id);
}
