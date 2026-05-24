using StrettorAPI.Common;
using StrettorAPI.DTOs;

namespace StrettorAPI.Services;

public interface IUserService
{
    Task<ServiceResult<UserResponseDto>> RegisterAsync(UserRegisterDto dto);
    Task<ServiceResult<UserResponseDto>> LoginAsync(UserLoginDto dto);
    Task<ServiceResult<UserResponseDto>> GetByIdAsync(Guid id);
    Task<ServiceResult<IEnumerable<UserResponseDto>>> GetAllAsync();
    Task<ServiceResult<UserResponseDto>> UpdateAsync(Guid id, UpdateUserDto dto);
    Task<ServiceResult> DeleteAsync(Guid id);
}
