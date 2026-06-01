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

// Register WhisperClient with a typed HttpClient
builder.Services.AddHttpClient<WhisperClient>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(180);
});
builder.Services.AddHttpClient("MediaImport", client =>
{
    client.Timeout = TimeSpan.FromSeconds(120);
});

var app = builder.Build();

app.UseCors();
app.MapControllers();
app.UseWebSockets();
app.MapHub<CaptionHub>("/captionHub");

app.Run();
