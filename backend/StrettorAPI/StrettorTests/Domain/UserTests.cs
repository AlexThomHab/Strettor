using FluentAssertions;
using StrettorAPI.Models;
using Xunit;

namespace StrettorTests.Domain;

public class UserTests
{
    [Fact]
    public void IsSubscriptionActive_WhenIsPaidAndExpiryInFuture_ShouldReturnTrue()
    {
        var user = new User
        {
            IsPaid = true,
            SubscriptionExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        var result = user.IsSubscriptionActive;

        result.Should().BeTrue();
    }

    [Fact]
    public void IsSubscriptionActive_WhenIsPaidButExpiryInPast_ShouldReturnFalse()
    {
        var user = new User
        {
            IsPaid = true,
            SubscriptionExpiresAt = DateTime.UtcNow.AddDays(-1)
        };

        var result = user.IsSubscriptionActive;

        result.Should().BeFalse();
    }

    [Fact]
    public void IsSubscriptionActive_WhenNotPaid_ShouldReturnFalse()
    {
        var user = new User
        {
            IsPaid = false,
            SubscriptionExpiresAt = DateTime.UtcNow.AddYears(1) // future date - doesn't matter
        };

        var result = user.IsSubscriptionActive;

        result.Should().BeFalse();
    }

    [Fact]
    public void IsSubscriptionActive_WhenNotPaidAndNoExpirySet_ShouldReturnFalse()
    {
        var user = new User
        {
            IsPaid = false,
            SubscriptionExpiresAt = null
        };

        var result = user.IsSubscriptionActive;

        result.Should().BeFalse();
    }

    [Fact]
    public void NewUser_ShouldHaveUniqueId()
    {
        var userA = new User();
        var userB = new User();

        userA.Id.Should().NotBe(userB.Id);
        userA.Id.Should().NotBeEmpty();
    }

    [Fact]
    public void NewUser_ShouldNotBeSubscribedByDefault()
    {
        var user = new User();

        user.IsPaid.Should().BeFalse();
        user.SubscriptionExpiresAt.Should().BeNull();
        user.IsSubscriptionActive.Should().BeFalse();
    }
}
