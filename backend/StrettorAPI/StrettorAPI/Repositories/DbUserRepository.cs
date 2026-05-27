using StrettorAPI.Data;
using StrettorAPI.Models;

namespace StrettorAPI.Repositories;

// Database-backed implementation of IUserRepository.
// Depends on IUserDbContext - the thin abstraction over the persistence engine
// (replace with an EfUserDbContext : IUserDbContext when connecting to a real DB).
public class DbUserRepository : IUserRepository
{
    private readonly IUserDbContext _context;

    public DbUserRepository(IUserDbContext context)
    {
        _context = context;
    }

    public Task<User?> GetByIdAsync(Guid id)
        => _context.FindByIdAsync(id);

    public Task<User?> GetByEmailAsync(string email)
        => _context.FindByEmailAsync(email);

    public Task<User?> GetByStripeCustomerIdAsync(string stripeCustomerId)
        => _context.FindByStripeCustomerIdAsync(stripeCustomerId);

    public async Task<IEnumerable<User>> GetAllAsync()
        => await _context.GetAllAsync();

    public Task AddAsync(User user)
        => _context.InsertAsync(user);

    public Task UpdateAsync(User user)
        => _context.UpdateAsync(user);

    public Task DeleteAsync(Guid id)
        => _context.DeleteAsync(id);
}
