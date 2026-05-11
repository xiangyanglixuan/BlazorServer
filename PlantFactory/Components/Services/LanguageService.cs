using Microsoft.JSInterop;
using System.Globalization;

namespace PlantFactory.Components.Services;

public class LanguageService
{
    private static readonly Dictionary<string, string> Zh = new()
    {
        // Layout
        ["AppName"] = "植物工厂系统",
        ["PageTitle"] = "植物工厂智能监控系统",
        ["UserCenter"] = "个人中心",
        ["Logout"] = "退出登录",
        ["Username"] = "用户名：",
        ["UserRole"] = "用户角色：",
        ["LoginTime"] = "登录时间：",
        ["Email"] = "电子邮箱：",
        ["Phone"] = "联系电话：",
        ["LastLoginIp"] = "最后登录IP：",
        ["EditProfile"] = "编辑资料",
        ["ChangePassword"] = "修改密码",
        ["Close"] = "关闭",
        ["RoleSuperAdmin"] = "超级管理员",
        ["RoleSystemAdmin"] = "系统管理员",
        ["RoleOperator"] = "操作员",
        ["RoleNormalUser"] = "普通用户",
        // NavMenu
        ["MenuLocationMonitor"] = "库位监测",
        ["MenuLocationStatus"] = "库位状态监测",
        ["MenuLocationAnalysis"] = "库位统计分析",
        ["MenuEnvMonitor"] = "环境监测",
        ["MenuAirMonitor"] = "空气参数监测",
        ["MenuNutrientMonitor"] = "营养液监测",
        ["MenuPlantCategory"] = "植物类别管理",
        ["MenuGrowthFormula"] = "植物生长配方管理",
        ["MenuWarehouse"] = "出入库管理",
        ["MenuInbound"] = "入库管理",
        ["MenuOutbound"] = "出库管理",
        ["MenuDevice"] = "设备管理",
        ["MenuAlarm"] = "设备报警管理",
        ["MenuDeviceStatus"] = "设备状态监控(SCADA)",
        ["MenuDataStats"] = "数据统计",
        // Login
        ["LoginTitle"] = "登录 - 植物工厂智能监控系统",
        ["PlantFactory"] = "植物工厂",
        ["SmartMonitor"] = "智能监控系统",
        ["WelcomeBack"] = "欢迎回来",
        ["PleaseLogin"] = "请登录您的账号",
        ["UsernameLabel"] = "用户名",
        ["UsernamePlaceholder"] = "请输入用户名",
        ["PasswordLabel"] = "密码",
        ["PasswordPlaceholder"] = "请输入密码",
        ["RememberPassword"] = "记住密码",
        ["ForgotPassword"] = "忘记密码？",
        ["LoginButton"] = "登录",
        ["LoggingIn"] = "登录中...",
        ["UsernameRequired"] = "请输入用户名",
        ["PasswordRequired"] = "请输入密码",
        ["LoginFailed"] = "用户名或密码错误",
        ["LoginError"] = "登录失败：",
        // Routes
        ["VerifyingLogin"] = "正在验证登录状态...",
        // TabBar
        ["TabHome"] = "首页",
        ["TabLocationStatus"] = "库位状态监测",
        ["TabLocationAnalysis"] = "库位统计分析",
        ["TabAirMonitor"] = "空气参数监测",
        ["TabNutrientMonitor"] = "营养液监测",
        ["TabPlantCategory"] = "植物类别管理",
        ["TabGrowthFormula"] = "植物生长配方管理",
        ["TabInbound"] = "入库管理",
        ["TabOutbound"] = "出库管理",
        ["TabAlarm"] = "设备报警管理",
        ["TabDeviceStatus"] = "设备状态监控",
        ["TabDataStats"] = "数据统计",
        ["TabMaxAlert"] = "最多只能打开{0}个标签页",
    };

