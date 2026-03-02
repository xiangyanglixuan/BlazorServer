using PlantFactory.Components.Data;
using PlantFactory.Components.Models;
using System.Data;

namespace PlantFactory.Components.Services
{
    public class InBoundService
    {
        private readonly SqlHelper _sqlHelper;

        public InBoundService(SqlHelper sqlHelper)
        {
            _sqlHelper = sqlHelper;
        }

        public async Task<List<InoutBounds>> GetAllBoundAsync()
        {
            var bounds = new List<InoutBounds>();

            var sql = "SELECT * FROM InoutBound";
            var dt = _sqlHelper.ExecuteQuery(sql);
            foreach (DataRow row in dt.Rows)
            {
                bounds.Add(new InoutBounds
                {
                    Id = Convert.ToInt32(row["Id"]),
                    PlantName = row["PlantName"].ToString(),
                    NumberofPiles = row["NumberofPiles"].ToString(),
                    NumofColumns = row["NumofColumns"].ToString(),
                    InboundTime = Convert.ToDateTime(row["InboundTime"])
                });
            }
            return bounds;
        }

        public async Task<int> AddBoundAsync(InoutBounds bound)
        {
            var parameters = new Dictionary<string, object>
            {
                { "PlantName", bound.PlantName },
                { "NumberofPiles", bound.NumberofPiles },
                { "NumofColumns", bound.NumofColumns },
                { "InboundTime", bound.InboundTime }
            };
            var sql = @"INSERT INTO InoutBound (PlantName, NumberofPiles, NumofColumns, InboundTime) 
                       VALUES (@PlantName, @NumberofPiles, @NumofColumns, @InboundTime);
                       SELECT SCOPE_IDENTITY();";
            var result = _sqlHelper.ExecuteScalar(sql, parameters);
            return Convert.ToInt32(result);
        }

        public async Task<bool> UpdateBoundAsync(InoutBounds bound)
        {
            var parameters = new Dictionary<string, object>
            {
                { "Id", bound.Id },
                { "PlantName", bound.PlantName },
                { "NumberofPiles", bound.NumberofPiles },
                { "NumofColumns", bound.NumofColumns },
                { "InboundTime", bound.InboundTime }
            };
            var sql = @"UPDATE InoutBounds 
                        SET PlantName = @PlantName, 
                            NumberofPiles = @NumberofPiles, 
                            NumofColumns = @NumofColumns, 
                            InboundTime = @InboundTime 
                        WHERE Id = @Id";
            var rowsAffected = _sqlHelper.ExecuteNonQuery(sql, parameters);
            return rowsAffected > 0;
        }
    }
}