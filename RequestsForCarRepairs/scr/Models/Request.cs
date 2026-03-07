using RequestsForCarRepairs.API.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RequestsForCarRepairs.API.Models  // Добавьте namespace
{
    [Table("requests")]
    public class Request
    {
        [Key]
        [Column("requestid")]
        public int RequestID { get; set; }

        [Column("startdate")]
        public DateTime StartDate { get; set; }

        [Column("cartype")]
        public string CarType { get; set; } = string.Empty;

        [Column("carmodel")]
        public string CarModel { get; set; } = string.Empty;

        [Column("problemdescription")]
        public string ProblemDescription { get; set; } = string.Empty;

        [Column("requeststatus")]
        public string RequestStatus { get; set; } = string.Empty;

        [Column("completiondate")]
        public DateTime? CompletionDate { get; set; }

        [Column("repairparts")]
        public string? RepairParts { get; set; }

        [Column("masterid")]
        public int? MasterID { get; set; }

        [Column("clientid")]
        public int? ClientID { get; set; }

        [ForeignKey("ClientID")]
        public User? Client { get; set; }

        [ForeignKey("MasterID")]
        public User? Master { get; set; }

        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    }
}