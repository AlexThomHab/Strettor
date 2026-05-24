namespace StrettorAPI.DTOs;

public class UpdateUserDto
{
    public string? Username { get; set; }
    public bool? IsPaid { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
}
