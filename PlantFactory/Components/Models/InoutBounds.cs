namespace PlantFactory.Components.Models
{
    public class InoutBounds
    {
        public int Id { get; set; }
        public string PlantName { get; set; } //品名
        public string NumberofPiles { get; set; }   //层数
        public string NumofColumns { get; set; }   //列数
        public decimal NumofTrays { get; set; }  //托盘数
        public decimal Production { get; set; }  //产量
        public DateTime InboundTime { get; set; }  //入库时间
        public DateTime OutboundTime { get; set; }  //出库时间
    }
}
