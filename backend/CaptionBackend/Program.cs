using CaptionBackend.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add CORS - Critical for React to connect
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")  // React dev server
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
    client.Timeout = TimeSpan.FromSeconds(10);
});

var app = builder.Build();

app.UseCors();
app.MapControllers();
app.MapHub<CaptionHub>("/captionHub");

app.Run();