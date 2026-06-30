using BlazorServer.Models;
using Comm450.Profinet.Siemens;
using Microsoft.Extensions.Options;

namespace BlazorServer.Services
{
    public class PlcBackgroundService : BackgroundService
    {
        private readonly ILogger<PlcBackgroundService> _logger;
        private readonly Dictionary<string, LineConfig> _lines;
        private readonly Dictionary<string, SiemensS7Net> _plcClients = new();

        public Dictionary<string, int[]> LatestStatus { get; } = new();
        public DateTime LastReadTime { get; private set; }
        public bool IsConnected { get; private set; }

        public PlcBackgroundService(IOptions<PlcConfig> config, ILogger<PlcBackgroundService> logger)
        {
            _logger = logger;
            _lines = config.Value.Lines;

            foreach (var (name, line) in _lines)
            {
                if (!_plcClients.ContainsKey(line.IpAddress))
                    _plcClients[line.IpAddress] = new SiemensS7Net(SiemensPLCS.S1500, line.IpAddress);

                LatestStatus[name] = Array.Empty<int>();
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var allSuccess = true;

                    foreach (var (name, line) in _lines)
                    {
                        var plc = _plcClients[line.IpAddress];
                        var result = plc.ReadInt16(line.Address, line.Count);
                        if (result.IsSuccess)
                        {
                            LatestStatus[name] = result.Content.Select(v => (int)v).ToArray();
                            _logger.LogInformation("{Name} 最新状态: {Status}", name, LatestStatus[name]);
                        }
                        else
                        {
                            allSuccess = false;
                            _logger.LogWarning("{Name} ({Ip}) 读取失败: {Msg}", name, line.IpAddress, result.Message);
                        }
                    }

                    IsConnected = allSuccess;
                    LastReadTime = DateTime.Now;
                }
                catch (Exception ex)
                {
                    IsConnected = false;
                    _logger.LogError(ex, "PLC 读取异常");
                }

                await Task.Delay(5000, stoppingToken);
            }
        }
    }
}
