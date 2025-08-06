using feedme.Server.Models;

namespace feedme.Server.Repositories;

public class InMemoryCatalogRepository : ICatalogRepository
{
    private readonly List<CatalogItem> _items = new();

    public IEnumerable<CatalogItem> GetAll() => _items;

    public CatalogItem? GetById(string id) => _items.FirstOrDefault(i => i.Id == id);

    public CatalogItem Add(CatalogItem item)
    {
        item.Id = Guid.NewGuid().ToString();
        _items.Add(item);
        return item;
    }
}
