using BlazorServer.Models;

namespace BlazorServer.Services;

public class AlarmService
{
    private static readonly string[] StatusTexts = ["", "断电", "故障", "堵货", "超时故障", "运行", "停止"];

    public (List<AlarmRecord> Records, int Total) GetPaged(int page, int pageSize, string? search = null)
    {
        // 假数据, 后续接入 DB
        var all = new List<AlarmRecord>();
        for (int i = 1; i <= 35; i++)
        {
            all.Add(new AlarmRecord
            {
                Id = i,
                DeviceNumber = $"HK{i:D2}",
                FaultDetail = $"HK{i:D2}" + StatusTexts[i % 4 + 1],
                DeviceStatus = i % 4 + 1,
                StatusText = StatusTexts[i % 4 + 1],
                IsRecovered = i % 3 == 0,
                AlarmTime = DateTime.Now.AddMinutes(-i * 10),
                RecoveryTime = i % 3 == 0 ? DateTime.Now.AddMinutes(-i * 5) : null
            });
        }

        if (!string.IsNullOrWhiteSpace(search))
            all = all.Where(r => r.DeviceNumber.Contains(search, StringComparison.OrdinalIgnoreCase)
                || r.FaultDetail.Contains(search, StringComparison.OrdinalIgnoreCase)).ToList();

        var total = all.Count;
        var records = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return (records, total);
    }
}
