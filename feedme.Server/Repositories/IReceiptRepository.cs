using feedme.Server.Models;

namespace feedme.Server.Repositories;

public interface IReceiptRepository
{
    Task<IEnumerable<Receipt>> GetAllAsync();
    Task<Receipt?> GetByIdAsync(string id);
    Task<Receipt> AddAsync(Receipt receipt);
}
