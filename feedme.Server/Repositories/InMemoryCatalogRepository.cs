using System.Collections.Concurrent;
using System.Threading;
using feedme.Server.Models;

namespace feedme.Server.Repositories;

public class InMemoryCatalogRepository : ICatalogRepository
{
    private readonly ConcurrentDictionary<string, CatalogItem> _items = new();

    public Task<IEnumerable<CatalogItem>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult<IEnumerable<CatalogItem>>(_items.Values);
    }

    public Task<CatalogItem?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var item = _items.TryGetValue(id, out var value) ? value : null;
        return Task.FromResult(item);
    }

    public Task<CatalogItem> AddAsync(CatalogItem item, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var id = Guid.NewGuid().ToString();
        item.Id = id;
        _items[id] = item;
        return Task.FromResult(item);
    }
}
