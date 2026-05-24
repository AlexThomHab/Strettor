using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using StrettorAPI.Common;
using StrettorAPI.Controllers;
using StrettorAPI.DTOs;
using StrettorAPI.Services;
using Xunit;

namespace StrettorTests.Controllers;

public class UsersControllerTests
{
    private readonly Mock<IUserService> _mockService;
    private readonly UsersController _controller;

    public UsersControllerTests()
    {
        _mockService = new Mock<IUserService>();
        _controller  = new UsersController(_mockService.Object);
    }

    [Fact]
    public async Task GetAll_ShouldReturn200OkWithAllUsers()
    {
        var users = new List<UserResponseDto>
        {
            new() { Id = Guid.NewGuid(), Username = "alice", Email = "alice@test.com" },
            new() { Id = Guid.NewGuid(), Username = "bob",   Email = "bob@test.com"   }
        };
        _mockService
            .Setup(s => s.GetAllAsync())
            .ReturnsAsync(ServiceResult<IEnumerable<UserResponseDto>>.Ok(users));

        var result = await _controller.GetAll();

        result.Should().BeOfType<OkObjectResult>();
        var body = (IEnumerable<UserResponseDto>)((OkObjectResult)result).Value!;
        body.Should().HaveCount(2);
        body.Select(u => u.Username).Should().BeEquivalentTo("alice", "bob");
    }

    [Fact]
    public async Task GetById_WhenUserExists_ShouldReturn200OkWithCorrectData()
    {
        var id  = Guid.NewGuid();
        var dto = new UserResponseDto { Id = id, Username = "alex", Email = "alex@test.com", IsSubscriptionActive = true };
        _mockService
            .Setup(s => s.GetByIdAsync(id))
            .ReturnsAsync(ServiceResult<UserResponseDto>.Ok(dto));

        var result = await _controller.GetById(id);

        result.Should().BeOfType<OkObjectResult>();
        var body = (UserResponseDto)((OkObjectResult)result).Value!;
        body.Id.Should().Be(id);
        body.IsSubscriptionActive.Should().BeTrue();
    }

    [Fact]
    public async Task GetById_WhenUserDoesNotExist_ShouldReturn404NotFound()
    {
        _mockService
            .Setup(s => s.GetByIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync(ServiceResult<UserResponseDto>.Fail(ServiceError.NotFound, "User not found."));

        var result = await _controller.GetById(Guid.NewGuid());

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Update_WhenUserExists_ShouldReturn200OkWithUpdatedData()
    {
        var id      = Guid.NewGuid();
        var dto     = new UpdateUserDto { Username = "newname", IsPaid = true };
        var updated = new UserResponseDto { Id = id, Username = "newname", IsPaid = true };
        _mockService
            .Setup(s => s.UpdateAsync(id, dto))
            .ReturnsAsync(ServiceResult<UserResponseDto>.Ok(updated));

        var result = await _controller.Update(id, dto);

        result.Should().BeOfType<OkObjectResult>();
        var body = (UserResponseDto)((OkObjectResult)result).Value!;
        body.Username.Should().Be("newname");
        body.IsPaid.Should().BeTrue();
    }

    [Fact]
    public async Task Update_WhenUserDoesNotExist_ShouldReturn404NotFound()
    {
        _mockService
            .Setup(s => s.UpdateAsync(It.IsAny<Guid>(), It.IsAny<UpdateUserDto>()))
            .ReturnsAsync(ServiceResult<UserResponseDto>.Fail(ServiceError.NotFound, "User not found."));

        var result = await _controller.Update(Guid.NewGuid(), new UpdateUserDto());

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Delete_WhenUserExists_ShouldReturn204NoContent()
    {
        var id = Guid.NewGuid();
        _mockService
            .Setup(s => s.DeleteAsync(id))
            .ReturnsAsync(ServiceResult.Ok());

        var result = await _controller.Delete(id);

        result.Should().BeOfType<NoContentResult>();
        ((NoContentResult)result).StatusCode.Should().Be(204);
    }

    [Fact]
    public async Task Delete_WhenUserDoesNotExist_ShouldReturn404NotFound()
    {
        _mockService
            .Setup(s => s.DeleteAsync(It.IsAny<Guid>()))
            .ReturnsAsync(ServiceResult.Fail(ServiceError.NotFound, "User not found."));

        var result = await _controller.Delete(Guid.NewGuid());

        result.Should().BeOfType<NotFoundObjectResult>();
    }
}
