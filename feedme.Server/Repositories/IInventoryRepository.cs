using feedme.Server.Models;

namespace feedme.Server.Repositories;

public interface IInventoryRepository
{
    Task<IEnumerable<InventoryDocument>> GetAllAsync();

    Task<InventoryDocument?> GetByIdAsync(string id);

    Task<InventoryDocument> AddAsync(InventoryDocument document);

    Task<InventoryDocument?> UpdateAsync(InventoryDocument document);

    Task<bool> RemoveAsync(string id);
}
