using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RequestsForCarRepairs.API.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("userid")]
    public int UserID { get; set; }

    [Column("fio")]
    public string Fio { get; set; } = string.Empty;

    [Column("phone")]
    public string Phone { get; set; } = string.Empty;

    [Column("login")]
    public string Login { get; set; } = string.Empty;

    [Column("password")]
    public string Password { get; set; } = string.Empty;

    [Column("type")]
    public string Type { get; set; } = string.Empty;

    public ICollection<Request>? ClientRequests { get; set; }
    public ICollection<Request>? MasterRequests { get; set; }
    public ICollection<Comment>? Comments { get; set; }
}