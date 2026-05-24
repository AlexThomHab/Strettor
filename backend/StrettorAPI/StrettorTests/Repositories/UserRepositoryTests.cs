using FluentAssertions;
using Moq;
using StrettorAPI.Data;
using StrettorAPI.Models;
using StrettorAPI.Repositories;
using Xunit;

namespace StrettorTests.Repositories;

// Tests DbUserRepository in complete isolation from any real database.
// IUserDbContext is mocked so every test exercises only the repository's
// delegation and field-mapping logic — no I/O, no EF, no network.
public class UserRepositoryTests
{
    private readonly Mock<IUserDbContext> _mockContext;
    private readonly DbUserRepository _repo;

    public UserRepositoryTests()
    {
        _mockContext = new Mock<IUserDbContext>();
        _repo        = new DbUserRepository(_mockContext.Object);
    }

    [Fact]
    public async Task GetByIdAsync_WhenUserExists_ShouldReturnCorrectUser()
    {
        var id   = Guid.NewGuid();
        var user = new User { Id = id, Username = "alex", Email = "alex@test.com" };
        _mockContext.Setup(c => c.FindByIdAsync(id)).ReturnsAsync(user);

        var result = await _repo.GetByIdAsync(id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(id);
        result.Username.Should().Be("alex");
        result.Email.Should().Be("alex@test.com");
    }

    [Fact]
    public async Task GetByIdAsync_WhenUserDoesNotExist_ShouldReturnNull()
    {
        _mockContext
            .Setup(c => c.FindByIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync((User?)null);

        var result = await _repo.GetByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByEmailAsync_WhenUserExists_ShouldReturnMatchingUser()
    {
        var user = new User { Email = "alex@test.com", Username = "alex" };
        _mockContext
            .Setup(c => c.FindByEmailAsync("alex@test.com"))
            .ReturnsAsync(user);

        var result = await _repo.GetByEmailAsync("alex@test.com");

        result.Should().NotBeNull();
        result!.Email.Should().Be("alex@test.com");
    }

    [Fact]
    public async Task GetByEmailAsync_WhenUserDoesNotExist_ShouldReturnNull()
    {
        _mockContext
            .Setup(c => c.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        var result = await _repo.GetByEmailAsync("ghost@test.com");

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByStripeCustomerIdAsync_WhenUserExists_ShouldReturnMatchingUser()
    {
        const string customerId = "cus_abc123";
        var user = new User { StripeCustomerId = customerId, Email = "alex@test.com" };
        _mockContext
            .Setup(c => c.FindByStripeCustomerIdAsync(customerId))
            .ReturnsAsync(user);

        var result = await _repo.GetByStripeCustomerIdAsync(customerId);

        result.Should().NotBeNull();
        result!.StripeCustomerId.Should().Be(customerId);
    }

    [Fact]
    public async Task GetAllAsync_ShouldDelegateToContextAndReturnAllUsers()
    {
        var users = new List<User>
        {
            new() { Username = "alice", Email = "alice@test.com" },
            new() { Username = "bob",   Email = "bob@test.com"   }
        };
        _mockContext.Setup(c => c.GetAllAsync()).ReturnsAsync(users);

        var result = (await _repo.GetAllAsync()).ToList();

        result.Should().HaveCount(2);
        result.Select(u => u.Username).Should().BeEquivalentTo("alice", "bob");
    }

    [Fact]
    public async Task AddAsync_ShouldDelegateInsertToContext()
    {
        var user = new User { Username = "alex", Email = "alex@test.com" };
        _mockContext
            .Setup(c => c.InsertAsync(user))
            .Returns(Task.CompletedTask);

        await _repo.AddAsync(user);

        _mockContext.Verify(c => c.InsertAsync(user), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ShouldDelegateToContext()
    {
        var user = new User { Id = Guid.NewGuid(), Username = "updated" };
        _mockContext
            .Setup(c => c.UpdateAsync(user))
            .Returns(Task.CompletedTask);

        await _repo.UpdateAsync(user);

        _mockContext.Verify(c => c.UpdateAsync(user), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ShouldDelegateDeletionToContext()
    {
        var id = Guid.NewGuid();
        _mockContext
            .Setup(c => c.DeleteAsync(id))
            .Returns(Task.CompletedTask);

        await _repo.DeleteAsync(id);

        _mockContext.Verify(c => c.DeleteAsync(id), Times.Once);
    }
}
