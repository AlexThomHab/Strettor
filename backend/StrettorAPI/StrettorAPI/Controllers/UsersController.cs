using Microsoft.AspNetCore.Mvc;
using StrettorAPI.Common;
using StrettorAPI.DTOs;
using StrettorAPI.Services;

namespace StrettorAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;

    public UsersController(IUserService service)
    {
        _service = service;
    }

    // GET api/users
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result.Value);
    }

    // GET api/users/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);

        if (!result.IsSuccess)
            return result.Error switch
            {
                ServiceError.NotFound => NotFound(new { message = result.ErrorMessage }),
                _                     => BadRequest(new { message = result.ErrorMessage })
            };

        return Ok(result.Value);
    }

    // PUT api/users/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);

        if (!result.IsSuccess)
            return result.Error switch
            {
                ServiceError.NotFound => NotFound(new { message = result.ErrorMessage }),
                _                     => BadRequest(new { message = result.ErrorMessage })
            };

        return Ok(result.Value);
    }

    // DELETE api/users/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _service.DeleteAsync(id);

        if (!result.IsSuccess)
            return result.Error switch
            {
                ServiceError.NotFound => NotFound(new { message = result.ErrorMessage }),
                _                     => BadRequest(new { message = result.ErrorMessage })
            };

        return NoContent();
    }
}
