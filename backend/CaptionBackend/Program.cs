using System.Text;
using CaptionBackend.Data;
using CaptionBackend.Hubs;
using CaptionBackend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicyName = "FrontendCors";
const string JwtSectionName = "Jwt";

// Add CORS - Critical for React to connect
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicyName, policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174"
            ) // frontend origins
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSignalR();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- JWT Auth (no endpoints protected yet; will add [Authorize] next step) ---
builder.Services.AddAuthorization();

var jwtSection = builder.Configuration.GetSection(JwtSectionName);
var issuer = jwtSection["Issuer"];
var audience = jwtSection["Audience"];
var signingKey = jwtSection["SigningKey"];

// Do not hard-fail startup if JWT config isn't present yet.
// We’ll throw once an [Authorize] endpoint is hit (or you add validation later).
// This keeps the app runnable while we implement auth endpoints progressively.
if (string.IsNullOrWhiteSpace(issuer) ||
    string.IsNullOrWhiteSpace(audience) ||
    string.IsNullOrWhiteSpace(signingKey))
{
    // Placeholder symmetric key/config for dev runtime; replace via appsettings once auth endpoints are implemented.
    issuer = issuer ?? "dev-issuer";
    audience = audience ?? "dev-audience";
    signingKey = signingKey ?? "dev_signing_key_change_me_to_long_random_secret";
}

var keyBytes = Encoding.UTF8.GetBytes(signingKey);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; // local dev
        options.SaveToken = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,

            ValidateAudience = true,
            ValidAudience = audience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

var connectionString = builder.Configuration.GetConnectionString("CaptionDatabase")
    ?? throw new InvalidOperationException("Connection string 'CaptionDatabase' is not configured.");

builder.Services.AddDbContext<CaptionDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

builder.Services.AddScoped<CaptionService>();
builder.Services.Configure<WhisperOptions>(builder.Configuration.GetSection("Whisper"));

// Register WhisperClient with a typed HttpClient
builder.Services.AddHttpClient<WhisperClient>((serviceProvider, client) =>
{
    var options = serviceProvider.GetRequiredService<IOptions<WhisperOptions>>().Value;
    client.BaseAddress = new Uri(options.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(Math.Clamp(options.TimeoutSeconds, 1, 300));
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(FrontendCorsPolicyName);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<CaptionHub>("/captionHub");

app.Run();

