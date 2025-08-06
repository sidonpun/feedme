using feedme.Server.Models;

namespace feedme.Server.Repositories;

public interface ICatalogRepository
{
    IEnumerable<CatalogItem> GetAll();
    CatalogItem? GetById(string id);
    CatalogItem Add(CatalogItem item);
}
