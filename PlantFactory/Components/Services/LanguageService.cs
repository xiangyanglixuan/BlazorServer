using Microsoft.JSInterop;
using System.Globalization;
using System.Resources;
using PlantFactory.Resources;

namespace PlantFactory.Components.Services;

public class LanguageService
{
    private static readonly ResourceManager _resources = new(typeof(AppStrings));

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
        try
        {
            var culture = _currentLanguage == "en"
                ? CultureInfo.GetCultureInfo("en")
                : CultureInfo.GetCultureInfo("zh-CN");
            return _resources.GetString(key, culture) ?? key;
        }
        catch
        {
            return key;
        }
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
