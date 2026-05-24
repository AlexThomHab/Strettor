using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using StrettorAPI.Common;
using StrettorAPI.Controllers;
using StrettorAPI.DTOs;
using StrettorAPI.Services;
using Xunit;

namespace StrettorTests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IUserService> _mockService;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mockService = new Mock<IUserService>();
        _controller  = new AuthController(_mockService.Object);
    }

    [Fact]
    public async Task Register_WithValidInput_ShouldReturn201Created()
    {
        var dto = new UserResponseDto { Id = Guid.NewGuid(), Username = "alex", Email = "alex@test.com" };
        _mockService
            .Setup(s => s.RegisterAsync(It.IsAny<UserRegisterDto>()))
            .ReturnsAsync(ServiceResult<UserResponseDto>.Ok(dto));

        var result = await _controller.Register(new UserRegisterDto());

        result.Should().BeOfType<CreatedAtActionResult>();
        ((CreatedAtActionResult)result).StatusCode.Should().Be(201);
    }

    [Fact]
    public async Task Register_WithValidInput_ShouldReturnCorrectResponseDto()
    {
        var dto = new UserResponseDto { Id = Guid.NewGuid(), Username = "alex", Email = "alex@test.com" };
        _mockService
            .Setup(s => s.RegisterAsync(It.IsAny<UserRegisterDto>()))
            .ReturnsAsync(ServiceResult<UserResponseDto>.Ok(dto));

        var result = await _controller.Register(new UserRegisterDto());

        var body = (UserResponseDto)((CreatedAtActionResult)result).Value!;
        body.Username.Should().Be("alex");
        body.Email.Should().Be("alex@test.com");
    }

    [Fact]
    public async Task Register_WhenServiceReturnsDuplicateEmailError_ShouldReturn409Conflict()
    {
        _mockService
            .Setup(s => s.RegisterAsync(It.IsAny<UserRegisterDto>()))
            .ReturnsAsync(ServiceResult<UserResponseDto>.Fail(
                ServiceError.DuplicateEmail, "A user with email 'taken@test.com' is already registered."));

        var result = await _controller.Register(new UserRegisterDto { Email = "taken@test.com" });

        result.Should().BeOfType<ConflictObjectResult>();
        ((ConflictObjectResult)result).StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturn200Ok()
    {
        var dto = new UserResponseDto { Id = Guid.NewGuid(), Username = "alex", Email = "alex@test.com" };
        _mockService
            .Setup(s => s.LoginAsync(It.IsAny<UserLoginDto>()))
            .ReturnsAsync(ServiceResult<UserResponseDto>.Ok(dto));

        var result = await _controller.Login(new UserLoginDto());

        result.Should().BeOfType<OkObjectResult>();
        ((OkObjectResult)result).StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnCorrectResponseDto()
    {
        var dto = new UserResponseDto { Id = Guid.NewGuid(), Username = "alex", Email = "alex@test.com" };
        _mockService
            .Setup(s => s.LoginAsync(It.IsAny<UserLoginDto>()))
            .ReturnsAsync(ServiceResult<UserResponseDto>.Ok(dto));

        var result = await _controller.Login(new UserLoginDto());

        var body = (UserResponseDto)((OkObjectResult)result).Value!;
        body.Email.Should().Be("alex@test.com");
        body.Username.Should().Be("alex");
    }

    [Fact]
    public async Task Login_WhenServiceReturnsInvalidCredentialsError_ShouldReturn401Unauthorized()
    {
        _mockService
            .Setup(s => s.LoginAsync(It.IsAny<UserLoginDto>()))
            .ReturnsAsync(ServiceResult<UserResponseDto>.Fail(
                ServiceError.InvalidCredentials, "Invalid email or password."));

        var result = await _controller.Login(new UserLoginDto());

        result.Should().BeOfType<UnauthorizedObjectResult>();
        ((UnauthorizedObjectResult)result).StatusCode.Should().Be(401);
    }
}
