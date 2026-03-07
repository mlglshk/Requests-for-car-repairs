using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RequestsForCarRepairs.API.Models;

[Table("comments")]
public class Comment
{
    [Key]
    [Column("commentid")]
    public int CommentID { get; set; }

    [Column("message")]
    public string Message { get; set; } = string.Empty;

    [Column("masterid")]
    public int MasterID { get; set; }

    [Column("requestid")]
    public int RequestID { get; set; }

    [Column("createdat")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [ForeignKey("MasterID")]
    public User Master { get; set; } = null!;

    [ForeignKey("RequestID")]
    public Request Request { get; set; } = null!;
}