using StrettorAPI.Common;
using StrettorAPI.DTOs;
using StrettorAPI.Models;
using StrettorAPI.Repositories;

namespace StrettorAPI.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _users;

    public UserService(IUserRepository users)
    {
        _users = users;
    }

    public async Task<ServiceResult<UserResponseDto>> RegisterAsync(UserRegisterDto dto)
    {
        var existing = await _users.GetByEmailAsync(dto.Email);
        if (existing is not null)
            return ServiceResult<UserResponseDto>.Fail(
                ServiceError.DuplicateEmail,
                $"A user with email '{dto.Email}' is already registered.");

        var user = new User
        {
            Username     = dto.Username,
            Email        = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        await _users.AddAsync(user);
        return ServiceResult<UserResponseDto>.Ok(ToResponse(user));
    }

    public async Task<ServiceResult<UserResponseDto>> LoginAsync(UserLoginDto dto)
    {
        var user = await _users.GetByEmailAsync(dto.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return ServiceResult<UserResponseDto>.Fail(
                ServiceError.InvalidCredentials,
                "Invalid email or password.");

        return ServiceResult<UserResponseDto>.Ok(ToResponse(user));
    }

    public async Task<ServiceResult<UserResponseDto>> GetByIdAsync(Guid id)
    {
        var user = await _users.GetByIdAsync(id);
        if (user is null)
            return ServiceResult<UserResponseDto>.Fail(ServiceError.NotFound, $"User '{id}' not found.");

        return ServiceResult<UserResponseDto>.Ok(ToResponse(user));
    }

    public async Task<ServiceResult<IEnumerable<UserResponseDto>>> GetAllAsync()
    {
        var users = await _users.GetAllAsync();
        return ServiceResult<IEnumerable<UserResponseDto>>.Ok(users.Select(ToResponse));
    }

    public async Task<ServiceResult<UserResponseDto>> UpdateAsync(Guid id, UpdateUserDto dto)
    {
        var user = await _users.GetByIdAsync(id);
        if (user is null)
            return ServiceResult<UserResponseDto>.Fail(ServiceError.NotFound, $"User '{id}' not found.");

        if (dto.Username is not null)
            user.Username = dto.Username;

        if (dto.IsPaid.HasValue)
            user.IsPaid = dto.IsPaid.Value;

        if (dto.SubscriptionExpiresAt.HasValue)
            user.SubscriptionExpiresAt = dto.SubscriptionExpiresAt.Value;

        await _users.UpdateAsync(user);
        return ServiceResult<UserResponseDto>.Ok(ToResponse(user));
    }

    public async Task<ServiceResult> DeleteAsync(Guid id)
    {
        var user = await _users.GetByIdAsync(id);
        if (user is null)
            return ServiceResult.Fail(ServiceError.NotFound, $"User '{id}' not found.");

        await _users.DeleteAsync(id);
        return ServiceResult.Ok();
    }

    private static UserResponseDto ToResponse(User user) => new()
    {
        Id                   = user.Id,
        Username             = user.Username,
        Email                = user.Email,
        IsPaid               = user.IsPaid,
        IsSubscriptionActive = user.IsSubscriptionActive
    };
}
