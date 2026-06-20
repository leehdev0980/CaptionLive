using CaptionBackend.Hubs;
using CaptionBackend.Services;
using Polly;
using Polly.Extensions.Http;

var builder = WebApplication.CreateBuilder(args);

// Add CORS - Critical for React to connect
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(origin =>
              Uri.TryCreate(origin, UriKind.Absolute, out var uri)
              && (uri.Host == "localhost" || uri.Host == "127.0.0.1")
              && uri.Port >= 5173
              && uri.Port <= 5190)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSignalR();
builder.Services.AddControllers();

// Define a retry policy
var retryPolicy = HttpPolicyExtensions
    .HandleTransientHttpError() // Handles HttpRequestException, 5xx and 408 responses
    .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))); // Exponential backoff

// Register WhisperClient with a typed HttpClient and apply the retry policy
builder.Services.AddHttpClient<WhisperClient>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(180);
})
.AddPolicyHandler(retryPolicy);

builder.Services.AddHttpClient("MediaImport", client =>
{
    client.Timeout = TimeSpan.FromSeconds(120);
})
.AddPolicyHandler(retryPolicy); // Also apply to media imports

var app = builder.Build();

app.UseCors();
app.MapControllers();
app.UseWebSockets();
app.MapHub<CaptionHub>("/captionHub");

app.Run();
