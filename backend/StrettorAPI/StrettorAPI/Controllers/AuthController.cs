using Microsoft.AspNetCore.Mvc;
using StrettorAPI.Common;
using StrettorAPI.DTOs;
using StrettorAPI.Services;

namespace StrettorAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _service;

    public AuthController(IUserService service)
    {
        _service = service;
    }

    // POST api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] UserRegisterDto dto)
    {
        var result = await _service.RegisterAsync(dto);

        if (!result.IsSuccess)
            return result.Error switch
            {
                ServiceError.DuplicateEmail => Conflict(new { message = result.ErrorMessage }),
                _                           => BadRequest(new { message = result.ErrorMessage })
            };

        return CreatedAtAction(nameof(UsersController.GetById), "Users",
            new { id = result.Value!.Id }, result.Value);
    }

    // POST api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserLoginDto dto)
    {
        var result = await _service.LoginAsync(dto);

        if (!result.IsSuccess)
            return result.Error switch
            {
                ServiceError.InvalidCredentials => Unauthorized(new { message = result.ErrorMessage }),
                _                               => BadRequest(new { message = result.ErrorMessage })
            };

        return Ok(result.Value);
    }
}
