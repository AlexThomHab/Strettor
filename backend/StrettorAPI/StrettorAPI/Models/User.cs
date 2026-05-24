namespace StrettorAPI.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsPaid { get; set; } = false;
    public DateTime? SubscriptionExpiresAt { get; set; }
    public string? StripeCustomerId { get; set; }

    public bool IsSubscriptionActive =>
        IsPaid && SubscriptionExpiresAt.HasValue && SubscriptionExpiresAt.Value > DateTime.UtcNow;
}
