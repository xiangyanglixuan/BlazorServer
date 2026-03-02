namespace PlantFactory.Components.Models
{
    public class AirMonitor
    {
        public int Id { get; set; }
        public decimal Temperature { get; set; }  //温度
        public decimal Humidity { get; set; }   //湿度
        public decimal CO2Level { get; set; }  //二氧化碳浓度
        public string LightIntensity { get; set; }  //光照强度
    }
}
