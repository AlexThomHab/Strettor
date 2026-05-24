using StrettorAPI.Models;
using System.Collections.Concurrent;

namespace StrettorAPI.Repositories;

public class InMemoryUserRepository : IUserRepository
{
    private static readonly ConcurrentDictionary<Guid, User> _store = new();

    public Task<User?> GetByIdAsync(Guid id)
    {
        _store.TryGetValue(id, out var user);
        return Task.FromResult(user);
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        var user = _store.Values.FirstOrDefault(u =>
            u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(user);
    }

    public Task<User?> GetByStripeCustomerIdAsync(string stripeCustomerId)
    {
        var user = _store.Values.FirstOrDefault(u =>
            u.StripeCustomerId != null &&
            u.StripeCustomerId.Equals(stripeCustomerId, StringComparison.Ordinal));
        return Task.FromResult(user);
    }

    public Task<IEnumerable<User>> GetAllAsync()
    {
        return Task.FromResult<IEnumerable<User>>(_store.Values.ToList());
    }

    public Task AddAsync(User user)
    {
        _store[user.Id] = user;
        return Task.CompletedTask;
    }

    public Task UpdateAsync(User user)
    {
        _store[user.Id] = user;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id)
    {
        _store.TryRemove(id, out _);
        return Task.CompletedTask;
    }
}
