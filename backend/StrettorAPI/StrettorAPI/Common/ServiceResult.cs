namespace StrettorAPI.Common;

public enum ServiceError
{
    None = 0,
    NotFound,
    DuplicateEmail,
    InvalidCredentials
}

// Non-generic variant for operations that produce no return value (e.g. Delete).
public record ServiceResult
{
    public bool IsSuccess { get; init; }
    public ServiceError Error { get; init; }
    public string? ErrorMessage { get; init; }

    public static ServiceResult Ok() =>
        new() { IsSuccess = true };

    public static ServiceResult Fail(ServiceError error, string message) =>
        new() { IsSuccess = false, Error = error, ErrorMessage = message };
}

// Generic variant for operations that return data on success.
public record ServiceResult<T>
{
    public bool IsSuccess { get; init; }
    public T? Value { get; init; }
    public ServiceError Error { get; init; }
    public string? ErrorMessage { get; init; }

    public static ServiceResult<T> Ok(T value) =>
        new() { IsSuccess = true, Value = value };

    public static ServiceResult<T> Fail(ServiceError error, string message) =>
        new() { IsSuccess = false, Error = error, ErrorMessage = message };
}
