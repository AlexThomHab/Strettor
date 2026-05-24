using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;
using StrettorAPI.Configuration;
using StrettorAPI.DTOs;
using StrettorAPI.Repositories;

namespace StrettorAPI.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IUserRepository _users;
    private readonly StripeSettings _stripe;

    public PaymentsController(IUserRepository users, IOptions<StripeSettings> stripeOptions)
    {
        _users  = users;
        _stripe = stripeOptions.Value;
    }

    // POST api/payments/create-checkout-session
    // Creates a Stripe Checkout Session for an annual subscription and returns
    // the hosted payment page URL.  The frontend should redirect the user there.
    //
    // NOTE: Once JWT auth is wired up, replace dto.UserId with the Guid from
    //       the authenticated user's claims so the client cannot spoof it.
    [HttpPost("create-checkout-session")]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutSessionDto dto)
    {
        var user = await _users.GetByIdAsync(dto.UserId);
        if (user is null)
            return NotFound(new { message = "User not found." });

        var options = new SessionCreateOptions
        {
            Mode = "subscription",
            LineItems =
            [
                new SessionLineItemOptions
                {
                    Price    = _stripe.AnnualPriceId,
                    Quantity = 1
                }
            ],
            // ClientReferenceId lets us map the completed session back to our
            // internal user when the webhook fires.
            ClientReferenceId = dto.UserId.ToString(),
            SuccessUrl        = _stripe.SuccessUrl,
            CancelUrl         = _stripe.CancelUrl
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);

        return Ok(new { url = session.Url });
    }

    // POST api/payments/webhook
    // Receives asynchronous lifecycle events from Stripe.
    //
    // [AllowAnonymous]  — Stripe calls this without any auth token.
    // [IgnoreAntiforgeryToken] — Not needed for ApiController, but explicit for
    //                            clarity if antiforgery middleware is ever added.
    //
    // IMPORTANT: Do NOT add [FromBody] — we must read the raw bytes ourselves
    //            so we can pass them to ConstructEvent for signature validation.
    //            ASP.NET Core does not pre-consume the body for endpoints that
    //            don't declare a body parameter.
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook()
    {
        string json;
        using (var reader = new StreamReader(Request.Body))
        {
            json = await reader.ReadToEndAsync();
        }

        var stripeSignature = Request.Headers["Stripe-Signature"].ToString();

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(
                json,
                stripeSignature,
                _stripe.WebhookSecret,
                throwOnApiVersionMismatch: false);
        }
        catch (StripeException ex)
        {
            // Invalid signature — reject immediately so Stripe knows to retry.
            return BadRequest(new { message = ex.Message });
        }

        switch (stripeEvent.Type)
        {
            case "checkout.session.completed":
                await HandleCheckoutCompleted(stripeEvent);
                break;

            case "invoice.paid":
                await HandleInvoicePaid(stripeEvent);
                break;

            case "customer.subscription.deleted":
                await HandleSubscriptionDeleted(stripeEvent);
                break;

            // Return 200 for all other event types — Stripe expects a 2xx to
            // acknowledge receipt even for events we choose not to act on.
        }

        return Ok();
    }

    // checkout.session.completed fires once when the user finishes payment.
    // This is the first time we learn the Stripe customer ID, so we store it
    // on the user record so future invoice events can be resolved.
    private async Task HandleCheckoutCompleted(Event stripeEvent)
    {
        if (stripeEvent.Data.Object is not Session session)
            return;

        if (!Guid.TryParse(session.ClientReferenceId, out var userId))
            return;

        var user = await _users.GetByIdAsync(userId);
        if (user is null)
            return;

        user.IsPaid                 = true;
        user.SubscriptionExpiresAt  = DateTime.UtcNow.AddYears(1);
        user.StripeCustomerId       = session.CustomerId;

        await _users.UpdateAsync(user);
    }

    // invoice.paid fires on every successful renewal charge.
    // We look the user up by their stored Stripe customer ID and push the
    // expiry forward another year.
    private async Task HandleInvoicePaid(Event stripeEvent)
    {
        if (stripeEvent.Data.Object is not Invoice invoice)
            return;

        var user = await _users.GetByStripeCustomerIdAsync(invoice.CustomerId);
        if (user is null)
            return;

        user.IsPaid                = true;
        user.SubscriptionExpiresAt = DateTime.UtcNow.AddYears(1);

        await _users.UpdateAsync(user);
    }

    // customer.subscription.deleted fires when the subscription is cancelled
    // (either immediately or at the end of the billing period, depending on
    // the Stripe settings).  We expire the subscription right away here;
    // adjust if you want to honour the paid-through date instead.
    private async Task HandleSubscriptionDeleted(Event stripeEvent)
    {
        if (stripeEvent.Data.Object is not Subscription subscription)
            return;

        var user = await _users.GetByStripeCustomerIdAsync(subscription.CustomerId);
        if (user is null)
            return;

        user.IsPaid                = false;
        user.SubscriptionExpiresAt = DateTime.UtcNow;

        await _users.UpdateAsync(user);
    }
}
