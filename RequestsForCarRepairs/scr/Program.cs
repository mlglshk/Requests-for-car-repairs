using Microsoft.EntityFrameworkCore;
using RequestsForCarRepairs.API.Data;
using System.Diagnostics;

try
{
    // Эта строка решает проблему с датами
    AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

    var builder = WebApplication.CreateBuilder(args);

    builder.Services.AddControllers();
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        });
    });

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql("Host=localhost;Port=5433;Database=ISRPO;Username=postgres;Password=12345"));

    var app = builder.Build();

    app.UseCors("AllowAll");
    app.MapControllers();
    app.UseDefaultFiles();
    app.UseStaticFiles();

    app.MapGet("/", async context =>
    {
        context.Response.Redirect("/authorization.html");
    });

    string url = "https://localhost:10001";
    Console.WriteLine($"🚀 Запуск на {url}");

    var serverTask = Task.Run(() => app.Run(url));

    await Task.Delay(2000);

    try
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = url,
            UseShellExecute = true
        });
        Console.WriteLine("✅ Браузер открыт автоматически");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Не удалось открыть браузер: {ex.Message}");
        Console.WriteLine($"👉 Откройте вручную: {url}/authorization.html");
    }

    await serverTask;
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Ошибка: {ex.Message}");
    Console.ReadLine();
}