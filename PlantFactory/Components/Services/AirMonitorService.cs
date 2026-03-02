using PlantFactory.Components.Data;
using PlantFactory.Components.Models;
using System.Data;

namespace PlantFactory.Components.Services
{
    public class AirMonitorService
    {
        private readonly SqlHelper _sqlHelper;
        public AirMonitorService(SqlHelper sqlHelper)
        {
            _sqlHelper = sqlHelper;
        }
        public async Task<List<AirMonitor>> GetAllAirMonitorsAsync()
        {
            var monitors = new List<AirMonitor>();
            var sql = "SELECT * FROM AirMonitor";
            var dt = _sqlHelper.ExecuteQuery(sql);
            foreach (DataRow row in dt.Rows)
            {
                monitors.Add(new AirMonitor
                {
                    Id = Convert.ToInt32(row["Id"]),
                    Temperature = Convert.ToDecimal(row["Temperature"]),
                    Humidity = Convert.ToDecimal(row["Humidity"]),
                    CO2Level = Convert.ToDecimal(row["CO2Level"]),
                    LightIntensity = row["LightIntensity"].ToString()
                });
            }
            return monitors;
        }
    }
}
