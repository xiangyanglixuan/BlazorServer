using PlantFactory.Components;
using PlantFactory.Components.Data;
using PlantFactory.Components.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// 添加服务到容器
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();

// 注册 SqlHelper 和数据服务
builder.Services.AddSingleton<SqlHelper>();
builder.Services.AddScoped<PlantService>();
builder.Services.AddScoped<InBoundService>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
