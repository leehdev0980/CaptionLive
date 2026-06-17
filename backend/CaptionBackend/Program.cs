using CaptionBackend.Hubs;
using CaptionBackend.Services;

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

/*
 * Increase request size + multipart limits to support large audio uploads.
 * Note: avoid compile-time references to IIS-specific types (can break builds on different target frameworks/runtimes).
 */
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    // Allow large files in multipart/form-data
    options.MultipartBodyLengthLimit = long.MaxValue;
});

// Register WhisperClient with a typed HttpClient
builder.Services.AddHttpClient<WhisperClient>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(180);
});
builder.Services.AddHttpClient("MediaImport", client =>
{
    client.Timeout = TimeSpan.FromSeconds(120);
});

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    // Keep connections alive for long transcription requests
    serverOptions.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(5);

    // Allow very large request bodies (e.g., >50MB uploads)
    serverOptions.Limits.MaxRequestBodySize = long.MaxValue;
});

var app = builder.Build();

app.UseCors();
app.MapControllers();
app.UseWebSockets();
app.MapHub<CaptionHub>("/captionHub");

app.Run();
