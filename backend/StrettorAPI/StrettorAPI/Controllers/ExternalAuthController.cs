using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using StrettorAPI.DTOs;
using StrettorAPI.Models;
using StrettorAPI.Repositories;
using System.Security.Claims;

namespace StrettorAPI.Controllers;

//
// builder.Services
//     .AddAuthentication(options =>
//     {
//         options.DefaultScheme          = CookieAuthenticationDefaults.AuthenticationScheme;
//         options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
//     })
//     .AddCookie()
//     .AddGoogle(options =>
//     {
//         options.ClientId     = builder.Configuration["Authentication:Google:ClientId"]!;
//         options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
//         // CallbackPath defaults to /signin-google - the middleware handles the
//         // code exchange there, then redirects to RedirectUri set in ExternalLogin.
//     });
//
// app.UseAuthentication();   // must come before app.UseAuthorization()
// app.UseAuthorization();
//

[ApiController]
[Route("api/auth")]
public class ExternalAuthController : ControllerBase
{
    private readonly IUserRepository _users;

    public ExternalAuthController(IUserRepository users)
    {
        _users = users;
    }

    // GET api/auth/external-login/{provider}
    // Kicks off the OAuth2 redirect - provider must match a registered scheme
    // name, e.g. "Google" or "GitHub".
    [HttpGet("external-login/{provider}")]
    public IActionResult ExternalLogin(string provider)
    {
        var redirectUrl = Url.Action(nameof(ExternalCallback), "ExternalAuth");

        var properties = new AuthenticationProperties
        {
            RedirectUri = redirectUrl
        };

        // ChallengeResult tells the middleware to redirect the browser to the
        // provider's consent screen.  On success, the provider sends the browser
        // back to options.CallbackPath (/signin-google), the Google middleware
        // exchanges the code for tokens, signs the identity into the cookie
        // scheme, and then follows RedirectUri to our ExternalCallback action.
        return Challenge(properties, provider);
    }

    // GET api/auth/external-callback
    // Called after the OAuth middleware has already validated the provider
    // response and signed the user into the cookie scheme.
    [HttpGet("external-callback")]
    public async Task<IActionResult> ExternalCallback()
    {
        var result = await HttpContext.AuthenticateAsync(
            CookieAuthenticationDefaults.AuthenticationScheme);

        if (!result.Succeeded)
            return Unauthorized(new { message = "External authentication failed." });

        var email = result.Principal?.FindFirstValue(ClaimTypes.Email);

        // Some providers only expose a given name, not a formatted name.
        var name = result.Principal?.FindFirstValue(ClaimTypes.Name)
                ?? result.Principal?.FindFirstValue(ClaimTypes.GivenName);

        if (string.IsNullOrEmpty(email))
            return BadRequest(new { message = "The provider did not return an email address." });

        // Find or create the local account.
        var user = await _users.GetByEmailAsync(email);

        if (user is null)
        {
            user = new User
            {
                Username     = name ?? email.Split('@')[0],
                Email        = email,
                PasswordHash = string.Empty   // OAuth users have no local password
            };

            await _users.AddAsync(user);
        }

        // Clean up the transient external cookie - we no longer need it.
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        // TODO: once JWT is in place, mint a token here instead of returning
        //       the raw DTO (e.g. return Ok(new { token = jwtService.Issue(user) })).
        return Ok(ToResponse(user));
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
