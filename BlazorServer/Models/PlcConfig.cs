namespace BlazorServer.Models
{
    public class PlcConfig
    {
        public Dictionary<string, LineConfig> Lines { get; set; } = new();
    }

    public class LineConfig
    {
        public string IpAddress { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public ushort Count { get; set; }
    }
}
