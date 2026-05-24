using StrettorAPI.Models;

namespace StrettorAPI.Data;

// Thin abstraction over the persistence engine (EF Core, Dapper, etc.).
// The concrete implementation (e.g. EfUserDbContext) will wrap DbContext;
// in tests we swap it for a Moq double.
public interface IUserDbContext
{
    Task<User?> FindByIdAsync(Guid id);
    Task<User?> FindByEmailAsync(string email);
    Task<User?> FindByStripeCustomerIdAsync(string stripeCustomerId);
    Task<IEnumerable<User>> GetAllAsync();
    Task InsertAsync(User user);
    Task UpdateAsync(User user);
    Task DeleteAsync(Guid id);
}
