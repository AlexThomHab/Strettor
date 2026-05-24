using FluentAssertions;
using Moq;
using StrettorAPI.Common;
using StrettorAPI.DTOs;
using StrettorAPI.Models;
using StrettorAPI.Repositories;
using StrettorAPI.Services;
using Xunit;

namespace StrettorTests.Services;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mockRepo;
    private readonly UserService _service;

    public UserServiceTests()
    {
        _mockRepo = new Mock<IUserRepository>();
        _service  = new UserService(_mockRepo.Object);
    }

    [Fact]
    public async Task RegisterAsync_WithValidInput_ShouldHashPasswordBeforeStoringUser()
    {
        User? captured = null;
        const string plain = "password123";

        _mockRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _mockRepo.Setup(r => r.AddAsync(It.IsAny<User>()))
                 .Callback<User>(u => captured = u)
                 .Returns(Task.CompletedTask);

        var dto = new UserRegisterDto { Username = "alex", Email = "alex@test.com", Password = plain };

        await _service.RegisterAsync(dto);

        captured.Should().NotBeNull();
        captured!.PasswordHash.Should().NotBe(plain);
        captured.PasswordHash.Should().StartWith("$2");
        BCrypt.Net.BCrypt.Verify(plain, captured.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task RegisterAsync_WithValidInput_ShouldCallAddAsyncOnce()
    {
        _mockRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _mockRepo.Setup(r => r.AddAsync(It.IsAny<User>())).Returns(Task.CompletedTask);

        var dto = new UserRegisterDto { Username = "alex", Email = "alex@test.com", Password = "pw" };

        await _service.RegisterAsync(dto);

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WithValidInput_ShouldReturnSuccessWithMappedDto()
    {
        _mockRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _mockRepo.Setup(r => r.AddAsync(It.IsAny<User>())).Returns(Task.CompletedTask);

        var dto = new UserRegisterDto { Username = "alex", Email = "alex@test.com", Password = "pw" };

        var result = await _service.RegisterAsync(dto);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Username.Should().Be("alex");
        result.Value.Email.Should().Be("alex@test.com");
        result.Value.Id.Should().NotBeEmpty();
    }

    [Fact]
    public async Task RegisterAsync_WhenEmailAlreadyExists_ShouldReturnDuplicateEmailError()
    {
        _mockRepo
            .Setup(r => r.GetByEmailAsync("taken@test.com"))
            .ReturnsAsync(new User { Email = "taken@test.com" });

        var dto = new UserRegisterDto { Email = "taken@test.com", Password = "pw" };

        var result = await _service.RegisterAsync(dto);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(ServiceError.DuplicateEmail);
        result.ErrorMessage.Should().Contain("taken@test.com");
    }

    [Fact]
    public async Task RegisterAsync_WhenEmailAlreadyExists_ShouldNeverCallAddAsync()
    {
        _mockRepo
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(new User { Email = "taken@test.com" });

        await _service.RegisterAsync(new UserRegisterDto { Email = "taken@test.com" });

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldReturnSuccessWithUserDto()
    {
        const string password = "password123";
        var user = new User
        {
            Username     = "alex",
            Email        = "alex@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
        };
        _mockRepo.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

        var dto = new UserLoginDto { Email = user.Email, Password = password };

        var result = await _service.LoginAsync(dto);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Email.Should().Be(user.Email);
        result.Value.Username.Should().Be(user.Username);
    }

    [Fact]
    public async Task LoginAsync_WhenEmailDoesNotExist_ShouldReturnInvalidCredentialsError()
    {
        _mockRepo
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        var dto = new UserLoginDto { Email = "ghost@test.com", Password = "anything" };

        var result = await _service.LoginAsync(dto);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(ServiceError.InvalidCredentials);
    }

    [Fact]
    public async Task LoginAsync_WhenPasswordIsIncorrect_ShouldReturnInvalidCredentialsError()
    {
        var user = new User
        {
            Email        = "alex@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correctpassword")
        };
        _mockRepo.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

        var dto = new UserLoginDto { Email = user.Email, Password = "wrongpassword" };

        var result = await _service.LoginAsync(dto);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(ServiceError.InvalidCredentials);
    }

    [Fact]
    public async Task GetByIdAsync_WhenUserExists_ShouldReturnSuccessWithMappedDto()
    {
        var id   = Guid.NewGuid();
        var user = new User { Id = id, Username = "alex", Email = "alex@test.com" };
        _mockRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(user);

        var result = await _service.GetByIdAsync(id);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Id.Should().Be(id);
        result.Value.Username.Should().Be("alex");
    }

    [Fact]
    public async Task GetByIdAsync_WhenUserDoesNotExist_ShouldReturnNotFoundError()
    {
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((User?)null);

        var result = await _service.GetByIdAsync(Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(ServiceError.NotFound);
    }

    [Fact]
    public async Task GetByIdAsync_WhenSubscriptionIsActive_ShouldReturnIsSubscriptionActiveTrue()
    {
        var id   = Guid.NewGuid();
        var user = new User { Id = id, IsPaid = true, SubscriptionExpiresAt = DateTime.UtcNow.AddDays(30) };
        _mockRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(user);

        var result = await _service.GetByIdAsync(id);

        result.Value!.IsSubscriptionActive.Should().BeTrue();
    }

    [Fact]
    public async Task GetByIdAsync_WhenSubscriptionIsExpired_ShouldReturnIsSubscriptionActiveFalse()
    {
        var id   = Guid.NewGuid();
        var user = new User { Id = id, IsPaid = true, SubscriptionExpiresAt = DateTime.UtcNow.AddDays(-1) };
        _mockRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(user);

        var result = await _service.GetByIdAsync(id);

        result.Value!.IsSubscriptionActive.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateAsync_WhenUserExists_ShouldPersistChangesAndReturnUpdatedDto()
    {
        var id     = Guid.NewGuid();
        var expiry = DateTime.UtcNow.AddYears(1);
        var user   = new User { Id = id, Username = "oldname", IsPaid = false };

        _mockRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(user);
        _mockRepo.Setup(r => r.UpdateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);

        var dto = new UpdateUserDto { Username = "newname", IsPaid = true, SubscriptionExpiresAt = expiry };

        var result = await _service.UpdateAsync(id, dto);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Username.Should().Be("newname");
        result.Value.IsPaid.Should().BeTrue();
        _mockRepo.Verify(r => r.UpdateAsync(
            It.Is<User>(u => u.Username == "newname" && u.IsPaid && u.SubscriptionExpiresAt == expiry)),
            Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenUserDoesNotExist_ShouldReturnNotFoundError()
    {
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((User?)null);

        var result = await _service.UpdateAsync(Guid.NewGuid(), new UpdateUserDto());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(ServiceError.NotFound);
    }

    [Fact]
    public async Task DeleteAsync_WhenUserExists_ShouldReturnSuccess()
    {
        var id   = Guid.NewGuid();
        var user = new User { Id = id };
        _mockRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(user);
        _mockRepo.Setup(r => r.DeleteAsync(id)).Returns(Task.CompletedTask);

        var result = await _service.DeleteAsync(id);

        result.IsSuccess.Should().BeTrue();
        _mockRepo.Verify(r => r.DeleteAsync(id), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenUserDoesNotExist_ShouldReturnNotFoundError()
    {
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((User?)null);

        var result = await _service.DeleteAsync(Guid.NewGuid());

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(ServiceError.NotFound);
        _mockRepo.Verify(r => r.DeleteAsync(It.IsAny<Guid>()), Times.Never);
    }
}
