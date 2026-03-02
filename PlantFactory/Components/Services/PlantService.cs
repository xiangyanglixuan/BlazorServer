using PlantFactory.Components.Data;
using PlantFactory.Components.Models;
using System.Data;

namespace PlantFactory.Components.Services
{
    public class PlantService
    {
        private readonly SqlHelper _sqlHelper;

        public PlantService(SqlHelper sqlHelper)
        {
            _sqlHelper = sqlHelper;
        }

        public async Task<List<Plants>> GetAllPlantsAsync()
        {
            var plants = new List<Plants>();

            var sql = "SELECT * FROM PlantCategory";
            var dt = _sqlHelper.ExecuteQuery(sql);

            foreach (DataRow row in dt.Rows)
            {
                plants.Add(new Plants
                {
                    Id = Convert.ToInt32(row["Id"]),
                    Name = row["Name"].ToString(),
                    Category = row["Category"].ToString(),
                    OptimalTemperature = Convert.ToDecimal(row["OptimalTemperature"]),
                    OptimalHumidity = Convert.ToDecimal(row["OptimalHumidity"]),
                    GrowthStage = row["GrowthStage"].ToString()
                });
            }

            return plants;
        }

        // 添加新植物
        public async Task<int> AddPlantAsync(Plants plant)
        {
            var parameters = new Dictionary<string, object>
            {
                { "Name", plant.Name },
                { "Category", plant.Category },
                { "OptimalTemperature", plant.OptimalTemperature },
                { "OptimalHumidity", plant.OptimalHumidity },
                { "GrowthStage", plant.GrowthStage }
            };

            var sql = @"INSERT INTO PlantCategory (Name, Category, OptimalTemperature, OptimalHumidity, GrowthStage) 
                       VALUES (@Name, @Category, @OptimalTemperature, @OptimalHumidity, @GrowthStage);
                       SELECT SCOPE_IDENTITY();";

            var result = _sqlHelper.ExecuteScalar(sql, parameters);
            return Convert.ToInt32(result);
        }

        // 更新植物信息
        public async Task<bool> UpdatePlantAsync(Plants plant)
        {
            var parameters = new Dictionary<string, object>
            {
                { "Id", plant.Id },
                { "Name", plant.Name },
                { "Category", plant.Category },
                { "OptimalTemperature", plant.OptimalTemperature },
                { "OptimalHumidity", plant.OptimalHumidity },
                { "GrowthStage", plant.GrowthStage }
            };

            var sql = @"UPDATE PlantCategory SET 
                       Name = @Name, 
                       Category = @Category, 
                       OptimalTemperature = @OptimalTemperature, 
                       OptimalHumidity = @OptimalHumidity, 
                       GrowthStage = @GrowthStage 
                       WHERE Id = @Id";

            var affectedRows = _sqlHelper.ExecuteNonQuery(sql, parameters);
            return affectedRows > 0;
        }

        // 删除植物
        public async Task<bool> DeletePlantAsync(int id)
        {
            var sql = "DELETE FROM PlantCategory WHERE Id = @Id";
            var parameters = new Dictionary<string, object> { { "Id", id } };

            var affectedRows = _sqlHelper.ExecuteNonQuery(sql, parameters);
            return affectedRows > 0;
        }
    }
}
