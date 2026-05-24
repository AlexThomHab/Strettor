namespace StrettorAPI.DTOs;

public class UserResponseDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsPaid { get; set; }
    public bool IsSubscriptionActive { get; set; }
}
