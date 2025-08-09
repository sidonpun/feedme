using System.Collections.Concurrent;
using feedme.Server.Models;

namespace feedme.Server.Repositories;

public class InMemoryCatalogRepository : ICatalogRepository
{
    private readonly ConcurrentDictionary<string, CatalogItem> _items = new();

    public IEnumerable<CatalogItem> GetAll() => _items.Values;

    public CatalogItem? GetById(string id) =>
        _items.TryGetValue(id, out var item) ? item : null;

    public CatalogItem Add(CatalogItem item)
    {
        var id = Guid.NewGuid().ToString();
        item.Id = id;
        _items[id] = item;
        return item;
    }
}