    private static readonly Dictionary<string, string> En = new()
    {
        // Layout
        ["AppName"] = "Plant Factory System",
        ["PageTitle"] = "Plant Factory Intelligent Monitoring",
        ["UserCenter"] = "Personal Center",
        ["Logout"] = "Logout",
        ["Username"] = "Username:",
        ["UserRole"] = "User Role:",
        ["LoginTime"] = "Login Time:",
        ["Email"] = "Email:",
        ["Phone"] = "Phone:",
        ["LastLoginIp"] = "Last Login IP:",
        ["EditProfile"] = "Edit Profile",
        ["ChangePassword"] = "Change Password",
        ["Close"] = "Close",
        ["RoleSuperAdmin"] = "Super Admin",
        ["RoleSystemAdmin"] = "System Admin",
        ["RoleOperator"] = "Operator",
        ["RoleNormalUser"] = "Normal User",
        // NavMenu
        ["MenuLocationMonitor"] = "Location Monitor",
        ["MenuLocationStatus"] = "Location Status",
        ["MenuLocationAnalysis"] = "Location Analysis",
        ["MenuEnvMonitor"] = "Environment Monitor",
        ["MenuAirMonitor"] = "Air Parameters",
        ["MenuNutrientMonitor"] = "Nutrient Monitor",
        ["MenuPlantCategory"] = "Plant Categories",
        ["MenuGrowthFormula"] = "Growth Formulas",
        ["MenuWarehouse"] = "Inventory",
        ["MenuInbound"] = "Inbound",
        ["MenuOutbound"] = "Outbound",
        ["MenuDevice"] = "Devices",
        ["MenuAlarm"] = "Alarm Management",
        ["MenuDeviceStatus"] = "Device Status (SCADA)",
        ["MenuDataStats"] = "Data Statistics",
        // Login
        ["LoginTitle"] = "Login - Plant Factory Intelligent Monitoring System",
        ["PlantFactory"] = "Plant Factory",
        ["SmartMonitor"] = "Intelligent Monitoring System",
        ["WelcomeBack"] = "Welcome Back",
        ["PleaseLogin"] = "Please login to your account",
        ["UsernameLabel"] = "Username",
        ["UsernamePlaceholder"] = "Please enter username",
        ["PasswordLabel"] = "Password",
        ["PasswordPlaceholder"] = "Please enter password",
        ["RememberPassword"] = "Remember Password",
        ["ForgotPassword"] = "Forgot Password?",
        ["LoginButton"] = "Login",
        ["LoggingIn"] = "Logging in...",
        ["UsernameRequired"] = "Please enter username",
        ["PasswordRequired"] = "Please enter password",
        ["LoginFailed"] = "Invalid username or password",
        ["LoginError"] = "Login failed: ",
        // Routes
        ["VerifyingLogin"] = "Verifying login status...",
        // TabBar
        ["TabHome"] = "Home",
        ["TabLocationStatus"] = "Location Status",
        ["TabLocationAnalysis"] = "Location Analysis",
        ["TabAirMonitor"] = "Air Parameters",
        ["TabNutrientMonitor"] = "Nutrient Monitor",
        ["TabPlantCategory"] = "Plant Categories",
        ["TabGrowthFormula"] = "Growth Formulas",
        ["TabInbound"] = "Inbound",
        ["TabOutbound"] = "Outbound",
        ["TabAlarm"] = "Alarm Management",
        ["TabDeviceStatus"] = "Device Status",
        ["TabDataStats"] = "Data Statistics",
        ["TabMaxAlert"] = "Maximum {0} tabs allowed",
    };

    private string _currentLanguage = "zh";

    public string CurrentLanguage
    {
        get => _currentLanguage;
        set
        {
            if (_currentLanguage != value)
            {
                _currentLanguage = value;
                NotifyLanguageChanged();
            }
        }
    }

    public bool IsEnglish => _currentLanguage == "en";

    public event Action? OnLanguageChanged;

    public string T(string key)
    {
        var dict = _currentLanguage == "en" ? En : Zh;
        return dict.TryGetValue(key, out var value) ? value : key;
    }

    public string GetRoleName(string username)
    {
        return username.ToLower() switch
        {
            "admin" => T("RoleSuperAdmin"),
            "administrator" => T("RoleSuperAdmin"),
            "manager" => T("RoleSystemAdmin"),
            "operator" => T("RoleOperator"),
            "user" => T("RoleNormalUser"),
            _ => username
        };
    }

    public async Task LoadFromStorage(IJSRuntime js)
    {
        try
        {
            var lang = await js.InvokeAsync<string>("localStorage.getItem", "appLanguage");
            if (lang is "en" or "zh")
            {
                _currentLanguage = lang;
            }
        }
        catch
        {
            // ignore
        }
    }

    public async Task ToggleLanguage(IJSRuntime js)
    {
        _currentLanguage = _currentLanguage == "zh" ? "en" : "zh";
        try
        {
            await js.InvokeVoidAsync("localStorage.setItem", "appLanguage", _currentLanguage);
        }
        catch
        {
            // ignore
        }
        NotifyLanguageChanged();
    }

    private void NotifyLanguageChanged()
    {
        OnLanguageChanged?.Invoke();
    }
}
