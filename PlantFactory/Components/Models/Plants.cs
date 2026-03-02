namespace PlantFactory.Components.Models
{
    public class Plants
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Category { get; set; }
        public decimal OptimalTemperature { get; set; }
        public decimal OptimalHumidity { get; set; }
        public string GrowthStage { get; set; }
    }
}
