using System.Threading;
using feedme.Server.Models;

namespace feedme.Server.Repositories;

public interface ICatalogRepository
{
    Task<IEnumerable<CatalogItem>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CatalogItem?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<CatalogItem> AddAsync(CatalogItem item, CancellationToken cancellationToken = default);
}
