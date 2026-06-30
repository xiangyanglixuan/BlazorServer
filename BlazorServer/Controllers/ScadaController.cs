using BlazorServer.Services;
using Microsoft.AspNetCore.Mvc;

namespace BlazorServer.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ScadaController : ControllerBase
    {
        private readonly PlcBackgroundService _plcService;

        public ScadaController(PlcBackgroundService plcService)
        {
            _plcService = plcService;
        }

        [HttpGet("status/{lineName}")]
        public IActionResult GetStatus(string lineName)
        {
            if (!_plcService.LatestStatus.TryGetValue(lineName.ToUpper(), out var data))
                return NotFound(new { message = $"线体 '{lineName}' 不存在" });

            return Ok(new
            {
                lineName = lineName.ToUpper(),
                lastReadTime = _plcService.LastReadTime,
                isConnected = _plcService.IsConnected,
                data
            });
        }

        [HttpGet("status")]
        public IActionResult GetAllStatus()
        {
            return Ok(new
            {
                lastReadTime = _plcService.LastReadTime,
                isConnected = _plcService.IsConnected,
                lines = _plcService.LatestStatus
            });
        }
    }
}
