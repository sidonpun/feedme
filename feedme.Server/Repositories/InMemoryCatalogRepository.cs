using System.Collections.Concurrent;
using feedme.Server.Models;

namespace feedme.Server.Repositories;

public class InMemoryCatalogRepository : ICatalogRepository
{
    private readonly ConcurrentDictionary<string, CatalogItem> _items = new();

    public Task<IEnumerable<CatalogItem>> GetAllAsync() =>
        Task.FromResult<IEnumerable<CatalogItem>>(_items.Values);

    public Task<CatalogItem?> GetByIdAsync(string id)
    {
        var item = _items.TryGetValue(id, out var value) ? value : null;
        return Task.FromResult(item);
    }

    public Task<CatalogItem> AddAsync(CatalogItem item)
    {
        var id = Guid.NewGuid().ToString();
        item.Id = id;
        _items[id] = item;
        return Task.FromResult(item);
    }
}
