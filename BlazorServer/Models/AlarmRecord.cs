namespace BlazorServer.Models;

public class AlarmRecord
{
    public int Id { get; set; }
    public string DeviceNumber { get; set; } = string.Empty;
    public string FaultDetail { get; set; } = string.Empty;
    public int DeviceStatus { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public bool IsRecovered { get; set; }
    public DateTime AlarmTime { get; set; }
    public DateTime? RecoveryTime { get; set; }
}
