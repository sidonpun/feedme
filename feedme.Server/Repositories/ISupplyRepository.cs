using feedme.Server.Models;

namespace feedme.Server.Repositories;

public interface ISupplyRepository
{
    Task<IReadOnlyCollection<Supply>> GetLatestAsync(int limit, CancellationToken cancellationToken = default);
    Task<Supply> AddAsync(Supply supply, CancellationToken cancellationToken = default);
}
